import { Injectable, NgZone } from '@angular/core';
import { ChartData, ChartOptions, ChartDataWithAngles, TooltipUpdate, PieSpecificOptions } from './chart.interface';
import {
  ChartService,
  DEFAULT_PIE_LABEL_FONT,
  DEFAULT_SLICE_LABEL_SHADOW_COLOR,
  DEFAULT_SLICE_LABEL_SHADOW_BLUR,
  DEFAULT_SLICE_LABEL_CONTRAST_STROKE_COLOR,
  DEFAULT_SLICE_LABEL_CONTRAST_STROKE_WIDTH
} from './chart.service';

@Injectable()
export class PieService {
  private ctx!: CanvasRenderingContext2D;
  private ngZone!: NgZone;
  private chartService!: ChartService;
  private width = 300; // 图表绘制区域的逻辑宽度
  private height = 300; // 图表绘制区域的逻辑高度
  private initialDisplayWidth = 300; // 存储初始化/更新时传入的画布完整逻辑宽度
  private initialDisplayHeight = 300; // 存储初始化/更新时传入的画布完整逻辑高度
  private centerX = 150;
  private centerY = 150;
  private outerRadius = 120;
  private innerRadius = 0;
  public hoveredIndex: number = -1;
  private animationProgress = 0;
  private animationFrameId: number | null = null;
  public processedData: Array<ChartDataWithAngles> = [];
  public sliceVisibility: boolean[] = [];
  public mergedOptions!: ChartOptions;
  private defaultOptions: ChartOptions = {
    chartType: 'pie',
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
    pie: {
      showLabels: true,
      showPercentage: true,
      dynamicSlices: true,
      innerRadius: 0, // Default for pie, can be overridden for donut
      outerRadius: undefined, // Will be calculated if not set
      donutText: '',
      minSliceSize: 4,
      expandSlice: true,
      expandRadius: 10,
    }
  };
  private _isToggling: boolean = false; // 防止快速切换导致状态异常的标志
  private sliceAnimationIds: number[] = []; // 用于独立控制切片动画（如果未来需要）

  // =================================================================================
  // 1. 初始化方法 (Initialization Methods)
  // =================================================================================

  /**
   * 构造函数
   * @param chartService 图表服务实例
   * @param ngZone Angular Zone 服务实例
   */
  constructor(chartService: ChartService, ngZone: NgZone) {
    this.chartService = chartService;
    this.ngZone = ngZone;
  }

  /**
   * 初始化饼图服务
   * @param ctx Canvas 2D 上下文
   * @param displayWidth 画布的完整逻辑宽度
   * @param displayHeight 画布的完整逻辑高度
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
    this.initialDisplayWidth = displayWidth;
    this.initialDisplayHeight = displayHeight;
    this.mergedOptions = {
      ...this.defaultOptions,
      ...options,
      pie: {
        ...this.defaultOptions.pie,
        ...(options.pie || {}),
      },
      chartType: 'pie'
    };

    // 饼图强制图例在顶部 (如果显示图例)
    if (this.mergedOptions.showLegend !== false) {
      if (!this.mergedOptions.legend) {
        this.mergedOptions.legend = { position: 'top', align: this.defaultOptions.legend!.align || 'center' };
      } else {
        this.mergedOptions.legend.position = 'top'; // 强制为 top
        if (!this.mergedOptions.legend.align) {
          this.mergedOptions.legend.align = this.defaultOptions.legend!.align || 'center';
        }
      }
    }

    this.data = data; // 使用 setter 处理数据
    this.calculateDimensions(displayWidth, displayHeight); // 根据画布尺寸和选项计算实际图表绘制尺寸

    if (this.mergedOptions.animate && !skipInitialAnimation) {
      this.animationProgress = 0;
      this.startAnimation();
    } else {
      this.animationProgress = 1;
    }
    this.draw(); // 初次绘制
  }

  /**
   * 设置图表数据 (内部使用 setter)
   * @param newData 新的图表数据
   */
  private set data(newData: ChartData[]) {
    this.processDataInput(newData);
  }

  /**
   * 处理和转换输入的图表数据，计算角度和颜色
   * @param inputData 原始输入的图表数据
   */
  private processDataInput(inputData: ChartData[]): void {
    if (!inputData || inputData.length === 0) {
      this.processedData = [];
      this.sliceVisibility = [];
      return;
    }
    // 为数据分配颜色并计算百分比和角度
    const coloredData = this.chartService.assignPieColors(inputData as any, this.mergedOptions.colors || this.defaultOptions.colors!);
    this.processedData = this.chartService.calculatePieAngles(coloredData, this.mergedOptions?.pie?.minSliceSize) as Array<ChartDataWithAngles>;

    // 初始化或更新切片可见性状态，仅当长度变化或存在未定义状态时
    if (this.processedData.length !== this.sliceVisibility.length || this.sliceVisibility.some(v => v === undefined)) {
      this.sliceVisibility = this.processedData.map(() => true);
    }
  }

  /**
   * 根据画布尺寸和图表配置计算饼图的实际绘制尺寸 (中心点、半径等)
   * @param canvasLogicalWidth 画布的完整逻辑宽度
   * @param canvasLogicalHeight 画布的完整逻辑高度
   */
  private calculateDimensions(canvasLogicalWidth: number, canvasLogicalHeight: number): void {
    let effectiveWidth = canvasLogicalWidth;
    let effectiveHeight = canvasLogicalHeight;

    // 确定图表绘制区域的宽度
    if (this.mergedOptions.width && typeof this.mergedOptions.width === 'number') {
      this.width = this.mergedOptions.width; // 使用选项中指定的宽度
    } else {
      // 如果未指定宽度，则基于画布宽度，并考虑图例位置 (虽然饼图强制图例在顶部，但保留逻辑以防未来变化)
      if (this.mergedOptions.showLegend && (this.mergedOptions.legend?.position === 'left' || this.mergedOptions.legend?.position === 'right')) {
        effectiveWidth *= 0.8; // 为左右图例预留空间
      }
      this.width = effectiveWidth;
    }

    // 确定图表绘制区域的高度
    if (this.mergedOptions.height && typeof this.mergedOptions.height === 'number') {
      this.height = this.mergedOptions.height; // 使用选项中指定的高度
    } else {
      // 如果未指定高度，则基于画布高度，并考虑图例 (顶部) 和标题
      if (this.mergedOptions.showLegend && this.mergedOptions.legend?.position === 'top') {
        effectiveHeight *= 0.85; // 为顶部图例预留空间 (经验值)
      }
      this.height = effectiveHeight;
    }

    const titleGutter = this.mergedOptions.title ? 40 : 0; // 标题占用的垂直空间
    this.centerX = this.width / 2; // 绘制区域的中心 X
    this.centerY = titleGutter + (this.height - titleGutter) / 2; // 绘制区域的中心 Y (考虑标题)

    // 计算外半径
    const availableRadiusX = this.width / 2;
    const availableRadiusY = (this.height - titleGutter) / 2;
    const limitingRadiusBasedOnSpace = Math.max(0, Math.min(availableRadiusX, availableRadiusY));

    if (this.mergedOptions?.pie?.outerRadius && typeof this.mergedOptions?.pie?.outerRadius === 'number' && this.mergedOptions?.pie?.outerRadius > 0) {
      this.outerRadius = this.mergedOptions?.pie?.outerRadius;
    } else {
      // 默认使用可用限制半径的90%，并微调 (例如 +30px，但需确保不超过限制)
      // 这个默认值可以根据视觉效果调整，此处简化为基于可用空间的比例
      this.outerRadius = limitingRadiusBasedOnSpace * 0.9;
    }
    // 确保最终的 outerRadius 不超过可用空间，并有一个最小实用值
    this.outerRadius = Math.min(this.outerRadius, limitingRadiusBasedOnSpace);
    this.outerRadius = Math.max(5, this.outerRadius); // 最小半径5px，除非空间为0
    if (limitingRadiusBasedOnSpace === 0) this.outerRadius = 0;


    // 计算内半径 (用于甜甜圈图)
    const isDonut = this.mergedOptions?.pie?.innerRadius !== undefined && typeof this.mergedOptions?.pie?.innerRadius === 'number' && this.mergedOptions?.pie?.innerRadius > 0;
    if (isDonut) {
      let calculatedInnerRadius = this.outerRadius * 0.55; // 默认内半径为外半径的55%
      if (this.mergedOptions?.pie?.innerRadius! > 0 && this.mergedOptions?.pie?.innerRadius! < this.outerRadius) {
        calculatedInnerRadius = this.mergedOptions?.pie?.innerRadius!;
      } else if (this.mergedOptions?.pie?.innerRadius! >= this.outerRadius && this.outerRadius > 0) {
        // 用户值无效（过大或等于外半径），回退到默认比例
        calculatedInnerRadius = this.outerRadius * 0.55;
      } else if (this.outerRadius === 0) {
        calculatedInnerRadius = 0; // 外半径为0，则内半径也为0
      }
      this.innerRadius = Math.max(0, calculatedInnerRadius); // 确保非负
    } else {
      this.innerRadius = 0; // 非甜甜圈图，内半径为0
    }
  }

  // =================================================================================
  // 2. 绘制方法 (Drawing Methods)
  // =================================================================================

  /**
   * 开始绘制动画
   */
  private startAnimation(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    const animate = () => {
      this.animationProgress += 0.05; // 动画步长
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.draw(); // 动画结束，最后绘制一帧
        this.animationFrameId = null;
        return;
      }
      this.draw(); // 绘制当前动画帧
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * 绘制饼图的主要方法
   */
  public draw(): void {
    if (!this.ctx || this.processedData.length === 0) return;

    // 清空画布 (使用画布的完整逻辑尺寸，因为上下文已被缩放)
    this.ctx.clearRect(0, 0, this.initialDisplayWidth, this.initialDisplayHeight);
    if (this.mergedOptions.backgroundColor) {
      this.ctx.fillStyle = this.mergedOptions.backgroundColor;
      this.ctx.fillRect(0, 0, this.initialDisplayWidth, this.initialDisplayHeight);
    }

    // 绘制标题
    if (this.mergedOptions.title) {
      this.ctx.fillStyle = '#333';
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText(this.mergedOptions.title, this.centerX, 25); // 标题位置可调整
    }

    const isDonut = this.innerRadius > 0;

    // 绘制每个切片
    this.processedData.forEach((item, index) => {
      if (!this.sliceVisibility[index]) return; // 如果切片不可见，则跳过

      const animatedEndAngle = item.startAngle + (item.endAngle - item.startAngle) * this.animationProgress;
      const isHovered = index === this.hoveredIndex;
      const numberOfVisibleSlices = this.processedData.filter((_, i) => this.sliceVisibility[i]).length;

      this.ctx.save(); // 保存当前上下文状态

      // 处理悬浮时的切片扩展效果
      if (isHovered && this.mergedOptions?.pie?.expandSlice && numberOfVisibleSlices > 1) {
        const expandRadius = this.mergedOptions?.pie?.expandRadius || 10;
        const midAngle = (item.startAngle + animatedEndAngle) / 2;
        const offsetX = Math.cos(midAngle) * expandRadius;
        const offsetY = Math.sin(midAngle) * expandRadius;
        this.ctx.translate(offsetX, offsetY); // 平移上下文以实现扩展效果
      }

      this.ctx.beginPath();
      if (isDonut) {
        this.ctx.arc(this.centerX, this.centerY, this.outerRadius, item.startAngle, animatedEndAngle);
        this.ctx.arc(this.centerX, this.centerY, this.innerRadius, animatedEndAngle, item.startAngle, true); // 逆时针绘制内圆弧
        this.ctx.closePath();
      } else { // 非甜甜圈图
        const angleDiff = animatedEndAngle - item.startAngle;
        // 使用一个小的容差值来判断是否接近完整的圆
        const isFullCircle = Math.abs(angleDiff - (Math.PI * 2)) < 1e-6;

        if (isFullCircle) {
          // 如果是完整的圆，只绘制圆弧本身，确保从0到2*PI以避免潜在的微小间隙问题
          this.ctx.arc(this.centerX, this.centerY, this.outerRadius, 0, Math.PI * 2);
          this.ctx.closePath(); // 虽然arc(0, 2PI)本身是闭合的，但显式调用closePath保持路径定义完整
        } else {
          // 标准的饼图扇形路径：从圆心开始，绘制圆弧，然后闭合路径回到圆心
          this.ctx.moveTo(this.centerX, this.centerY);
          this.ctx.arc(this.centerX, this.centerY, this.outerRadius, item.startAngle, animatedEndAngle);
          this.ctx.closePath(); // 连接圆弧的终点到moveTo设置的起点（圆心）
        }
      }

      this.ctx.fillStyle = item.color || '#ccc'; // 设置填充颜色
      this.ctx.fill();

      // 设置边框和阴影（悬浮时效果更明显）
      if (isHovered) {
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 8;
        this.ctx.strokeStyle = '#fff'; // 悬浮时使用更清晰的白色边框
        this.ctx.lineWidth = 2;
      } else {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; // 默认半透明白色边框
        this.ctx.lineWidth = 1;
      }
      this.ctx.stroke(); // 描边
      this.ctx.restore(); // 恢复上下文状态
    });

    // 动画完成后绘制标签和甜甜圈文本
    if (this.mergedOptions?.pie?.showLabels && this.animationProgress === 1) this.drawLabels();
    if (isDonut && this.mergedOptions?.pie?.donutText && this.animationProgress === 1) this.drawDonutText();
  }

  /**
   * 在甜甜圈图中心绘制文本
   */
  private drawDonutText(): void {
    if (!this.mergedOptions?.pie?.donutText) return;
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'; // 轻微阴影
    this.ctx.shadowBlur = 4;
    this.ctx.fillStyle = '#333'; // 文本颜色
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = 'bold 16px Arial'; // 文本样式
    this.ctx.fillText(this.mergedOptions?.pie?.donutText, this.centerX, this.centerY);
    this.ctx.restore();
  }

  /**
   * 在每个切片上绘制标签 (数值或百分比)
   */
  private drawLabels(): void {
    const numberOfVisibleSlices = this.processedData.filter((_, i) => this.sliceVisibility[i]).length;

    this.processedData.forEach((item, index) => {
      if (!this.sliceVisibility[index]) return; // 不绘制不可见切片的标签

      let x: number;
      let y: number;

      if (numberOfVisibleSlices === 1) {
        // 如果只有一个可见切片（100%），标签位于圆心且不移动
        x = this.centerX;
        y = this.centerY;
      } else {
        // 多个切片时的标准标签定位逻辑
        const midAngle = (item.startAngle + item.endAngle) / 2; // 切片中间角度
        let labelRadius = this.outerRadius * 0.8; // 默认标签半径
        if (this.innerRadius > 0 && this.outerRadius - this.innerRadius < 40) { // 如果环很窄
          labelRadius = this.innerRadius + (this.outerRadius - this.innerRadius) / 2;
        } else if (this.innerRadius > 0) {
          labelRadius = this.innerRadius + (this.outerRadius - this.innerRadius) * 0.6;
        }
        x = this.centerX + Math.cos(midAngle) * labelRadius;
        y = this.centerY + Math.sin(midAngle) * labelRadius;

        // 如果当前切片被悬浮且选项允许扩展（这只在 numberOfVisibleSlices > 1 时发生）
        // 标签也需要相应移动以保持在切片上
        const isHovered = index === this.hoveredIndex;
        if (isHovered && this.mergedOptions?.pie?.expandSlice) {
          const expandRadius = this.mergedOptions?.pie?.expandRadius || 10;
          const hoverOffsetX = Math.cos(midAngle) * expandRadius;
          const hoverOffsetY = Math.sin(midAngle) * expandRadius;
          x += hoverOffsetX;
          y += hoverOffsetY;
        }
      }

      this.ctx.save();
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = DEFAULT_SLICE_LABEL_SHADOW_COLOR; // 文本阴影使其更易读
      this.ctx.shadowBlur = DEFAULT_SLICE_LABEL_SHADOW_BLUR;

      let labelText = '';
      // 使用 originalPercentage 进行显示
      if (this.mergedOptions?.pie?.showPercentage && item.originalPercentage !== undefined) {
        labelText = `${this.formatPercentage(item.originalPercentage)}`;
      }
      if (this.mergedOptions?.pie?.showLabels && item.data !== undefined) {
        const valueText = this.formatValue(item.data);
        labelText = labelText ? `${valueText} (${labelText})` : valueText;
      }
      if (!labelText && item.name) {
        labelText = item.name; // 如果都没有，显示名称
      }

      this.ctx.font = DEFAULT_PIE_LABEL_FONT; // 标签字体
      this.ctx.fillStyle = '#fff'; // 标签文字颜色 (白色，通常在彩色背景上较好)
      // 为白色文字添加黑色描边以增强对比度
      this.ctx.strokeStyle = DEFAULT_SLICE_LABEL_CONTRAST_STROKE_COLOR;
      this.ctx.lineWidth = DEFAULT_SLICE_LABEL_CONTRAST_STROKE_WIDTH; // 描边宽度
      this.ctx.lineJoin = 'round'; // 描边连接样式
      this.ctx.strokeText(labelText, x, y);
      this.ctx.fillText(labelText, x, y);
      this.ctx.restore();
    });
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
      pie: {
        ...this.defaultOptions.pie,
        ...(options.pie || {}),
      },
      chartType: 'pie'
    };
    // 强制图例在顶部
    if (this.mergedOptions.showLegend !== false) {
      if (!this.mergedOptions.legend) {
        this.mergedOptions.legend = { position: 'top', align: this.defaultOptions.legend!.align || 'center' };
      } else {
        this.mergedOptions.legend.position = 'top';
        if (!this.mergedOptions.legend.align) {
          this.mergedOptions.legend.align = this.defaultOptions.legend!.align || 'center';
        }
      }
    }

    if (newDisplayWidth !== undefined) this.initialDisplayWidth = newDisplayWidth;
    if (newDisplayHeight !== undefined) this.initialDisplayHeight = newDisplayHeight;

    this.data = data; // 使用 setter 处理数据并更新角度等
    this.calculateDimensions(this.initialDisplayWidth, this.initialDisplayHeight); // 重新计算尺寸
    this.draw(); // 重绘图表
  }

  /**
   * 设置当前悬浮的切片索引
   * @param index 切片索引，-1 表示没有悬浮
   */
  public setHoveredIndex(index: number): void {
    this.hoveredIndex = index;
  }

  /**
   * 切换指定索引切片的选中/可见状态
   * @param index 切片的索引
   */
  public toggleSliceSelection(index: number): void {
    if (this._isToggling || index < 0 || index >= this.processedData.length) return; // 防止重复触发或无效索引

    try {
      this._isToggling = true;
      this.cancelAllAnimations(); // 取消所有正在进行的动画

      this.sliceVisibility[index] = !this.sliceVisibility[index];

      if (this.mergedOptions?.pie?.dynamicSlices) {
        // 获取所有当前可见的切片数据
        const visibleDataItems = this.processedData.filter((_, i) => this.sliceVisibility[i]);
        if (visibleDataItems.length > 0) {
          // 重新计算可见切片的角度和百分比
          const recalculatedData = this.chartService.calculatePieAngles(visibleDataItems, this.mergedOptions?.pie?.minSliceSize) as ChartDataWithAngles[];
          // 更新 processedData 中对应可见切片的角度和百分比信息
          let visibleIndex = 0;
          for (let i = 0; i < this.processedData.length; i++) {
            if (this.sliceVisibility[i]) {
              if (visibleIndex < recalculatedData.length) { // 确保 recalculatedData 有对应项
                this.processedData[i].startAngle = recalculatedData[visibleIndex].startAngle;
                this.processedData[i].endAngle = recalculatedData[visibleIndex].endAngle;
                this.processedData[i].percentage = recalculatedData[visibleIndex].percentage; // 更新用于绘制的百分比
                // 更新用于显示的 originalPercentage，使其反映在当前可见项中的占比
                this.processedData[i].originalPercentage = recalculatedData[visibleIndex].originalPercentage;
                visibleIndex++;
              }
            }
          }
        } else {
          // 如果没有可见切片了，可以将所有角度设为0或保持原样，取决于期望行为
          // 当前行为：不改变角度，但它们不会被绘制
        }
      }

      this.animationProgress = 1; // 确保下次绘制是最终状态
      if (this.hoveredIndex === index && !this.sliceVisibility[index]) {
        this.hoveredIndex = -1; // 如果隐藏了当前悬浮的切片，则取消悬浮状态
      }
      this.ngZone.run(() => this.draw()); // 在Angular Zone内重绘
    } finally {
      setTimeout(() => this._isToggling = false, 50); // 短暂延迟后重置标志
    }
  }

  /**
   * 获取图例项数组，用于在图表组件中渲染图例
   * @returns 图例项数组
   */
  public getLegendItems(): Array<{ name: string; color: string; visible: boolean; active: boolean; percentageText?: string, numberText?: string }> {
    return this.processedData.map((item, i) => ({
      name: item.name,
      color: item.color || this.mergedOptions.colors![i % this.mergedOptions.colors!.length], // 回退到默认颜色
      visible: this.isSliceVisible(i),
      active: this.hoveredIndex === i, // 是否为当前悬浮的切片
      // 使用 originalPercentage 进行显示
      percentageText: (this.mergedOptions?.pie?.showPercentage && item.originalPercentage !== undefined) ? this.formatPercentage(item.originalPercentage) : undefined,
      numberText: (this.mergedOptions?.pie?.showLabels && item.data !== undefined) ? this.formatValue(item.data) : undefined
    }));
  }

  /**
   * 检查指定索引的切片是否可见
   * @param index 切片的索引
   * @returns 如果可见则返回 true，否则返回 false
   */
  public isSliceVisible(index: number): boolean {
    return this.sliceVisibility[index] === true;
  }

  /**
   * 获取当前悬浮切片的颜色
   * @returns 颜色字符串，如果没有悬浮或颜色未定义则为空字符串
   */
  public getHoveredSliceColor(): string {
    if (this.hoveredIndex < 0 || this.hoveredIndex >= this.processedData.length) return '';
    return this.processedData[this.hoveredIndex].color || '';
  }

  /**
   * 格式化数值 (例如，添加千位分隔符)
   * @param value 要格式化的数值
   * @returns 格式化后的字符串，无效则为 '0'
   */
  public formatValue(value: number | undefined): string {
    if (typeof value === 'number') return this.chartService.formatNumber(value);
    return '0';
  }

  /**
   * 格式化百分比值
   * @param percentage 百分比数值 (0-100)
   * @returns 格式化后的百分比字符串 (例如 "25.0")，无效则为 '0'
   */
  public formatPercentage(percentage: number | undefined): string {
    return percentage !== undefined ? percentage.toFixed(1) + '%' : '0%';
  }

  /**
   * 处理画布点击事件，判断是否点击在某个切片上
   * @param canvasX 点击位置相对于画布的 X 坐标 (逻辑单位)
   * @param canvasY 点击位置相对于画布的 Y 坐标 (逻辑单位)
   * @param event 原始鼠标事件
   */
  public processCanvasClick(canvasX: number, canvasY: number, event: MouseEvent): void {
    if (!this.mergedOptions.onClick) return; // 如果没有定义点击回调，则不处理

    const clickedSliceIndex = this.findHoveredSlice(canvasX, canvasY);
    if (clickedSliceIndex !== -1 && this.sliceVisibility[clickedSliceIndex]) { // 确保切片可见才响应点击
      this.ngZone.run(() => { // 确保在 Angular Zone 内执行
        this.mergedOptions.onClick!({
          item: this.processedData[clickedSliceIndex],
          index: clickedSliceIndex,
          data: this.processedData, // 传递原始处理后的数据
          options: this.mergedOptions,
          event: event // 传递原始鼠标事件
        });
      });
    }
  }

  /**
   * 查找鼠标位置对应的切片索引
   * @param x 鼠标相对于画布中心的 X 坐标 (逻辑单位)
   * @param y 鼠标相对于画布中心的 Y 坐标 (逻辑单位)
   * @returns 返回切片索引，未找到则为 -1
   */
  public findHoveredSlice(x: number, y: number): number {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI; // 将角度标准化到 0 - 2PI

    // 检查距离是否在内外半径之间 (如果是甜甜圈图)
    if (distance <= this.outerRadius && (this.innerRadius === 0 || distance >= this.innerRadius)) {
      for (let i = 0; i < this.processedData.length; i++) {
        if (!this.sliceVisibility[i]) continue; // 跳过不可见的切片
        const slice = this.processedData[i];
        // 检查角度是否在切片的起始和结束角度之间
        if (angle >= slice.startAngle && angle <= slice.endAngle) return i;
      }
    }
    return -1; // 未找到匹配的切片
  }

  /**
   * 内部方法，用于隐藏工具提示并重绘
   */
  private hideTooltipInternal(): void {
    if (this.hoveredIndex !== -1) {
      this.ngZone.run(() => { this.hoveredIndex = -1; });
      this.draw(); // 重绘以移除悬浮效果
    }
  }

  /**
   * 隐藏所有工具提示并重绘图表 (通常在鼠标移出画布时调用)
   */
  public hideAllTooltipsAndRedraw(): void {
    this.hideTooltipInternal();
  }

  /**
   * 取消所有主绘制动画和切片特定动画
   */
  private cancelAllAnimations(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
    this.cancelAllSliceAnimations(); // 如果有独立的切片动画，也取消它们
  }

  /**
   * 取消所有（未来可能存在的）独立切片动画
   */
  private cancelAllSliceAnimations(): void {
    if (this.sliceAnimationIds && this.sliceAnimationIds.length > 0) {
      this.sliceAnimationIds.forEach(id => { if (id) cancelAnimationFrame(id); });
      this.sliceAnimationIds = [];
    }
  }

  /**
   * 销毁服务，清理资源 (例如取消动画帧)
   */
  public destroy(): void {
    this.cancelAllAnimations();
  }
}