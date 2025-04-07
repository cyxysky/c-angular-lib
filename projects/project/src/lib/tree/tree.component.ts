import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild, forwardRef, ElementRef, ViewChild, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { trigger, state, style, transition, animate, AnimationEvent } from '@angular/animations';
import { expandCollapse } from '../animation/expandCollapse.animation';
import { rotate } from '../animation/rotate.animation';
import { UtilsService } from '../service/utils.service';
import { CheckboxComponent } from '../checkbox/checkbox.component';
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
  changeChildren?: (children: TreeNodeOptions[]) => void;
  asyncLoading?: boolean;
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
    CdkVirtualForOf,
    CheckboxComponent
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
  //#region 输入属性 (Inputs)
  /** 树数据 */
  @Input({ alias: 'treeData' }) treeData: TreeNodeOptions[] = [];
  /** 是否显示图标 */
  @Input({ alias: 'treeShowIcon', transform: booleanAttribute }) showIcon = false;
  /** 是否显示连接线 */
  @Input({ alias: 'treeShowLine', transform: booleanAttribute }) showLine = false;
  /** 是否可勾选 */
  @Input({ alias: 'treeCheckable', transform: booleanAttribute }) checkable = false;
  /** 是否多选 */
  @Input({ alias: 'treeMultiple', transform: booleanAttribute }) multiple = false;
  /** 是否可拖拽 */
  @Input({ alias: 'treeDraggable', transform: booleanAttribute }) draggable = false;
  /** 是否默认展开所有节点 */
  @Input({ alias: 'treeDefaultExpandAll', transform: booleanAttribute }) defaultExpandAll = false;
  /** 搜索值 */
  @Input({ alias: 'treeSearchValue' }) searchValue = '';
  /** 是否异步加载数据 */
  @Input({ alias: 'treeAsyncData', transform: booleanAttribute }) asyncData = false;
  /** 缩进 */
  @Input({ alias: 'treeIndent' }) indent = 24;
  /** 选项高度 */
  @Input({ alias: 'treeOptionHeight' }) optionHeight = 24;
  /** 是否虚拟滚动 */
  @Input({ alias: 'treeIsVirtualScroll', transform: booleanAttribute }) isVirtualScroll = false;
  /** 展开图标 */
  @Input({ alias: 'treeExpandedIcon' }) expandedIcon: TemplateRef<{ $implicit: TreeNodeOptions, origin: any }> | null = null;
  /** 虚拟滚动高度 */
  @Input({ alias: 'treeVirtualHeight' }) virtualHeight: number = 300;
  /** 虚拟滚动项高度 */
  @Input({ alias: 'treeVirtualItemSize' }) virtualItemSize: number = 24;
  /** 虚拟滚动最小缓冲区 */
  @Input({ alias: 'treeVirtualMinBuffer' }) virtualMinBuffer: number = 300;
  /** 虚拟滚动最大缓冲区 */
  @Input({ alias: 'treeVirtualMaxBuffer' }) virtualMaxBuffer: number = 600;
  /** 默认选中的节点 */
  @Input({ alias: 'treeDefaultSelectedKeys' }) defaultSelectedKeys: string[] = [];
  /** 默认选中的节点 */
  @Input({ alias: 'treeDefaultCheckedKeys' }) defaultCheckedKeys: string[] = [];
  /** 默认展开的节点 */
  @Input({ alias: 'treeDefaultExpandedKeys' }) defaultExpandedKeys: string[] = [];
  /** 节点模板 */
  @Input({ alias: 'treeTemplate' }) treeTemplate: TemplateRef<{ $implicit: TreeNodeOptions, isLast: boolean, level: number }> | null = null;
  /** 是否展示动画 */
  @Input() showAnimation: boolean = true;
  //#endregion

  //#region 输出事件 (Outputs)
  /** 勾选事件 */
  @Output() checkBoxChange = new EventEmitter<{ checked: boolean, node: TreeNodeOptions }>();
  /** 展开事件 */
  @Output() expandChange = new EventEmitter<{ expanded: boolean, node: TreeNodeOptions }>();
  /** 选中事件 */
  @Output() selectedChange = new EventEmitter<{ selected: boolean, node: TreeNodeOptions }>();
  /** 搜索事件 */
  @Output() searchChange = new EventEmitter<string>();
  /** 加载数据事件 */
  @Output() loadData = new EventEmitter<TreeNodeOptions>();
  //#endregion

  //#region 内部状态变量
  @ContentChild('iconTemplate') iconTemplate?: TemplateRef<{ $implicit: TreeNodeOptions, origin: any }>;
  @ViewChild('treeContainer') treeContainer!: ElementRef;

  flattenNodes: Map<string, TreeNodeOptions> = new Map();
  expandedKeys: Set<string> = new Set();
  selectedKeys: Set<string> = new Set();
  checkedKeys: Set<string> = new Set();
  indeterminateKeys: Set<string> = new Set();
  searchResults: TreeNodeOptions[] = [];
  flattenVirtualNodes: Array<any> = [];
  virtualFlattenNodesParentMap: Map<string, string> = new Map();
  flattenNodesParentMap: Map<string, string> = new Map();
  initData: boolean = false;
  searching: boolean = false;
  constructor(
    private cdr: ChangeDetectorRef,
    private utilsService: UtilsService
  ) { }
  // 生成缩进数组
  getIndentArray(level: number): number[] {
    return Array(level).fill(0).map((_, i) => i);
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchValue'] && !changes['searchValue'].firstChange) {
      this.searching = true;
      this.handleSearch();
      this.searching = false;
    }
    this.initData = true;
    if (changes['treeData']) {
      this.flattenTree();
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
    this.cdr.detectChanges();
    this.initData = false;
  }

  /**
   * 初始化默认展开的节点
   */
  initDefaultExpandedKeys(): void {
    this.expendByNodes(this.defaultExpandedKeys, true, true);
  }

  /**
   * 初始化默认选中的节点
   */
  initDefaultSelectedKeys(): void {
    this.defaultSelectedKeys.forEach(key => {
      const node = this.flattenNodes.get(key);
      if (node && !node.disabled && node.selectable !== false) {
        this.selectedKeys.add(key);
        node.selected = true;
      }
    });
    this.expendByNodes(this.defaultSelectedKeys, false, false);
  }

  /**
   * 初始化checkbox默认选中的节点
   */
  initDefaultCheckedKeys(): void {
    // 先处理所有直接被指定要选中的节点
    this.defaultCheckedKeys.forEach(key => {
      const node = this.flattenNodes.get(key);
      if (node && !node.disabled && !node.disableCheckbox) {
        this.checkedKeys.add(key);
        node.checked = true;
      }
    });

    // 第二次遍历，确保父子节点状态一致
    this.defaultCheckedKeys.forEach(key => {
      const node = this.flattenNodes.get(key);
      if (node && !node.disabled && !node.disableCheckbox) {
        // 处理其子节点
        this.updateChildrenCheckState(node, true);
        // 更新父节点状态
        this.updateParentCheckState(node);
      }
    });
  }

  /**
   * 扁平化树节点
   */
  private flattenTree(): void {
    this.flattenNodes = new Map();
    this.flattenVirtualNodes = [];
    this.flattenTreeNodes(this.treeData, 0);
    this.cdr.detectChanges();
  }

  /**
   * 扁平化树节点
   * @param nodes 节点
   * @param level 层级
   * @param parent 父节点
   */
  private flattenTreeNodes(nodes: TreeNodeOptions[] = [], level: number, parent?: TreeNodeOptions): void {
    nodes.forEach((node, index) => {
      if (this.isVirtualScroll) {
        this.flattenVirtualNodes.push({
          node,
          isLast: index === nodes.length - 1,
          level
        });
        if (parent) {
          this.virtualFlattenNodesParentMap.set(node.key, parent.key);
        }
      }
      // 将多个条件判断合并成一个循环
      this.flattenNodes.set(node.key, node);
      node.expanded && this.expandedKeys.add(node.key);
      node.selected && this.selectedKeys.add(node.key);
      node.checked && this.checkedKeys.add(node.key);
      node.indeterminate && this.indeterminateKeys.add(node.key);
      parent && this.flattenNodesParentMap.set(node.key, parent.key);
      // 简化子节点处理逻辑
      if (node.children?.length) {
        this.flattenTreeNodes(node.children, level + 1, node);
      } else {
        !this.asyncData && (node.isLeaf = true);
      }
    });
  }

  /**
   * 展开所有节点
   */
  handleExpandAll(): void {
    this.expandedKeys = new Set();
    this.traverseNodesForExpandAll(this.treeData);
    this.cdr.detectChanges();
  }

  /**
   * 遍历所有节点，将所有节点展开
   * @param nodes 
   */
  private traverseNodesForExpandAll(nodes: TreeNodeOptions[]): void {
    nodes.forEach(node => {
      if (!node.isLeaf && node.children && node.children.length) {
        this.expandedKeys.add(node.key);
        node.expanded = true;
        this.traverseNodesForExpandAll(node.children);
      }
    });
  }

  /**
   * 节点展开事件
   * @param node 节点
   */
  onNodeExpand(node: TreeNodeOptions): void {
    if (this.asyncData && (!node.children || node.children.length === 0) && !node.isLeaf) {
      node.changeChildren = (children: TreeNodeOptions[]) => {
        node.children = children;
        node.asyncLoading = false;
        this.cdr.detectChanges();
      };
      this.loadData.emit(node);
      node.asyncLoading = true;
      this.cdr.detectChanges();
    }

    if (node.expanded) {
      // 收起：先更新状态，保持DOM渲染直到动画结束
      node.expanded = false;
      this.expandedKeys.delete(node.key);
      // nodeRenderMap保持不变，等动画结束后再移除
    } else {
      // 展开：先添加到渲染集合，再立即更新状态
      this.expandedKeys.add(node.key);
      node.expanded = true;
    }
    this.cdr.detectChanges();
    this.expandChange.emit({ expanded: node.expanded, node });
  }

  /**
   * 节点动画结束事件
   * @param event 事件
   * @param node 节点
   */
  onAnimationDone(event: AnimationEvent, node: TreeNodeOptions): void {
    // 仅当收起动画完成时，从渲染集合中移除
    if (event.toState === 'collapsed' && !node.expanded) {
      this.expandedKeys.delete(node.key);
      this.cdr.detectChanges();
    }
  }

  /**
   * 节点点击选中事件
   * @param node 节点
   * @param event 事件
   */
  onNodeSelect(node: TreeNodeOptions, event: MouseEvent): void {
    if (node.disabled || node.selectable === false) return;
    if (this.checkable) {
      this.onNodeCheck(node, !node.checked);
      return;
    }
    !this.multiple && this.utilsService.traverseAllNodes(this.treeData, (node: TreeNodeOptions) => {
      node.selected && (node.selected = false);
    });
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

  /**
   * 节点checkbox点击事件
   * @param node 节点
   * @param checked 是否选中
   */
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

  /**
   * 更新子节点的checkbox状态
   * @param node 
   * @param checked 
   */
  public updateChildrenCheckState(node: TreeNodeOptions, checked: boolean): void {
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

  /**
   * 更新父节点的checkbox状态
   * @param node 
   */
  public updateParentCheckState(node: TreeNodeOptions): void {
    let parentKey = this.isVirtualScroll ? this.virtualFlattenNodesParentMap.get(node.key) : this.flattenNodesParentMap.get(node.key);
    if (!parentKey) return;
    const parent = this.flattenNodes.get(parentKey);
    if (!parent?.children) return;
    // 使用过滤器函数简化逻辑
    const isEnabledChild = (child: TreeNodeOptions) => !child.disabled && !child.disableCheckbox;
    const totalEnabledChildren = parent.children.filter(isEnabledChild).length;
    const checkedChildren = parent.children.filter(child => child.checked && isEnabledChild(child)).length;
    const indeterminateChildren = parent.children.filter(child => child.indeterminate && isEnabledChild(child)).length;
    // 父节点不可用时直接返回
    if (parent.disabled || parent.disableCheckbox) return;
    // 更新父节点状态
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

  /**
   * 处理搜索
   */
  handleSearch(): void {
    // 简化搜索逻辑
    if (!this.searchValue) {
      this.searchResults = [];
      this.resetExpandedState();
      this.cdr.detectChanges();
      return;
    }
    const searchTerm = this.searchValue.toLowerCase();
    this.searchResults = this.searchTreeNodes(this.treeData, searchTerm);
    this.resetExpandedStateNoCdr();
    // 只在有结果时执行展开操作
    this.searchResults.length > 0 && this.expandSearchResults();
    this.cdr.detectChanges();
  }


  /**
   * 重置树的展开状态到初始状态
   */
  public resetExpandedStateNoCdr(): void {
    // 清空当前展开的所有节点
    this.expandedKeys.clear();
    this.utilsService.traverseAllNodes(this.treeData, (node: any) => {
      node.expanded = false;
    });
  }


  /**
   * 展开节点父级
   * @param nodes 节点
   */
  private expendByNodes(keys: string[], resetExpanded: boolean = true, expandSelf: boolean = true): void {
    if (resetExpanded) {
      this.resetExpandedState();
      this.cdr.detectChanges();
    }
    keys.forEach(key => {
      if (this.expandedKeys.has(key)) return;
      const node = this.flattenNodes.get(key);
      if (node) {
        this.expandNodeParents(node, expandSelf);
      }
    });
  }

  /**
   * 搜索树节点
   * @param nodes 节点
   * @param searchValue 搜索值
   * @returns 搜索结果
   */
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

  /**
   * 展开搜索结果
   */
  private expandSearchResults(): void {
    this.searchResults.forEach(node => {
      this.expandNodeParents(node, false);
    });
    this.cdr.detectChanges();
  }

  /**
   * 展开节点父级
   * @param node 节点
   * @param expandSelf 是否展开自身
   */
  private expandNodeParents(node: TreeNodeOptions, expandSelf: boolean = true): void {
    const parentNodes = this.getParentNodes(node);
    parentNodes.forEach(pathNode => {
      if (!pathNode.isLeaf && pathNode.children && pathNode.children.length) {
        this.expandedKeys.add(pathNode.key);
        pathNode.expanded = true;
      }
    });
    if (expandSelf && !node.isLeaf && node.children && node.children.length) {
      this.expandedKeys.add(node.key);
      node.expanded = true;
    }
  }

  /**
   * 判断是否显示空状态
   * @returns 
   */
  showEmptyState(): boolean {
    return this.searchValue !== undefined &&
      this.searchValue !== '' &&
      this.searchResults.length === 0 &&
      !this.searching;
  }

  /**
   * 判断是否显示垂直线段
   * @param node 节点
   * @param index 当前缩进的索引
   * @returns 
   */
  public hasVerticalLine(node: TreeNodeOptions, index: number): boolean {
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

  /**
   * 获取节点的所有父节点
   * @param node 节点
   * @returns 父节点
   */
  private getParentNodes(node: TreeNodeOptions): TreeNodeOptions[] {
    const parentsKey: string[] = [];
    const findParents = (targetKey: string): void => {
      let parentNode = this.isVirtualScroll ? this.virtualFlattenNodesParentMap.get(targetKey) : this.flattenNodesParentMap.get(targetKey);
      if (parentNode) {
        parentsKey.unshift(parentNode);
        findParents(parentNode);
      }
    };
    findParents(node.key);
    let parents: TreeNodeOptions[] = [];
    parentsKey.forEach(key => {
      const parent = this.flattenNodes.get(key);
      if (parent) {
        parents.push(parent);
      }
    });
    return parents;
  }

  /**
   * for索引
   * @param index 索引
   * @param node 节点
   * @returns 索引
   */
  trackBy(index: number, node: any): number {
    return index;
  }

  /**
   * 获取可见的虚拟节点，用于虚拟滚动
   * @returns 可见的虚拟节点
   */
  getVisibleVirtualNodes(): Array<any> {
    return !this.flattenVirtualNodes?.length ? [] : this.flattenVirtualNodes.filter(item => item.node && this.isNodeVisible(item.node.key));
  }

  /**
   * 判断节点是否应该在当前视图中可见
   * @param nodeKey 节点key
   * @returns 是否可见
   */
  isNodeVisible(nodeKey: string): boolean {
    if (!this.virtualFlattenNodesParentMap.has(nodeKey)) return true;

    let currentKey = nodeKey;
    while (this.virtualFlattenNodesParentMap.has(currentKey)) {
      const parentKey = this.virtualFlattenNodesParentMap.get(currentKey)!;
      if (!this.expandedKeys.has(parentKey)) return false;
      currentKey = parentKey;
    }
    return true;
  }

  // 对外暴露的方法
  /**
   * 获取展开的节点
   * @returns 展开的节点
   */
  public getExpandedKeys(): Set<string> {
    return this.expandedKeys;
  }

  /**
   * 获取选中的节点
   * @returns 选中的节点
   */
  public getSelectedKeys(): Set<string> {
    return this.selectedKeys;
  }

  /**
   * 获取勾选的节点
   * @returns 勾选的节点
   */
  public getCheckedKeys(): Set<string> {
    return this.checkedKeys;
  }

  /**
   * 获取搜索结果
   * @returns 搜索结果
   */
  public getSearchResults(): TreeNodeOptions[] {
    return this.searchResults;
  }

  /**
   * 获取扁平化节点
   * @returns 扁平化节点
   */
  public getFlattenNodes(): Map<string, TreeNodeOptions> {
    return this.flattenNodes;
  }

  /**
   * 展开节点
   * @param keys 节点key
   */
  public expendNodeByKeys(keys: string[], resetExpanded: boolean = true, expandSelf: boolean = true): void {
    this.expendByNodes(keys, resetExpanded, expandSelf);
    this.cdr.detectChanges();
  }

  /**
   * 重置树的展开状态到初始状态
   */
  public resetExpandedState(): void {
    // 清空当前展开的所有节点
    this.expandedKeys.clear();
    this.utilsService.traverseAllNodes(this.treeData, (node: any) => {
      node.expanded = false;
    });
    this.cdr.detectChanges();
  }


}
