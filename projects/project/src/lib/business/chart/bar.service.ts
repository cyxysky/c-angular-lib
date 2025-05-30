import { Injectable, NgZone } from '@angular/core';
import {
  ChartData,
  ChartOptions,
  TooltipUpdate,
  BarSpecificOptions,
  DEFAULT_TEXT_COLOR,
  DEFAULT_MUTED_TEXT_COLOR,
  DEFAULT_BACKGROUND_TEXT_COLOR,
  DEFAULT_LABEL_FONT,
  DEFAULT_GRID_LINE_COLOR,
  DEFAULT_GRID_LINE_WIDTH,
  DEFAULT_AXIS_LINE_COLOR,
  DEFAULT_AXIS_LINE_WIDTH,
  DEFAULT_MARGIN
} from './chart.interface';
import {
  ChartService
} from './chart.service';

@Injectable()
export class BarService {
  private ctx!: CanvasRenderingContext2D;
  private ngZone!: NgZone;
  public processedData: ChartData[] = [];
  private groupVisibility: boolean[] = [];
  public mergedOptions!: ChartOptions;
  private defaultOptions: ChartOptions = {
    chartType: 'bar',
    colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8341f4', '#3acfb4', '#fa7e1e', '#dc3545'],
    backgroundColor: '#ffffff',
    showLegend: true,
    animate: true,

    legend: { position: 'top', align: 'center' },
    hoverEffect: {
      enabled: true,
      showTooltip: true,
      tooltipHoverable: false
    },
    bar: {
      borderRadius: 4,
      showValues: true,
      showGrid: true,
      margin: { top: 40, right: 40, bottom: 40, left: 40 },
      showGuideLine: true,
      guideLineStyle: 'dashed',
      guideLineColor: '#666',
      guideLineWidth: 1,
    }
  };
  private animationFrameId: number | null = null;
  private currentAnimationValue = 0;
  public hoveredBarIndex: number = -1;
  public hoveredGroupIndex: number = -1;
  public barPositions: Array<{ x: number, y: number, width: number, height: number, data: ChartData, groupIndex: number }> = [];
  private displayWidth!: number; // 逻辑宽度
  private displayHeight!: number; // 逻辑高度

  // =================================================================================
  // 1. 初始化方法 (Initialization Methods)
  // =================================================================================

  /**
   * 构造函数
   * @param chartService 图表服务实例
   * @param ngZone Angular Zone 服务实例
   */
  constructor(private chartService: ChartService, ngZone: NgZone) {
    this.ngZone = ngZone;
  }

  /**
   * 初始化图表服务
   * @param ctx Canvas 2D 上下文
   * @param displayWidth 画布逻辑宽度
   * @param displayHeight 画布逻辑高度
   * @param data 图表数据
   * @param options 图表配置项
   * @param skipInitialAnimation 是否跳过初始动画
   */
  public init(
    ctx: CanvasRenderingContext2D,
    displayWidth: number,
    displayHeight: number,
    data: ChartData[],
    options: ChartOptions,
    skipInitialAnimation: boolean = false
  ): void {
    this.ctx = ctx;
    this.displayWidth = displayWidth;
    this.displayHeight = displayHeight;
    this.mergedOptions = {
      ...this.defaultOptions,
      ...options,
      bar: {
        ...this.defaultOptions.bar,
        ...(options.bar || {}),
      },
      chartType: 'bar'
    };
    this.data = data;
    this.drawChart(skipInitialAnimation);
  }

  /**
   * 设置图表数据 (内部使用 setter)
   * @param newData 新的图表数据
   */
  private set data(newData: ChartData[]) {
    this.processDataInput(newData);
  }

  /**
   * 处理和转换输入的图表数据
   * @param inputData 原始输入的图表数据
   */
  private processDataInput(inputData: ChartData[]): void {
    if (!inputData || inputData.length === 0) {
      this.processedData = [];
      this.groupVisibility = [];
      return;
    }

    try {
      const hasExplicitGroups = inputData.some(item => item.children && item.children.length > 0);

      if (hasExplicitGroups) {
        this.processedData = inputData.map(group => ({
          ...group,
          children: group.children?.filter(child => child && child.name !== undefined) || []
        }));
      } else {
        this.processedData = [{
          name: this.mergedOptions.title || '数据系列',
          children: inputData.filter(item => item && item.name !== undefined)
        }];
      }
      this.groupVisibility = this.getGroupNames().map(() => true);
    } catch (e) {
      console.error('处理数据时出错:', e);
      this.processedData = [];
      this.groupVisibility = [];
    }
  }

  // =================================================================================
  // 2. 绘制方法 (Drawing Methods)
  // =================================================================================

  /**
   * 绘制整个图表，如果需要动画则启动动画流程
   * @param forceNoAnimation 是否强制不使用动画
   */
  private drawChart(forceNoAnimation: boolean = false): void {
    if (!this.processedData || this.processedData.length === 0 || !this.ctx) return;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.mergedOptions.animate && !forceNoAnimation) {
      this.currentAnimationValue = 0;
      this.animateChart();
    } else {
      this.drawChartFrame(1.0);
    }
  }

  /**
   * 执行图表动画的循环
   */
  private animateChart(): void {
    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        this.currentAnimationValue += 0.03;
        const easedValue = this.chartService.easeOutQuad(Math.min(this.currentAnimationValue, 1));
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
   * 绘制图表的单帧内容
   * @param animationProgress 动画进度 (0 到 1)
   */
  public drawChartFrame(animationProgress: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
    ctx.fillStyle = this.mergedOptions.backgroundColor!;
    ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
    const margin = this.mergedOptions?.bar?.margin! || DEFAULT_MARGIN;
    const chartWidth = this.displayWidth - margin.left - margin.right;
    const chartHeight = this.displayHeight - margin.top - margin.bottom;
    const visibleData = this.getVisibleData();
    const maxValue = this.chartService.getMaxValue(visibleData);
    const categories = this.getCategories(visibleData);
    let categoryCount = categories.length;
    this.chartService.drawTitle(ctx, this.mergedOptions.title, margin, chartWidth);
    if (this.mergedOptions?.bar?.showGrid && maxValue > 0) {
      this.drawGrid(margin, chartHeight, chartWidth, maxValue);
    }
    this.barPositions = [];
    if (visibleData.length > 0 && maxValue > 0 && categoryCount > 0) {
      const groupWidth = chartWidth / categoryCount;
      const visibleGroupCount = this.getGroupNames().filter((_, i) => this.groupVisibility[i]).length || 1;
      const barWidth = groupWidth * 0.7 / visibleGroupCount;
      const barSpacing = groupWidth * 0.3 / (visibleGroupCount + 1);
      this.drawBars(visibleData, margin, chartHeight, barWidth, barSpacing, groupWidth, maxValue, animationProgress);
    } else {
      this.barPositions = [];
    }
    this.drawAxes(margin, chartHeight, chartWidth);
    if (this.hoveredBarIndex !== -1 && this.hoveredGroupIndex !== -1 && this.mergedOptions?.bar?.showGuideLine) {
      this.drawGuideLine(margin, chartHeight, chartWidth);
    }
  }

  /**
   * 绘制图表网格线
   * @param margin 图表边距
   * @param chartHeight 图表绘制区域高度
   * @param chartWidth 图表绘制区域宽度
   * @param maxValue Y轴最大值
   */
  private drawGrid(margin: any, chartHeight: number, chartWidth: number, maxValue: number): void {
    const ctx = this.ctx;
    const gridCount = 5;
    ctx.strokeStyle = DEFAULT_GRID_LINE_COLOR;
    ctx.lineWidth = DEFAULT_GRID_LINE_WIDTH;
    ctx.setLineDash([]); // Ensure solid lines for grid unless specified otherwise by a new option

    for (let i = 0; i <= gridCount; i++) {
      const yPos = margin.top + chartHeight - (i / gridCount) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, yPos);
      ctx.lineTo(margin.left + chartWidth, yPos);
      ctx.stroke();
      ctx.fillStyle = DEFAULT_MUTED_TEXT_COLOR;
      ctx.font = DEFAULT_LABEL_FONT;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.chartService.formatNumber(maxValue * i / gridCount), margin.left - 10, yPos + 4);
    }
  }

  /**
   * 绘制柱状图的柱子
   * @param visibleData 过滤后的可见数据
   * @param margin 图表边距
   * @param chartHeight 图表绘制区域高度
   * @param barWidth 单个柱子宽度
   * @param barSpacing 柱子间距
   * @param groupWidth 每组柱子的总宽度
   * @param maxValue Y轴最大值
   * @param animationProgress 动画进度
   */
  private drawBars(
    visibleData: ChartData[], margin: any, chartHeight: number, barWidth: number, barSpacing: number,
    groupWidth: number, maxValue: number, animationProgress: number
  ): void {
    const ctx = this.ctx;
    const groupNames = this.getGroupNames().filter((_, i) => this.groupVisibility[i]);
    const categories = this.getCategories(visibleData);

    categories.forEach((category, categoryIdx) => {
      groupNames.forEach((groupName, groupIdxInGroup) => {
        const originalGroupIndex = this.getGroupNames().indexOf(groupName);
        const dataItems = this.getDataItemsByGroupName(groupName);
        const item = dataItems.find(d => d.name === category);
        if (!item) return;

        const itemValue = item.data || 0;
        const groupLeft = margin.left + categoryIdx * groupWidth;
        const x = groupLeft + barSpacing + groupIdxInGroup * (barWidth + barSpacing);
        const barH = (itemValue / maxValue) * chartHeight * animationProgress;
        const y = margin.top + chartHeight - barH;
        this.barPositions.push({ x, y, width: barWidth, height: barH, data: item, groupIndex: originalGroupIndex });
        const barColor = this.getDataColor(originalGroupIndex, categoryIdx);
        if (itemValue > 0) {
          this.drawSingleBarShape(ctx, x, y, barWidth, barH, barColor, this.mergedOptions?.bar?.borderRadius || 0);
        }
        if (this.mergedOptions?.bar?.showValues && animationProgress > 0.9 && itemValue > 0) {
          this.drawBarValueText(ctx, item, x, y, barWidth, barH, margin);
        }
      });
      if (groupNames.length > 0 && categories.length > 0 && categoryIdx < categories.length) {
        ctx.fillStyle = DEFAULT_MUTED_TEXT_COLOR;
        ctx.font = DEFAULT_LABEL_FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const groupLeft = margin.left + categoryIdx * groupWidth;
        ctx.fillText(categories[categoryIdx], groupLeft + groupWidth / 2, margin.top + chartHeight + 20);
      }
    });
  }

  /**
   * 绘制单个柱子
   * @param ctx Canvas 2D 上下文
   * @param x 矩形左上角 x 坐标
   * @param y 矩形左上角 y 坐标
   * @param width 矩形宽度
   * @param height 矩形高度
   * @param color 柱子颜色
   * @param borderRadius 圆角半径
   */
  private drawSingleBarShape(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string, borderRadius: number): void {
    ctx.fillStyle = color;
    const effectiveRadius = borderRadius > 0 ? Math.min(borderRadius, height / 2, width / 2) : 0;
    if (effectiveRadius > 0) {
      this.roundRect(ctx, x, y, width, height, effectiveRadius, true, false);
    } else {
      ctx.fillRect(x, y, width, height);
    }
  }

  /**
   * 绘制柱子值文本
   * @param ctx Canvas 2D 上下文
   * @param item 数据项
   * @param x 矩形左上角 x 坐标 
   * @param y 矩形左上角 y 坐标
   * @param barWidth 矩形宽度
   * @param barHeight 矩形高度
   * @param margin 图表边距
   */
  private drawBarValueText(ctx: CanvasRenderingContext2D, item: ChartData, x: number, y: number, barWidth: number, barHeight: number, margin: any): void {
    ctx.textAlign = 'center';
    const formattedValue = this.chartService.formatNumber(item.data);
    const valueTextY = y - 5; // Position above the bar
    const approximateTextHeight = parseInt(DEFAULT_LABEL_FONT.substring(DEFAULT_LABEL_FONT.search(/\d+/)), 10) || 12;
    const titlePresent = !!this.mergedOptions.title;
    const titleSpace = titlePresent ? (margin.top / 2) : 0;
    const spaceAboveChartContent = margin.top - titleSpace;
    if (valueTextY - approximateTextHeight > 0 && barHeight > 0) { // Ensure text is within canvas and bar exists
      if (valueTextY > margin.top - spaceAboveChartContent + approximateTextHeight) { // Check if text fits above bar (simplified check)
        ctx.fillStyle = DEFAULT_TEXT_COLOR;
        ctx.font = DEFAULT_LABEL_FONT;
        ctx.textBaseline = 'bottom';
        ctx.fillText(formattedValue, x + barWidth / 2, valueTextY);
      } else if (barHeight > approximateTextHeight + 10) { // If bar is tall enough for text inside
        ctx.fillStyle = DEFAULT_BACKGROUND_TEXT_COLOR;
        ctx.font = DEFAULT_LABEL_FONT;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(formattedValue, x + barWidth / 2, y + approximateTextHeight + 2); // Position text inside the bar
      }
    } else if (barHeight > approximateTextHeight + 10) { // Fallback: If no space above, but bar is tall enough for text inside
      ctx.fillStyle = DEFAULT_BACKGROUND_TEXT_COLOR;
      ctx.font = DEFAULT_LABEL_FONT;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(formattedValue, x + barWidth / 2, y + approximateTextHeight + 2); // Position text inside the bar
    }
  }

  /**
   * 绘制坐标轴
   * @param margin 图表边距
   * @param chartHeight 图表绘制区域高度
   * @param chartWidth 图表绘制区域宽度
   */
  private drawAxes(margin: any, chartHeight: number, chartWidth: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = DEFAULT_AXIS_LINE_COLOR;
    ctx.lineWidth = DEFAULT_AXIS_LINE_WIDTH;
    ctx.setLineDash([]); // Ensure solid axis lines

    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();
  }

  /**
   * 绘制鼠标悬浮时的辅助引导线
   * @param margin 图表边距
   * @param chartHeight 图表绘制区域高度
   * @param chartWidth 图表绘制区域宽度
   */
  private drawGuideLine(margin: any, chartHeight: number, chartWidth: number): void {
    if (this.hoveredBarIndex === -1 || this.hoveredGroupIndex === -1 || !this.mergedOptions?.bar?.showGuideLine) return;
    const ctx = this.ctx;
    const categories = this.getCategories(this.getVisibleData());
    if (this.hoveredBarIndex >= categories.length) return;
    const categoryName = categories[this.hoveredBarIndex];
    const hoveredBar = this.barPositions.find(
      bar => bar.groupIndex === this.hoveredGroupIndex && bar.data?.name === categoryName
    );
    if (!hoveredBar) return;
    const barCenterX = hoveredBar.x + hoveredBar.width / 2;
    ctx.beginPath();
    ctx.strokeStyle = this.mergedOptions?.bar?.guideLineColor || '#666';
    ctx.lineWidth = this.mergedOptions?.bar?.guideLineWidth || 1;
    if (this.mergedOptions?.bar?.guideLineStyle === 'dashed') ctx.setLineDash([4, 4]);
    else ctx.setLineDash([]);
    ctx.moveTo(barCenterX, margin.top);
    ctx.lineTo(barCenterX, margin.top + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * 绘制圆角矩形 (用于柱子)
   * @param ctx Canvas 2D 上下文
   * @param x 矩形左上角 x 坐标
   * @param y 矩形左上角 y 坐标
   * @param width 矩形宽度
   * @param height 矩形高度
   * @param radius 圆角半径
   * @param fill 是否填充
   * @param stroke 是否描边
   */
  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: boolean, stroke: boolean): void {
    const effectiveRadius = Math.max(0, radius);
    ctx.beginPath();
    ctx.moveTo(x, y + effectiveRadius);
    ctx.quadraticCurveTo(x, y, x + effectiveRadius, y);
    ctx.lineTo(x + width - effectiveRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + effectiveRadius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + effectiveRadius);
    ctx.closePath();
    fill && ctx.fill();
    stroke && ctx.stroke();
  }

  // =================================================================================
  // 3. 其他功能方法 (Other Functional Methods)
  // =================================================================================

  /**
   * 更新图表数据和配置项
   * @param data 新的图表数据
   * @param options 新的图表配置项
   * @param newDisplayWidth 可选，新的画布逻辑宽度
   * @param newDisplayHeight 可选，新的画布逻辑高度
   */
  public update(data: ChartData[], options: ChartOptions, newDisplayWidth?: number, newDisplayHeight?: number): void {
    this.mergedOptions = {
      ...this.defaultOptions,
      ...options,
      bar: {
        ...this.defaultOptions.bar,
        ...(options.bar || {}),
      },
      chartType: 'bar'
    };
    if (newDisplayWidth !== undefined) this.displayWidth = newDisplayWidth;
    if (newDisplayHeight !== undefined) this.displayHeight = newDisplayHeight;
    this.data = data;
    this.drawChart();
  }

  /**
   * 设置当前悬浮的柱子数据索引和分组索引
   * @param dataIndex 柱子数据索引 (通常是类别索引)
   * @param groupIndex 分组索引
   */
  public setHoveredIndices(dataIndex: number, groupIndex: number): void {
    this.hoveredBarIndex = dataIndex;
    this.hoveredGroupIndex = groupIndex;
  }

  /**
   * 切换指定分组（图例项）的可见性
   * @param index 分组的索引
   */
  public toggleGroupVisibility(index: number): void {
    this.groupVisibility[index] = !this.groupVisibility[index];
    this.drawChart();
  }

  /**
   * 处理画布点击事件
   * @param canvasX 点击位置相对于画布的 X 坐标 (逻辑单位)
   * @param canvasY 点击位置相对于画布的 Y 坐标 (逻辑单位)
   * @param event 原始鼠标事件
   */
  public processCanvasClick(canvasX: number, canvasY: number, event: MouseEvent): void {
    if (!this.mergedOptions.onClick) return;

    const clickedBarInfo = this.findHoveredBar(canvasX, canvasY);

    if (clickedBarInfo.dataIndex === -1 || clickedBarInfo.groupIndex === -1) return;
    if (clickedBarInfo.groupIndex >= this.processedData.length) return;

    const group = this.processedData[clickedBarInfo.groupIndex];
    const categories = this.getCategories(this.getVisibleData());

    if (clickedBarInfo.dataIndex >= categories.length) return;
    const categoryName = categories[clickedBarInfo.dataIndex];

    const item = group.children?.find(child => child.name === categoryName);
    if (!item) return;

    // Find the barPosition for the exact clicked bar to get its screen coordinates and dimensions
    const barPosition = this.barPositions.find(
      bar => bar.groupIndex === clickedBarInfo.groupIndex && bar.data === item // Compare by object reference if item is from processedData
    );

    if (barPosition) {
      this.ngZone.run(() => {
        this.mergedOptions.onClick!({
          item: item, // The actual data item clicked
          index: clickedBarInfo.dataIndex, // Index within the categories array
          groupIndex: clickedBarInfo.groupIndex, // Index of the group in processedData
          data: this.processedData, // All processed data
          options: this.mergedOptions, // Current chart options
          event: event, // Original mouse event
          position: { // Position and dimensions of the clicked bar
            x: barPosition.x,
            y: barPosition.y,
            width: barPosition.width,
            height: barPosition.height
          }
        });
      });
    }
  }

  /**
   * 隐藏所有工具提示并重绘图表 (通常在鼠标移出画布时调用)
   */
  public hideAllTooltipsAndRedraw(): void {
    this.hideTooltipInternal();
  }

  /**
   * 获取所有分组名称
   * @returns 分组名称数组
   */
  public getGroupNames(): string[] {
    return this.chartService.getGroupNames(this.processedData);
  }

  /**
   * 获取所有分类名称
   * @param data 用于提取分类的数据集 (通常是 getVisibleData() 的结果)
   * @returns 分类名称数组
   */
  public getCategories(data: ChartData[]): string[] {
    const categories = new Set<string>();
    data.forEach(group => {
      group.children?.forEach(child => child.name && categories.add(child.name));
    });
    return Array.from(categories);
  }

  /**
   * 根据分组名称获取对应的数据项
   * @param groupName 分组名称
   * @returns 该分组下的数据项数组
   */
  public getDataItemsByGroupName(groupName: string): ChartData[] {
    const group = this.processedData.find(item => item.name === groupName);
    return group?.children || [];
  }

  /**
   * 获取当前可见的数据 (根据 groupVisibility 过滤)
   * @returns 可见数据数组
   */
  public getVisibleData(): ChartData[] {
    // processedData contains groups. We filter these groups based on groupVisibility.
    return this.processedData.filter((group, index) => this.groupVisibility[index]);
  }

  /**
   * 检查指定索引的分组是否可见
   * @param groupIndex 分组的索引
   * @returns 如果可见则返回 true，否则返回 false
   */
  public isGroupVisible(groupIndex: number): boolean {
    return this.groupVisibility[groupIndex] === true;
  }

  /**
   * 计算并格式化百分比
   * @param value 当前值
   * @param groupIndex 可选，分组索引，用于计算该分组的总值作为基数
   * @returns 百分比字符串 (例如 "25.0")
   */
  public calculatePercentage(value: number | undefined, groupIndex?: number): string {
    const totalValue = this.chartService.getTotalValue(this.processedData, groupIndex, true);
    const numValue = typeof value === 'number' ? value : 0;
    return (totalValue > 0 ? (numValue / totalValue * 100).toFixed(1) : '0') + '%';
  }

  /**
   * 获取指定分组的颜色
   * @param groupIndex 分组索引
   * @returns 颜色字符串 (HEX, RGB, etc.)
   */
  public getGroupColor(groupIndex: number): string {
    if (groupIndex < 0 || groupIndex >= this.processedData.length || !this.mergedOptions.colors || this.mergedOptions.colors.length === 0) return '';
    const groupItem = this.processedData[groupIndex];
    if (groupItem?.color) return groupItem.color;
    return this.mergedOptions.colors[groupIndex % this.mergedOptions.colors.length];
  }

  /**
   * 获取特定数据点（柱子）的颜色
   * @param groupIndex 分组索引
   * @param dataIndex 数据索引 (通常是类别索引)
   * @returns 颜色字符串
   */
  public getDataColor(groupIndex: number, dataIndex: number): string {
    const defaultGroupColor = this.getGroupColor(groupIndex);
    if (groupIndex < 0 || groupIndex >= this.processedData.length || dataIndex < 0) return defaultGroupColor;
    const group = this.processedData[groupIndex];
    const categories = this.getCategories(this.getVisibleData());
    if (dataIndex >= categories.length) return defaultGroupColor;
    const categoryName = categories[dataIndex];
    if (group?.children) {
      const childItem = group.children.find(child => child.name === categoryName);
      if (childItem?.color) return childItem.color;
    }
    return defaultGroupColor;
  }

  /**
   * 获取图例项数组，用于在图表组件中渲染图例
   * @returns 图例项数组
   */
  public getLegendItems(): Array<{ name: string; color: string; visible: boolean; active: boolean; percentageText?: string, numberText?: string }> {
    return this.getGroupNames().map((name, i) => ({
      name,
      color: this.getGroupColor(i),
      visible: this.isGroupVisible(i),
      active: this.hoveredGroupIndex === i,
      percentageText: this.calculatePercentage(this.chartService.getTotalValue(this.processedData, i, true)),
      numberText: this.chartService.getTotalValue(this.processedData, i, true).toString()
    }));
  }

  /**
   * 内部方法，用于在鼠标移出或需要主动隐藏时处理工具提示的隐藏逻辑
   */
  private hideTooltipInternal(): void {
    if (this.hoveredBarIndex !== -1 || this.hoveredGroupIndex !== -1) {
      this.ngZone.run(() => {
        this.hoveredBarIndex = -1;
        this.hoveredGroupIndex = -1;
      });
      this.drawChartFrame(1.0);
    }
  }

  /**
   * 查找鼠标位置对应的柱子
   * @param x 鼠标相对于画布的 X 坐标 (逻辑单位)
   * @param y 鼠标相对于画布的 Y 坐标 (逻辑单位)
   * @returns 返回包含 dataIndex 和 groupIndex 的对象，未找到则为 -1
   */
  public findHoveredBar(x: number, y: number): { dataIndex: number, groupIndex: number } {
    for (let i = 0; i < this.barPositions.length; i++) {
      const bar = this.barPositions[i];
      if (x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height) {
        const categories = this.getCategories(this.getVisibleData());
        const dataIndex = categories.indexOf(bar.data.name!);
        return { dataIndex, groupIndex: bar.groupIndex };
      }
    }
    return { dataIndex: -1, groupIndex: -1 };
  }

  /**
   * 销毁服务，清理资源 (例如取消动画帧)
   */
  public destroy(): void {
    this.animationFrameId = this.chartService.cancelAnimationFrameHelper(this.animationFrameId);
  }
}