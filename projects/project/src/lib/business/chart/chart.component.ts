import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, SimpleChanges, NgZone, TemplateRef, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartData, ChartOptions, TooltipUpdate } from './chart.interface';
import { ChartService } from './chart.service';
import { BarService } from './bar.service';
import { PieService } from './pie.service';
import { Subject, Subscription } from 'rxjs';

interface LegendItem {
  name: string;
  color: string;
  visible: boolean;
  active: boolean;
  percentageText?: string;
}

@Component({
  selector: 'lib-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.less',
  providers: [BarService, PieService, ChartService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('chartTooltip', { static: true }) chartTooltipElementRef!: ElementRef<HTMLDivElement>;
  @ViewChild('defaultTooltipTemplate', { static: true }) defaultTooltipRef!: TemplateRef<{ $implicit: any }>;

  @Input() data: ChartData[] = [];
  @Input() options!: ChartOptions;
  @Input() tooltipTemplate?: TemplateRef<{ $implicit: any }>;

  private resizeTimeout: number | null = null;
  public legendItems: LegendItem[] = [];
  public tooltipSubject!: Subject<TooltipUpdate>;
  private serviceTooltipSubscription?: Subscription;

  isTooltipDisplayed: boolean = false;
  tooltipData?: any;
  tooltipStylePosition: { left: string, top: string } = { left: '', top: '' };
  tooltipBorderColor?: string;
  private componentDevicePixelRatio: number = 1;
  private componentCanvasLogicalWidth!: number;
  private componentCanvasLogicalHeight!: number;
  private boundOnCanvasMouseMove!: (event: MouseEvent) => void;
  private boundOnCanvasMouseOut!: (event: MouseEvent) => void;
  private boundOnCanvasClick!: (event: MouseEvent) => void;
  private eventListenersAttached: boolean = false;
  private lastMouseEventForTooltip?: MouseEvent; // 用于存储最后的鼠标事件，在某些提示框逻辑中可能有用

  constructor(
    private barService: BarService,
    private pieService: PieService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.validateOptions();
  }

  ngAfterViewInit(): void {
    this.initializeChart(false);
    window.addEventListener('resize', this.onResize.bind(this));
  }

  ngOnChanges(changes: SimpleChanges): void {
    let reinitialize = false;
    if (changes['options']) {
      this.validateOptions();
      if (changes['options'].previousValue && changes['options'].currentValue.chartType !== changes['options'].previousValue.chartType) {
        reinitialize = true;
      } else {
        if (this.isCanvasReady()) {
          this.destroyServiceSubscriptions();
          this.initializeChartDependentSubscriptions();
        }
      }
    }
    if (reinitialize) {
      this.destroyServiceSubscriptions();
      this.removeCanvasEventListeners();
      if (this.options?.chartType === 'bar') this.barService.destroy();
      else if (this.options?.chartType === 'pie') this.pieService.destroy();
      this.initializeChart(true);
    } else if ((changes['data'] || (changes['options'] && !reinitialize)) && this.isCanvasReady()) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
    if (this.resizeTimeout) {
      window.cancelAnimationFrame(this.resizeTimeout);
    }
    this.destroyServiceSubscriptions();
    this.removeCanvasEventListeners();
    if (this.options?.chartType === 'bar') {
      this.barService.destroy();
    } else if (this.options?.chartType === 'pie') {
      this.pieService.destroy();
    }
  }

  private destroyServiceSubscriptions(): void {
    this.serviceTooltipSubscription?.unsubscribe();
  }

  /**
   * 初始化图表依赖的订阅，在此处设置悬浮框的位置
   */
  private initializeChartDependentSubscriptions(): void {
    this.destroyServiceSubscriptions();
    if (!this.options) return;
    const activeService = this.options.chartType === 'bar' ? this.barService : this.pieService;
    this.serviceTooltipSubscription = activeService.tooltipUpdate$.subscribe((update: TooltipUpdate) => {
      this.isTooltipDisplayed = update.isVisible;
      if (update.isVisible && update.data && update.position) {
        this.tooltipData = update.data;
        const mouseX = update.position.x; // 画布相关的逻辑鼠标 X 坐标
        const mouseY = update.position.y; // 画布相关的逻辑鼠标 Y 坐标
        const tooltipEl = this.chartTooltipElementRef.nativeElement;
        const canvasLogicalWidth = this.componentCanvasLogicalWidth;
        let targetLeft = mouseX + 15;
        let targetTop = mouseY;
        if (targetLeft + tooltipEl.getBoundingClientRect().width > canvasLogicalWidth) {
          targetLeft = mouseX - tooltipEl.getBoundingClientRect().width + 15; // 调整为减15，避免紧贴边缘
        }
        if (targetLeft < 0) {
          targetLeft = 0; // 固定到左边缘
        }
        this.tooltipStylePosition = { left: `${targetLeft}px`, top: `${targetTop}px` };
        this.tooltipBorderColor = update.borderColor;
      } else {
        this.tooltipData = undefined;
      }
      this.cdr.detectChanges();
    });
  }

  private validateOptions(): void {
    if (!this.options || !this.options.chartType) {
      console.error('ChartOptions 和 chartType 是必填项。');
    }
  }

  private isCanvasReady(): boolean {
    return !!(this.canvasRef && this.canvasRef.nativeElement && this.canvasRef.nativeElement.getContext('2d'));
  }

  private setupCanvasAndGetContext(): { ctx: CanvasRenderingContext2D, logicalWidth: number, logicalHeight: number, devicePixelRatio: number } | null {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;
    if (!container) {
      console.error('未找到用于 HiDPI 设置的画布容器。');
      return null;
    }
    const containerRect = container.getBoundingClientRect();
    const styleWidth = this.options.width || containerRect.width;
    const styleHeight = this.options.height || containerRect.height;
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.style.width = styleWidth + 'px';
    canvas.style.height = styleHeight + 'px';
    const physicalWidth = Math.floor(styleWidth * devicePixelRatio);
    const physicalHeight = Math.floor(styleHeight * devicePixelRatio);
    canvas.width = physicalWidth;
    canvas.height = physicalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('从画布获取 2D 上下文失败。');
      return null;
    }
    ctx.scale(devicePixelRatio, devicePixelRatio);
    this.componentDevicePixelRatio = devicePixelRatio;
    this.componentCanvasLogicalWidth = styleWidth;
    this.componentCanvasLogicalHeight = styleHeight;
    return { ctx, logicalWidth: styleWidth, logicalHeight: styleHeight, devicePixelRatio };
  }

  private setupCanvasEventListeners(): void {
    if (this.eventListenersAttached || !this.canvasRef || !this.canvasRef.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    this.boundOnCanvasMouseMove = this.onCanvasMouseMove.bind(this);
    this.boundOnCanvasMouseOut = this.onCanvasMouseOut.bind(this);
    this.boundOnCanvasClick = this.onCanvasClick.bind(this);
    this.ngZone.runOutsideAngular(() => {
      canvas.addEventListener('mousemove', this.boundOnCanvasMouseMove);
      canvas.addEventListener('mouseout', this.boundOnCanvasMouseOut);
      canvas.addEventListener('click', this.boundOnCanvasClick);
    });
    this.eventListenersAttached = true;
  }

  private removeCanvasEventListeners(): void {
    if (this.eventListenersAttached && this.canvasRef && this.canvasRef.nativeElement) {
      const canvas = this.canvasRef.nativeElement;
      canvas.removeEventListener('mousemove', this.boundOnCanvasMouseMove);
      canvas.removeEventListener('mouseout', this.boundOnCanvasMouseOut);
      canvas.removeEventListener('click', this.boundOnCanvasClick);
      this.eventListenersAttached = false;
    }
  }

  private onCanvasMouseMove(event: MouseEvent): void {
    if (!this.canvasRef || !this.canvasRef.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) * (canvas.width / this.componentDevicePixelRatio / rect.width);
    const canvasY = (event.clientY - rect.top) * (canvas.height / this.componentDevicePixelRatio / rect.height);
    this.lastMouseEventForTooltip = event; // 存储最后的鼠标事件
    if (this.options.chartType === 'bar') {
      this.handleBarMouseMove(canvasX, canvasY, event);
    } else if (this.options.chartType === 'pie') {
      this.handlePieMouseMove(canvasX, canvasY, event);
    }
  }

  private handleBarMouseMove(canvasX: number, canvasY: number, event: MouseEvent): void {
    if (!this.barService || !this.barService.mergedOptions) return; // 防御性检查
    const hoveredBarInfo = this.barService.findHoveredBar(canvasX, canvasY);
    const previousHoveredBarIndex = this.barService.hoveredBarIndex;
    const previousHoveredSeriesIndex = this.barService.hoveredSeriesIndex;
    if (hoveredBarInfo.dataIndex !== previousHoveredBarIndex || hoveredBarInfo.seriesIndex !== previousHoveredSeriesIndex) {
      this.ngZone.run(() => {
        this.barService.setHoveredIndices(hoveredBarInfo.dataIndex, hoveredBarInfo.seriesIndex);
      });
      this.barService.drawChartFrame(1.0); // 重绘以实现柱子悬停效果
    }
    // 提示框逻辑
    if (hoveredBarInfo.dataIndex !== -1 && hoveredBarInfo.seriesIndex !== -1 && this.options.hoverEffect?.showTooltip !== false) {
      const seriesNames = this.barService.getSeriesNames();
      if (hoveredBarInfo.seriesIndex < seriesNames.length) {
        const seriesName = seriesNames[hoveredBarInfo.seriesIndex];
        const categories = this.barService.getCategories(this.barService.getVisibleData());
        if (hoveredBarInfo.dataIndex < categories.length) {
          const categoryName = categories[hoveredBarInfo.dataIndex];
          const dataItems = this.barService.getDataItemsBySeriesName(seriesName);
          const item = dataItems.find(d => d.name === categoryName);
          if (item) {
            const tooltipPayload = {
              title: `${seriesName} - ${item.name}`,
              rows: [{ label: '数值', value: this.barService.formatValue(item.data ?? item.value) }],
              item: item
            };
            const borderColor = this.barService.getDataColor(hoveredBarInfo.seriesIndex, hoveredBarInfo.dataIndex);
            this.barService.emitTooltipUpdate({
              isVisible: true,
              data: tooltipPayload,
              position: { x: canvasX, y: canvasY },
              borderColor: borderColor,
              mouseEvent: event
            });
          } else {
            this.barService.emitTooltipUpdate({ isVisible: false, mouseEvent: event });
          }
        } else {
          this.barService.emitTooltipUpdate({ isVisible: false, mouseEvent: event });
        }
      } else {
        this.barService.emitTooltipUpdate({ isVisible: false, mouseEvent: event });
      }
    } else {
      if (this.isTooltipDisplayed || previousHoveredBarIndex !== -1 || previousHoveredSeriesIndex !== -1) {
        this.barService.emitTooltipUpdate({ isVisible: false, mouseEvent: event });
      }
    }
  }

  private handlePieMouseMove(canvasX: number, canvasY: number, event: MouseEvent): void {
    if (!this.pieService || !this.pieService.mergedOptions) return; // 防御性检查
    const hoveredSliceIndex = this.pieService.findHoveredSlice(canvasX, canvasY);
    const previousHoveredIndex = this.pieService.hoveredIndex;
    if (hoveredSliceIndex !== previousHoveredIndex) {
      this.ngZone.run(() => {
        this.pieService.setHoveredIndex(hoveredSliceIndex);
      });
      this.pieService.draw(); // 重绘以实现扇区悬停效果
    }
    // 提示框逻辑
    if (hoveredSliceIndex !== -1 && this.options.hoverEffect?.showTooltip !== false) {
      const sliceData = this.pieService.processedData[hoveredSliceIndex];
      if (sliceData) { // 确保 sliceData 存在
        const tooltipPayload = {
          title: sliceData.name,
          rows: [
            { label: '数值', value: this.pieService.formatValue(sliceData.value) },
            { label: '比例', value: `${this.pieService.formatPercentage(sliceData.percentage)}%` }
          ],
          item: sliceData
        };
        const borderColor = sliceData.color || '';
        this.pieService.emitTooltipUpdate({
          isVisible: true,
          data: tooltipPayload,
          position: { x: canvasX, y: canvasY },
          borderColor: borderColor,
          mouseEvent: event
        });
      } else { // 未找到扇区数据
        this.pieService.emitTooltipUpdate({ isVisible: false, mouseEvent: event });
      }
    } else { // 未悬停或提示框已禁用
      if (this.isTooltipDisplayed || previousHoveredIndex !== -1) {
        this.pieService.emitTooltipUpdate({ isVisible: false, mouseEvent: event });
      }
    }
  }

  private onCanvasMouseOut(event: MouseEvent): void {
    if (!this.canvasRef || !this.canvasRef.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const relatedTarget = event.relatedTarget as Node;
    let trulyLeftCanvas = true;
    if (relatedTarget) {
      if (canvas.contains(relatedTarget) ||
        (rect.left <= event.clientX && event.clientX <= rect.right &&
          rect.top <= event.clientY && event.clientY <= rect.bottom)) {
        trulyLeftCanvas = false;
      }
    }
    if (event.target === canvas && !relatedTarget) {
      trulyLeftCanvas = true;
    }
    this.lastMouseEventForTooltip = event; // 存储最后的鼠标事件
    if (this.options.chartType === 'bar') {
      this.handleBarMouseOut(trulyLeftCanvas, event);
    } else if (this.options.chartType === 'pie') {
      this.handlePieMouseOut(trulyLeftCanvas, event);
    }
  }

  private handleBarMouseOut(isTrulyLeavingCanvas: boolean, event: MouseEvent): void {
    if (!this.barService) return;
    if (isTrulyLeavingCanvas) {
      if (this.barService.hoveredBarIndex !== -1 || this.barService.hoveredSeriesIndex !== -1) {
        this.ngZone.run(() => {
          this.barService.setHoveredIndices(-1, -1);
        });
        this.barService.drawChartFrame(1.0);
        this.barService.emitTooltipUpdate({ isVisible: false, mouseEvent: event });
      }
    }
  }

  private handlePieMouseOut(isTrulyLeavingCanvas: boolean, event: MouseEvent): void {
    if (!this.pieService) return;
    if (isTrulyLeavingCanvas) {
      if (this.pieService.hoveredIndex !== -1) {
        this.ngZone.run(() => {
          this.pieService.setHoveredIndex(-1);
        });
        this.pieService.draw();
        this.pieService.emitTooltipUpdate({ isVisible: false, mouseEvent: event });
      }
    }
  }

  private onCanvasClick(event: MouseEvent): void {
    if (!this.canvasRef || !this.canvasRef.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / this.componentDevicePixelRatio / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / this.componentDevicePixelRatio / rect.height);
    if (this.options.chartType === 'bar') {
      this.barService.processCanvasClick(x, y, event);
    } else if (this.options.chartType === 'pie') {
      this.pieService.processCanvasClick(x, y, event);
    }
  }

  private initializeChart(skipAnimation: boolean = false): void {
    if (!this.isCanvasReady() || !this.options || !this.containerRef || !this.defaultTooltipRef) return;
    if (this.options.chartType !== 'bar' && this.barService) this.barService.destroy();
    if (this.options.chartType !== 'pie' && this.pieService) this.pieService.destroy();
    const canvasSetup = this.setupCanvasAndGetContext();
    if (!canvasSetup) return;
    const { ctx, logicalWidth, logicalHeight, devicePixelRatio } = canvasSetup;
    if (this.options.chartType === 'bar') {
      this.barService.init(
        ctx,
        logicalWidth,
        logicalHeight,
        this.data,
        this.options,
        skipAnimation
      );
    } else if (this.options.chartType === 'pie') {
      this.pieService.init(
        ctx,
        logicalWidth,
        logicalHeight,
        this.data,
        this.options,
        skipAnimation
      );
    }
    this.setupCanvasEventListeners();
    this.initializeChartDependentSubscriptions();
    this.updateLegendItems();
    this.cdr.detectChanges();
  }

  private updateChart(): void {
    if (!this.options || !this.isCanvasReady()) return;
    if (this.options.chartType === 'bar') {
      this.barService.update(this.data, this.options, this.componentCanvasLogicalWidth, this.componentCanvasLogicalHeight);
    } else if (this.options.chartType === 'pie') {
      this.pieService.update(this.data, this.options, this.componentCanvasLogicalWidth, this.componentCanvasLogicalHeight);
    }
    this.updateLegendItems();
    this.cdr.detectChanges();
  }

  private updateLegendItems(): void {
    if (!this.options) return;
    if (this.options.chartType === 'bar') {
      this.legendItems = this.barService.getLegendItems();
    } else if (this.options.chartType === 'pie') {
      this.legendItems = this.pieService.getLegendItems();
    }
  }

  public isTooltipPointerEvents(): string {
    return this.options?.hoverEffect?.tooltipHoverable === true ? 'auto' : 'none';
  }

  public showLegend(): boolean {
    return !!(this.options?.showLegend !== false && this.legendItems && this.legendItems.length > 0);
  }

  public getLegendPosition(): string {
    return this.options?.legend?.position || 'top';
  }

  public toggleLegendItem(index: number): void {
    if (!this.options) return;
    if (this.options.chartType === 'bar') {
      this.barService.toggleSeriesVisibility(index);
    } else if (this.options.chartType === 'pie') {
      this.pieService.toggleSliceSelection(index);
    }
    this.updateLegendItems();
    this.cdr.detectChanges();
  }

  public handleCanvasMouseLeave(event: MouseEvent): void {
    if (!this.options) return;
    const activeService = this.options.chartType === 'bar' ? this.barService : this.pieService;
    if (!activeService || typeof activeService.hideAllTooltipsAndRedraw !== 'function') return;
    const tooltipEl = this.chartTooltipElementRef.nativeElement;
    // 如果鼠标确实离开了画布，并且没有悬停在可交互的工具提示上，则隐藏工具提示
    if (tooltipEl.contains(event.relatedTarget as Node) && this.options.hoverEffect?.tooltipHoverable) {
      return; // 鼠标在可交互的工具提示上，不隐藏
    }
    activeService.hideAllTooltipsAndRedraw();
  }

  @HostListener('document:mouseleave', ['$event'])
  onDocumentMouseLeave(event: MouseEvent) {
    if (!this.options) return;
    const activeService = this.options.chartType === 'bar' ? this.barService : this.pieService;
    if (activeService && typeof activeService.hideAllTooltipsAndRedraw === 'function') {
      activeService.hideAllTooltipsAndRedraw();
    }
  }

  @HostListener('window:blur', ['$event'])
  onWindowBlur(event: Event) {
    if (!this.options) return;
    const activeService = this.options.chartType === 'bar' ? this.barService : this.pieService;
    if (activeService && typeof activeService.hideAllTooltipsAndRedraw === 'function') {
      activeService.hideAllTooltipsAndRedraw();
    }
  }

  private onResize(): void {
    if (this.resizeTimeout) window.cancelAnimationFrame(this.resizeTimeout);
    this.resizeTimeout = window.requestAnimationFrame(() => {
      this.removeCanvasEventListeners();
      if (this.isCanvasReady()) {
        this.initializeChart(true); // 重建图表，跳过动画
      }
      this.resizeTimeout = null;
    });
  }
}
