import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, SimpleChanges, NgZone, TemplateRef, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartData, ChartOptions, LegendItem, TooltipUpdate } from './chart.interface';
import { ChartService } from './chart.service';
import { BarService } from './bar.service';
import { PieService } from './pie.service';
import { LineService } from './line.service';
import { Subject, Subscription } from 'rxjs';



@Component({
  selector: 'lib-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.less',
  providers: [BarService, PieService, ChartService, LineService],
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
    private lineService: LineService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private chartService: ChartService
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
      const previousChartType = changes['options']?.previousValue?.chartType;
      const previousService = this.getChartServiceByType(previousChartType);
      if (previousService && typeof previousService.destroy === 'function') {
        previousService.destroy();
      }
      this.initializeChart(false);
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
    const activeService = this.getActiveChartService();
    if (activeService && typeof activeService.destroy === 'function') {
      activeService.destroy();
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
        const tooltipEl = this.chartTooltipElementRef.nativeElement;
        const containerEl = this.containerRef.nativeElement;
        this.tooltipStylePosition = this.calculateTooltipPosition(update.position, tooltipEl, containerEl);
      }

      if (this.cdr) {
        this.cdr.detectChanges();
      }
    });
  }

  private calculateTooltipPosition(
    mousePositionInContainer: { x: number; y: number },
    tooltipEl: HTMLElement,
    containerEl: HTMLElement
  ): { left: string; top: string } {
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    // 使用传入的鼠标位置（相对于容器）
    let targetLeft = mousePositionInContainer.x; // x 偏移可以根据需要调整，例如 + 10
    let targetTop = mousePositionInContainer.y;  // y 偏移也可以调整

    const containerClientWidth = containerEl.clientWidth;

    // 如果tooltip超出容器右边界，则调整位置到鼠标左侧
    if (targetLeft + tooltipWidth > containerClientWidth) {
      targetLeft = (mousePositionInContainer.x - 5) - tooltipWidth; // 5是鼠标与tooltip的间隙
    }

    // 确保tooltip不会超出容器左边界
    if (targetLeft < 0) {
      targetLeft = 0;
    }
    // 未来可以添加对上下边界的检查和调整
    return { left: `${targetLeft}px`, top: `${targetTop}px` };
  }

  private validateOptions(): void {
    if (!this.options || !this.options.chartType) {
      console.error('ChartOptions 和 chartType 是必填项。');
    }
  }

  /**
   * 检查画布是否已准备好
   * @returns 画布是否已准备好
   */
  private isCanvasReady(): boolean {
    return !!(this.canvasRef && this.canvasRef.nativeElement && this.canvasRef.nativeElement.getContext('2d'));
  }

  /**
   * 设置画布并获取上下文
   * @returns 上下文
   */
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

  /**
   * 设置画布事件监听器
   */
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

  /**
   * 移除画布事件监听器
   */
  private removeCanvasEventListeners(): void {
    if (this.eventListenersAttached && this.canvasRef && this.canvasRef.nativeElement) {
      const canvas = this.canvasRef.nativeElement;
      canvas.removeEventListener('mousemove', this.boundOnCanvasMouseMove);
      canvas.removeEventListener('mouseout', this.boundOnCanvasMouseOut);
      canvas.removeEventListener('click', this.boundOnCanvasClick);
      this.eventListenersAttached = false;
    }
  }

  /**
   * 处理鼠标移动事件
   * @param event 鼠标事件
   */
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

    const activeService = this.getActiveChartService();
    if (!activeService) return;

    const chartType = this.options.chartType;
    if (chartType === 'bar') {
      this.handleBarMouseMove(logicalCanvasX, logicalCanvasY, mouseX_forTooltip, mouseY_forTooltip, event);
    } else if (chartType === 'pie') {
      this.handlePieMouseMove(logicalCanvasX, logicalCanvasY, mouseX_forTooltip, mouseY_forTooltip, event);
    } else if (chartType === 'line') {
      this.handleLineMouseMove(logicalCanvasX, logicalCanvasY, mouseX_forTooltip, mouseY_forTooltip, event);
    }
  }

  /**
   * 处理条形图鼠标移动事件
   * @param logicalCanvasX 逻辑坐标X
   * @param logicalCanvasY 逻辑坐标Y
   * @param mouseX_container 鼠标X相对容器
   * @param mouseY_container 鼠标Y相对容器
   * @param event 鼠标事件
   */
  private handleBarMouseMove(logicalCanvasX: number, logicalCanvasY: number, mouseX_container: number, mouseY_container: number, event: MouseEvent): void {
    if (!this.barService || !this.barService.mergedOptions) return;
    const hoveredBarInfo = this.barService.findHoveredBar(logicalCanvasX, logicalCanvasY);
    const previousHoveredBarIndex = this.barService.hoveredBarIndex;
    const previousHoveredGroupIndex = this.barService.hoveredGroupIndex;

    if (hoveredBarInfo.dataIndex !== previousHoveredBarIndex || hoveredBarInfo.groupIndex !== previousHoveredGroupIndex) {
      this.ngZone.run(() => {
        this.barService.setHoveredIndices(hoveredBarInfo.dataIndex, hoveredBarInfo.groupIndex);
        this.updateLegendItems();
      });
      this.barService.drawChartFrame(1.0);
      this.cdr.detectChanges();
    }

    if (hoveredBarInfo.dataIndex !== -1 && hoveredBarInfo.groupIndex !== -1 && this.options.hoverEffect?.showTooltip !== false) {
      const groupNames = this.barService.getGroupNames();
      if (hoveredBarInfo.groupIndex < groupNames.length) {
        const groupName = groupNames[hoveredBarInfo.groupIndex];
        const categories = this.barService.getCategories(this.barService.getVisibleData());
        if (hoveredBarInfo.dataIndex < categories.length) {
          const categoryName = categories[hoveredBarInfo.dataIndex];
          const dataItems = this.barService.getDataItemsByGroupName(groupName);
          const item = dataItems.find(d => d.name === categoryName);
          if (item) {
            const tooltipPayload = {
              title: `${groupName} - ${item.name}`,
              rows: [
                { label: '数值', value: this.chartService.formatNumber(item.data) },
                { label: '占比', value: `${this.barService.calculatePercentage(item.data)}` }
              ],
              item: item
            };
            const borderColor = this.barService.getDataColor(hoveredBarInfo.groupIndex, hoveredBarInfo.dataIndex);
            this.tooltipUpdateSubject.next({
              isVisible: true,
              data: tooltipPayload,
              position: { x: mouseX_container, y: mouseY_container },
              borderColor: borderColor
            });
          }
        }
      }
    } else if (this.isTooltipDisplayed && (hoveredBarInfo.dataIndex === -1 || hoveredBarInfo.groupIndex === -1)) {
      this.tooltipUpdateSubject.next({ isVisible: false });
    }
  }

  /**
   * 处理饼图鼠标移动事件
   * @param logicalCanvasX 逻辑坐标X
   * @param logicalCanvasY 逻辑坐标Y
   * @param mouseX_container 鼠标X相对容器
   * @param mouseY_container 鼠标Y相对容器
   * @param event 鼠标事件
   */
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
            { label: '占比', value: `${this.chartService.formatPercentage(item.percentage)}` }
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

  private handleLineMouseMove(logicalCanvasX: number, logicalCanvasY: number, mouseX_container: number, mouseY_container: number, event: MouseEvent): void {
    if (!this.lineService || !this.lineService.mergedOptions) return;
    const { groupIndex: hoveredGroupIndex, dataIndex: hoveredDataIndex, point: hoveredPoint } = this.lineService.findHoveredPoint(logicalCanvasX, logicalCanvasY);
    const previousHoveredGroupIndex = this.lineService.hoveredPointInfo.groupIndex;
    const previousHoveredDataIndex = this.lineService.hoveredPointInfo.dataIndex;

    if (hoveredGroupIndex !== previousHoveredGroupIndex || hoveredDataIndex !== previousHoveredDataIndex) {
      this.ngZone.run(() => {
        this.lineService.setHoveredPointInfo(hoveredGroupIndex, hoveredDataIndex);
        this.updateLegendItems();
      });
      this.lineService.drawChartFrame(1.0);
      this.cdr.detectChanges();
    }

    if (hoveredPoint && this.options.hoverEffect?.showTooltip !== false) {
      const group = this.lineService.processedData[hoveredPoint.groupIndex];
      const item = group?.children?.[hoveredPoint.dataIndex];
      if (item && group) {
        const tooltipPayload = {
          title: `${group.name} - ${item.name}`,
          rows: [
            { label: '数值', value: this.chartService.formatNumber(item.data!) },
          ],
          item: item
        };
        const borderColor = this.lineService.getLineColor(hoveredPoint.groupIndex);
        this.tooltipUpdateSubject.next({
          isVisible: true,
          data: tooltipPayload,
          position: { x: mouseX_container, y: mouseY_container },
          borderColor: borderColor
        });
      }
    } else if (this.isTooltipDisplayed && !hoveredPoint) {
      this.tooltipUpdateSubject.next({ isVisible: false });
    }
  }

  /**
   * 处理鼠标离开画布事件
   * @param event 鼠标事件
   */
  private onCanvasMouseOut(event: MouseEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (this.chartTooltipElementRef && this.chartTooltipElementRef.nativeElement.contains(relatedTarget) && this.options.hoverEffect?.tooltipHoverable) {
      return;
    }
    const isTrulyLeavingCanvas = !relatedTarget || (relatedTarget !== this.canvasRef.nativeElement && !this.canvasRef.nativeElement.contains(relatedTarget));
    
    const activeService = this.getActiveChartService();
    if (!activeService) return;

    const chartType = this.options.chartType;
    if (chartType === 'bar') {
      this.handleBarMouseOut(isTrulyLeavingCanvas, event);
    } else if (chartType === 'pie') {
      this.handlePieMouseOut(isTrulyLeavingCanvas, event);
    } else if (chartType === 'line') {
      this.handleLineMouseOut(isTrulyLeavingCanvas, event);
    }
  }

  /**
   * 处理条形图鼠标离开画布事件
   * @param isTrulyLeavingCanvas 是否真正离开画布
   * @param event 鼠标事件
   */
  private handleBarMouseOut(isTrulyLeavingCanvas: boolean, event: MouseEvent): void {
    if (isTrulyLeavingCanvas) {
      if (this.barService.hoveredBarIndex !== -1 || this.barService.hoveredGroupIndex !== -1) {
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
        const { logicalCanvasX, logicalCanvasY } = this.getCanvasXYConfig(event);
        const hoveredBarInfo = this.barService.findHoveredBar(logicalCanvasX, logicalCanvasY);
        if (hoveredBarInfo.dataIndex === -1 && hoveredBarInfo.groupIndex === -1 && this.isTooltipDisplayed) {
          this.tooltipUpdateSubject.next({ isVisible: false });
        }
      }
    }
  }

  /**
   * 处理饼图鼠标离开画布事件
   * @param isTrulyLeavingCanvas 是否真正离开画布
   * @param event 鼠标事件
   */
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
        const { logicalCanvasX, logicalCanvasY } = this.getCanvasXYConfig(event);
        const hoveredSliceIndex = this.pieService.findHoveredSlice(logicalCanvasX, logicalCanvasY);
        if (hoveredSliceIndex === -1 && this.isTooltipDisplayed) {
          this.tooltipUpdateSubject.next({ isVisible: false });
        }
      }
    }
  }

  /**
   * 处理折线图鼠标离开画布事件
   * @param isTrulyLeavingCanvas 是否真正离开画布
   * @param event 鼠标事件
   */
  private handleLineMouseOut(isTrulyLeavingCanvas: boolean, event: MouseEvent): void {
    if (isTrulyLeavingCanvas) {
      if (this.lineService.hoveredPointInfo.groupIndex !== -1 || this.lineService.hoveredPointInfo.dataIndex !== -1) {
        this.ngZone.run(() => {
          this.lineService.setHoveredPointInfo(-1, -1);
          this.updateLegendItems();
        });
        this.lineService.drawChartFrame(1.0);
        this.cdr.detectChanges();
      }
      this.tooltipUpdateSubject.next({ isVisible: false });
    } else {
      if (!this.options.hoverEffect?.tooltipHoverable) {
        const { logicalCanvasX, logicalCanvasY } = this.getCanvasXYConfig(event);
        const { point: hoveredPoint } = this.lineService.findHoveredPoint(logicalCanvasX, logicalCanvasY);
        if (!hoveredPoint && this.isTooltipDisplayed) {
          this.tooltipUpdateSubject.next({ isVisible: false });
        }
      }
    }
  }

  /**
   * 处理画布点击事件
   * @param event 鼠标事件
   */
  private onCanvasClick(event: MouseEvent): void {
    if (!this.canvasRef || !this.canvasRef.nativeElement) return;
    const { logicalCanvasX, logicalCanvasY } = this.getCanvasXYConfig(event);
    const activeService = this.getActiveChartService();
    if (activeService && typeof activeService.processCanvasClick === 'function') {
      activeService.processCanvasClick(logicalCanvasX, logicalCanvasY, event);
    }
  }

  /**
   * 获取画布XY配置
   * @param event 鼠标事件
   * @returns 画布XY配置
   */
  private getCanvasXYConfig(event: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const cssMouseX_onCanvas = event.clientX - rect.left;
    const cssMouseY_onCanvas = event.clientY - rect.top;
    const scaleX = rect.width === 0 ? 1 : this.componentCanvasLogicalWidth / rect.width;
    const scaleY = rect.height === 0 ? 1 : this.componentCanvasLogicalHeight / rect.height;
    const logicalCanvasX = cssMouseX_onCanvas * scaleX;
    const logicalCanvasY = cssMouseY_onCanvas * scaleY;
    return { logicalCanvasX, logicalCanvasY };
  }

  /**
   * 初始化图表
   * @param skipAnimation 是否跳过动画
   */
  private initializeChart(skipAnimation: boolean = false): void {
    if (!this.isCanvasReady() || !this.options || !this.containerRef || !this.defaultTooltipRef) return;
    const canvasSetup = this.setupCanvasAndGetContext();
    if (!canvasSetup) return;
    const { ctx, logicalWidth, logicalHeight, devicePixelRatio } = canvasSetup;
    const activeService = this.getActiveChartService();
    if (activeService && typeof activeService.init === 'function') {
      activeService.init(
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

  /**
   * 更新图表
   */
  private updateChart(): void {
    if (!this.options || !this.isCanvasReady()) return;
    const activeService = this.getActiveChartService();
    if (activeService && typeof activeService.update === 'function') {
      activeService.update(this.data, this.options, this.componentCanvasLogicalWidth, this.componentCanvasLogicalHeight);
    }
    this.updateLegendItems();
    this.cdr.detectChanges();
  }

  /**
   * 更新图例
   */
  private updateLegendItems(): void {
    if (!this.options) return;
    const activeService = this.getActiveChartService();
    if (activeService && typeof activeService.getLegendItems === 'function') {
      this.legendItems = activeService.getLegendItems();
    }
  }

  /**
   * 获取图例指针事件
   * @returns 图例指针事件
   */
  public isTooltipPointerEvents(): string {
    return this.options?.hoverEffect?.tooltipHoverable === true ? 'auto' : 'none';
  }

  /**
   * 显示图例
   * @returns 是否显示图例
   */
  public showLegend(): boolean {
    return !!(this.options?.showLegend !== false && this.legendItems && this.legendItems.length > 0);
  }

  /**
   * 获取图例位置
   * @returns 图例位置
   */
  public getLegendPosition(): string {
    return this.options?.legend?.position || 'top';
  }

  /**
   * 切换图例项
   * @param index 图例项索引
   */
  public toggleLegendItem(index: number): void {
    if (!this.options) return;
    const activeService = this.getActiveChartService();
    if (activeService) {
      const chartType = this.options.chartType;
      if (chartType === 'bar' && 'toggleGroupVisibility' in activeService) {
        (activeService as BarService).toggleGroupVisibility(index);
      } else if (chartType === 'pie' && 'toggleSliceSelection' in activeService) {
        (activeService as PieService).toggleSliceSelection(index);
      } else if (chartType === 'line' && 'toggleGroupVisibility' in activeService) {
        (activeService as LineService).toggleGroupVisibility(index);
      }
    }
    this.updateLegendItems();
    this.cdr.detectChanges();
  }

  /**
   * 处理画布鼠标离开事件
   * @param event 鼠标事件
   */
  public handleCanvasMouseLeave(event: MouseEvent): void {
    if (!this.options) return;
    let activeService = this.getActiveChartService();

    if (!activeService || typeof activeService.hideAllTooltipsAndRedraw !== 'function') return;

    const tooltipEl = this.chartTooltipElementRef.nativeElement;
    if (tooltipEl.contains(event.relatedTarget as Node) && this.options.hoverEffect?.tooltipHoverable) {
      return;
    }
    activeService.hideAllTooltipsAndRedraw();
    if (this.options.chartType === 'line') {
      this.updateLegendItems();
      this.cdr.detectChanges();
    }
  }

  /**
   * 处理窗口大小变化事件
   */
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

  private getActiveChartService(): BarService | PieService | LineService | undefined {
    if (!this.options || !this.options.chartType) {
      return undefined;
    }
    switch (this.options.chartType) {
      case 'bar':
        return this.barService;
      case 'pie':
        return this.pieService;
      case 'line':
        return this.lineService;
      default:
        return undefined;
    }
  }

  private getChartServiceByType(chartType: string): BarService | PieService | LineService | undefined {
    switch (chartType) {
      case 'bar':
        return this.barService;
      case 'pie':
        return this.pieService;
      case 'line':
        return this.lineService;
      default:
        return undefined;
    }
  }
}
