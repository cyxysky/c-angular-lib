import { Directive, TemplateRef, Input, ElementRef, HostListener, SimpleChanges, ComponentRef, EventEmitter, Output } from '@angular/core';
import { OverlayBasicDirective, OverlayBasicPosition, OverlayBasicPositionConfigs, OverlayBasicTrigger } from '../core/overlay/overlay-basic.directive';
import { OverlayRef, Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { PopoverComponent } from './popover.component';
import { OverlayService } from '../core/overlay/overlay.service';
import * as _ from 'lodash';
import { UtilsService } from '../core/utils/utils.service';
@Directive({
  selector: '[libPopover]'
})
export class PopoverDirective implements OverlayBasicDirective {
  /** 提示内容 */
  @Input('popoverContent') popoverContent: string | TemplateRef<any> = '';
  /** 提示标题 */
  @Input('popoverTitle') popoverTitle: string | TemplateRef<any> = '';
  /** 提示位置 */
  @Input('popoverPlacement') placement: OverlayBasicPosition = 'top';
  /** 提示触发方式 */
  @Input('popoverTrigger') trigger: OverlayBasicTrigger = 'hover';
  /** 提示是否显示 */
  @Input('popoverVisible') visible: boolean = false;
  /** 是否严格由编程控制显示 */
  @Input('popoverStrictVisiable') strictVisiable: boolean = false;
  /** 提示鼠标进入延迟 */
  @Input('popoverMouseEnterDelay') mouseEnterDelay: number = 50;
  /** 提示鼠标离开延迟 */
  @Input('popoverMouseLeaveDelay') mouseLeaveDelay: number = 200;
  /** 提示显示状态改变事件 */
  @Output('popoverVisibleChange') visibleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  private overlayRef: OverlayRef | null = null;
  private enterTimer: any;
  private leaveTimer: any;
  private portal: ComponentPortal<PopoverComponent> | null = null;
  private popoverComponentRef: ComponentRef<PopoverComponent> | null = null;
  private componentHover: boolean = false;

  constructor(
    private elementRef: ElementRef,
    private overlayService: OverlayService,
    public overlay: Overlay,
    private utilsService: UtilsService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['popoverTitle']) {
      this.updateComponent('title', this.popoverTitle);
    }
    if (changes['popoverContent']) {
      this.updateComponent('content', this.popoverContent);
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
    this.closePopover();
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
   * 显示
   */
  public show(): void {
    if (!this.strictVisiable && this.visible) return;
    this.visible = true;
    this.visibleChange.emit(this.visible);
    this.closePopover();
    const positions = this.overlayService.getPositions(this.placement);
    // 创建overlay
    this.overlayRef = this.overlayService.createOverlay(
      {
        positionStrategy: this.overlay.position().flexibleConnectedTo(this.elementRef).withPositions(positions).withPush(false).withGrowAfterOpen(true).withLockedPosition(false)
      },
      this.elementRef,
      positions,
      (ref) => {
        if (this.strictVisiable) return;
        this.closePopover();
      },
      (position, isBackupUsed) => {
        if (isBackupUsed) {
          for (const key in OverlayBasicPositionConfigs) {
            if (_.isEqual(OverlayBasicPositionConfigs[key], position)) {
              if (this.popoverComponentRef) {
                this.popoverComponentRef.setInput('placement', key as OverlayBasicPosition);
                this.popoverComponentRef.instance?.getMargin();
                this.popoverComponentRef.instance?.cdr?.detectChanges();
              }
              break;
            }
          }
        }
        // 根据使用的位置进行UI调整
      }
    );

    // 创建并附加组件
    this.portal = new ComponentPortal(PopoverComponent);
    const componentRef = this.overlayRef.attach(this.portal);

    componentRef.setInput('title', this.popoverTitle);
    componentRef.setInput('content', this.popoverContent);
    componentRef.setInput('placement', this.placement);

    componentRef.location.nativeElement.addEventListener('mouseenter', () => {
      this.componentHover = true;
      this.hoverOpen();
    });
    componentRef.location.nativeElement.addEventListener('mouseleave', () => {
      this.componentHover = false;
      this.hoverClose();
    });

    this.popoverComponentRef = componentRef;
    // 设置CSS类以添加动画效果
    this.utilsService.delayExecution(() => {
      this.popoverComponentRef && this.popoverComponentRef.setInput('isVisible', true);
    }, 10);
  }

  /**
   * 隐藏
   */
  public hide(): void {
    if (!this.visible || this.componentHover) return;
    this.visibleChange.emit(this.visible);
    this.visible = false;
    this.closePopover();
  }

  /**
   * 更新位置
   */
  public updatePosition(): void {
    if (this.overlayRef) {
      this.overlayRef.updatePosition();
    }
  }

  /**
   * 更新内容
   * @param key 键
   * @param value 值
   */
  public updateComponent(key: string, value: any): void {
    this.popoverComponentRef?.setInput(key, value);
  }

  /**
   * 关闭
   */
  private closePopover(): void {
    if (this.overlayRef) {
      this.visible = false;
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

}
