import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { cloneDeep, isEqual } from 'lodash-es';

// 定义菜单项接口
export interface MenuItem {
  key: string;
  title: string;
  icon?: string;
  isOpen?: boolean;
  selected?: boolean;
  disabled?: boolean;
  children?: MenuItem[];
  link?: string;
}

@Component({
  selector: 'lib-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.less',
  animations: [
    trigger('expandCollapse', [
      state('void', style({ 
        height: '0',
        opacity: 0,
        overflow: 'hidden'
      })),
      state('*', style({ 
        height: '*',
        opacity: 1,
        overflow: 'hidden'
      })),
      transition('void <=> *', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class MenuComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'vertical' | 'inline' | 'horizontal' = 'inline';
  @Input() theme: 'light' | 'dark' = 'light';
  @Input() inlineCollapsed = false;
  @Input() items: MenuItem[] = [];
  @Input() selectable = true;
  @Input() inlineIndent = 24;
  @Input() selectedKeys: string[] = [];

  @Output() menuItemClick = new EventEmitter<MenuItem>();
  @Output() openChange = new EventEmitter<{item: MenuItem, open: boolean}>();

  // 组件内部数据，与输入数据隔离
  internalItems: MenuItem[] = [];

  // 菜单计时器
  private leaveTimers: Map<string, any> = new Map();
  private enterTimers: Map<string, any> = new Map();
  private hoverDelay = 50; // 设置较短的延迟时间

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // 深拷贝输入数据，实现数据隔离
    this.internalItems = cloneDeep(this.items);
    this.updateSelectedItems();
    // 确保初始时所有子菜单都是关闭的
    this.ensureAllMenusClosed();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // 当输入数据变化时更新内部数据
    if (changes['items']) {
      this.internalItems = cloneDeep(this.items);
    }

    if (changes['selectedKeys'] && !changes['selectedKeys'].firstChange) {
      this.updateSelectedItems();
    }

    if (changes['mode'] || changes['inlineCollapsed']) {
      // 在水平模式或折叠模式下关闭所有展开的子菜单
      if (this.mode === 'horizontal' || this.inlineCollapsed) {
        this.collapseAllSubMenus(this.internalItems);
      }
    }
  }

  // 确保所有菜单初始时是关闭的
  private ensureAllMenusClosed(): void {
    if (this.internalItems) {
      this.internalItems.forEach(item => {
        if (item.children && item.children.length > 0) {
          // 初始状态设为关闭
          item.isOpen = false;
          // 递归处理子菜单
          this.closeAllSubMenus(item.children);
        }
      });
    }
  }

  // 递归关闭所有子菜单
  private closeAllSubMenus(items: MenuItem[]): void {
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        item.isOpen = false;
        this.closeAllSubMenus(item.children);
      }
    });
  }

  // 切换子菜单状态
  toggleSubMenu(item: MenuItem): void {
    if (item.disabled || !item.children || item.children.length === 0) {
      return;
    }
    
    // 处理不同模式下的子菜单展开行为
    if (this.mode === 'inline' && !this.inlineCollapsed) {
      // 内联模式：切换当前子菜单的展开/折叠状态
      item.isOpen = !item.isOpen;
      this.openChange.emit({ item, open: !!item.isOpen });
    } else {
      // 水平、垂直或折叠模式：切换当前子菜单，同时关闭同级的其他子菜单
      const parentItems = this.findParentItems(item);
      const siblings = this.getSiblingItems(item, parentItems);
      
      // 关闭同级其他子菜单
      siblings.forEach(sibling => {
        if (sibling !== item && sibling.isOpen) {
          sibling.isOpen = false;
          this.openChange.emit({ item: sibling, open: false });
          
          // 递归关闭子菜单的子菜单
          if (sibling.children) {
            this.closeAllSubMenus(sibling.children);
          }
        }
      });
      
      // 切换当前子菜单状态
      item.isOpen = !item.isOpen;
      this.openChange.emit({ item, open: !!item.isOpen });
      
      // 如果当前菜单已关闭，递归关闭其子菜单
      if (!item.isOpen && item.children) {
        this.closeAllSubMenus(item.children);
      }
    }
  }

  // 鼠标进入子菜单容器
  onMouseEnterSubmenu(item: MenuItem): void {
    if (item.disabled || !item.children || item.children.length === 0) {
      return;
    }
    
    // 对于所有非内联模式（包括折叠状态的内联模式），使用悬停打开子菜单
    if (this.mode !== 'inline' || this.inlineCollapsed) {
      // 清除可能存在的离开定时器
      this.clearLeaveTimer(item.key);
      
      // 设置进入定时器，模拟DropMenu的行为
      if (!item.isOpen) {
        // 使用适当的延迟来设置isOpen
        this.setEnterTimer(item);
      }
    }
  }

  // 鼠标离开子菜单标题
  onMouseLeaveSubmenu(item: MenuItem): void {
    if (item.disabled || !item.children || item.children.length === 0) {
      return;
    }
    
    // 对于所有非内联模式（包括折叠状态的内联模式），使用悬停关闭子菜单
    if (this.mode !== 'inline' || this.inlineCollapsed) {
      // 清除可能存在的进入定时器
      this.clearEnterTimer(item.key);
      
      // 设置离开定时器
      this.setLeaveTimer(item);
    }
  }

  // 鼠标进入子菜单内容
  onMouseEnterSubMenu(item: MenuItem): void {
    if (item.disabled || !item.children || item.children.length === 0) {
      return;
    }
    
    // 清除可能存在的离开定时器
    this.clearLeaveTimer(item.key);
  }

  // 鼠标离开子菜单内容
  onMouseLeaveSubMenu(item: MenuItem): void {
    if (item.disabled || !item.children || item.children.length === 0 || (this.mode === 'inline' && !this.inlineCollapsed)) {
      return;
    }
    
    // 设置离开定时器
    this.setLeaveTimer(item);
  }

  // 设置进入定时器
  private setEnterTimer(item: MenuItem): void {
    this.clearEnterTimer(item.key);
    
    const timerId = setTimeout(() => {
      // 关闭同级的其他子菜单
      const parentItems = this.findParentItems(item);
      const siblings = this.getSiblingItems(item, parentItems);
      
      siblings.forEach(sibling => {
        if (sibling !== item && sibling.isOpen) {
          sibling.isOpen = false;
          this.openChange.emit({ item: sibling, open: false });
          
          // 递归关闭子菜单的子菜单
          if (sibling.children) {
            this.closeAllSubMenus(sibling.children);
          }
        }
      });
      
      // 打开当前子菜单
      item.isOpen = true;
      this.openChange.emit({ item, open: true });
      this.cdr.detectChanges();
      this.enterTimers.delete(item.key);
    }, this.hoverDelay);
    
    this.enterTimers.set(item.key, timerId);
  }

  // 设置离开定时器
  private setLeaveTimer(item: MenuItem): void {
    this.clearLeaveTimer(item.key);
    
    const timerId = setTimeout(() => {
      if (item.isOpen) {
        item.isOpen = false;
        this.openChange.emit({ item, open: false });
        
        // 递归关闭子菜单
        if (item.children) {
          this.closeAllSubMenus(item.children);
        }
        
        this.cdr.detectChanges();
      }
      this.leaveTimers.delete(item.key);
    }, 200); // 略微延长离开时间，给用户更多操作空间
    
    this.leaveTimers.set(item.key, timerId);
  }

  // 清除进入定时器
  private clearEnterTimer(key: string): void {
    if (this.enterTimers.has(key)) {
      clearTimeout(this.enterTimers.get(key));
      this.enterTimers.delete(key);
    }
  }

  // 清除离开定时器
  private clearLeaveTimer(key: string): void {
    if (this.leaveTimers.has(key)) {
      clearTimeout(this.leaveTimers.get(key));
      this.leaveTimers.delete(key);
    }
  }

  // 点击菜单项
  onMenuItemClick(item: MenuItem): void {
    if (this.selectable && !item.disabled) {
      // 先取消所有选中状态
      this.clearSelectedState(this.internalItems);
      // 设置当前选中
      item.selected = true;
      
      // 如果是子菜单项，确保父菜单项展开
      if (this.mode === 'inline' && !this.inlineCollapsed) {
        this.openParentMenus(this.internalItems, item);
      }
      
      // 通过找到原始数据中对应的项发送事件，保持输入输出数据一致性
      const originalItem = this.findOriginalItem(item.key, this.items);
      this.menuItemClick.emit(originalItem || item);
      
      // 如果不是内联模式，点击后关闭所有菜单
      if (this.mode !== 'inline' || this.inlineCollapsed) {
        // 给一个小延迟，确保点击事件完成
        setTimeout(() => {
          this.collapseAllSubMenus(this.internalItems);
        }, 100);
      }
    }
  }

  // 根据key查找原始数据中的菜单项
  private findOriginalItem(key: string, items: MenuItem[]): MenuItem | null {
    for (const item of items) {
      if (item.key === key) {
        return item;
      }
      if (item.children && item.children.length > 0) {
        const found = this.findOriginalItem(key, item.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  // 检查是否有选中的子菜单项
  hasSelectedChild(item: MenuItem): boolean {
    if (!item.children) {
      return false;
    }

    // 直接检查该项的子菜单项是否有选中状态
    const hasDirectSelectedChild = item.children.some(child => child.selected);
    if (hasDirectSelectedChild) {
      return true;
    }

    // 递归检查子级的子级是否有选中项
    return item.children.some(child => {
      if (child.children && child.children.length > 0) {
        return this.hasSelectedChild(child);
      }
      return false;
    });
  }

  // 打开选中项的所有父级菜单
  private openParentMenus(items: MenuItem[], selectedItem: MenuItem): void {
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        // 检查当前项的直接子项中是否包含选中项
        const directChild = item.children.find(child => child === selectedItem);
        if (directChild) {
          item.isOpen = true;
          return;
        }

        // 递归检查更深层次的子项
        const hasSelectedChild = this.hasSelectedChildInTree(item, selectedItem);
        if (hasSelectedChild) {
          item.isOpen = true;
          this.openParentMenus(item.children, selectedItem);
        }
      }
    }
  }

  // 检查菜单树中是否包含指定的菜单项
  private hasSelectedChildInTree(parent: MenuItem, targetItem: MenuItem): boolean {
    if (!parent.children) {
      return false;
    }

    for (const child of parent.children) {
      if (child === targetItem) {
        return true;
      }

      if (child.children && child.children.length > 0) {
        if (this.hasSelectedChildInTree(child, targetItem)) {
          return true;
        }
      }
    }

    return false;
  }

  // 清除所有菜单项的选中状态
  private clearSelectedState(items: MenuItem[]): void {
    items.forEach(item => {
      item.selected = false;
      if (item.children && item.children.length > 0) {
        this.clearSelectedState(item.children);
      }
    });
  }

  // 根据selectedKeys更新选中状态
  private updateSelectedItems(): void {
    if (!this.selectedKeys || this.selectedKeys.length === 0) {
      // 如果没有选中项，清除所有选中状态
      this.clearSelectedState(this.internalItems);
      return;
    }

    // 先清除所有选中状态
    this.clearSelectedState(this.internalItems);
    
    // 只使用第一个选中键 (如果有多个，只选中第一个)
    const selectedKey = this.selectedKeys[0];
    this.setSelectedByKey(this.internalItems, selectedKey);

    // 确保所有选中项的父菜单是展开的
    if (this.mode === 'inline' && !this.inlineCollapsed) {
      this.ensureParentMenusOpen(this.internalItems);
    }
  }

  // 根据单个key设置选中项
  private setSelectedByKey(items: MenuItem[], key: string): void {
    for (const item of items) {
      if (item.key === key) {
        item.selected = true;
        return; // 找到第一个匹配项就返回
      }

      if (item.children && item.children.length > 0) {
        this.setSelectedByKey(item.children, key);
      }
    }
  }

  // 确保所有选中项的父菜单是展开的
  private ensureParentMenusOpen(items: MenuItem[]): void {
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        const hasSelected = this.hasSelectedChild(item);
        if (hasSelected && this.mode === 'inline' && !this.inlineCollapsed) {
          item.isOpen = true;
        }
        this.ensureParentMenusOpen(item.children);
      }
    });
  }

  // 收起所有子菜单
  private collapseAllSubMenus(items: MenuItem[]): void {
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        item.isOpen = false;
        this.collapseAllSubMenus(item.children);
      }
    });
  }

  // 查找菜单项的父级菜单数组
  private findParentItems(targetItem: MenuItem): MenuItem[] {
    const findParent = (items: MenuItem[], target: MenuItem, path: MenuItem[] = []): MenuItem[] | null => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          if (item.children.includes(target)) {
            return [...path, item];
          }
          
          const result = findParent(item.children, target, [...path, item]);
          if (result) {
            return result;
          }
        }
      }
      return null;
    };
    
    return findParent(this.internalItems, targetItem, []) || [];
  }

  // 获取同级菜单项
  private getSiblingItems(item: MenuItem, parentPath: MenuItem[]): MenuItem[] {
    if (parentPath.length === 0) {
      // 顶级菜单项
      return this.internalItems.filter(i => i !== item);
    }
    
    // 获取直接父级
    const parent = parentPath[parentPath.length - 1];
    return parent.children?.filter(child => child !== item) || [];
  }

  ngOnDestroy(): void {
    // 清理所有定时器
    this.leaveTimers.forEach((timer) => clearTimeout(timer));
    this.enterTimers.forEach((timer) => clearTimeout(timer));
    this.leaveTimers.clear();
    this.enterTimers.clear();
  }
}
