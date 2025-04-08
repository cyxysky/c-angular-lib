import { Directive, TemplateRef, Input, ElementRef, HostListener, SimpleChanges, ComponentRef, EventEmitter, Output } from '@angular/core';
import { OverlayBasicDirective, OverlayBasicPosition, OverlayBasicPositionConfigs, OverlayBasicTrigger } from '../overlay/overlay-basic.directive';
import { OverlayRef, Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { PopoverComponent } from './popover.component';
import { OverlayService } from '../overlay/overlay.service';
import * as _ from 'lodash';
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
  private popoverComponent: PopoverComponent | null = null;
  private popoverComponentRef: ComponentRef<PopoverComponent> | null = null;
  private componentHover: boolean = false;

  constructor(
    private elementRef: ElementRef,
    private overlayService: OverlayService,
    public overlay: Overlay,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tooltipContent']) {
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
      (ref) => this.closePopover(),
      (position, isBackupUsed) => {
        if (isBackupUsed) {
          for (const key in OverlayBasicPositionConfigs) {
            if (_.isEqual(OverlayBasicPositionConfigs[key], position)) {
              this.popoverComponent!.placement = key as OverlayBasicPosition;
              this.popoverComponent?.getMargin();
              this.popoverComponentRef?.changeDetectorRef.detectChanges();
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

    // 设置tooltip内容和位置
    this.popoverComponent = componentRef.instance;
    this.popoverComponentRef = componentRef;

    // 设置CSS类以添加动画效果
    setTimeout(() => {
      if (componentRef.instance) {
        componentRef.instance.isVisible = true;
      }
    }, 10);
  }

  public hide(): void {
    if (!this.visible || this.componentHover) return;
    this.visibleChange.emit(this.visible);
    this.visible = false;
    this.closePopover();
  }

  public updatePosition(): void {
    if (this.overlayRef) {
      this.overlayRef.updatePosition();
    }
  }

  public updateContent(content: string | TemplateRef<any>): void {
    if (this.popoverComponent) {
      this.popoverComponent.content = content;
    }
  }

  private closePopover(): void {
    if (this.overlayRef) {
      this.visible = false;
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

}
