import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, SimpleChanges, NgZone, Renderer2, TemplateRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarChartOptions, ChartData } from '../chart.interface';
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
  @ViewChild('defaultTooltip', { static: true }) defaultTooltipRef!: TemplateRef<{ $implicit: ChartData }>;
  @Input() data: ChartData[] = [];
  @Input() options: BarChartOptions = {};
  @Input() tooltipTemplate?: TemplateRef<{ $implicit: ChartData }>;

  // 渲染相关属性
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
  barPositions: Array<{ x: number, y: number, width: number, height: number, data: ChartData }> = [];
  private mousePosition: { x: number, y: number } = { x: 0, y: 0 };
  private isTooltipHovered: boolean = false;

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
      this.drawChart();
    }
  }

  // ============================================================
  // 1. 数据处理和计算方法
  // ============================================================

  /**
   * 计算数据总和，用于百分比计算
   */
  private calculateTotalValue(): number {
    return this.data.reduce((sum, item) => sum + item.value, 0);
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
  public calculatePercentage(value: number): string {
    const totalValue = this.calculateTotalValue();
    return totalValue > 0 ? (value / totalValue * 100).toFixed(1) : '0';
  }
  
  /**
   * 获取柱形颜色，供模板使用
   */
  public getBarColor(index: number): string {
    if (index < 0 || !this.mergedOptions.barColors || this.mergedOptions.barColors.length === 0) {
      return '';
    }
    const colorIndex = index % this.mergedOptions.barColors.length;
    return this.mergedOptions.barColors[colorIndex];
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

    canvas.width = this.mergedOptions.width || this.defaultOptions.width!;
    canvas.height = this.mergedOptions.height || this.defaultOptions.height!;

    this.setupHiDPI(canvas, this.ctx);
    this.drawChart();
  }

  /**
   * 设置高DPI屏幕支持
   */
  private setupHiDPI(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    const devicePixelRatio = window.devicePixelRatio || 1;

    if (devicePixelRatio > 1) {
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      ctx.scale(devicePixelRatio, devicePixelRatio);
    }
  }

  // ============================================================
  // 3. 图表绘制方法
  // ============================================================

  /**
   * 绘制图表主方法
   */
  private drawChart(): void {
    if (!this.data || this.data.length === 0) return;

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

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = this.mergedOptions.backgroundColor!;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 计算图表区域尺寸
    const margin = this.mergedOptions.margin!;
    const chartWidth = canvas.width - margin.left - margin.right;
    const chartHeight = canvas.height - margin.top - margin.bottom;

    // 计算柱形尺寸
    const maxValue = this.chartService.getMaxValue(this.data);
    const barWidth = chartWidth / this.data.length * 0.7;
    const barSpacing = chartWidth / this.data.length - barWidth;

    // 绘制标题
    if (this.mergedOptions.title) {
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.mergedOptions.title, canvas.width / 2, margin.top / 2);
    }

    // 绘制网格线
    if (this.mergedOptions.showGrid) {
      this.drawGrid(margin, chartHeight, chartWidth, maxValue);
    }

    // 绘制柱形
    this.barPositions = [];
    this.drawBars(margin, chartHeight, barWidth, barSpacing, maxValue, animationProgress);
    
    // 绘制坐标轴
    this.drawAxes(margin, chartHeight, chartWidth);

    // 绘制辅助线
    if (this.hoveredBarIndex !== -1 && this.mergedOptions.hoverEffect?.showGuideLine) {
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
  private drawBars(margin: any, chartHeight: number, barWidth: number, barSpacing: number, maxValue: number, animationProgress: number): void {
    const ctx = this.ctx;

    this.data.forEach((item, index) => {
      const x = margin.left + (barWidth + barSpacing) * index + barSpacing / 2;
      const barHeight = (item.value / maxValue) * chartHeight * animationProgress;
      const y = margin.top + chartHeight - barHeight;

      // 记录柱形位置，用于交互检测
      this.barPositions.push({
        x,
        y,
        width: barWidth,
        height: barHeight,
        data: item
      });

      // 设置柱形样式
      const colorIndex = index % this.mergedOptions.barColors!.length;
      const barColor = this.mergedOptions.barColors![colorIndex];

      if (index === this.hoveredBarIndex) {
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

      // 绘制X轴标签
      ctx.fillStyle = '#666666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, x + barWidth / 2, margin.top + chartHeight + 20);
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
  }

  /**
   * 绘制辅助线
   */
  private drawGuideLine(margin: any, chartHeight: number, chartWidth: number): void {
    if (this.hoveredBarIndex === -1 || !this.mergedOptions.hoverEffect?.showGuideLine) return;

    const ctx = this.ctx;
    const bar = this.barPositions[this.hoveredBarIndex];
    const barCenterX = bar.x + bar.width / 2;

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

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.mousePosition = { x, y };

    const hoveredIndex = this.findHoveredBar(x, y);

    if (!this.isTooltipHoverable() || !this.isTooltipHovered) {
      if (hoveredIndex !== this.hoveredBarIndex) {
        this.hoveredBarIndex = hoveredIndex;
        this.drawChartFrame(1.0);

        if (hoveredIndex !== -1 && this.mergedOptions.hoverEffect?.showTooltip) {
          this.showTooltip(hoveredIndex, event);
        } else {
          this.hideTooltip();
        }
      } else if (hoveredIndex !== -1) {
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
  private findHoveredBar(x: number, y: number): number {
    for (let i = 0; i < this.barPositions.length; i++) {
      const bar = this.barPositions[i];
      if (
        x >= bar.x &&
        x <= bar.x + bar.width &&
        y >= bar.y &&
        y <= bar.y + bar.height
      ) {
        return i;
      }
    }
    return -1;
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
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 查找点击的柱形
    const clickedBarIndex = this.findHoveredBar(x, y);

    // 如果点击到了柱形，执行回调
    if (clickedBarIndex !== -1) {
      const clickedBar = this.barPositions[clickedBarIndex];
      this.ngZone.run(() => {
        // 传入包含所有相关信息的对象
        this.mergedOptions.onClick!({
          item: clickedBar.data,
          index: clickedBarIndex,
          data: this.data,
          options: this.mergedOptions,
          event: event,
          position: {
            x: clickedBar.x,
            y: clickedBar.y,
            width: clickedBar.width,
            height: clickedBar.height
          }
        });
      });
    }
  }

  // ============================================================
  // 5. 工具提示相关方法
  // ============================================================

  /**
   * 显示工具提示
   */
  private showTooltip(barIndex: number, event?: MouseEvent): void {
    if (!this.mergedOptions.hoverEffect?.showTooltip) return;
    
    const tooltip = this.tooltipRef.nativeElement;
    const bar = this.barPositions[barIndex];
    const item = bar.data;
    
    tooltip.innerHTML = '';
    
    if (this.tooltipTemplate) {
      this.ngZone.run(() => {
        const viewRef = this.tooltipTemplate!.createEmbeddedView({ $implicit: item });
        viewRef.detectChanges();
        
        viewRef.rootNodes.forEach(node => {
          this.renderer.appendChild(tooltip, node);
        });
      });
    } else {
      this.ngZone.run(() => {
        const viewRef = this.defaultTooltipRef.createEmbeddedView({ $implicit: item });
        viewRef.detectChanges();
        
        viewRef.rootNodes.forEach(node => {
          this.renderer.appendChild(tooltip, node);
        });
      });
    }
    
    this.hoveredBarIndex = barIndex;
    
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
    if (this.hoveredBarIndex === -1) return;

    const tooltip = this.tooltipRef.nativeElement;
    const tooltipRect = tooltip.getBoundingClientRect();
    const canvas = this.canvasRef.nativeElement;
    const canvasRect = canvas.getBoundingClientRect();

    let x, y;

    if (event) {
      x = event.clientX - canvasRect.left + 5;
      y = event.clientY - canvasRect.top + 12;
    } else {
      x = this.mousePosition.x;
      y = this.mousePosition.y;
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
    });
  }

  /**
   * 隐藏所有工具提示
   */
  private hideAllTooltips(): void {
    this.ngZone.run(() => {
      this.hoveredBarIndex = -1;
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
