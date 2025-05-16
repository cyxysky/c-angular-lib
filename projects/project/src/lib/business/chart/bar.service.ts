import { Injectable, NgZone } from '@angular/core';
import { ChartData, ChartOptions, TooltipUpdate } from './chart.interface';
import { ChartService } from './chart.service';
import { Subject } from 'rxjs';

@Injectable()
export class BarService {
  private ctx!: CanvasRenderingContext2D;
  private ngZone!: NgZone;
  private chartService!: ChartService;
  public processedData: ChartData[] = [];
  private seriesVisibility: boolean[] = [];
  public mergedOptions!: ChartOptions;
  private defaultOptions: Partial<ChartOptions> = {
    colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8341f4', '#3acfb4', '#fa7e1e', '#dc3545'],
    backgroundColor: '#ffffff',
    borderRadius: 4,
    showValues: true,
    showLegend: true,
    showGrid: true,
    animate: true,
    margin: { top: 40, right: 20, bottom: 50, left: 50 },
    legend: { position: 'top', align: 'center' },
    hoverEffect: { enabled: true, showTooltip: true, showGuideLine: true, guideLineStyle: 'dashed', guideLineColor: '#666', guideLineWidth: 1, tooltipHoverable: false }
  };
  private animationFrameId: number | null = null;
  private currentAnimationValue = 0;
  public hoveredBarIndex: number = -1;
  public hoveredSeriesIndex: number = -1;
  public barPositions: Array<{ x: number, y: number, width: number, height: number, data: ChartData, seriesIndex: number }> = [];
  private displayWidth!: number; // 逻辑宽度
  private displayHeight!: number; // 逻辑高度
  private tooltipUpdateSubject = new Subject<TooltipUpdate>();
  public tooltipUpdate$ = this.tooltipUpdateSubject.asObservable();

  constructor(chartService: ChartService, ngZone: NgZone) {
    this.chartService = chartService;
    this.ngZone = ngZone;
  }

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
    this.mergedOptions = { ...this.defaultOptions, ...options, chartType: 'bar' };
    if (this.mergedOptions.barColors && (!this.mergedOptions.colors || this.mergedOptions.colors.length === 0)) {
      this.mergedOptions.colors = this.mergedOptions.barColors;
    }
    this.data = data;
    this.drawChart(skipInitialAnimation);
  }

  public setHoveredIndices(dataIndex: number, seriesIndex: number): void {
    this.hoveredBarIndex = dataIndex;
    this.hoveredSeriesIndex = seriesIndex;
  }

  public emitTooltipUpdate(update: TooltipUpdate): void {
    this.tooltipUpdateSubject.next(update);
  }

  public update(data: ChartData[], options: ChartOptions, newDisplayWidth?: number, newDisplayHeight?: number): void {
    this.mergedOptions = { ...this.defaultOptions, ...options, chartType: 'bar' };
    if (this.mergedOptions.barColors && (!this.mergedOptions.colors || this.mergedOptions.colors.length === 0)) {
      this.mergedOptions.colors = this.mergedOptions.barColors;
    }
    if (newDisplayWidth !== undefined) this.displayWidth = newDisplayWidth;
    if (newDisplayHeight !== undefined) this.displayHeight = newDisplayHeight;
    this.data = data;
    this.drawChart();
  }

  private set data(newData: ChartData[]) {
    this.processDataInput(newData);
  }

  private processDataInput(inputData: ChartData[]): void {
    this.processedData = [];
    if (!inputData || inputData.length === 0) return;
    try {
      const hasChildren = inputData.some(item => item.children && item.children.length > 0);
      const hasSeries = inputData.some(item => item.series);
      if (hasChildren || hasSeries) {
        this.processedData = [...inputData];
      } else {
        this.processedData = [{
          name: this.mergedOptions.title || '数据',
          series: this.mergedOptions.title || '数据',
          children: [...inputData]
        }];
      }
      this.processedData = this.processedData.map(item => {
        if (item.children) {
          return { ...item, children: item.children.filter(child => child && child.name !== undefined) };
        }
        return item;
      });
      this.seriesVisibility = this.getSeriesNames().map(() => true);
    } catch (e) {
      console.error('处理数据时出错:', e);
      this.processedData = [];
      this.seriesVisibility = [];
    }
  }

  private hideTooltipInternal(): void {
    if (this.hoveredBarIndex !== -1 || this.hoveredSeriesIndex !== -1) {
      this.ngZone.run(() => {
        this.hoveredBarIndex = -1;
        this.hoveredSeriesIndex = -1;
      });
      this.tooltipUpdateSubject.next({ isVisible: false });
      this.drawChartFrame(1.0);
    }
  }

  public hideAllTooltipsAndRedraw(): void {
    this.hideTooltipInternal();
  }

  public destroy(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  public getSeriesNames(): string[] {
    const seriesNames: string[] = [];
    this.processedData.forEach(item => {
      if (item.series && !seriesNames.includes(item.series)) {
        seriesNames.push(item.series);
      }
      if (item.children) {
        item.children.forEach(child => {
          if (child.series && !seriesNames.includes(child.series)) {
            seriesNames.push(child.series);
          }
        });
      }
    });
    return seriesNames;
  }

  public getVisibleData(): ChartData[] {
    const visibleSeriesNames = this.getSeriesNames().filter((_, i) => this.seriesVisibility[i]);
    if (!visibleSeriesNames.length) return [];
    return this.processedData.filter(item => {
      if (item.series && visibleSeriesNames.includes(item.series)) return true;
      if (item.children) {
        const visibleChildren = item.children.filter(child => !child.series || visibleSeriesNames.includes(child.series));
        return visibleChildren.length > 0;
      }
      return false;
    }).map(item => {
      if (item.children) {
        return { ...item, children: item.children.filter(child => !child.series || visibleSeriesNames.includes(child.series)) };
      }
      return item;
    });
  }

  private safeArrayMax(arr: number[], defaultValue: number = 0): number {
    if (!arr || arr.length === 0) return defaultValue;
    const validValues = arr.filter(val => !isNaN(val) && typeof val === 'number' && isFinite(val));
    if (validValues.length === 0) return defaultValue;
    return Math.max(...validValues);
  }

  private getMaxCategoryValue(): number {
    const visibleData = this.getVisibleData();
    if (visibleData.length === 0) return 0;
    const allCategories = new Set<string>();
    visibleData.forEach(item => {
      if (item.children) item.children.forEach(child => allCategories.add(child.name));
      else if (item.name) allCategories.add(item.name);
    });
    if (allCategories.size === 0) return 0;
    const categoryTotals: Record<string, number> = {};
    Array.from(allCategories).forEach(category => categoryTotals[category] = 0);
    visibleData.forEach(item => {
      if (item.children) {
        item.children.forEach(child => {
          if (categoryTotals[child.name] !== undefined) categoryTotals[child.name] += (child.data ?? child.value ?? 0);
        });
      } else if (item.name && categoryTotals[item.name] !== undefined) {
        categoryTotals[item.name] += (item.data ?? item.value ?? 0);
      }
    });
    return Object.values(categoryTotals).length > 0 ? this.safeArrayMax(Object.values(categoryTotals)) : 0;
  }

  private calculateTotalValue(seriesIndex?: number): number {
    const seriesNames = this.getSeriesNames();
    if (seriesIndex !== undefined && seriesIndex >= 0 && seriesIndex < seriesNames.length) {
      const seriesName = seriesNames[seriesIndex];
      let total = 0;
      this.processedData.forEach(item => {
        if (item.series === seriesName) total += (item.data ?? item.value ?? 0);
        if (item.children) item.children.forEach(child => { if (child.series === seriesName) total += (child.data ?? child.value ?? 0); });
      });
      return total;
    } else {
      let total = 0;
      this.processedData.forEach(item => {
        total += (item.data ?? item.value ?? 0);
        if (item.children) item.children.forEach(child => total += (child.data ?? child.value ?? 0));
      });
      return total;
    }
  }

  public formatValue(value: number | undefined): string {
    if (typeof value === 'number') return this.chartService.formatNumber(value);
    return '0';
  }

  public calculatePercentage(value: number | undefined, seriesIndex?: number): string {
    const totalValue = this.calculateTotalValue(seriesIndex);
    const numValue = typeof value === 'number' ? value : 0;
    return totalValue > 0 ? (numValue / totalValue * 100).toFixed(1) : '0';
  }

  public getSeriesColor(seriesIndex: number): string {
    if (seriesIndex < 0 || !this.mergedOptions.colors || this.mergedOptions.colors.length === 0) return '';
    const seriesNames = this.getSeriesNames();
    if (seriesIndex >= seriesNames.length) return '';
    const seriesName = seriesNames[seriesIndex];
    for (const item of this.processedData) {
      if (item.series === seriesName && item.color) return item.color;
      if (item.children) for (const child of item.children) if (child.series === seriesName && child.color) return child.color;
    }
    return this.mergedOptions.colors[seriesIndex % this.mergedOptions.colors.length];
  }

  public getDataColor(seriesIndex: number, dataIndex: number): string {
    if (seriesIndex < 0 || dataIndex < 0 || !this.mergedOptions.colors) return '';
    const seriesNames = this.getSeriesNames();
    if (seriesIndex >= seriesNames.length) return '';
    const seriesName = seriesNames[seriesIndex];
    let targetItem: ChartData | undefined;
    const categories = this.getCategories(this.getVisibleData());
    const categoryName = categories[dataIndex];
    for (const item of this.processedData) {
      if (item.series === seriesName) {
        if (item.children) targetItem = item.children.find(child => child.name === categoryName && (!child.series || child.series === seriesName));
        else if (item.name === categoryName) targetItem = item;
      } else if (item.children) {
        targetItem = item.children.find(child => child.name === categoryName && child.series === seriesName);
      }
      if (targetItem) break;
    }
    if (targetItem && targetItem.color) return targetItem.color;
    return this.getSeriesColor(seriesIndex);
  }

  public getHoveredBarColor(): string {
    if (this.hoveredBarIndex < 0 || this.hoveredSeriesIndex < 0) return '';
    return this.getDataColor(this.hoveredSeriesIndex, this.hoveredBarIndex);
  }

  public getLegendItems(): Array<{ name: string; color: string; visible: boolean; active: boolean; percentageText?: string }> {
    return this.getSeriesNames().map((name, i) => ({
      name,
      color: this.getSeriesColor(i),
      visible: this.isSeriesVisible(i),
      active: this.hoveredSeriesIndex === i
    }));
  }

  public isSeriesVisible(index: number): boolean {
    return this.seriesVisibility[index] === true;
  }

  public toggleSeriesVisibility(index: number): void {
    this.seriesVisibility[index] = !this.seriesVisibility[index];
    this.drawChart();
  }

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

  public drawChartFrame(animationProgress: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
    ctx.fillStyle = this.mergedOptions.backgroundColor!;
    ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
    const margin = this.mergedOptions.margin!;
    const chartWidth = this.displayWidth - margin.left - margin.right;
    const chartHeight = this.displayHeight - margin.top - margin.bottom;
    const visibleData = this.getVisibleData();
    const maxValue = this.getMaxCategoryValue();
    const categories = this.getCategories(visibleData);
    let categoryCount = categories.length;
    if (this.mergedOptions.title) {
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.mergedOptions.title, this.displayWidth / 2, margin.top / 2);
    }
    if (this.mergedOptions.showGrid && maxValue > 0) {
      this.drawGrid(margin, chartHeight, chartWidth, maxValue);
    }
    this.barPositions = [];
    if (visibleData.length > 0 && maxValue > 0 && categoryCount > 0) {
      const groupWidth = chartWidth / categoryCount;
      const visibleSeriesCount = this.getSeriesNames().filter((_, i) => this.seriesVisibility[i]).length || 1;
      const barWidth = groupWidth * 0.7 / visibleSeriesCount;
      const barSpacing = groupWidth * 0.3 / (visibleSeriesCount + 1);
      this.drawBars(visibleData, margin, chartHeight, barWidth, barSpacing, groupWidth, maxValue, animationProgress);
    } else {
      this.barPositions = [];
    }
    this.drawAxes(margin, chartHeight, chartWidth);
    if (this.hoveredBarIndex !== -1 && this.hoveredSeriesIndex !== -1 && this.mergedOptions.hoverEffect?.showGuideLine) {
      this.drawGuideLine(margin, chartHeight, chartWidth);
    }
  }

  private drawGrid(margin: any, chartHeight: number, chartWidth: number, maxValue: number): void {
    const ctx = this.ctx;
    const gridCount = 5;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridCount; i++) {
      const yPos = margin.top + chartHeight - (i / gridCount) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, yPos);
      ctx.lineTo(margin.left + chartWidth, yPos);
      ctx.stroke();
      ctx.fillStyle = '#666666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(this.chartService.formatNumber(maxValue * i / gridCount), margin.left - 10, yPos + 4);
    }
  }

  private getItemValue(item: ChartData): number {
    return (item.data ?? item.value ?? 0);
  }

  private drawBars(
    visibleData: ChartData[], margin: any, chartHeight: number, barWidth: number, barSpacing: number,
    groupWidth: number, maxValue: number, animationProgress: number
  ): void {
    const ctx = this.ctx;
    const seriesNames = this.getSeriesNames().filter((_, i) => this.seriesVisibility[i]);
    const categories = this.getCategories(visibleData);
    categories.forEach((category, categoryIdx) => {
      let cumulativeHeight = 0;
      seriesNames.forEach((seriesName, seriesIdxInGroup) => {
        const originalSeriesIndex = this.getSeriesNames().indexOf(seriesName);
        const dataItems = this.getDataItemsBySeriesName(seriesName);
        const item = dataItems.find(d => d.name === category);
        if (!item) return;
        const itemValue = this.getItemValue(item);
        const groupLeft = margin.left + categoryIdx * groupWidth;
        const x = groupLeft + barSpacing + seriesIdxInGroup * (barWidth + barSpacing);
        const barH = (itemValue / maxValue) * chartHeight * animationProgress;
        const y = margin.top + chartHeight - barH - cumulativeHeight;
        this.barPositions.push({ x, y, width: barWidth, height: barH, data: item, seriesIndex: originalSeriesIndex });
        const barColor = this.getDataColor(originalSeriesIndex, categoryIdx);
        if (categoryIdx === this.hoveredBarIndex && originalSeriesIndex === this.hoveredSeriesIndex) {
          ctx.fillStyle = this.lightenColor(barColor, 20);
        } else {
          ctx.fillStyle = barColor;
        }
        if (itemValue > 0) {
          if (this.mergedOptions.borderRadius && this.mergedOptions.borderRadius > 0) {
            const effectiveRadius = Math.min(this.mergedOptions.borderRadius, barH, barWidth / 2);
            this.roundRect(ctx, x, y, barWidth, barH, effectiveRadius, true, false);
          } else {
            ctx.fillRect(x, y, barWidth, barH);
          }
        }
        if (this.mergedOptions.showValues && animationProgress > 0.9 && itemValue > 0) {
          ctx.fillStyle = '#333333';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          const formattedValue = this.formatValue(item.data ?? item.value);
          const valueY = y - 5;
          const approximateTextHeight = 12;
          const titleHeightClearance = this.mergedOptions.title ? (margin.top / 2 + approximateTextHeight / 2 + 5) : (approximateTextHeight);

          if (valueY > titleHeightClearance) {
            ctx.fillText(formattedValue, x + barWidth / 2, valueY);
          } else if (barH > approximateTextHeight + 10) {
            ctx.fillStyle = '#ffffff';
            ctx.fillText(formattedValue, x + barWidth / 2, y + approximateTextHeight + 2);
          }
        }
      });
      if (seriesNames.length > 0) {
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const groupLeft = margin.left + categoryIdx * groupWidth;
        ctx.fillText(category, groupLeft + groupWidth / 2, margin.top + chartHeight + 20);
      }
    });
  }

  private drawAxes(margin: any, chartHeight: number, chartWidth: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();
  }

  private drawGuideLine(margin: any, chartHeight: number, chartWidth: number): void {
    if (this.hoveredBarIndex === -1 || this.hoveredSeriesIndex === -1 || !this.mergedOptions.hoverEffect?.showGuideLine) return;
    const ctx = this.ctx;
    const categories = this.getCategories(this.getVisibleData());
    if (this.hoveredBarIndex >= categories.length) return;
    const categoryName = categories[this.hoveredBarIndex];
    const hoveredBar = this.barPositions.find(
      bar => bar.seriesIndex === this.hoveredSeriesIndex && bar.data?.name === categoryName
    );
    if (!hoveredBar) return;
    const barCenterX = hoveredBar.x + hoveredBar.width / 2;
    ctx.beginPath();
    ctx.strokeStyle = this.mergedOptions.hoverEffect?.guideLineColor || '#666';
    ctx.lineWidth = this.mergedOptions.hoverEffect?.guideLineWidth || 1;
    if (this.mergedOptions.hoverEffect?.guideLineStyle === 'dashed') ctx.setLineDash([4, 4]);
    else ctx.setLineDash([]);
    ctx.moveTo(barCenterX, margin.top);
    ctx.lineTo(barCenterX, margin.top + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  public findHoveredBar(x: number, y: number): { dataIndex: number, seriesIndex: number } {
    for (let i = 0; i < this.barPositions.length; i++) {
      const bar = this.barPositions[i];
      if (x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height) {
        const categories = this.getCategories(this.getVisibleData());
        const dataIndex = categories.indexOf(bar.data.name!);
        return { dataIndex, seriesIndex: bar.seriesIndex };
      }
    }
    return { dataIndex: -1, seriesIndex: -1 };
  }

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
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  public lightenColor(color: string, percent: number): string {
    try {
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
    } catch (e) {
      return color;
    }
  }

  public getCategories(data: ChartData[]): string[] {
    const categories = new Set<string>();
    data.forEach(item => {
      if (item.children) item.children.forEach(child => { if (child.name) categories.add(child.name); });
      else if (item.name) categories.add(item.name);
    });
    return Array.from(categories);
  }

  public getDataItemsBySeriesName(seriesName: string): ChartData[] {
    const items: ChartData[] = [];
    this.processedData.forEach(item => {
      if (item.series === seriesName) {
        if (item.children) items.push(...item.children);
        else items.push(item);
      } else if (item.children) {
        const seriesItems = item.children.filter(child => child.series === seriesName);
        items.push(...seriesItems);
      }
    });
    return items;
  }

  public processCanvasClick(canvasX: number, canvasY: number, event: MouseEvent): void {
    if (!this.mergedOptions.onClick) return;
    const clickedBarInfo = this.findHoveredBar(canvasX, canvasY);
    if (clickedBarInfo.dataIndex !== -1 && clickedBarInfo.seriesIndex !== -1) {
      const seriesNames = this.getSeriesNames();
      if (clickedBarInfo.seriesIndex >= seriesNames.length) return;
      const seriesName = seriesNames[clickedBarInfo.seriesIndex];
      const categories = this.getCategories(this.getVisibleData());
      if (clickedBarInfo.dataIndex >= categories.length) return;
      const category = categories[clickedBarInfo.dataIndex];
      const dataItems = this.getDataItemsBySeriesName(seriesName);
      const item = dataItems.find(d => d.name === category);
      if (!item) return;
      const barPosition = this.barPositions.find(
        bar => bar.seriesIndex === clickedBarInfo.seriesIndex && bar.data?.name === item.name
      );
      if (barPosition) {
        this.ngZone.run(() => {
          this.mergedOptions.onClick!({
            item: item,
            index: clickedBarInfo.dataIndex,
            seriesIndex: clickedBarInfo.seriesIndex,
            data: this.processedData,
            options: this.mergedOptions,
            event: event,
            position: { x: barPosition.x, y: barPosition.y, width: barPosition.width, height: barPosition.height }
          });
        });
      }
    }
  }
}