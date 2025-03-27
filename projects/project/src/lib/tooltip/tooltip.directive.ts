import { CdkOverlayOrigin, ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Directive, ElementRef, HostListener, Input, OnDestroy, OnInit, SimpleChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { OverlayService } from '../service/overlay.service';
import { TooltipComponent } from './tooltip.component';
import { OverlayBasicDirective, OverlayBasicPosition, OverlayBasicTrigger } from '../overlay/overlay-basic.directive';


@Directive({
  selector: '[libTooltip]',
  exportAs: 'libTooltip',
  standalone: true,
  host: {
    '[class.lib-tooltip-open]': 'visible'
  }
})
export class TooltipDirective implements OnInit, OnDestroy, OverlayBasicDirective {
  /** 提示内容 */
  @Input('libTooltip') tooltipContent: string | TemplateRef<any> = '';
  /** 提示位置 */
  @Input('libTooltipPlacement') placement: OverlayBasicPosition = 'top';
  /** 提示触发方式 */
  @Input('libTooltipTrigger') trigger: OverlayBasicTrigger = 'hover';
  /** 提示是否显示 */
  @Input('libTooltipVisible') visible: boolean = false;
  /** 是否严格由编程控制显示 */
  @Input('libTooltipStrictVisiable') strictVisiable: boolean = false;
  /** 提示鼠标进入延迟 */
  @Input('libTooltipMouseEnterDelay') mouseEnterDelay: number = 50;
  /** 提示鼠标离开延迟 */
  @Input('libTooltipMouseLeaveDelay') mouseLeaveDelay: number = 0;
  /** 提示CSS类 */
  @Input('libTooltipClass') tooltipClass: string = '';
  /** 提示颜色 */
  @Input('libTooltipColor') tooltipColor: string = '#000';

  private overlayRef: OverlayRef | null = null;
  private enterTimer: any;
  private leaveTimer: any;
  private portal: ComponentPortal<TooltipComponent> | null = null;
  private tooltipComponent: TooltipComponent | null = null;

  constructor(
    private elementRef: ElementRef,
    private overlayService: OverlayService,
    public overlay: Overlay,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tooltipContent']) {
      this.updateContent(this.tooltipContent);
    }
    if (changes['visible']) {

      // 严格由编程控制显示
      if (this.strictVisiable) {
        if (this.visible) {
          this.show();
        } else {
          this.hide();
        }
      }
    }
  }


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
    // 严格由编程控制显示
    if (this.strictVisiable) return;
    if (this.trigger === 'hover') {
      clearTimeout(this.leaveTimer);
      this.enterTimer = setTimeout(() => {
        this.show();
      }, this.mouseEnterDelay);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    // 严格由编程控制显示
    if (this.strictVisiable) return;
    if (this.trigger === 'hover') {
      clearTimeout(this.enterTimer);
      this.hide();
    }
  }

  @HostListener('click')
  onClick(): void {
    // 严格由编程控制显示
    if (this.strictVisiable) return;
    if (this.trigger === 'click') {
      this.visible ? this.hide() : this.show();
    }
  }

  public show(): void {
    if (!this.strictVisiable && (this.visible || !this.tooltipContent)) return;
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
    this.tooltipComponent = componentRef.instance;

    // 设置CSS类以添加动画效果
    setTimeout(() => {
      if (componentRef.instance) {
        componentRef.instance.isVisible = true;
      }
    }, 10);
  }

  public hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.closeTooltip();
  }

  public updatePosition(): void {
    if (this.overlayRef) {
      this.overlayRef.updatePosition();
    }
  }

  public updateContent(content: string | TemplateRef<any>): void {
    if (this.tooltipComponent) {
      this.tooltipComponent.content = content;
    }
  }

  private closeTooltip(): void {
    if (this.overlayRef) {
      this.visible = false;
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }


}
