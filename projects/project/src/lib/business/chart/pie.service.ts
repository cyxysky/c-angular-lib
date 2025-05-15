import { Injectable, NgZone } from '@angular/core';
import { ChartData, ChartOptions, ChartDataWithAngles, TooltipUpdate } from './chart.interface';
import { ChartService } from './chart.service';
import { Subject } from 'rxjs';

@Injectable()
export class PieService {
  private ctx!: CanvasRenderingContext2D;
  private ngZone!: NgZone;
  private chartService!: ChartService;
  private width = 300; // Logical width for chart drawing area
  private height = 300; // Logical height for chart drawing area
  private centerX = 150;
  private centerY = 150;
  private outerRadius = 120;
  private innerRadius = 0;
  public hoveredIndex: number = -1;
  private animationProgress = 0;
  private animationFrameId: number | null = null;
  public processedData: Array<ChartDataWithAngles> = [];
  public sliceVisibility: boolean[] = [];
  private mousePosition: { x: number, y: number } = { x: 0, y: 0 };
  private canvasScale: number = 1; // devicePixelRatio, passed from component
  private mergedOptions!: ChartOptions;
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
  private lastEmittedTooltipData?: any;
  private lastEmittedBorderColor?: string;

  constructor(chartService: ChartService, ngZone: NgZone) {
    this.chartService = chartService;
    this.ngZone = ngZone;
  }

  public init(
    ctx: CanvasRenderingContext2D,
    displayWidth: number, // Initial canvas logical width
    displayHeight: number, // Initial canvas logical height
    canvasScale: number, // devicePixelRatio
    data: ChartData[],
    options: ChartOptions,
    skipInitialAnimation: boolean = false
  ): void {
    this.ctx = ctx;
    this.canvasScale = canvasScale;
    this.mergedOptions = { ...this.defaultOptions, ...options, chartType: 'pie' };
    this.data = data;
    this.calculateDimensions(displayWidth, displayHeight); // Calculate actual chart drawing dimensions
    if (this.mergedOptions.animate && !skipInitialAnimation) {
      this.animationProgress = 0;
      this.startAnimation();
    } else {
      this.animationProgress = 1;
    }
    this.draw();
  }

  public update(data: ChartData[], options: ChartOptions, newDisplayWidth?: number, newDisplayHeight?: number): void {
    this.mergedOptions = { ...this.defaultOptions, ...options, chartType: 'pie' };
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
    if (this.processedData.length !== this.sliceVisibility.length || this.sliceVisibility.some(v => v === undefined)){
        this.sliceVisibility = this.processedData.map(() => true);
    }
  }

  private calculateDimensions(canvasLogicalWidth: number, canvasLogicalHeight: number): void {
    // Use the passed canvas logical dimensions as the basis
    this.width = this.mergedOptions.width || canvasLogicalWidth;
    this.height = this.mergedOptions.height || canvasLogicalHeight;
    // Adjust drawing area based on legend (similar to original logic but without direct DOM access for padding)
    const isDonut = this.mergedOptions.innerRadius !== undefined && this.mergedOptions.innerRadius > 0;
    if (isDonut && this.mergedOptions.showLegend) {
      if (!this.mergedOptions.legend) this.mergedOptions.legend = {};
      this.mergedOptions.legend.position = 'top'; // Force legend to top for donut with legend (as per original)
    }
    const legendPosition = this.mergedOptions.legend?.position || 'top';
    if (this.mergedOptions.showLegend) {
      if (legendPosition === 'left' || legendPosition === 'right') this.width *= 0.8;
      else if (legendPosition === 'top' || legendPosition === 'bottom') this.height *= 0.85;
    }
    // If user specified fixed width/height in options, those should take precedence for chart drawing area.
    // The canvas itself will be canvasLogicalWidth/Height.
    // This ensures chart drawing respects options if provided, else fits in given canvas space.
    this.width = this.mergedOptions.width || this.width; 
    this.height = this.mergedOptions.height || this.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.outerRadius = this.mergedOptions.outerRadius || Math.min(this.width, this.height) * 0.4;
    if (isDonut) {
      this.innerRadius = this.outerRadius * 0.6;
      if (this.mergedOptions.innerRadius && this.mergedOptions.innerRadius > 0 && this.mergedOptions.innerRadius < this.outerRadius) {
        this.innerRadius = this.mergedOptions.innerRadius;
      }
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
    // Clear using the logical width/height of the drawing area, context is already scaled
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (this.mergedOptions.backgroundColor) {
      this.ctx.fillStyle = this.mergedOptions.backgroundColor;
      this.ctx.fillRect(0, 0, this.width, this.height);
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

  public processMouseMove(canvasX: number, canvasY: number, event: MouseEvent, isTooltipHoverable: boolean): void {
    this.mousePosition = { x: canvasX, y: canvasY };
    const hoveredSliceIndex = this.findHoveredSlice(canvasX, canvasY);
    if (hoveredSliceIndex !== this.hoveredIndex) {
      this.ngZone.run(() => { 
        this.hoveredIndex = hoveredSliceIndex;
      });
      this.draw();
      if (hoveredSliceIndex !== -1 && this.mergedOptions.hoverEffect?.showTooltip) {
        const sliceData = this.processedData[hoveredSliceIndex];
        this.lastEmittedTooltipData = {
          title: sliceData.name,
          rows: [
              { label: '数值', value: this.formatValue(sliceData.value) },
              { label: '比例', value: `${this.formatPercentage(sliceData.percentage)}%` }
          ],
          item: sliceData
        };
        this.lastEmittedBorderColor = sliceData.color || '';
        this.tooltipUpdateSubject.next({
          isVisible: true,
          data: this.lastEmittedTooltipData,
          position: { x: canvasX + 15, y: canvasY }, // Use canvas-relative coordinates
          borderColor: this.lastEmittedBorderColor
        });
      } else {
         if (this.hoveredIndex === -1) {
            this.tooltipUpdateSubject.next({ isVisible: false });
         }
      }
    } else if (hoveredSliceIndex !== -1 && this.mergedOptions.hoverEffect?.showTooltip) {
      this.tooltipUpdateSubject.next({
        isVisible: true,
        data: this.lastEmittedTooltipData,
        position: { x: canvasX + 15, y: canvasY }, // Use canvas-relative coordinates
        borderColor: this.lastEmittedBorderColor
      });
    }
  }

  public processMouseOut(isTrulyLeavingCanvas: boolean, event: MouseEvent): void {
    if (isTrulyLeavingCanvas) {
      if (this.hoveredIndex !== -1) {
        this.ngZone.run(() => { this.hoveredIndex = -1; });
        this.draw();
        this.tooltipUpdateSubject.next({ isVisible: false });
      }
    }
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
          event: event // Original mouse event
        });
      });
    }
  }

  private findHoveredSlice(x: number, y: number): number {
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

  private _hideTooltipInternal(): void {
    if (this.hoveredIndex !== -1) {
        this.ngZone.run(() => { this.hoveredIndex = -1; });
        this.tooltipUpdateSubject.next({ isVisible: false });
        this.draw(); 
    }
  }

  public hideAllTooltipsAndRedraw(): void {
   this._hideTooltipInternal();
  }

  public destroy(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
    this.cancelAllSliceAnimations();
  }
}