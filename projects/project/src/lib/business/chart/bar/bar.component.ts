import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, SimpleChanges, NgZone, Renderer2, TemplateRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarChartOptions, ChartData, ChartSeries } from '../chart.interface';
import { ChartService } from '../chart.serivice';

@Component({
  selector: 'lib-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bar.component.html',
  styleUrl: './bar.component.less'
})
export class BarComponent implements OnInit, OnChanges {
  // 组件输入和视图引用
  @ViewChild('barCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barTooltip', { static: true }) tooltipRef!: ElementRef<HTMLDivElement>;
  @ViewChild('defaultTooltip', { static: true }) defaultTooltipRef!: TemplateRef<{ $implicit: any }>;
  @Input() data: ChartData[] | ChartSeries[] = [];
  @Input() options: BarChartOptions = {};
  @Input() tooltipTemplate?: TemplateRef<{ $implicit: any }>;

  // 渲染相关属性
  chartSeries: ChartSeries[] = []; // 处理后的图表系列数据
  private seriesVisibility: boolean[] = []; // 系列可见性状态
  private ctx!: CanvasRenderingContext2D;
  private defaultOptions: BarChartOptions = {
    width: 600,
    height: 400,
    barColors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8341f4', '#3acfb4', '#fa7e1e', '#dc3545'],
    backgroundColor: '#ffffff',
    borderRadius: 4,
    showValues: true,
    showGrid: true,
    animate: true,
    margin: { top: 40, right: 20, bottom: 50, left: 50 },
    legend: {
      show: true,
      position: 'top',
      align: 'center'
    },
    hoverEffect: {
      enabled: true,
      showTooltip: true,
      showGuideLine: true,
      guideLineStyle: 'dashed',
      guideLineColor: '#666',
      guideLineWidth: 1,
      tooltipHoverable: false
    }
  };
  private mergedOptions!: BarChartOptions;

  // 动画和交互相关属性
  private animationFrameId: number | null = null;
  private currentAnimationValue = 0;
  hoveredBarIndex: number = -1;
  hoveredSeriesIndex: number = -1;
  barPositions: Array<{ x: number, y: number, width: number, height: number, data: ChartData, seriesIndex: number }> = [];
  private mousePosition: { x: number, y: number } = { x: 0, y: 0 };
  private isTooltipHovered: boolean = false;
  private canvasScale: number = 1; // 用于高DPI显示

  constructor(
    private chartService: ChartService,
    private ngZone: NgZone,
    private renderer: Renderer2
  ) { }

  // 生命周期钩子
  ngOnInit(): void {
    this.initCanvas();
    this.setupEventListeners();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['data'] || changes['options']) && this.ctx) {
      this.mergedOptions = { ...this.defaultOptions, ...this.options };
      this.processData();
      this.drawChart();
    }
  }

  // 处理输入数据，转换为统一的ChartSeries格式
  private processData(): void {
    this.chartSeries = [];

    if (!this.data || this.data.length === 0) {
      return;
    }

    // 判断输入的是单系列数据还是多系列数据
    if (this.data.length > 0 && 'data' in this.data[0]) {
      // 已经是ChartSeries格式
      this.chartSeries = this.data as ChartSeries[];
    } else {
      // 是单个ChartData数组，转换为单系列
      this.chartSeries = [{
        name: this.mergedOptions.title || '数据',
        data: this.data as ChartData[]
      }];
    }

    // 初始化系列可见性数组
    this.seriesVisibility = this.chartSeries.map(() => true);
  }

  // ============================================================
  // 1. 数据处理和计算方法
  // ============================================================

  /**
   * 获取当前可见的系列
   */
  private getVisibleSeries(): ChartSeries[] {
    return this.chartSeries.filter((_, index) => this.seriesVisibility[index]);
  }

  /**
   * 计算所有可见系列中特定类别的最大值
   */
  private getMaxCategoryValue(): number {
    const visibleSeries = this.getVisibleSeries();
    if (visibleSeries.length === 0) return 0;

    // 获取所有系列中数据点最多的系列的数据点数量
    const maxDataPoints = Math.max(...visibleSeries.map(series => series.data.length));

    // 初始化类别总和数组
    const categoryTotals = Array(maxDataPoints).fill(0);

    // 计算每个类别的总和
    visibleSeries.forEach(series => {
      series.data.forEach((item, index) => {
        if (index < categoryTotals.length) {
          categoryTotals[index] += item.value;
        }
      });
    });

    // 返回最大类别总和
    return Math.max(...categoryTotals, 0);
  }

  /**
   * 计算数据总和，用于百分比计算
   */
  private calculateTotalValue(seriesIndex?: number): number {
    if (seriesIndex !== undefined && seriesIndex >= 0 && seriesIndex < this.chartSeries.length) {
      // 计算特定系列的总和
      return this.chartSeries[seriesIndex].data.reduce((sum, item) => sum + item.value, 0);
    } else {
      // 计算所有系列的总和
      return this.chartSeries.reduce((sum, series) =>
        sum + series.data.reduce((seriesSum, item) => seriesSum + item.value, 0), 0);
    }
  }

  /**
   * 格式化数值显示，供模板使用
   */
  public formatValue(value: number): string {
    return this.chartService.formatNumber(value);
  }

  /**
   * 计算百分比，供模板使用
   */
  public calculatePercentage(value: number, seriesIndex?: number): string {
    const totalValue = this.calculateTotalValue(seriesIndex);
    return totalValue > 0 ? (value / totalValue * 100).toFixed(1) : '0';
  }

  /**
   * 获取系列颜色，供模板使用
   */
  public getSeriesColor(seriesIndex: number): string {
    if (seriesIndex < 0 || !this.mergedOptions.barColors || this.mergedOptions.barColors.length === 0) {
      return '';
    }

    // 首先检查系列是否有自定义颜色
    const series = this.chartSeries[seriesIndex];
    if (series && series.color) {
      return series.color;
    }

    // 否则使用默认颜色
    const colorIndex = seriesIndex % this.mergedOptions.barColors.length;
    return this.mergedOptions.barColors[colorIndex];
  }

  /**
   * 获取数据点颜色，供模板使用
   */
  public getDataColor(seriesIndex: number, dataIndex: number): string {
    if (seriesIndex < 0 || dataIndex < 0 || !this.mergedOptions.barColors) {
      return '';
    }

    // 检查数据点是否有自定义颜色
    const series = this.chartSeries[seriesIndex];
    if (series && series.data[dataIndex] && series.data[dataIndex].color) {
      return series.data[dataIndex].color!;
    }

    // 否则使用系列颜色
    return this.getSeriesColor(seriesIndex);
  }

  /**
   * 获取当前悬停柱形的颜色
   */
  public getHoveredBarColor(): string {
    if (this.hoveredBarIndex < 0 || this.hoveredSeriesIndex < 0) {
      return '';
    }

    return this.getDataColor(this.hoveredSeriesIndex, this.hoveredBarIndex);
  }

  /**
   * 图例相关方法
   */
  public showLegend(): boolean {
    return this.mergedOptions?.legend?.show !== false && this.chartSeries.length > 0;
  }

  public getLegendPosition(): string {
    return this.mergedOptions?.legend?.position || 'top';
  }

  public isSeriesVisible(index: number): boolean {
    return this.seriesVisibility[index] === true;
  }

  public toggleSeriesVisibility(index: number): void {
    this.seriesVisibility[index] = !this.seriesVisibility[index];
    this.drawChart();
  }

  // ============================================================
  // 2. Canvas初始化与配置方法
  // ============================================================

  /**
   * 初始化Canvas
   */
  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.mergedOptions = { ...this.defaultOptions, ...this.options };

    // 设置Canvas容器大小
    const container = canvas.parentElement;
    if (container) {
      container.style.width = `${this.mergedOptions.width || this.defaultOptions.width!}px`;
      container.style.height = `${this.mergedOptions.height || this.defaultOptions.height!}px`;
    }

    // 设置Canvas并处理高DPI显示
    this.setupHiDPI(canvas);

    this.processData();
    this.drawChart();
  }

  /**
   * 设置高DPI屏幕支持
   * 修复高DPI屏幕下图表大小与边框不对应的问题
   */
  private setupHiDPI(canvas: HTMLCanvasElement): void {
    // 获取设备像素比
    const devicePixelRatio = window.devicePixelRatio || 1;
    // 获取canvas元素的CSS宽高
    const rect = canvas.parentElement?.getBoundingClientRect() || { width: this.mergedOptions.width || 600, height: this.mergedOptions.height || 400 };

    // 保存当前的CSS宽高
    const width = rect.width;
    const height = rect.height;

    // 重置Canvas样式宽高
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // 设置Canvas缓冲区尺寸
    canvas.width = Math.floor(width * devicePixelRatio);
    canvas.height = Math.floor(height * devicePixelRatio);

    // 缩放上下文，抵消像素比缩放
    this.ctx.scale(devicePixelRatio, devicePixelRatio);

    // 保存像素比例，用于事件处理时坐标转换
    this.canvasScale = devicePixelRatio;
  }

  // ============================================================
  // 3. 图表绘制方法
  // ============================================================

  /**
   * 绘制图表主方法
   */
  private drawChart(): void {
    if (!this.chartSeries || this.chartSeries.length === 0) return;

    this.mergedOptions = { ...this.defaultOptions, ...this.options };

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.mergedOptions.animate) {
      this.currentAnimationValue = 0;
      this.animateChart();
    } else {
      this.drawChartFrame(1.0);
    }
  }

  /**
   * 动画绘制图表
   */
  private animateChart(): void {
    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        this.currentAnimationValue += 0.03;
        const easedValue = this.chartService.easeOutQuad(
          Math.min(this.currentAnimationValue, 1)
        );

        this.drawChartFrame(easedValue);

        if (this.currentAnimationValue < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          this.animationFrameId = null;
        }
      };

      this.animationFrameId = requestAnimationFrame(animate);
    });
  }

  /**
   * 绘制图表单帧
   */
  private drawChartFrame(animationProgress: number): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // 清空画布，注意使用设备像素比调整后的尺寸
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.fillStyle = this.mergedOptions.backgroundColor!;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // 计算图表区域尺寸
    const margin = this.mergedOptions.margin!;
    const chartWidth = displayWidth - margin.left - margin.right;
    const chartHeight = displayHeight - margin.top - margin.bottom;

    // 获取可见系列
    const visibleSeries = this.getVisibleSeries();

    // 计算柱形尺寸
    const maxValue = this.getMaxCategoryValue();

    // 获取所有系列中最大的数据点数量，如果没有可见系列，使用所有系列
    let categoryCount = 0;
    if (visibleSeries.length > 0) {
      categoryCount = Math.max(...visibleSeries.map(series => series.data.length));
    } else if (this.chartSeries.length > 0) {
      categoryCount = Math.max(...this.chartSeries.map(series => series.data.length));
    }

    // 绘制标题
    if (this.mergedOptions.title) {
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.mergedOptions.title, displayWidth / 2, margin.top / 2);
    }

    // 绘制网格线 - 即使没有可见数据也显示网格
    if (this.mergedOptions.showGrid) {
      // 如果没有可见数据，使用默认最大值
      const effectiveMaxValue = maxValue > 0 ? maxValue : 100;
      this.drawGrid(margin, chartHeight, chartWidth, effectiveMaxValue);
    }

    // 只有在有可见系列时才绘制柱形
    if (visibleSeries.length > 0 && maxValue > 0 && categoryCount > 0) {
      // 计算每个类别组的总宽度
      const groupWidth = chartWidth / categoryCount;
      // 单个柱子宽度 = 组宽度 * 0.7 / 可见系列数量
      const barWidth = groupWidth * 0.7 / visibleSeries.length;
      // 组内间距 = 组宽度 * 0.3 / (可见系列数量 + 1)
      const barSpacing = groupWidth * 0.3 / (visibleSeries.length + 1);

      // 绘制柱形
      this.barPositions = [];
      this.drawBars(visibleSeries, margin, chartHeight, barWidth, barSpacing, groupWidth, maxValue, animationProgress);
    } else {
      this.barPositions = [];
    }

    // 始终绘制坐标轴，无论是否有可见数据
    this.drawAxes(margin, chartHeight, chartWidth);

    // 仅在有悬停柱形时绘制辅助线
    if (this.hoveredBarIndex !== -1 && this.hoveredSeriesIndex !== -1 && this.mergedOptions.hoverEffect?.showGuideLine) {
      this.drawGuideLine(margin, chartHeight, chartWidth);
    }
  }

  /**
   * 绘制网格线
   */
  private drawGrid(margin: any, chartHeight: number, chartWidth: number, maxValue: number): void {
    const ctx = this.ctx;
    const gridCount = 5;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= gridCount; i++) {
      const y = margin.top + chartHeight - (i / gridCount) * chartHeight;

      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();

      ctx.fillStyle = '#666666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText((maxValue * i / gridCount).toFixed(0), margin.left - 10, y + 4);
    }
  }

  /**
   * 绘制柱形
   */
  private drawBars(
    visibleSeries: ChartSeries[],
    margin: any,
    chartHeight: number,
    barWidth: number,
    barSpacing: number,
    groupWidth: number,
    maxValue: number,
    animationProgress: number
  ): void {
    const ctx = this.ctx;

    // 对每个类别绘制所有系列的柱形
    const categoryLabels = new Set<string>();

    // 处理每个系列
    visibleSeries.forEach((series, seriesIndex) => {
      const actualSeriesIndex = this.chartSeries.findIndex(s => s === series);

      // 处理每个系列的每个数据点
      series.data.forEach((item, dataIndex) => {
        // 保存类别标签，用于后续绘制X轴
        categoryLabels.add(item.name);

        // 计算柱形的位置
        // 组的左侧位置 = 左侧边距 + 组索引 * 组宽度
        const groupLeft = margin.left + dataIndex * groupWidth;
        // 柱形的x位置 = 组左侧 + 组内间距 + 系列索引 * (柱宽 + 组内间距)
        const x = groupLeft + barSpacing + seriesIndex * (barWidth + barSpacing);

        // 计算柱形高度和y位置
        const barHeight = (item.value / maxValue) * chartHeight * animationProgress;
        const y = margin.top + chartHeight - barHeight;

        // 记录柱形位置，用于交互检测
        this.barPositions.push({
          x,
          y,
          width: barWidth,
          height: barHeight,
          data: item,
          seriesIndex: actualSeriesIndex
        });

        // 设置柱形填充颜色
        const barColor = this.getDataColor(actualSeriesIndex, dataIndex);

        // 检查是否是悬停的柱形
        if (dataIndex === this.hoveredBarIndex && actualSeriesIndex === this.hoveredSeriesIndex) {
          ctx.fillStyle = this.lightenColor(barColor, 20);
        } else {
          ctx.fillStyle = barColor;
        }

        // 只有当值大于0时才绘制柱形
        if (item.value > 0) {
          // 绘制柱形
          if (this.mergedOptions.borderRadius && this.mergedOptions.borderRadius > 0) {
            // 确保圆角不超过柱形高度的一半，避免在低高度时出现问题
            const effectiveRadius = Math.min(this.mergedOptions.borderRadius, barHeight / 2);
            this.roundRect(ctx, x, y, barWidth, barHeight, effectiveRadius, true, false);
          } else {
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }

        // 绘制数值
        if (this.mergedOptions.showValues && animationProgress > 0.9) {
          ctx.fillStyle = '#333333';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          const formattedValue = this.chartService.formatNumber(item.value);

          // 对于值为0的情况，将数值显示在基线上方
          const valueY = item.value > 0 ? y - 5 : margin.top + chartHeight - 5;
          ctx.fillText(formattedValue, x + barWidth / 2, valueY);
        }

        // 只有在第一个系列时绘制X轴标签，避免重复
        if (seriesIndex === 0) {
          ctx.fillStyle = '#666666';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(item.name, groupLeft + groupWidth / 2, margin.top + chartHeight + 20);
        }
      });
    });
  }

  /**
   * 绘制坐标轴
   */
  private drawAxes(margin: any, chartHeight: number, chartWidth: number): void {
    const ctx = this.ctx;

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;

    // X轴
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();

    // Y轴
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();

    // 绘制X轴类别标签（即使没有可见系列也显示）
    if (this.chartSeries.length > 0) {
      const categoryCount = Math.max(...this.chartSeries.map(series => series.data.length));
      if (categoryCount > 0) {
        const groupWidth = chartWidth / categoryCount;
        this.chartSeries[0].data.forEach((item, dataIndex) => {
          ctx.fillStyle = '#666666';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          const groupLeft = margin.left + dataIndex * groupWidth;
          ctx.fillText(item.name, groupLeft + groupWidth / 2, margin.top + chartHeight + 20);
        });
      }
    }
  }

  /**
   * 绘制辅助线
   */
  private drawGuideLine(margin: any, chartHeight: number, chartWidth: number): void {
    if (this.hoveredBarIndex === -1 || this.hoveredSeriesIndex === -1 || !this.mergedOptions.hoverEffect?.showGuideLine) return;

    const ctx = this.ctx;
    // 查找对应的柱形位置
    const hoveredBar = this.barPositions.find(
      bar => bar.seriesIndex === this.hoveredSeriesIndex &&
        bar.data.name === this.chartSeries[this.hoveredSeriesIndex].data[this.hoveredBarIndex].name
    );

    if (!hoveredBar) return;

    const barCenterX = hoveredBar.x + hoveredBar.width / 2;

    ctx.beginPath();
    ctx.strokeStyle = this.mergedOptions.hoverEffect?.guideLineColor || '#666';
    ctx.lineWidth = this.mergedOptions.hoverEffect?.guideLineWidth || 1;

    if (this.mergedOptions.hoverEffect?.guideLineStyle === 'dashed') {
      ctx.setLineDash([4, 4]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.moveTo(barCenterX, margin.top);
    ctx.lineTo(barCenterX, margin.top + chartHeight);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  // ============================================================
  // 4. 事件处理方法
  // ============================================================

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    const canvas = this.canvasRef.nativeElement;
    const tooltip = this.tooltipRef.nativeElement;

    this.ngZone.runOutsideAngular(() => {
      canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
      canvas.addEventListener('mouseout', (event) => this.handleMouseOut(event));
      canvas.addEventListener('click', (event) => this.handleCanvasClick(event));

      tooltip.addEventListener('mouseenter', () => {
        if (this.isTooltipHoverable()) {
          this.isTooltipHovered = true;
        }
      });

      tooltip.addEventListener('mouseleave', () => {
        if (this.isTooltipHoverable()) {
          this.isTooltipHovered = false;
          if (this.hoveredBarIndex === -1) this.hideTooltip();
        }
      });
    });
  }

  /**
   * 处理鼠标移动事件
   */
  private handleMouseMove(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // 计算鼠标在Canvas中的位置，考虑设备像素比
    const x = (event.clientX - rect.left);
    const y = (event.clientY - rect.top);

    this.mousePosition = { x, y };

    const hoveredBarInfo = this.findHoveredBar(x, y);

    if (!this.isTooltipHoverable() || !this.isTooltipHovered) {
      if (hoveredBarInfo.dataIndex !== this.hoveredBarIndex || hoveredBarInfo.seriesIndex !== this.hoveredSeriesIndex) {
        this.hoveredBarIndex = hoveredBarInfo.dataIndex;
        this.hoveredSeriesIndex = hoveredBarInfo.seriesIndex;
        this.drawChartFrame(1.0);

        if (hoveredBarInfo.dataIndex !== -1 && hoveredBarInfo.seriesIndex !== -1 && this.mergedOptions.hoverEffect?.showTooltip) {
          this.showTooltip(hoveredBarInfo, event);
        } else {
          this.hideTooltip();
        }
      } else if (hoveredBarInfo.dataIndex !== -1 && hoveredBarInfo.seriesIndex !== -1) {
        this.updateTooltipPosition(event);
      }
    }
  }

  /**
   * 处理鼠标离开事件
   */
  private handleMouseOut(event: MouseEvent): void {
    if (this.isEventToTooltip(event)) {
      return;
    }

    if (!this.isEventToChildElement(event)) {
      this.hideAllTooltips();
    }
  }

  /**
   * 处理Canvas鼠标离开事件
   */
  public handleCanvasMouseLeave(event: MouseEvent): void {
    if (this.isEventToTooltip(event) && this.isTooltipHoverable()) {
      return;
    }
    this.hideAllTooltips();
  }

  /**
   * 处理文档鼠标离开事件
   */
  @HostListener('document:mouseleave', ['$event'])
  onDocumentMouseLeave(event: MouseEvent) {
    this.hideAllTooltips();
  }

  /**
   * 处理窗口失焦事件
   */
  @HostListener('window:blur', ['$event'])
  onWindowBlur(event: Event) {
    this.hideAllTooltips();
  }

  /**
   * 查找鼠标悬停的柱形索引
   */
  private findHoveredBar(x: number, y: number): { dataIndex: number, seriesIndex: number } {
    for (let i = 0; i < this.barPositions.length; i++) {
      const bar = this.barPositions[i];
      if (
        x >= bar.x &&
        x <= bar.x + bar.width &&
        y >= bar.y &&
        y <= bar.y + bar.height
      ) {
        // 找到对应的数据点索引
        const series = this.chartSeries[bar.seriesIndex];
        const dataIndex = series.data.findIndex(data => data.name === bar.data.name);

        return { dataIndex, seriesIndex: bar.seriesIndex };
      }
    }
    return { dataIndex: -1, seriesIndex: -1 };
  }

  /**
   * 检查事件是否导向工具提示
   */
  private isEventToTooltip(event: MouseEvent): boolean {
    if (!event.relatedTarget) return false;
    if (!this.isTooltipHoverable()) return false;

    const tooltip = this.tooltipRef.nativeElement;
    return tooltip.contains(event.relatedTarget as Node);
  }

  /**
   * 检查事件是否导向子元素
   */
  private isEventToChildElement(event: MouseEvent): boolean {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.closest('.bar-chart-container');

    if (!event.relatedTarget || !container) return false;
    return container.contains(event.relatedTarget as Node);
  }

  /**
   * 检查工具提示是否可悬停
   */
  public isTooltipHoverable(): boolean {
    return this.mergedOptions.hoverEffect?.tooltipHoverable === true;
  }

  /**
   * 处理Canvas点击事件
   */
  private handleCanvasClick(event: MouseEvent): void {
    // 检查是否有点击回调函数
    if (!this.mergedOptions.onClick) return;

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // 计算点击在canvas中的位置
    const x = (event.clientX - rect.left);
    const y = (event.clientY - rect.top);

    // 查找点击的柱形
    const clickedBarInfo = this.findHoveredBar(x, y);

    // 如果点击到了柱形，执行回调
    if (clickedBarInfo.dataIndex !== -1 && clickedBarInfo.seriesIndex !== -1) {
      const series = this.chartSeries[clickedBarInfo.seriesIndex];
      const item = series.data[clickedBarInfo.dataIndex];
      const barPosition = this.barPositions.find(
        bar => bar.seriesIndex === clickedBarInfo.seriesIndex && bar.data.name === item.name
      );

      if (barPosition) {
        this.ngZone.run(() => {
          // 传入包含所有相关信息的对象
          this.mergedOptions.onClick!({
            item: item,
            index: clickedBarInfo.dataIndex,
            seriesIndex: clickedBarInfo.seriesIndex,
            data: this.chartSeries,
            options: this.mergedOptions,
            event: event,
            position: {
              x: barPosition.x,
              y: barPosition.y,
              width: barPosition.width,
              height: barPosition.height
            }
          });
        });
      }
    }
  }

  // ============================================================
  // 5. 工具提示相关方法
  // ============================================================

  /**
   * 显示工具提示
   */
  private showTooltip(barInfo: { dataIndex: number, seriesIndex: number }, event?: MouseEvent): void {
    if (!this.mergedOptions.hoverEffect?.showTooltip) return;

    const tooltip = this.tooltipRef.nativeElement;
    const series = this.chartSeries[barInfo.seriesIndex];
    const item = series.data[barInfo.dataIndex];

    const barPosition = this.barPositions.find(
      bar => bar.seriesIndex === barInfo.seriesIndex && bar.data.name === item.name
    );

    if (!barPosition) return;

    tooltip.innerHTML = '';

    const tooltipData = {
      item: item,
      series: series,
      seriesIndex: barInfo.seriesIndex,
      dataIndex: barInfo.dataIndex
    };

    if (this.tooltipTemplate) {
      this.ngZone.run(() => {
        const viewRef = this.tooltipTemplate!.createEmbeddedView({ $implicit: tooltipData });
        viewRef.detectChanges();

        viewRef.rootNodes.forEach(node => {
          this.renderer.appendChild(tooltip, node);
        });
      });
    } else {
      this.ngZone.run(() => {
        const viewRef = this.defaultTooltipRef.createEmbeddedView({ $implicit: tooltipData });
        viewRef.detectChanges();
        viewRef.rootNodes.forEach(node => {
          this.renderer.appendChild(tooltip, node);
        });
      });
    }
    this.hoveredBarIndex = barInfo.dataIndex;
    this.hoveredSeriesIndex = barInfo.seriesIndex;
    if (event) {
      this.updateTooltipPosition(event);
    } else {
      this.updateTooltipPosition();
    }
  }

  /**
   * 更新工具提示位置
   */
  private updateTooltipPosition(event?: MouseEvent): void {
    if (this.hoveredBarIndex === -1 || this.hoveredSeriesIndex === -1) return;
    const tooltip = this.tooltipRef.nativeElement;
    const tooltipRect = tooltip.getBoundingClientRect();
    const canvas = this.canvasRef.nativeElement;
    const canvasRect = canvas.getBoundingClientRect();
    let x, y;
    if (event) {
      x = event.clientX - canvasRect.left - 15;
      y = event.clientY - canvasRect.top;
    } else {
      x = this.mousePosition.x;
      y = this.mousePosition.y;
    }
    // 检查是否接近右边界，如果接近右边界，调整位置
    if (x + tooltipRect.width > canvasRect.width) {
      x = x - tooltipRect.width + 5; // 向左偏移，25是一个合适的偏移值
    }
    this.renderer.setStyle(tooltip, 'left', `${x + 15}px`);
    this.renderer.setStyle(tooltip, 'top', `${y - tooltipRect.height / 2}px`);
  }

  /**
   * 隐藏工具提示
   */
  private hideTooltip(): void {
    this.ngZone.run(() => {
      this.hoveredBarIndex = -1;
      this.hoveredSeriesIndex = -1;
    });
  }

  /**
   * 隐藏所有工具提示
   */
  private hideAllTooltips(): void {
    this.ngZone.run(() => {
      this.hoveredBarIndex = -1;
      this.hoveredSeriesIndex = -1;
    });
    this.drawChartFrame(1.0);
  }

  // ============================================================
  // 6. 辅助工具方法
  // ============================================================

  /**
   * 绘制圆角矩形
   */
  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: boolean, stroke: boolean): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
  }

  /**
   * 让颜色变亮
   */
  private lightenColor(color: string, percent: number): string {
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);
    r = Math.min(255, Math.floor(r * (100 + percent) / 100));
    g = Math.min(255, Math.floor(g * (100 + percent) / 100));
    b = Math.min(255, Math.floor(b * (100 + percent) / 100));
    const rr = ((r.toString(16).length === 1) ? '0' + r.toString(16) : r.toString(16));
    const gg = ((g.toString(16).length === 1) ? '0' + g.toString(16) : g.toString(16));
    const bb = ((b.toString(16).length === 1) ? '0' + b.toString(16) : b.toString(16));
    return `#${rr}${gg}${bb}`;
  }
}
