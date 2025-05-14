import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, AfterViewInit, NgZone, Renderer2, TemplateRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartService } from '../chart.serivice';
import { PieChartData, PieChartOptions } from '../chart.interface';

@Component({
  selector: 'lib-pie',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pie.component.html',
  styleUrl: './pie.component.less'
})
export class PieComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('pieCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('pieTooltip', { static: true }) tooltipRef!: ElementRef<HTMLDivElement>;
  @ViewChild('defaultTooltip', { static: true }) defaultTooltipRef!: TemplateRef<{ $implicit: any }>;
  
  @Input() data: PieChartData[] = [];
  @Input() options: PieChartOptions = {};
  @Input() tooltipTemplate?: TemplateRef<{ $implicit: any }>;
  
  private ctx!: CanvasRenderingContext2D;
  private width = 300;
  private height = 300;
  private centerX = 150;
  private centerY = 150;
  private outerRadius = 120;
  private innerRadius = 0; // 默认为实心圆
  public hoveredIndex: number = -1;
  private animationProgress = 0;
  private animationFrameId: number | null = null;
  public processedData: Array<PieChartData & { startAngle: number; endAngle: number }> = [];
  public sliceVisibility: boolean[] = [];
  private mousePosition: { x: number, y: number } = { x: 0, y: 0 };
  private isTooltipHovered: boolean = false;
  private canvasScale: number = 1;
  
  constructor(
    private chartService: ChartService,
    private ngZone: NgZone,
    private renderer: Renderer2
  ) { }
  
  ngOnInit(): void {
    this.processData();
  }
  
  ngAfterViewInit(): void {
    this.initializeCanvas();
    this.draw();
    this.setupEventListeners();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['data'] || changes['options']) && this.ctx) {
      this.processData();
      this.draw();
    }
  }
  
  private processData(): void {
    if (!this.data || this.data.length === 0) return;
    
    // 确保所有数据项都有颜色
    const coloredData = this.chartService.assignPieColors(this.data, this.options.colors);
    
    // 计算每个扇区的角度
    this.processedData = this.chartService.calculatePieAngles(coloredData);
    
    // 初始化扇区可见性数组
    this.sliceVisibility = this.processedData.map(() => true);
  }
  
  private initializeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    
    // 获取实际容器大小
    const container = this.containerRef.nativeElement;
    const rect = container.getBoundingClientRect();
    
    // 应用设置的宽高或使用容器宽高
    this.width = this.options.width || rect.width || 300;
    this.height = this.options.height || rect.height || 300;
    
    // 设置画布大小和DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = this.width * dpr;
    canvas.height = this.height * dpr;
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);
    this.canvasScale = dpr;
    
    // 计算中心点和半径
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.outerRadius = this.options.outerRadius || Math.min(this.width, this.height) * 0.4;
    this.innerRadius = this.options.innerRadius || 0;
    
    // 重置动画
    if (this.options.animate) {
      this.animationProgress = 0;
      this.startAnimation();
    } else {
      this.animationProgress = 1;
    }
  }
  
  private startAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    const animate = () => {
      this.animationProgress += 0.02;
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
  
  private draw(): void {
    if (!this.ctx || this.processedData.length === 0) return;
    
    // 清除画布
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // 应用背景颜色
    if (this.options.backgroundColor) {
      this.ctx.fillStyle = this.options.backgroundColor;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // 绘制标题
    if (this.options.title) {
      this.ctx.fillStyle = '#333';
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText(this.options.title, this.centerX, 20);
    }
    
    // 绘制可见的饼图扇区
    this.processedData.forEach((item, index) => {
      if (!this.sliceVisibility[index]) return;
      
      const animatedEndAngle = item.startAngle + (item.endAngle - item.startAngle) * this.animationProgress;
      const isHovered = index === this.hoveredIndex;
      
      this.ctx.save();
      
      // 如果悬停且启用了扩展效果
      if (isHovered && this.options.hoverEffect?.expandSlice) {
        const expandRadius = this.options.hoverEffect.expandRadius || 10;
        const midAngle = (item.startAngle + animatedEndAngle) / 2;
        const offsetX = Math.cos(midAngle) * expandRadius;
        const offsetY = Math.sin(midAngle) * expandRadius;
        this.ctx.translate(offsetX, offsetY);
      }
      
      // 绘制扇区
      this.ctx.beginPath();
      this.ctx.moveTo(this.centerX, this.centerY);
      this.ctx.arc(this.centerX, this.centerY, this.outerRadius, item.startAngle, animatedEndAngle);
      if (this.innerRadius > 0) {
        this.ctx.arc(this.centerX, this.centerY, this.innerRadius, animatedEndAngle, item.startAngle, true);
        this.ctx.closePath();
      } else {
        this.ctx.lineTo(this.centerX, this.centerY);
      }
      
      this.ctx.fillStyle = item.color || '#ccc';
      this.ctx.fill();
      
      // 添加边框
      this.ctx.strokeStyle = isHovered ? '#fff' : '#f8f8f8';
      this.ctx.lineWidth = isHovered ? 2 : 1;
      this.ctx.stroke();
      
      this.ctx.restore();
    });
    
    // 绘制标签
    if (this.options.showLabels && this.animationProgress === 1) {
      this.drawLabels();
    }
    
    // 如果是环形图，绘制中心文本
    if (this.innerRadius > 0 && this.options.donutText && this.animationProgress === 1) {
      this.ctx.fillStyle = '#333';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.fillText(this.options.donutText, this.centerX, this.centerY);
    }
  }
  
  private drawLabels(): void {
    this.processedData.forEach((item, index) => {
      if (!this.sliceVisibility[index]) return;
      
      const midAngle = (item.startAngle + item.endAngle) / 2;
      const labelRadius = this.outerRadius * 0.75;
      
      // 计算标签位置
      const x = this.centerX + Math.cos(midAngle) * labelRadius;
      const y = this.centerY + Math.sin(midAngle) * labelRadius;
      
      // 设置文本样式
      this.ctx.font = '12px Arial';
      this.ctx.fillStyle = '#fff';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // 绘制名称
      this.ctx.fillText(item.name, x, y);
      
      // 绘制百分比
      if (this.options.showPercentage && item.percentage !== undefined) {
        this.ctx.fillText(`${item.percentage.toFixed(1)}%`, x, y + 15);
      }
    });
  }
  
  /**
   * 图例相关方法
   */
  public showLegend(): boolean {
    return this.options.showLegend !== false && this.processedData.length > 0;
  }
  
  public getLegendPosition(): string {
    return this.options.legend?.position || 'bottom';
  }
  
  public isSliceVisible(index: number): boolean {
    return this.sliceVisibility[index] === true;
  }
  
  public toggleSliceSelection(index: number): void {
    this.sliceVisibility[index] = !this.sliceVisibility[index];
    this.draw();
    
    // 如果取消选中当前悬停的扇区，重置悬停状态
    if (this.hoveredIndex === index && !this.sliceVisibility[index]) {
      this.hoveredIndex = -1;
    }
  }
  
  /**
   * 获取悬浮扇区的颜色
   */
  public getHoveredSliceColor(): string {
    if (this.hoveredIndex < 0 || this.hoveredIndex >= this.processedData.length) {
      return '';
    }
    return this.processedData[this.hoveredIndex].color || '';
  }
  
  /**
   * 格式化数值显示
   */
  public formatValue(value: number | undefined): string {
    if (typeof value === 'number') {
      return this.chartService.formatNumber(value);
    }
    return '0';
  }
  
  /**
   * 格式化百分比显示
   */
  public formatPercentage(percentage: number | undefined): string {
    return percentage !== undefined ? percentage.toFixed(1) : '0';
  }
  
  /**
   * 是否允许悬浮框可悬停
   */
  public isTooltipHoverable(): boolean {
    return this.options.hoverEffect?.showTooltip === true;
  }
  
  // ============================================================
  // 事件处理方法
  // ============================================================
  
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
          if (this.hoveredIndex === -1) this.hideTooltip();
        }
      });
    });
  }
  
  private handleMouseMove(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    // 计算鼠标在Canvas中的位置
    const x = (event.clientX - rect.left);
    const y = (event.clientY - rect.top);
    
    this.mousePosition = { x, y };
    
    const hoveredSliceIndex = this.findHoveredSlice(x, y);
    
    if (!this.isTooltipHoverable() || !this.isTooltipHovered) {
      if (hoveredSliceIndex !== this.hoveredIndex) {
        this.hoveredIndex = hoveredSliceIndex;
        this.draw();
        
        if (hoveredSliceIndex !== -1 && this.options.hoverEffect?.showTooltip) {
          this.showTooltip(hoveredSliceIndex, event);
        } else {
          this.hideTooltip();
        }
      } else if (hoveredSliceIndex !== -1) {
        this.updateTooltipPosition(event);
      }
    }
  }
  
  private handleMouseOut(event: MouseEvent): void {
    if (this.isEventToTooltip(event)) {
      return;
    }
    
    if (!this.isEventToChildElement(event)) {
      this.hideAllTooltips();
    }
  }
  
  public handleCanvasMouseLeave(event: MouseEvent): void {
    if (this.isEventToTooltip(event) && this.isTooltipHoverable()) {
      return;
    }
    this.hideAllTooltips();
  }
  
  @HostListener('document:mouseleave', ['$event'])
  onDocumentMouseLeave(event: MouseEvent) {
    this.hideAllTooltips();
  }
  
  @HostListener('window:blur', ['$event'])
  onWindowBlur(event: Event) {
    this.hideAllTooltips();
  }
  
  private findHoveredSlice(x: number, y: number): number {
    // 计算鼠标距离圆心的距离
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 计算鼠标的角度
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;
    
    // 判断是否在饼图内（考虑内径，支持环形图）
    const inPie = distance <= this.outerRadius && distance >= this.innerRadius;
    
    if (inPie) {
      // 查找鼠标所在的扇区
      for (let i = 0; i < this.processedData.length; i++) {
        if (!this.sliceVisibility[i]) continue;
        
        const slice = this.processedData[i];
        if (angle >= slice.startAngle && angle <= slice.endAngle) {
          return i;
        }
      }
    }
    
    return -1;
  }
  
  private isEventToTooltip(event: MouseEvent): boolean {
    if (!event.relatedTarget) return false;
    if (!this.isTooltipHoverable()) return false;
    
    const tooltip = this.tooltipRef.nativeElement;
    return tooltip.contains(event.relatedTarget as Node);
  }
  
  private isEventToChildElement(event: MouseEvent): boolean {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.closest('.pie-chart-container');
    
    if (!event.relatedTarget || !container) return false;
    return container.contains(event.relatedTarget as Node);
  }
  
  private handleCanvasClick(event: MouseEvent): void {
    // 检查是否有点击回调函数
    if (!this.options.onClick) return;
    
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    // 计算点击在canvas中的位置
    const x = (event.clientX - rect.left);
    const y = (event.clientY - rect.top);
    
    // 查找点击的扇区索引
    const clickedSliceIndex = this.findHoveredSlice(x, y);
    
    // 如果点击到了扇区，执行回调
    if (clickedSliceIndex !== -1) {
      this.ngZone.run(() => {
        this.options.onClick!({
          item: this.processedData[clickedSliceIndex],
          index: clickedSliceIndex,
          data: this.processedData,
          options: this.options,
          event: event
        });
      });
    }
  }
  
  // 工具提示相关方法
  private showTooltip(sliceIndex: number, event?: MouseEvent): void {
    if (!this.options.hoverEffect?.showTooltip || sliceIndex < 0 || sliceIndex >= this.processedData.length) return;
    
    const tooltip = this.tooltipRef.nativeElement;
    const sliceData = this.processedData[sliceIndex];
    
    tooltip.innerHTML = '';
    
    const tooltipData = {
      item: sliceData,
      index: sliceIndex
    };
    
    if (this.tooltipTemplate) {
      this.ngZone.run(() => {
        const viewRef = this.tooltipTemplate!.createEmbeddedView({ $implicit: tooltipData });
        viewRef.detectChanges();
        
        viewRef.rootNodes.forEach(node => {
          this.renderer.appendChild(tooltip, node);
        });
      });
    } else {
      this.ngZone.run(() => {
        const viewRef = this.defaultTooltipRef.createEmbeddedView({ $implicit: tooltipData });
        viewRef.detectChanges();
        viewRef.rootNodes.forEach(node => {
          this.renderer.appendChild(tooltip, node);
        });
      });
    }
    
    this.hoveredIndex = sliceIndex;
    
    if (event) {
      this.updateTooltipPosition(event);
    } else {
      this.updateTooltipPosition();
    }
  }
  
  private updateTooltipPosition(event?: MouseEvent): void {
    if (this.hoveredIndex === -1) return;
    
    const tooltip = this.tooltipRef.nativeElement;
    const tooltipRect = tooltip.getBoundingClientRect();
    const canvas = this.canvasRef.nativeElement;
    const canvasRect = canvas.getBoundingClientRect();
    
    let x, y;
    if (event) {
      x = event.clientX - canvasRect.left - 15;
      y = event.clientY - canvasRect.top;
    } else {
      x = this.mousePosition.x;
      y = this.mousePosition.y;
    }
    
    // 检查是否接近右边界，如果接近右边界，调整位置
    if (x + tooltipRect.width > canvasRect.width) {
      x = x - tooltipRect.width + 5;
    }
    
    this.renderer.setStyle(tooltip, 'left', `${x + 15}px`);
    this.renderer.setStyle(tooltip, 'top', `${y - tooltipRect.height / 2}px`);
  }
  
  private hideTooltip(): void {
    this.ngZone.run(() => {
      this.hoveredIndex = -1;
    });
  }
  
  private hideAllTooltips(): void {
    this.ngZone.run(() => {
      this.hoveredIndex = -1;
    });
    
    try {
      this.draw();
    } catch (e) {
      console.error('隐藏提示时重绘图表失败:', e);
    }
  }
}
