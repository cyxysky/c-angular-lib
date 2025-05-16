import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, SimpleChanges, NgZone, TemplateRef, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartData, ChartOptions, LegendItem, TooltipUpdate } from './chart.interface';
import { ChartService } from './chart.service';
import { BarService } from './bar.service';
import { PieService } from './pie.service';
import { Subject, Subscription } from 'rxjs';



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
  private tooltipUpdateSubject = new Subject<TooltipUpdate>();
  public tooltipUpdate$ = this.tooltipUpdateSubject.asObservable();
  private componentTooltipSubscription?: Subscription;

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
          this.destroyComponentSubscriptions();
          this.initializeChartDependentSubscriptions();
        }
      }
    }
    if (reinitialize) {
      this.destroyComponentSubscriptions();
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
    this.destroyComponentSubscriptions();
    this.removeCanvasEventListeners();
    if (this.options?.chartType === 'bar') {
      this.barService.destroy();
    } else if (this.options?.chartType === 'pie') {
      this.pieService.destroy();
    }
  }

  private destroyComponentSubscriptions(): void {
    this.componentTooltipSubscription?.unsubscribe();
  }

  /**
   * 初始化图表依赖的订阅，在此处设置悬浮框的位置
   */
  private initializeChartDependentSubscriptions(): void {
    this.destroyComponentSubscriptions();
    if (!this.options) return;
    this.componentTooltipSubscription = this.tooltipUpdate$.subscribe((update: TooltipUpdate) => {
      this.isTooltipDisplayed = update.isVisible;
      this.tooltipData = (this.isTooltipDisplayed && update.data) ? update.data : undefined;
      this.tooltipBorderColor = (this.isTooltipDisplayed && update.borderColor) ? update.borderColor : undefined;

      if (this.isTooltipDisplayed && update.position) {
        const mouseXRelativeToContainer = update.position.x; // Already container-relative
        const mouseYRelativeToContainer = update.position.y; // Already container-relative
        const tooltipEl = this.chartTooltipElementRef.nativeElement;
        const containerEl = this.containerRef.nativeElement;
        const tooltipRect = tooltipEl.getBoundingClientRect();
        const tooltipWidth = tooltipRect.width;
        // const tooltipHeight = tooltipRect.height; // Not used in original logic for positioning
        let targetLeft = mouseXRelativeToContainer + 0;
        let targetTop = mouseYRelativeToContainer; // Align top of tooltip with mouse Y (relative to container)
        const containerClientWidth = containerEl.clientWidth;
        // Horizontal boundary check and flip (user's custom logic)
        // If tooltip (placed at targetLeft by default) overflows the right edge of the container
        if (targetLeft + tooltipWidth > containerClientWidth) {
          // Apply user's specific flip logic:
          // Place the tooltip such that its right edge is at (mouseXRelativeToContainer + offsetX)
          targetLeft = (mouseXRelativeToContainer + 5) - tooltipWidth;
        }
        // Prevent tooltip from going off the left edge of the container
        if (targetLeft < 0) {
          targetLeft = 0;
        }

        this.tooltipStylePosition = { left: `${targetLeft}px`, top: `${targetTop}px` };
      }
      // Always trigger change detection
      if (this.cdr) {
        this.cdr.detectChanges();
      }
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
    if (!this.canvasRef?.nativeElement || !this.containerRef?.nativeElement) return;

    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;

    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Mouse position relative to viewport
    const clientX = event.clientX;
    const clientY = event.clientY;

    // Mouse position relative to container for tooltip positioning
    const mouseX_forTooltip = clientX - containerRect.left;
    const mouseY_forTooltip = clientY - containerRect.top;

    // Mouse position relative to canvas (CSS pixels) for logical coordinate calculation
    const cssMouseX_onCanvas = clientX - canvasRect.left;
    const cssMouseY_onCanvas = clientY - canvasRect.top;

    const scaleX = canvasRect.width === 0 ? 1 : this.componentCanvasLogicalWidth / canvasRect.width;
    const scaleY = canvasRect.height === 0 ? 1 : this.componentCanvasLogicalHeight / canvasRect.height;
    const logicalCanvasX = cssMouseX_onCanvas * scaleX;
    const logicalCanvasY = cssMouseY_onCanvas * scaleY;

    if (this.options.chartType === 'bar') {
      this.handleBarMouseMove(logicalCanvasX, logicalCanvasY, mouseX_forTooltip, mouseY_forTooltip, event);
    } else if (this.options.chartType === 'pie') {
      this.handlePieMouseMove(logicalCanvasX, logicalCanvasY, mouseX_forTooltip, mouseY_forTooltip, event);
    }
  }

  private handleBarMouseMove(logicalCanvasX: number, logicalCanvasY: number, mouseX_container: number, mouseY_container: number, event: MouseEvent): void {
    if (!this.barService || !this.barService.mergedOptions) return;
    const hoveredBarInfo = this.barService.findHoveredBar(logicalCanvasX, logicalCanvasY);
    const previousHoveredBarIndex = this.barService.hoveredBarIndex;
    const previousHoveredSeriesIndex = this.barService.hoveredSeriesIndex;

    if (hoveredBarInfo.dataIndex !== previousHoveredBarIndex || hoveredBarInfo.seriesIndex !== previousHoveredSeriesIndex) {
      this.ngZone.run(() => {
        this.barService.setHoveredIndices(hoveredBarInfo.dataIndex, hoveredBarInfo.seriesIndex);
        this.updateLegendItems();
      });
      this.barService.drawChartFrame(1.0);
      this.cdr.detectChanges();
    }

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
              rows: [
                { label: '数值', value: this.barService.formatValue(item.data) },
                { label: '占比', value: `${this.barService.calculatePercentage(item.data)}` }
              ],
              item: item
            };
            const borderColor = this.barService.getDataColor(hoveredBarInfo.seriesIndex, hoveredBarInfo.dataIndex);
            this.tooltipUpdateSubject.next({
              isVisible: true,
              data: tooltipPayload,
              position: { x: mouseX_container, y: mouseY_container },
              borderColor: borderColor
            });
          }
        }
      }
    } else if (this.isTooltipDisplayed && (hoveredBarInfo.dataIndex === -1 || hoveredBarInfo.seriesIndex === -1)) {
      this.tooltipUpdateSubject.next({ isVisible: false });
    }
  }

  private handlePieMouseMove(logicalCanvasX: number, logicalCanvasY: number, mouseX_container: number, mouseY_container: number, event: MouseEvent): void {
    if (!this.pieService || !this.pieService.mergedOptions) return;
    const hoveredSliceIndex = this.pieService.findHoveredSlice(logicalCanvasX, logicalCanvasY);
    const previousHoveredIndex = this.pieService.hoveredIndex;

    if (hoveredSliceIndex !== previousHoveredIndex) {
      this.ngZone.run(() => {
        this.pieService.setHoveredIndex(hoveredSliceIndex);
        this.updateLegendItems();
      });
      this.pieService.draw();
      this.cdr.detectChanges();
    }

    if (hoveredSliceIndex !== -1 && this.options.hoverEffect?.showTooltip !== false) {
      const item = this.pieService.processedData[hoveredSliceIndex];
      if (item) {
        const tooltipPayload = {
          title: item.name,
          rows: [
            { label: '数值', value: this.pieService.formatValue(item.data) },
            { label: '占比', value: `${this.pieService.formatPercentage(item.percentage)}` }
          ],
          item: item
        };
        const borderColor = item.color;
        this.tooltipUpdateSubject.next({
          isVisible: true,
          data: tooltipPayload,
          position: { x: mouseX_container, y: mouseY_container },
          borderColor: borderColor
        });
      }
    } else if (this.isTooltipDisplayed && hoveredSliceIndex === -1) {
      this.tooltipUpdateSubject.next({ isVisible: false });
    }
  }

  private onCanvasMouseOut(event: MouseEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (this.chartTooltipElementRef && this.chartTooltipElementRef.nativeElement.contains(relatedTarget)) {
      return;
    }

    const isTrulyLeavingCanvas = !relatedTarget || (relatedTarget !== this.canvasRef.nativeElement && !this.canvasRef.nativeElement.contains(relatedTarget));

    if (this.options.chartType === 'bar') {
      this.handleBarMouseOut(isTrulyLeavingCanvas, event);
    } else if (this.options.chartType === 'pie') {
      this.handlePieMouseOut(isTrulyLeavingCanvas, event);
    }
  }

  private handleBarMouseOut(isTrulyLeavingCanvas: boolean, event: MouseEvent): void {
    if (isTrulyLeavingCanvas) {
      if (this.barService.hoveredBarIndex !== -1 || this.barService.hoveredSeriesIndex !== -1) {
        this.ngZone.run(() => {
          this.barService.setHoveredIndices(-1, -1);
          this.updateLegendItems();
        });
        this.barService.drawChartFrame(1.0);
        this.cdr.detectChanges();
      }
      this.tooltipUpdateSubject.next({ isVisible: false });
    } else {
      if (!this.options.hoverEffect?.tooltipHoverable) {
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const canvasX = (event.clientX - rect.left) * (canvas.width / this.componentDevicePixelRatio / rect.width);
        const canvasY = (event.clientY - rect.top) * (canvas.height / this.componentDevicePixelRatio / rect.height);
        const hoveredBarInfo = this.barService.findHoveredBar(canvasX, canvasY);
        if (hoveredBarInfo.dataIndex === -1 && hoveredBarInfo.seriesIndex === -1 && this.isTooltipDisplayed) {
          this.tooltipUpdateSubject.next({ isVisible: false });
        }
      }
    }
  }

  private handlePieMouseOut(isTrulyLeavingCanvas: boolean, event: MouseEvent): void {
    if (isTrulyLeavingCanvas) {
      if (this.pieService.hoveredIndex !== -1) {
        this.ngZone.run(() => {
          this.pieService.setHoveredIndex(-1);
          this.updateLegendItems();
        });
        this.pieService.draw();
        this.cdr.detectChanges();
      }
      this.tooltipUpdateSubject.next({ isVisible: false });
    } else {
      if (!this.options.hoverEffect?.tooltipHoverable) {
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        const canvasX = (event.clientX - rect.left) * (canvas.width / this.componentDevicePixelRatio / rect.width);
        const canvasY = (event.clientY - rect.top) * (canvas.height / this.componentDevicePixelRatio / rect.height);
        const hoveredSliceIndex = this.pieService.findHoveredSlice(canvasX, canvasY);
        if (hoveredSliceIndex === -1 && this.isTooltipDisplayed) {
          this.tooltipUpdateSubject.next({ isVisible: false });
        }
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
    if (tooltipEl.contains(event.relatedTarget as Node) && this.options.hoverEffect?.tooltipHoverable) {
      return;
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
        this.initializeChart(true);
      }
      this.resizeTimeout = null;
    });
  }
}
