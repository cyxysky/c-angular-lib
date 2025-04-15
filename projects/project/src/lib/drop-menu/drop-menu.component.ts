import { Component, Input, Output, EventEmitter, TemplateRef, ChangeDetectorRef, ElementRef, OnInit, OnChanges, SimpleChanges, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropMenu } from './drop-menu.interface';
import { UtilsService } from '../utils/utils.service';

@Component({
  selector: 'lib-drop-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drop-menu.component.html',
  styleUrl: './drop-menu.component.less',
  encapsulation: ViewEncapsulation.None // 确保嵌套样式可以渗透到子组件
})
export class DropMenuComponent implements OnInit, OnChanges, OnDestroy {
  /** 菜单数据 */
  @Input() items: DropMenu[] = [];
  /** 是否可见 */
  @Input() isVisible: boolean = false;
  /** 菜单位置 */
  @Input() placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  /** 菜单宽度 */
  @Input() width: number | string = 'auto';
  /** 自定义菜单项模板 */
  @Input() itemTemplate: TemplateRef<{ $implicit: DropMenu, index: number }> | null = null;
  /** 是否自动关闭菜单 */
  @Input() autoClose: boolean = true;
  /** 是否为子菜单 */
  @Input() isSubMenu: boolean = false;
  /** 是否选中 */
  @Input() selectedItem: DropMenu | null = null;
  /** 父级是否禁用 */
  @Input() parentDisabled: boolean = false;
  /** 点击菜单项事件 */
  @Output() itemClick = new EventEmitter<DropMenu>();
  /** 菜单关闭事件 */
  @Output() menuClose = new EventEmitter<void>();

  /** 跟踪当前悬停的子菜单 */
  hoveredItemIndex: number = -1;
  /** 鼠标离开计时器 */
  private leaveTimer: any = null;
  /** 鼠标进入计时器 */
  private enterTimer: any = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private utilsService: UtilsService
  ) { }

  ngOnInit(): void {
    // 子菜单需要立即可见
    if (this.isSubMenu) {
      this.utilsService.delayExecution(() => {
        this.isVisible = true;
        this.cdr.detectChanges();
      }, 0);
    }

    // 初始时如果有选中项，检查是否在当前菜单层级
    this.findSelectedPath();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // 当选中项变化时，查找选中路径
    if (changes['selectedItem']) {
      this.findSelectedPath();
    }
  }

  /**
   * 查找选中项的路径，初始化时调用
   */
  findSelectedPath(): void {
    if (!this.selectedItem) return;

    // 检查选中项是否在当前菜单或子菜单中
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      // 如果当前项就是选中项
      if (item === this.selectedItem) {
        return;
      }

      // 检查子菜单是否包含选中项
      if (item.children && item.children.length > 0 && this.containsItem(item.children, this.selectedItem)) {
        // 将包含选中项的菜单项设为展开状态
        this.hoveredItemIndex = i;
        this.cdr.detectChanges();
        return;
      }
    }
  }

  /**
   * 检查菜单数组是否包含指定项
   */
  private containsItem(items: DropMenu[], targetItem: DropMenu): boolean {
    if (!targetItem) return false;
    for (const item of items) {
      if (item === targetItem) return true;
      if (item.children && item.children.length > 0) {
        if (this.containsItem(item.children, targetItem)) return true;
      }
    }
    return false;
  }

  /**
   * 判断是否为模板引用
   */
  isTemplateRef(value: any): value is TemplateRef<any> {
    return value instanceof TemplateRef;
  }

  /**
   * 检查菜单项是否真正禁用（自身禁用或父级禁用）
   */
  isItemDisabled(item: DropMenu): boolean {
    return this.parentDisabled || !!item.disabled;
  }

  /**
   * 点击菜单项
   */
  onItemClick(item: DropMenu, event?: MouseEvent): void {
    // 如果菜单项被禁用，则不执行任何操作
    if (this.isItemDisabled(item)) {
      if (event) {
        event.stopPropagation();
      }
      return;
    }
    // 阻止事件冒泡，防止触发上级菜单的点击事件
    if (event) {
      event.stopPropagation();
    }
    this.itemClick.emit(item);
    // 只在没有子菜单或子菜单为空且启用了自动关闭时才关闭菜单
    if (this.autoClose) {
      this.menuClose.emit();
    }
  }

  /**
   * 处理子菜单项点击
   */
  onSubMenuItemClick(item: DropMenu): void {
    // 传递子菜单点击事件到父级
    this.itemClick.emit(item);
  }

  /**
   * 鼠标进入菜单项
   */
  onMouseEnterItem(index: number): void {
    // 检查对应索引的菜单项是否被禁用
    if (this.isItemDisabled(this.items[index])) {
      return;
    }

    // 清除任何现有的离开计时器
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = null;
    }
    // 直接设置索引，不使用延迟
    this.hoveredItemIndex = index;
    this.cdr.detectChanges();
  }

  /**
   * 鼠标离开菜单项
   */
  onMouseLeaveItem(): void {
    // 添加足够长的延时，不要立即关闭子菜单
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
    }
    this.leaveTimer = setTimeout(() => {
      this.hoveredItemIndex = -1;
      this.cdr.detectChanges();
    }, 50); // 更长的延迟，给用户足够时间移动到子菜单
  }

  /**
   * 判断是否显示子菜单
   * @param index 菜单项索引
   */
  shouldShowSubMenu(index: number): boolean {
    return this.hoveredItemIndex === index && !this.isItemDisabled(this.items[index]);
  }

  /**
   * 获取字符串
   * @param value 值
   * @returns 字符串
   */
  getString(value: any): string {
    return this.utilsService.getString(value);
  }

  /**
   * 鼠标进入子菜单
   * @param index 菜单项索引
   */
  onMouseEnterSubmenu(index: number): void {
    // 如果对应的菜单项被禁用，则不处理
    if (this.isItemDisabled(this.items[index])) {
      return;
    }

    // 清除任何现有的离开计时器
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = null;
    }
    // 确保子菜单保持显示状态
    this.hoveredItemIndex = index;
    this.cdr.detectChanges();
  }

  /**
   * 鼠标离开子菜单
   */
  onMouseLeaveSubmenu(): void {
    // 鼠标离开子菜单时不立即关闭，给一点延迟
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
    }
    this.leaveTimer = setTimeout(() => {
      this.hoveredItemIndex = -1;
      this.cdr.detectChanges();
    }, 50);
  }

  ngOnDestroy(): void {
    // 清理计时器
    if (this.enterTimer) {
      clearTimeout(this.enterTimer);
    }
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
    }
  }
}
