import { Directive, TemplateRef, Input, ElementRef, HostListener, SimpleChanges, ComponentRef, EventEmitter, Output, ViewContainerRef, Injector, Optional, SkipSelf } from '@angular/core';
import { OverlayBasicDirective, OverlayBasicPosition, OverlayBasicPositionConfigs, OverlayBasicTrigger } from '../overlay/overlay-basic.directive';
import { OverlayRef, Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DropMenuComponent } from './drop-menu.component';
import { OverlayService } from '../overlay/overlay.service';
import { DropMenu } from './drop-menu.interface';
import * as _ from 'lodash';
import { UtilsService } from '../utils/utils.service';

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
  /** 菜单项选中事件 */
  @Output('dropMenuSelectedChange') selectedChange: EventEmitter<DropMenu | null> = new EventEmitter<DropMenu | null>();

  private overlayRef: OverlayRef | null = null;
  private enterTimer: any;
  private leaveTimer: any;
  private portal: ComponentPortal<DropMenuComponent> | null = null;
  private dropMenuComponentRef: ComponentRef<DropMenuComponent> | null = null;
  private componentHover: boolean = false;
  private disposed: boolean = false;
  /** 跟踪是否为根菜单 */
  private isRootMenu: boolean = true;
  /** 跟踪需要自动关闭的根菜单引用 */
  private rootMenuRef: DropMenuDirective | null = null;

  constructor(
    private elementRef: ElementRef,
    private overlayService: OverlayService,
    private overlay: Overlay,
    private utilsService: UtilsService,
    @Optional() @SkipSelf() private parentMenu?: DropMenuDirective
  ) { 
    // 如果有父菜单，那么这个菜单不是根菜单
    this.isRootMenu = !parentMenu;
    // 找到根菜单引用
    if (parentMenu) {
      let current = parentMenu;
      // 向上查找根菜单
      while (current && !current.isRootMenu) {
        const parent = current.parentMenu;
        if (!parent) break;
        current = parent;
      }
      this.rootMenuRef = current;
    } else {
      this.rootMenuRef = this;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['menuItems'] && this.dropMenuComponentRef) {
      this.dropMenuComponentRef.setInput('items', this.menuItems);
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
    // 初始化时如果visible为true，则显示下拉菜单
    if (this.visible) {
      this.show();
    }
  }

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
    if (this.trigger === 'click') {
      // 修复点击后需要点击两次才能重新显示的问题
      if (this.disposed) {
        this.disposed = false;
        this.show();
      } else {
        this.visible ? this.hide() : this.show();
      }
    }
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
    this.changeVisible(true);
    this.closeDropMenu();
    this.disposed = false;
    const positions = this.overlayService.getPositions(this.placement);
    // 创建overlay
    this.overlayRef = this.overlayService.createOverlay(
      // 配置
      {
        positionStrategy: this.overlay.position().flexibleConnectedTo(this.elementRef).withPositions(positions).withPush(false).withGrowAfterOpen(true).withLockedPosition(false),
      },
      // 目标锚点元素
      this.elementRef,
      // 位置
      positions,
      // 处理外部点击
      (ref, event) => {
        if (this.strictVisible) return;
        this.disposed = true;
        this.hide();
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
    this.portal = new ComponentPortal(DropMenuComponent);
    const componentRef = this.overlayRef.attach(this.portal);
    componentRef.setInput('items', this.menuItems);
    componentRef.setInput('placement', this.placement);
    componentRef.setInput('width', this.width);
    componentRef.setInput('itemTemplate', this.itemTemplate);
    componentRef.setInput('autoClose', this.autoClose);
    componentRef.setInput('selectedItem', this.selectedItem);

    // 订阅事件
    const itemClickSub = componentRef.instance.itemClick.subscribe((item: DropMenu) => {
      this.itemClick.emit(item);
      
      // 更新选中项
      if (!item.disabled) {
        this.selectedItem = item;
        this.selectedChange.emit(this.selectedItem);
        // 更新组件中的选中项
        this.updateSelectedItem(this.selectedItem);
      }
      
      // 根据autoClose设置和是否有子菜单决定是否关闭菜单
      if (this.autoClose && (!item.children || item.children.length === 0) && !item.disabled) {
        // 关闭根菜单，这样会关闭整个菜单链
        if (this.rootMenuRef && this.rootMenuRef !== this) {
          this.rootMenuRef.hide();
        } else {
          this.hide();
        }
      }
    });
    
    const menuCloseSub = componentRef.instance.menuClose.subscribe(() => {
      // 关闭根菜单，这样会关闭整个菜单链
      if (this.rootMenuRef && this.rootMenuRef !== this) {
        this.rootMenuRef.hide();
      } else {
        this.hide();
      }
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

    // 保存组件引用
    this.dropMenuComponentRef = componentRef;

    // 设置CSS类以添加动画效果
    this.utilsService.delayExecution(() => {
      if (componentRef) {
        componentRef.setInput('isVisible', true);
        
        // 如果有选中项，触发查找选中路径
        if (this.selectedItem) {
          // 延迟执行，确保DOM已经渲染完成
          this.utilsService.delayExecution(() => {
            componentRef.instance.findSelectedPath();
          }, 50);
        }
      }
    }, 0)
  }

  public hide(): void {
    if (this.componentHover && !this.autoClose) return;
    this.dropMenuComponentRef?.setInput('isVisible', false);
    this.changeVisible(false);
    this.utilsService.delayExecution(() => {
      this.closeDropMenu();
    }, 150);
  }

  /**
   * 改变菜单显示状态
   * @param visible 显示状态
   */
  changeVisible(visible: boolean): void {
    this.visible = visible;
    this.visibleChange.emit(this.visible);
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
   * 关闭下拉菜单
   */
  private closeDropMenu(): void {
    if (this.overlayRef) {
      this.visible = false;
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  /**
   * 更新所有菜单组件中的选中项
   */
  private updateSelectedItem(selectedItem: DropMenu | null): void {
    if (this.dropMenuComponentRef) {
      this.dropMenuComponentRef.setInput('selectedItem', selectedItem);
    }
  }
} 