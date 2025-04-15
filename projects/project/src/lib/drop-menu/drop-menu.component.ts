import { Component, Input, Output, EventEmitter, TemplateRef, ChangeDetectorRef, ElementRef, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropMenu } from './drop-menu.interface';

@Component({
  selector: 'lib-drop-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drop-menu.component.html',
  styleUrl: './drop-menu.component.less',
  encapsulation: ViewEncapsulation.None // 确保嵌套样式可以渗透到子组件
})
export class DropMenuComponent implements OnInit, OnDestroy {
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

  constructor(private cdr: ChangeDetectorRef, private elementRef: ElementRef) {}

  ngOnInit(): void {
    // 子菜单需要立即可见
    if (this.isSubMenu) {
      setTimeout(() => {
        this.isVisible = true;
        this.cdr.detectChanges();
      }, 0);
    }
  }

  /**
   * 判断是否为模板引用
   */
  isTemplateRef(value: any): value is TemplateRef<any> {
    return value instanceof TemplateRef;
  }

  /**
   * 点击菜单项
   */
  onItemClick(item: DropMenu, event?: MouseEvent): void {
    // 阻止事件冒泡，防止触发上级菜单的点击事件
    if (event) {
      event.stopPropagation();
    }
    
    this.itemClick.emit(item);
    
    // 只在没有子菜单或子菜单为空且启用了自动关闭时才关闭菜单
    if (this.autoClose && (!item.children || item.children.length === 0)) {
      this.menuClose.emit();
    }
  }

  /**
   * 鼠标进入菜单项
   * @param index 菜单项索引
   */
  onMouseEnterItem(index: number): void {
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
    }, 150); // 更长的延迟，给用户足够时间移动到子菜单
  }

  /**
   * 判断是否显示子菜单
   * @param index 菜单项索引
   */
  shouldShowSubMenu(index: number): boolean {
    return this.hoveredItemIndex === index;
  }

  /**
   * 获取菜单样式
   */
  getMenuStyle(): any {
    return {
      width: typeof this.width === 'number' ? `${this.width}px` : this.width
    };
  }

  /**
   * 鼠标进入子菜单
   * @param index 菜单项索引
   */
  onMouseEnterSubmenu(index: number): void {
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
    }, 150);
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
