import { CdkOverlayOrigin, ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef, Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, SimpleChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { OverlayService } from '../overlay/overlay.service';
import { TooltipComponent } from './tooltip.component';
import { OverlayBasicDirective, OverlayBasicPosition, OverlayBasicTrigger } from '../overlay/overlay-basic.directive';
import { UtilsService } from '../utils/utils.service';


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
  @Input('tooltip') tooltipContent: string | TemplateRef<any> = '';
  /** 提示位置 */
  @Input('tooltipPlacement') placement: OverlayBasicPosition = 'top';
  /** 提示触发方式 */
  @Input('tooltipTrigger') trigger: OverlayBasicTrigger = 'hover';
  /** 提示是否显示 */
  @Input('tooltipVisible') visible: boolean = false;
  /** 是否严格由编程控制显示 */
  @Input('tooltipStrictVisiable') strictVisiable: boolean = false;
  /** 提示鼠标进入延迟 */
  @Input('tooltipMouseEnterDelay') mouseEnterDelay: number = 50;
  /** 提示鼠标离开延迟 */
  @Input('tooltipMouseLeaveDelay') mouseLeaveDelay: number = 200;
  /** 提示CSS类 */
  @Input('tooltipClass') tooltipClass: string = '';
  /** 提示颜色 */
  @Input('tooltipColor') tooltipColor: string = '#000';
  /** 提示显示状态改变事件 */
  @Output('tooltipVisibleChange') visibleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  /** 提示 */
  private overlayRef: OverlayRef | null = null;
  /** 进入计时器 */
  private enterTimer: any;
  /** 离开计时器 */
  private leaveTimer: any;
  /** 组件 */
  private portal: ComponentPortal<TooltipComponent> | null = null;
  /** 提示组件引用 */
  private tooltipComponentRef: ComponentRef<TooltipComponent> | null = null;
  /** 组件悬停 */
  private componentHover: boolean = false;

  constructor(
    private elementRef: ElementRef,
    private overlayService: OverlayService,
    public overlay: Overlay,
    private utilsService: UtilsService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tooltipContent']) {
      this.updateContent(this.tooltipContent);
    }
    if (changes['visible']) {
      if (this.visible) {
        this.show();
      } else {
        this.hide();
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
    this.hoverOpen();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hoverClose();
  }

  @HostListener('click')
  onClick(): void {
    // 严格由编程控制显示
    if (this.strictVisiable) return;
    if (this.trigger === 'click') {
      this.visible ? this.hide() : this.show();
    }
  }

  /**
   * 鼠标进入
   */
  hoverOpen() {
    // 严格由编程控制显示
    if (this.strictVisiable) return;
    if (this.trigger === 'hover') {
      clearTimeout(this.leaveTimer);
      this.enterTimer = setTimeout(() => {
        this.show();
      }, this.mouseEnterDelay);
    }
  }

  /**
   * 鼠标离开
   */
  hoverClose() {
    // 严格由编程控制显示
    if (this.strictVisiable) return;
    if (this.trigger === 'hover') {
      clearTimeout(this.enterTimer);
      this.leaveTimer = setTimeout(() => {
        this.hide();
        clearTimeout(this.leaveTimer);
      }, this.mouseLeaveDelay);
    }
  }

  /**
   * 显示tooltip
   */
  public show(): void {
    if (!this.strictVisiable && (this.visible || !this.tooltipContent)) return;
    this.visible = true;
    this.visibleChange.emit(this.visible);
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
      (ref) => {
        if (this.strictVisiable) return;
        this.closeTooltip();
      }
    );

    // 创建并附加组件
    this.portal = new ComponentPortal(TooltipComponent);
    const componentRef = this.overlayRef.attach(this.portal);
    // 设置tooltip内容和位置
    componentRef.setInput('content', this.tooltipContent);
    componentRef.setInput('placement', this.placement);
    componentRef.setInput('color', this.tooltipColor);
    componentRef.location.nativeElement.addEventListener('mouseenter', () => {
      this.componentHover = true;
    });
    componentRef.location.nativeElement.addEventListener('mouseleave', () => {
      this.componentHover = false;
      this.hoverClose();
    });
    this.tooltipComponentRef = componentRef;

    // 设置CSS类以添加动画效果
    this.utilsService.delayExecution(() => {
      this.tooltipComponentRef && this.tooltipComponentRef.setInput('isVisible', true);
    }, 10);
  }

  /**
   * 隐藏tooltip
   */
  public hide(): void {
    if (!this.visible || this.componentHover) return;
    this.closeTooltip();
  }

  /**
   * 更新tooltip位置
   */
  public updatePosition(): void {
    if (this.overlayRef) {
      this.overlayRef.updatePosition();
    }
  }

  /**
   * 更新tooltip内容
   * @param content 内容
   */
  public updateContent(content: string | TemplateRef<any>): void {
    this.tooltipComponentRef && this.tooltipComponentRef.setInput('content', content);
  }

  /**
   * 关闭tooltip
   */
  private closeTooltip(): void {
    if (this.overlayRef) {
      this.visible = false;
      this.visibleChange.emit(this.visible);
      this.tooltipComponentRef ? this.tooltipComponentRef.destroy() : null;
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }


}
