import { CdkOverlayOrigin, ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Directive, ElementRef, HostListener, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { OverlayService } from '../service/overlay.service';
import { TooltipComponent } from './tooltip.component';

@Directive({
  selector: '[libTooltip]',
  exportAs: 'libTooltip',
  standalone: true,
  host: {
    '[class.lib-tooltip-open]': 'visible'
  }
})
export class TooltipDirective implements OnInit, OnDestroy {
  @Input('libTooltip') tooltipContent: string | TemplateRef<any> = '';
  @Input('libTooltipPlacement') placement: 'top' | 'bottom' | 'left' | 'right' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top';
  @Input('libTooltipTrigger') trigger: 'hover' | 'click' = 'hover';
  @Input('libTooltipVisible') visible = false;
  @Input('libTooltipMouseEnterDelay') mouseEnterDelay = 50;
  @Input('libTooltipMouseLeaveDelay') mouseLeaveDelay = 0;
  @Input('libTooltipClass') tooltipClass = '';
  @Input('libTooltipColor') tooltipColor = '#000';

  private overlayRef: OverlayRef | null = null;
  private enterTimer: any;
  private leaveTimer: any;
  private portal: ComponentPortal<TooltipComponent> | null = null;

  constructor(
    private elementRef: ElementRef,
    private overlayService: OverlayService,
    public overlay: Overlay,
  ) { }

  ngOnInit(): void {
    // 初始化时如果visible为true，则显示tooltip
    if (this.visible) {
      this.show();
    }
  }

  ngOnDestroy(): void {
    this.closeTooltip();
    clearTimeout(this.enterTimer);
    clearTimeout(this.leaveTimer);
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.trigger === 'hover') {
      clearTimeout(this.leaveTimer);
      this.enterTimer = setTimeout(() => {
        this.show();
      }, this.mouseEnterDelay);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.trigger === 'hover') {
      clearTimeout(this.enterTimer);
      this.hide();
    }
  }

  @HostListener('click')
  onClick(): void {
    if (this.trigger === 'click') {
      this.visible ? this.hide() : this.show();
    }
  }

  show(): void {
    if (this.visible || !this.tooltipContent) return;
    this.visible = true;
    this.closeTooltip();
    const positions = this.overlayService.getPositions(this.placement);
    // 创建overlay
    this.overlayRef = this.overlayService.createOverlay(
      {
        panelClass: ['lib-tooltip-panel', this.tooltipClass],
        positionStrategy: this.overlay.position().flexibleConnectedTo(this.elementRef).withPositions(positions).withPush(false).withGrowAfterOpen(true).withLockedPosition(false)
      },
      this.elementRef,
      positions,
      (ref) => this.closeTooltip()
    );

    // 创建并附加组件
    this.portal = new ComponentPortal(TooltipComponent);
    const componentRef = this.overlayRef.attach(this.portal);

    // 设置tooltip内容和位置
    componentRef.instance.content = this.tooltipContent;
    componentRef.instance.placement = this.placement;
    componentRef.instance.color = this.tooltipColor;

    // 设置CSS类以添加动画效果
    setTimeout(() => {
      if (componentRef.instance) {
        componentRef.instance.isVisible = true;
      }
    }, 10);
  }

  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.closeTooltip();
  }

  private closeTooltip(): void {
    if (this.overlayRef) {
      this.visible = false;
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  
}
