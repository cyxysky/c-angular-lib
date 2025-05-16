import { Injectable, NgZone } from '@angular/core';
import { ChartData, ChartOptions, ChartDataWithAngles, TooltipUpdate } from './chart.interface';
import { ChartService } from './chart.service';
import { Subject } from 'rxjs';

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
  private defaultOptions: Partial<ChartOptions> = {
    colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8341f4', '#3acfb4', '#fa7e1e', '#dc3545'],
    backgroundColor: '#ffffff',
    showLabels: true,
    showPercentage: true,
    showLegend: true,
    animate: true,
    dynamicSlices: true,
    legend: { position: 'top', align: 'center' },
    hoverEffect: { enabled: true, showTooltip: true, expandSlice: true, expandRadius: 10, tooltipHoverable: false }
  };
  private _isToggling: boolean = false;
  private sliceAnimationIds: number[] = [];
  private tooltipUpdateSubject = new Subject<TooltipUpdate>();
  public tooltipUpdate$ = this.tooltipUpdateSubject.asObservable();

  constructor(chartService: ChartService, ngZone: NgZone) {
    this.chartService = chartService;
    this.ngZone = ngZone;
  }

  public init(
    ctx: CanvasRenderingContext2D,
    displayWidth: number, // 初始画布逻辑宽度
    displayHeight: number, // 初始画布逻辑高度
    data: ChartData[],
    options: ChartOptions,
    skipInitialAnimation: boolean = false
  ): void {
    this.ctx = ctx;
    this.initialDisplayWidth = displayWidth; // 存储初始画布尺寸
    this.initialDisplayHeight = displayHeight; // 存储初始画布尺寸
    this.mergedOptions = { ...this.defaultOptions, ...options, chartType: 'pie' };
    // 如果显示图例，则强制图例位于顶部
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
    this.data = data;
    this.calculateDimensions(displayWidth, displayHeight); // 计算实际图表绘制尺寸
    if (this.mergedOptions.animate && !skipInitialAnimation) {
      this.animationProgress = 0;
      this.startAnimation();
    } else {
      this.animationProgress = 1;
    }
    this.draw();
  }

  public setHoveredIndex(index: number): void {
    this.hoveredIndex = index;
  }

  public emitTooltipUpdate(update: TooltipUpdate): void {
    this.tooltipUpdateSubject.next(update);
  }

  public update(data: ChartData[], options: ChartOptions, newDisplayWidth?: number, newDisplayHeight?: number): void {
    this.mergedOptions = { ...this.defaultOptions, ...options, chartType: 'pie' };
    if (newDisplayWidth !== undefined) {
      this.initialDisplayWidth = newDisplayWidth; // 存储更新后的画布尺寸
    }
    if (newDisplayHeight !== undefined) {
      this.initialDisplayHeight = newDisplayHeight; // 存储更新后的画布尺寸
    }
    // 如果显示图例，则强制图例位于顶部
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
    this.data = data;
    if (newDisplayWidth !== undefined && newDisplayHeight !== undefined) {
      this.calculateDimensions(newDisplayWidth, newDisplayHeight);
    }
    this.draw();
  }

  private set data(newData: ChartData[]) {
    this.processDataInput(newData);
  }

  private processDataInput(inputData: ChartData[]): void {
    if (!inputData || inputData.length === 0) {
      this.processedData = [];
      this.sliceVisibility = [];
      return;
    }
    const coloredData = this.chartService.assignPieColors(inputData as any, this.mergedOptions.colors || this.defaultOptions.colors!);
    this.processedData = this.chartService.calculatePieAngles(coloredData) as Array<ChartDataWithAngles>;
    if (this.processedData.length !== this.sliceVisibility.length || this.sliceVisibility.some(v => v === undefined)) {
      this.sliceVisibility = this.processedData.map(() => true);
    }
  }

  private calculateDimensions(canvasLogicalWidth: number, canvasLogicalHeight: number): void {
    // 从完整的逻辑画布尺寸开始
    let effectiveWidth = canvasLogicalWidth;
    let effectiveHeight = canvasLogicalHeight;
    // 如果在选项中显式提供了图表尺寸，则直接将其用于绘制区域。
    // 否则，绘制区域即为画布尺寸，可能会因图例而减小。
    if (this.mergedOptions.width) {
      this.width = this.mergedOptions.width;
    } else {
      // 没有显式宽度，从画布宽度派生，可能会为图例减小
      if (this.mergedOptions.showLegend) {
        const legendPos = this.mergedOptions.legend?.position || 'top'; // 由于强制，将为 'top'
        if (legendPos === 'left' || legendPos === 'right') {
          effectiveWidth *= 0.8; // 减少图表计算可用空间
        }
      }
      this.width = effectiveWidth;
    }
    if (this.mergedOptions.height) {
      this.height = this.mergedOptions.height;
    } else {
      // 没有显式高度，从画布高度派生，可能会为图例减小
      if (this.mergedOptions.showLegend) {
        const legendPos = this.mergedOptions.legend?.position || 'top'; // 由于强制，将为 'top'
        if (legendPos === 'top' || legendPos === 'bottom') { // 虽然 'bottom' 不应该出现
          effectiveHeight *= 0.85; // 减少图表计算可用空间
        }
      }
      this.height = effectiveHeight;
    }
    // 此时，this.width 和 this.height 是图表绘制框的尺寸。
    const titleGutter = this.mergedOptions.title ? 40 : 0;
    this.centerX = this.width / 2;
    this.centerY = titleGutter + (this.height - titleGutter) / 2;
    // 计算 outerRadius
    const availableRadiusX = this.width / 2;
    const availableRadiusY = (this.height - titleGutter) / 2;
    const limitingRadiusBasedOnSpace = Math.max(0, Math.min(availableRadiusX, availableRadiusY));
    if (this.mergedOptions.outerRadius && typeof this.mergedOptions.outerRadius === 'number' && this.mergedOptions.outerRadius > 0) {
      this.outerRadius = this.mergedOptions.outerRadius;
    } else {
      // 默认使用可用限制半径的90%（实际上是直径的0.45），然后增加30px。
      const baseDefaultRadius = limitingRadiusBasedOnSpace * 0.9;
      this.outerRadius = baseDefaultRadius + 30;
    }
    // 确保最终的 outerRadius（用户定义或默认+30）不超过可用空间。
    this.outerRadius = Math.min(this.outerRadius, limitingRadiusBasedOnSpace);
    // 如果空间允许，确保最小实用半径（例如5px）。
    if (limitingRadiusBasedOnSpace > 0) {
      this.outerRadius = Math.max(5, this.outerRadius);
    } else {
      this.outerRadius = 0; // 没有空间，半径为0
    }
    const isDonut = this.mergedOptions.innerRadius !== undefined && typeof this.mergedOptions.innerRadius === 'number' && this.mergedOptions.innerRadius > 0;
    if (isDonut) {
      // 默认 innerRadius 是 outerRadius 的 55% (使环更厚，环占 outerRadius 的 65%)。
      let calculatedInnerRadius = this.outerRadius * 0.55;
      // 如果有效，用户定义的 innerRadius（绝对值）优先。
      if (this.mergedOptions.innerRadius! > 0 && this.mergedOptions.innerRadius! < this.outerRadius) {
        calculatedInnerRadius = this.mergedOptions.innerRadius!;
      } else if (this.mergedOptions.innerRadius! >= this.outerRadius && this.outerRadius > 0) {
        // 用户值无效（过大或相等），使用默认的 55%
        calculatedInnerRadius = this.outerRadius * 0.55;
      } else if (this.outerRadius === 0) {
        calculatedInnerRadius = 0; // 没有外半径，所以没有内半径。
      }
      // 如果 this.mergedOptions.innerRadius 为 0 (或 undefined, 被 isDonut 捕获),
      // 它将使用默认计算的 calculatedInnerRadius (this.outerRadius * 0.55)
      // 除非 outerRadius 也为 0。
      this.innerRadius = Math.max(0, calculatedInnerRadius); // 确保非负
    } else {
      this.innerRadius = 0;
    }
  }

  private startAnimation(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    const animate = () => {
      this.animationProgress += 0.05;
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.draw();
        this.animationFrameId = null;
        return;
      }
      this.draw();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  public draw(): void {
    if (!this.ctx || this.processedData.length === 0) return;
    // 使用画布的完整初始逻辑宽度/高度进行清除，上下文已被缩放
    this.ctx.clearRect(0, 0, this.initialDisplayWidth, this.initialDisplayHeight);
    if (this.mergedOptions.backgroundColor) {
      this.ctx.fillStyle = this.mergedOptions.backgroundColor;
      this.ctx.fillRect(0, 0, this.initialDisplayWidth, this.initialDisplayHeight);
    }
    if (this.mergedOptions.title) {
      this.ctx.fillStyle = '#333';
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText(this.mergedOptions.title, this.centerX, 25);
    }
    const isDonut = this.innerRadius > 0;
    this.processedData.forEach((item, index) => {
      if (!this.sliceVisibility[index]) return;
      const animatedEndAngle = item.startAngle + (item.endAngle - item.startAngle) * this.animationProgress;
      const isHovered = index === this.hoveredIndex;
      this.ctx.save();
      if (isHovered && this.mergedOptions.hoverEffect?.expandSlice) {
        const expandRadius = this.mergedOptions.hoverEffect.expandRadius || 10;
        const midAngle = (item.startAngle + animatedEndAngle) / 2;
        const offsetX = Math.cos(midAngle) * expandRadius;
        const offsetY = Math.sin(midAngle) * expandRadius;
        this.ctx.translate(offsetX, offsetY);
      }
      this.ctx.beginPath();
      if (isDonut) {
        this.ctx.arc(this.centerX, this.centerY, this.outerRadius, item.startAngle, animatedEndAngle);
        this.ctx.arc(this.centerX, this.centerY, this.innerRadius, animatedEndAngle, item.startAngle, true);
        this.ctx.closePath();
      } else {
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.arc(this.centerX, this.centerY, this.outerRadius, item.startAngle, animatedEndAngle);
        this.ctx.lineTo(this.centerX, this.centerY);
      }
      this.ctx.fillStyle = item.color || '#ccc';
      this.ctx.fill();
      if (isHovered) {
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 8;
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
      } else {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 1;
      }
      this.ctx.stroke();
      this.ctx.restore();
    });
    if (this.mergedOptions.showLabels && this.animationProgress === 1) this.drawLabels();
    if (isDonut && this.mergedOptions.donutText && this.animationProgress === 1) this.drawDonutText();
  }

  private drawDonutText(): void {
    if (!this.mergedOptions.donutText) return;
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    this.ctx.shadowBlur = 4;
    this.ctx.fillStyle = '#333';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillText(this.mergedOptions.donutText, this.centerX, this.centerY);
    this.ctx.restore();
  }

  private drawLabels(): void {
    this.processedData.forEach((item, index) => {
      if (!this.sliceVisibility[index]) return;
      const midAngle = (item.startAngle + item.endAngle) / 2;
      const labelRadius = this.outerRadius * 0.75;
      const x = this.centerX + Math.cos(midAngle) * labelRadius;
      const y = this.centerY + Math.sin(midAngle) * labelRadius;
      this.ctx.save();
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      this.ctx.shadowBlur = 3;
      const valueText = this.formatValue(item.value);
      this.ctx.font = 'bold 14px Arial, sans-serif';
      this.ctx.fillStyle = '#fff';
      this.ctx.textBaseline = 'middle';
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.lineWidth = 3;
      this.ctx.lineJoin = 'round';
      this.ctx.strokeText(valueText, x, y);
      this.ctx.fillText(valueText, x, y);
      this.ctx.restore();
    });
  }

  public getLegendItems(): Array<{ name: string; color: string; visible: boolean; active: boolean; percentageText?: string }> {
    return this.processedData.map((item, i) => ({
      name: item.name,
      color: item.color || this.mergedOptions.colors![i % this.mergedOptions.colors!.length],
      visible: this.isSliceVisible(i),
      active: this.hoveredIndex === i,
      percentageText: this.mergedOptions.showPercentage ? this.formatPercentage(item.percentage) : undefined
    }));
  }

  public isSliceVisible(index: number): boolean {
    return this.sliceVisibility[index] === true;
  }

  public toggleSliceSelection(index: number): void {
    if (this._isToggling) return;
    try {
      this._isToggling = true;
      this.cancelAllAnimations();
      this.sliceVisibility[index] = !this.sliceVisibility[index];
      if (this.mergedOptions.dynamicSlices) {
        const visibleData = this.processedData.filter((_, i) => this.sliceVisibility[i]);
        if (visibleData.length > 0) {
          const recalculatedData = this.chartService.calculatePieAngles(visibleData) as ChartDataWithAngles[];
          let visibleIndex = 0;
          for (let i = 0; i < this.processedData.length; i++) {
            if (this.sliceVisibility[i]) {
              this.processedData[i].startAngle = recalculatedData[visibleIndex].startAngle;
              this.processedData[i].endAngle = recalculatedData[visibleIndex].endAngle;
              this.processedData[i].percentage = recalculatedData[visibleIndex].percentage;
              visibleIndex++;
            }
          }
        }
      }
      this.animationProgress = 1;
      if (this.hoveredIndex === index && !this.sliceVisibility[index]) this.hoveredIndex = -1;
      this.ngZone.run(() => this.draw());
    } finally {
      setTimeout(() => this._isToggling = false, 100);
    }
  }

  private cancelAllAnimations(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
    this.cancelAllSliceAnimations();
  }

  private cancelAllSliceAnimations(): void {
    if (this.sliceAnimationIds) {
      this.sliceAnimationIds.forEach(id => { if (id) cancelAnimationFrame(id); });
      this.sliceAnimationIds = [];
    }
  }

  public getHoveredSliceColor(): string {
    if (this.hoveredIndex < 0 || this.hoveredIndex >= this.processedData.length) return '';
    return this.processedData[this.hoveredIndex].color || '';
  }

  public formatValue(value: number | undefined): string {
    if (typeof value === 'number') return this.chartService.formatNumber(value);
    return '0';
  }

  public formatPercentage(percentage: number | undefined): string {
    return percentage !== undefined ? percentage.toFixed(1) : '0';
  }

  public processCanvasClick(canvasX: number, canvasY: number, event: MouseEvent): void {
    if (!this.mergedOptions.onClick) return;
    const clickedSliceIndex = this.findHoveredSlice(canvasX, canvasY);
    if (clickedSliceIndex !== -1) {
      this.ngZone.run(() => {
        this.mergedOptions.onClick!({
          item: this.processedData[clickedSliceIndex],
          index: clickedSliceIndex,
          data: this.processedData,
          options: this.mergedOptions,
          event: event // 原始鼠标事件
        });
      });
    }
  }

  public findHoveredSlice(x: number, y: number): number {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;
    if (distance <= this.outerRadius && distance >= this.innerRadius) {
      for (let i = 0; i < this.processedData.length; i++) {
        if (!this.sliceVisibility[i]) continue;
        const slice = this.processedData[i];
        if (angle >= slice.startAngle && angle <= slice.endAngle) return i;
      }
    }
    return -1;
  }

  private hideTooltipInternal(): void {
    if (this.hoveredIndex !== -1) {
      this.ngZone.run(() => { this.hoveredIndex = -1; });
      this.tooltipUpdateSubject.next({ isVisible: false });
      this.draw();
    }
  }

  public hideAllTooltipsAndRedraw(): void {
    this.hideTooltipInternal();
  }

  public destroy(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
    this.cancelAllSliceAnimations();
  }
}