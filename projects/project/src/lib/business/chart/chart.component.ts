import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, SimpleChanges, NgZone, TemplateRef, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartData, ChartOptions, TooltipUpdate } from './chart.interface';
import { ChartService } from './chart.service';
import { BarService } from './bar.service';
import { PieService } from './pie.service';
import { Subscription } from 'rxjs';

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
  private serviceTooltipSubscription?: Subscription;

  isTooltipDisplayed: boolean = false;
  tooltipData?: any;
  tooltipStylePosition: { left: string, top: string } = { left: '0px', top: '0px' };
  tooltipBorderColor?: string;
  private componentDevicePixelRatio: number = 1;
  private componentCanvasLogicalWidth!: number;
  private componentCanvasLogicalHeight!: number;
  private boundOnCanvasMouseMove!: (event: MouseEvent) => void;
  private boundOnCanvasMouseOut!: (event: MouseEvent) => void;
  private boundOnCanvasClick!: (event: MouseEvent) => void;
  private eventListenersAttached: boolean = false;

  constructor(
    private chartServiceInstance: ChartService,
    private barService: BarService,
    private pieService: PieService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

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

  private initializeChartDependentSubscriptions(): void {
    this.destroyServiceSubscriptions();
    if (!this.options) return;
    const activeService = this.options.chartType === 'bar' ? this.barService : this.pieService;
    this.serviceTooltipSubscription = activeService.tooltipUpdate$.subscribe((update: TooltipUpdate) => {
      this.isTooltipDisplayed = update.isVisible;
      if (update.isVisible && update.data && update.position) {
        this.tooltipData = update.data;
        let x = update.position.x;
        let y = update.position.y;
        const tooltipHeight = this.chartTooltipElementRef?.nativeElement?.offsetHeight || 30;
        this.tooltipStylePosition = { left: `${x}px`, top: `${y - (tooltipHeight / 2)}px` };
        this.tooltipBorderColor = update.borderColor;
      } else {
        this.tooltipData = undefined;
      }
      this.cdr.detectChanges();
    });
  }

  private validateOptions(): void {
    if (!this.options || !this.options.chartType) {
      console.error('ChartOptions and chartType are mandatory.');
    }
  }

  private isCanvasReady(): boolean {
    return !!(this.canvasRef && this.canvasRef.nativeElement && this.canvasRef.nativeElement.getContext('2d'));
  }

  private setupCanvasAndGetContext(): { ctx: CanvasRenderingContext2D, logicalWidth: number, logicalHeight: number, devicePixelRatio: number } | null {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;
    if (!container) {
      console.error('Canvas container not found for HiDPI setup.');
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
      console.error('Failed to get 2D context from canvas.');
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
    if (this.options.chartType === 'bar') {
      this.barService.processMouseMove(canvasX, canvasY, event, this.options.hoverEffect?.tooltipHoverable ?? false);
    } else if (this.options.chartType === 'pie') {
      this.pieService.processMouseMove(canvasX, canvasY, event, this.options.hoverEffect?.tooltipHoverable ?? false);
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
    if (this.options.chartType === 'bar') {
      this.barService.processMouseOut(trulyLeftCanvas, event);
    } else if (this.options.chartType === 'pie') {
      this.pieService.processMouseOut(trulyLeftCanvas, event);
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
        devicePixelRatio,
        this.data,
        this.options,
        skipAnimation
      );
    } else if (this.options.chartType === 'pie') {
      this.pieService.init(
        ctx,
        logicalWidth,
        logicalHeight,
        devicePixelRatio,
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
