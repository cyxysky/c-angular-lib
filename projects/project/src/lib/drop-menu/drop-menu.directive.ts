import { Directive, TemplateRef, Input, ElementRef, HostListener, SimpleChanges, ComponentRef, EventEmitter, Output, ViewContainerRef, Injector, Optional, SkipSelf } from '@angular/core';
import { OverlayBasicDirective, OverlayBasicPosition, OverlayBasicPositionConfigs, OverlayBasicTrigger } from '../core/overlay/overlay-basic.directive';
import { OverlayRef, Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DropMenuComponent } from './drop-menu.component';
import { OverlayService } from '../core/overlay/overlay.service';
import { DropMenu } from './drop-menu.interface';
import * as _ from 'lodash';
import { UtilsService } from '../core/utils/utils.service';

@Directive({
  selector: '[libDropMenu]',
  standalone: true,
  exportAs: 'libDropMenu'
})
export class DropMenuDirective implements OverlayBasicDirective {
  /** 菜单项 */
  @Input('dropMenuItems') menuItems: DropMenu[] = [];
  /** 菜单位置 */
  @Input('dropMenuPlacement') placement: OverlayBasicPosition = 'bottom-left';
  /** 菜单触发方式 */
  @Input('dropMenuTrigger') trigger: OverlayBasicTrigger = 'click';
  /** 菜单是否显示 */
  @Input('dropMenuVisible') visible: boolean = false;
  /** 是否严格由编程控制显示 */
  @Input('dropMenuStrictVisible') strictVisible: boolean = false;
  /** 菜单类 */
  @Input('dropMenuClass') dropMenuClass: string = '';
  /** 菜单宽度 */
  @Input('dropMenuWidth') width: number | string = 'auto';
  /** 菜单项模板 */
  @Input('dropMenuItemTemplate') itemTemplate: TemplateRef<{ $implicit: DropMenu, index: number }> | null = null;
  /** 菜单鼠标进入延迟 */
  @Input('dropMenuMouseEnterDelay') mouseEnterDelay: number = 50;
  /** 菜单鼠标离开延迟 */
  @Input('dropMenuMouseLeaveDelay') mouseLeaveDelay: number = 500;
  /** 是否自动关闭菜单 */
  @Input('dropMenuAutoClose') autoClose: boolean = true;
  /** 菜单显示状态改变事件 */
  @Output('dropMenuVisibleChange') visibleChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  /** 菜单项点击事件 */
  @Output('dropMenuItemClick') itemClick: EventEmitter<DropMenu> = new EventEmitter<DropMenu>();
  /** 当前选中的菜单项 */
  @Input('dropMenuSelected') selectedItem: DropMenu | null = null;
  /** 纯模板 */
  @Input('dropMenuTemplate') template: TemplateRef<{ $implicit: DropMenu, index: number }> | null = null;
  /** 菜单项选中事件 */
  @Output('dropMenuSelectedChange') selectedChange: EventEmitter<DropMenu | null> = new EventEmitter<DropMenu | null>();

  private overlayRef: OverlayRef | null = null;
  private enterTimer: any;
  private leaveTimer: any;
  private dropMenuComponentRef: ComponentRef<DropMenuComponent> | null = null;
  private componentHover: boolean = false;

  constructor(
    private elementRef: ElementRef,
    private overlayService: OverlayService,
    private overlay: Overlay,
    private utilsService: UtilsService,
  ) {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['menuItems'] && this.dropMenuComponentRef) {
      this.dropMenuComponentRef.setInput('items', this.menuItems);
    }
    if (changes['visible']) {
      this.visible ? this.show() : this.hide();
    }
  }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    this.closeDropMenu();
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
    if (this.strictVisible) return;
    if (this.trigger === 'click') this.visible ? this.hide() : this.show();
  }

  /**
   * 鼠标悬停打开
   */
  hoverOpen() {
    // 严格由编程控制显示
    if (this.strictVisible) return;
    if (this.trigger === 'hover') {
      clearTimeout(this.leaveTimer);
      this.enterTimer = setTimeout(() => {
        this.show();
      }, this.mouseEnterDelay);
    }
  }

  /**
   * 鼠标悬停关闭
   */
  hoverClose() {
    // 严格由编程控制显示
    if (this.strictVisible) return;
    if (this.trigger === 'hover') {
      clearTimeout(this.enterTimer);
      this.leaveTimer = setTimeout(() => {
        // 检查组件是否仍处于悬停状态
        if (!this.componentHover) {
          this.hide();
          clearTimeout(this.leaveTimer);
        }
      }, this.mouseLeaveDelay);
    }
  }

  /**
   * 显示下拉菜单
   */
  public show(): void {
    if (!this.strictVisible && this.visible) return;
    this.closeDropMenu();
    const positions = this.overlayService.getPositions(this.placement);
    // 创建overlay
    this.overlayRef = this.overlayService.createOverlay(
      // 配置
      {
        panelClass: [this.dropMenuClass],
        positionStrategy: this.overlay.position().flexibleConnectedTo(this.elementRef).withPositions(positions).withPush(false).withGrowAfterOpen(true).withLockedPosition(false),
      },
      // 目标锚点元素
      this.elementRef,
      // 位置
      positions,
      // 处理外部点击
      (ref, event) => {
        if (this.strictVisible) return;
        this.utilsService.delayExecution(() => {
          this.hide();
        }, 10);
      },
      // 处理位置变化
      (position, isBackupUsed) => {
        if (isBackupUsed) {
          for (const key in OverlayBasicPositionConfigs) {
            if (_.isEqual(OverlayBasicPositionConfigs[key], position)) {
              this.dropMenuComponentRef?.setInput('placement', key as any);
              this.dropMenuComponentRef?.changeDetectorRef.detectChanges();
              break;
            }
          }
        }
      }
    );
    // 创建并附加组件
    const componentRef = this.overlayRef.attach(new ComponentPortal(DropMenuComponent));
    // 设置组件属性
    componentRef.setInput('items', this.menuItems);
    componentRef.setInput('placement', this.placement);
    componentRef.setInput('width', this.width);
    componentRef.setInput('itemTemplate', this.itemTemplate);
    componentRef.setInput('autoClose', this.autoClose);
    componentRef.setInput('selectedItem', this.selectedItem);
    componentRef.setInput('template', this.template);
    // 订阅事件
    const itemClickSub = componentRef.instance.itemClick.subscribe((item: DropMenu) => {
      this.itemClick.emit(item);
      if (!item.disabled) {
        this.selectedItem = item;
        this.selectedChange.emit(this.selectedItem);
        this.updateSelectedItem(this.selectedItem);
      }
    });
    const menuCloseSub = componentRef.instance.menuClose.subscribe(() => {
      // 关闭根菜单，这样会关闭整个菜单链
      this.hide();
    });
    // 当组件销毁时取消订阅
    componentRef.onDestroy(() => {
      itemClickSub.unsubscribe();
      menuCloseSub.unsubscribe();
    });
    // 处理鼠标事件
    componentRef.location.nativeElement.addEventListener('mouseenter', () => {
      this.componentHover = true;
      this.hoverOpen();
    });
    componentRef.location.nativeElement.addEventListener('mouseleave', () => {
      this.componentHover = false;
      this.hoverClose();
    });
    // 保存组件ref引用
    this.dropMenuComponentRef = componentRef;
    this.utilsService.delayExecution(() => {
      this.changeVisible(true);
    });
  }

  /**
   * 隐藏下拉菜单
   */
  public hide(): void {
    if (this.componentHover && !this.autoClose) return;
    this.changeVisible(false);
    this.utilsService.delayExecution(() => {
      this.closeDropMenu();
    }, OverlayService.overlayVisiableDuration);
  }

  /**
   * 改变菜单显示状态
   * @param visible 显示状态
   */
  changeVisible(visible: boolean): void {
    this.visible = visible;
    this.visibleChange.emit(this.visible);
    this.dropMenuComponentRef?.setInput('isVisible', visible);
  }

  /**
   * 更新位置
   */
  public updatePosition(): void {
    this.overlayRef && this.overlayRef.updatePosition();
  }

  /**
   * 关闭下拉菜单
   */
  private closeDropMenu(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
    }
    this.overlayRef = null;
    this.dropMenuComponentRef = null;
  }

  /**
   * 更新所有菜单组件中的选中项
   */
  private updateSelectedItem(selectedItem: DropMenu | null): void {
    this.dropMenuComponentRef && this.dropMenuComponentRef.setInput('selectedItem', selectedItem);
  }
} 