import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild, forwardRef, ElementRef, ViewChild, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { trigger, state, style, transition, animate, AnimationEvent } from '@angular/animations';
import { expandCollapse } from '../animation/expandCollapse.animation';
import { rotate } from '../animation/rotate.animation';

export interface TreeNodeOptions {
  key: string;
  title: string;
  icon?: string;
  isLeaf?: boolean;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  indeterminate?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  disableCheckbox?: boolean;
  children?: TreeNodeOptions[];
  [key: string]: any;
}

@Component({
  selector: 'lib-tree',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf
  ],
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    expandCollapse,
    rotate(90)
  ]
})
export class TreeComponent implements OnInit, OnChanges {
  @Input() treeData: TreeNodeOptions[] = [];
  @Input() showIcon = false;
  @Input() showLine = false;
  @Input() checkable = false;
  @Input() multiple = false;
  @Input() draggable = false;
  @Input() defaultExpandAll = false;
  @Input() searchValue = '';
  @Input() asyncData = false;
  @Input() indent = 24;
  @Input() optionHeight = 24;
  @Input() isVirtualScroll = false;
  @Input() expandedIcon: TemplateRef<{ $implicit: TreeNodeOptions, origin: any }> | null = null;
  @Input() virtualHeight: number = 300;
  @Input() virtualItemSize: number = 24;
  @Input() virtualMinBuffer: number = 10;
  @Input() virtualMaxBuffer: number = 10;
  @Input() defaultSelectedKeys: string[] = [];
  @Input() defaultCheckedKeys: string[] = [];
  @Input() defaultExpandedKeys: string[] = [];

  @Output() checkBoxChange = new EventEmitter<{ checked: boolean, node: TreeNodeOptions }>();
  @Output() expandChange = new EventEmitter<{ expanded: boolean, node: TreeNodeOptions }>();
  @Output() selectedChange = new EventEmitter<{ selected: boolean, node: TreeNodeOptions }>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() loadData = new EventEmitter<TreeNodeOptions>();

  @ContentChild('treeTemplate') treeTemplate?: TemplateRef<{ $implicit: TreeNodeOptions, origin: any, node: TreeNodeOptions }>;
  @ContentChild('iconTemplate') iconTemplate?: TemplateRef<{ $implicit: TreeNodeOptions, origin: any }>;

  @ViewChild('treeContainer') treeContainer!: ElementRef;

  flattenNodes: Map<string, TreeNodeOptions> = new Map();
  expandedKeys: Set<string> = new Set();
  selectedKeys: Set<string> = new Set();
  checkedKeys: Set<string> = new Set();
  indeterminateKeys: Set<string> = new Set();
  searchResults: TreeNodeOptions[] = [];
  
  // 用于跟踪正在动画中的节点
  animatingNodes: Map<string, boolean> = new Map();

  // 新增：存储应该显示的节点（不管是否展开）
  visibleNodes: Set<string> = new Set();

  // 这个集合跟踪哪些节点应该在DOM中（展开的或正在执行收起动画的）
  nodeRenderMap: Set<string> = new Set();

  constructor(private cdr: ChangeDetectorRef) {}

  // 生成缩进数组
  getIndentArray(level: number): number[] {
    return Array(level).fill(0).map((_, i) => i);
  }

  ngOnInit(): void {
    this.initTreeState();
    this.flattenTree();
    // 初始化：将所有展开的节点添加到渲染集合
    this.expandedKeys.forEach(key => this.nodeRenderMap.add(key));
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['treeData']) {
      this.flattenTree();
    }
    if (changes['searchValue']) {
      this.handleSearch();
    }
    if (changes['defaultExpandAll']) {
      if (this.defaultExpandAll) {
        this.handleExpandAll();
      }
    }
    if (changes['defaultExpandedKeys']) {
      this.initDefaultExpandedKeys();
    }
    if (changes['defaultSelectedKeys']) {
      this.initDefaultSelectedKeys();
    }
    if (changes['defaultCheckedKeys']) {
      this.initDefaultCheckedKeys();
    }
  }

  initDefaultExpandedKeys(): void {
    this.defaultExpandedKeys.forEach(key => {
      const node = this.flattenNodes.get(key);
      if (node) {
        this.expandedKeys.add(key);
        node.expanded = true;
      }
    });
  }

  initDefaultSelectedKeys(): void {
    this.defaultSelectedKeys.forEach(key => {
      const node = this.flattenNodes.get(key);
      if (node && !node.disabled && node.selectable !== false) {
        this.selectedKeys.add(key);
        node.selected = true;
      }
    });
  }

  initDefaultCheckedKeys(): void {
    this.defaultCheckedKeys.forEach(key => {
      const node = this.flattenNodes.get(key);
      if (node && !node.disabled && !node.disableCheckbox) {
        this.checkedKeys.add(key);
        node.checked = true;
        this.updateParentCheckState(node);
      }
    });
  }

  private initTreeState(): void {
    if (this.defaultExpandAll) {
      this.handleExpandAll();
    } else if (this.defaultExpandedKeys.length) {
      this.initDefaultExpandedKeys();
    }
    this.initDefaultSelectedKeys();
    this.initDefaultCheckedKeys();
    this.cdr.detectChanges();
  }

  private flattenTree(): void {
    this.flattenNodes = new Map();
    this.flattenTreeNodes(this.treeData);
    this.cdr.detectChanges();
  }

  private flattenTreeNodes(nodes: TreeNodeOptions[] = [], parent?: TreeNodeOptions): void {
    nodes.forEach(node => {
      this.flattenNodes.set(node.key, node);
      if (node.expanded) {
        this.expandedKeys.add(node.key);
      }
      if (node.selected) {
        this.selectedKeys.add(node.key);
      }
      if (node.checked) {
        this.checkedKeys.add(node.key);
      }
      if (node.indeterminate) {
        this.indeterminateKeys.add(node.key);
      }
      if (node.children && node.children.length) {
        this.flattenTreeNodes(node.children, node);
      } else {
        node.isLeaf = true;
      }
    });
  }

  handleExpandAll(): void {
    this.expandedKeys = new Set();
    this.traverseNodesForExpandAll(this.treeData);
    this.cdr.detectChanges();
  }

  private traverseNodesForExpandAll(nodes: TreeNodeOptions[]): void {
    nodes.forEach(node => {
      if (!node.isLeaf && node.children && node.children.length) {
        this.expandedKeys.add(node.key);
        node.expanded = true;
        this.traverseNodesForExpandAll(node.children);
      }
    });
  }

  onNodeExpand(node: TreeNodeOptions): void {
    if (this.asyncData && (!node.children || node.children.length === 0) && !node.isLeaf) {
      this.loadData.emit(node);
      return;
    }
    
    if (node.expanded) {
      // 收起：先更新状态，保持DOM渲染直到动画结束
      node.expanded = false;
      this.expandedKeys.delete(node.key);
      // nodeRenderMap保持不变，等动画结束后再移除
    } else {
      // 展开：先添加到渲染集合，再立即更新状态
      this.nodeRenderMap.add(node.key);
      this.expandedKeys.add(node.key);
      node.expanded = true;
    }
    
    this.cdr.detectChanges();
    this.expandChange.emit({ expanded: node.expanded, node });
  }

  // 处理动画事件
  onAnimationStart(event: AnimationEvent, node: TreeNodeOptions): void {
    if (event.fromState === 'void' && event.toState === '*') {
      // 展开动画开始
      this.visibleNodes.add(node.key);
    }
  }

  onAnimationDone(event: AnimationEvent, node: TreeNodeOptions): void {
    // 仅当收起动画完成时，从渲染集合中移除
    if (event.toState === 'collapsed' && !node.expanded) {
      this.nodeRenderMap.delete(node.key);
      this.cdr.detectChanges();
    }
  }

  onNodeSelect(node: TreeNodeOptions, event: MouseEvent): void {
    if (node.disabled || node.selectable === false) {
      return;
    }

    if (!this.multiple) {
      this.treeData.forEach(n => this.clearNodeSelected(n));
    }
    if (this.selectedKeys.has(node.key)) {
      this.selectedKeys.delete(node.key)
      node.selected = false;
    } else {
      !this.multiple && this.selectedKeys.clear();
      this.selectedKeys.add(node.key);
      node.selected = true;
    }
    this.cdr.detectChanges();
    this.selectedChange.emit({ selected: node.selected, node });
  }

  private clearNodeSelected(node: TreeNodeOptions): void {
    if (node.selected) {
      node.selected = false;
    }
    if (node.children && node.children.length) {
      node.children.forEach(child => this.clearNodeSelected(child));
    }
  }

  onNodeCheck(node: TreeNodeOptions, checked: boolean): void {
    if (node.disabled || node.disableCheckbox) {
      return;
    }

    node.checked = checked;
    node.indeterminate = false;

    if (checked) {
      this.checkedKeys.add(node.key);
      this.indeterminateKeys.delete(node.key);
    } else {
      this.checkedKeys.delete(node.key);
      this.indeterminateKeys.delete(node.key);
    }

    this.updateChildrenCheckState(node, checked);
    this.updateParentCheckState(node);
    this.cdr.detectChanges();
    this.checkBoxChange.emit({ checked, node });
  }

  private updateChildrenCheckState(node: TreeNodeOptions, checked: boolean): void {
    if (node.children) {
      node.children.forEach(child => {
        if (!child.disabled && !child.disableCheckbox) {
          child.checked = checked;
          child.indeterminate = false;

          if (checked) {
            this.checkedKeys.add(child.key);
            this.indeterminateKeys.delete(child.key);
          } else {
            this.checkedKeys.delete(child.key);
            this.indeterminateKeys.delete(child.key);
          }

          this.updateChildrenCheckState(child, checked);
        }
      });
    }
  }

  private updateParentCheckState(node: TreeNodeOptions): void {
    const findParent = (nodes: TreeNodeOptions[], targetKey: string): TreeNodeOptions | null => {
      for (const current of nodes) {
        if (current.children) {
          const isParent = current.children.some(child => child.key === targetKey);
          if (isParent) {
            return current;
          }
          const found = findParent(current.children, targetKey);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };

    const parent = findParent(this.treeData, node.key);
    if (parent && parent.children) {
      const totalEnabledChildren = parent.children.filter(
        child => !child.disabled && !child.disableCheckbox
      ).length;

      const checkedChildren = parent.children.filter(
        child => child.checked && !child.disabled && !child.disableCheckbox
      ).length;

      const indeterminateChildren = parent.children.filter(
        child => child.indeterminate && !child.disabled && !child.disableCheckbox
      ).length;

      if (checkedChildren === 0 && indeterminateChildren === 0) {
        if (!parent.disabled && !parent.disableCheckbox) {
          parent.checked = false;
          parent.indeterminate = false;
          this.checkedKeys.delete(parent.key);
          this.indeterminateKeys.delete(parent.key);
        }
      } else if (checkedChildren === totalEnabledChildren) {
        if (!parent.disabled && !parent.disableCheckbox) {
          parent.checked = true;
          parent.indeterminate = false;
          this.checkedKeys.add(parent.key);
          this.indeterminateKeys.delete(parent.key);
        }
      } else {
        if (!parent.disabled && !parent.disableCheckbox) {
          parent.checked = false;
          parent.indeterminate = true;
          this.checkedKeys.delete(parent.key);
          this.indeterminateKeys.add(parent.key);
        }
      }

      this.updateParentCheckState(parent);
    }
  }

  handleSearch(): void {
    if (!this.searchValue) {
      this.searchResults = [];
      return;
    }

    this.searchResults = this.searchTreeNodes(this.treeData, this.searchValue.toLowerCase());
    if (this.searchResults.length > 0) {
      this.expandSearchResults();
    }
    this.cdr.detectChanges();
  }

  private searchTreeNodes(nodes: TreeNodeOptions[], searchValue: string): TreeNodeOptions[] {
    const results: TreeNodeOptions[] = [];

    nodes.forEach(node => {
      const nodeTitleLower = node.title.toLowerCase();

      if (nodeTitleLower.includes(searchValue)) {
        results.push(node);
      }

      if (node.children && node.children.length) {
        const childResults = this.searchTreeNodes(node.children, searchValue);
        if (childResults.length > 0) {
          results.push(...childResults);
        }
      }
    });
    return results;
  }

  private expandSearchResults(): void {
    this.searchResults.forEach(node => {
      this.expandNodeParents(node);
    });
    this.cdr.detectChanges();
  }

  private expandNodeParents(node: TreeNodeOptions): void {
    const findNodePath = (nodes: TreeNodeOptions[], targetKey: string, path: TreeNodeOptions[] = []): TreeNodeOptions[] => {
      for (const current of nodes) {
        const currentPath = [...path, current];
        if (current.key === targetKey) {
          return currentPath;
        }
        if (current.children) {
          const found = findNodePath(current.children, targetKey, currentPath);
          if (found.length) {
            return found;
          }
        }
      }
      return [];
    };

    const nodePath = findNodePath(this.treeData, node.key);
    nodePath.forEach(pathNode => {
      if (!pathNode.isLeaf && pathNode.children && pathNode.children.length) {
        this.expandedKeys.add(pathNode.key);
        pathNode.expanded = true;
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue = value;
    this.searchChange.emit(value);
    this.handleSearch();
    this.cdr.detectChanges();
  }

  showEmptyState(): boolean {
    return this.searchValue !== undefined && 
           this.searchValue !== '' && 
           this.searchResults.length === 0;
  }

  isNodeVisible(node: TreeNodeOptions): boolean {
    return this.visibleNodes.has(node.key) || this.expandedKeys.has(node.key);
  }

  /**
   * 判断是否显示虚线
   * @param node 节点
   * @param index 当前缩进的索引
   * @returns 
   */
  public hasFlatLine(node: TreeNodeOptions, index: number): boolean {
    const parents = this.getParentNodes(node);
    // 如果没有父节点，或者index大于父节点数量，则显示连接线
    if (!parents.length || index >= parents.length) {
      return true;
    }
    // 从当前层级往上遍历每一层
    for (let i = parents.length - 1; i >= 0; i--) {
      const parent = parents[i];
      // 如果当前检查的缩进层级对应的父节点
      if (parents.length - 1 - i === index) {
        // 检查该父节点是否为其父节点的最后一个子节点
        const parentOfParent = i > 0 ? parents[i - 1] : null;
        if (parentOfParent && parentOfParent.children) {
          // 如果是最后一个子节点，则不显示连接线
          if (parentOfParent.children[parentOfParent.children.length - 1].key === parent.key) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // 获取节点的所有父节点
  private getParentNodes(node: TreeNodeOptions): TreeNodeOptions[] {
    const parents: TreeNodeOptions[] = [];
    const findParents = (nodes: TreeNodeOptions[], targetKey: string): boolean => {
      for (const current of nodes) {
        if (current.key === targetKey) {
          return true;
        }
        if (current.children) {
          if (findParents(current.children, targetKey)) {
            parents.unshift(current);
            return true;
          }
        }
      }
      return false;
    };
    findParents(this.treeData, node.key);
    return parents;
  }

  // 添加判断是否应该渲染子节点的方法
  shouldRenderChildren(node: TreeNodeOptions): any {
    // 如果节点在动画中或者已展开，则渲染子节点
    return this.animatingNodes.get(node.key) === true || node.expanded;
  }

  // 获取节点的动画状态 
  getNodeState(node: TreeNodeOptions): string {
    return node.expanded ? 'expanded' : 'collapsed';
  }
}
