import { CommonModule } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output, Renderer2, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdkOverlayOrigin, ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { SelectSearchComponent } from '../select-basic/select-search/select-search.component';
import { SelectTagComponent } from '../select-basic/select-tag/select-tag.component';
import { OverlayService } from '../service/overlay.service';
import { UtilsService } from '../service/utils.service';
import { TreeComponent, TreeNodeOptions } from '../tree/tree.component';

export type TreeSelectSize = 'large' | 'default' | 'small';
export type TreeSelectTriggerType = 'click' | 'hover';

@Component({
  selector: 'lib-tree-select',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkOverlayOrigin, TreeComponent, SelectSearchComponent, SelectTagComponent],
  templateUrl: './tree-select.component.html',
  styleUrls: ['./tree-select.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TreeSelectComponent),
      multi: true
    }
  ]
})
export class TreeSelectComponent implements OnInit, OnDestroy, ControlValueAccessor {
  // 视图引用
  @ViewChild(CdkOverlayOrigin, { static: false }) overlayOrigin!: CdkOverlayOrigin;
  @ViewChild('dropdownTemplate', { static: false }) dropdownTemplate!: TemplateRef<any>;
  @ViewChild('searchInput', { static: false }) searchInput!: SelectSearchComponent;
  @ViewChild(TreeComponent, { static: false }) treeComponent!: TreeComponent;

  // 输入属性
  /** 树节点数据 */
  @Input({ alias: 'treeData' }) treeData: TreeNodeOptions[] = [];
  /** 是否显示搜索框 */
  @Input({ alias: 'showSearch', transform: booleanAttribute }) showSearch: boolean = true;
  /** 是否禁用 */
  @Input({ alias: 'disabled', transform: booleanAttribute }) disabled: boolean = false;
  /** 占位文本 */
  @Input({ alias: 'placeholder' }) placeholder: string = '请选择';
  /** 是否允许清空 */
  @Input({ alias: 'allowClear', transform: booleanAttribute }) allowClear: boolean = true;
  /** 是否多选 */
  @Input({ alias: 'multiple', transform: booleanAttribute }) multiple: boolean = false;
  /** 尺寸 */
  @Input({ alias: 'size' }) size: TreeSelectSize = 'default';
  /** 是否无边框 */
  @Input({ alias: 'borderless', transform: booleanAttribute }) borderless: boolean = false;
  /** 状态 */
  @Input({ alias: 'status' }) status: 'error' | 'warning' | null = null;
  /** 下拉菜单的宽度 */
  @Input({ alias: 'dropdownWidth' }) dropdownWidth: string = '100%';
  /** 下拉菜单的高度 */
  @Input({ alias: 'dropdownHeight' }) dropdownHeight: number = 400;
  /** 自定义选项模板 */
  @Input({ alias: 'treeNodeTemplate' }) treeNodeTemplate: TemplateRef<any> | null = null;
  /** 自定义选项标签模板 */
  @Input({ alias: 'labelTemplate' }) labelTemplate: TemplateRef<any> | null = null;
  /** 是否可勾选 */
  @Input({ alias: 'treeCheckable', transform: booleanAttribute }) treeCheckable: boolean = false;
  /** 是否显示搜索结果父级 */
  @Input({ alias: 'showSearchParent', transform: booleanAttribute }) showSearchParent: boolean = false;
  /** 是否显示树线条 */
  @Input({ alias: 'treeShowLine', transform: booleanAttribute }) treeShowLine: boolean = false;
  /** 是否显示树图标 */
  @Input({ alias: 'treeShowIcon', transform: booleanAttribute }) treeShowIcon: boolean = false;
  /** 是否异步加载 */
  @Input({ alias: 'treeAsyncData', transform: booleanAttribute }) treeAsyncData: boolean = false;
  /** 触发方式 */
  @Input({ alias: 'actionTrigger' }) actionTrigger: TreeSelectTriggerType = 'click';
  /** 是否加载中 */
  @Input({ alias: 'loading', transform: booleanAttribute }) loading: boolean = false;
  /** 选项过滤函数 */
  @Input({ alias: 'filterTreeNode' }) filterTreeNode?: (inputValue: string, treeNode: TreeNodeOptions) => boolean;
  /** 自定义展开图标 */
  @Input({ alias: 'treeExpandedIcon' }) expandedIcon: TemplateRef<any> | null = null;
  /** 是否虚拟滚动 */
  @Input({ alias: 'treeVirtualScroll', transform: booleanAttribute }) treeVirtualScroll: boolean = false;
  /** 状态过滤 */
  @Input({ alias: 'filterState' }) filterState: 'error' | 'warning' | null = null;
  /** 默认展开的节点 */
  @Input({ alias: 'defaultExpandedKeys' }) defaultExpandedKeys: string[] = [];

  @Input() treeOptionHeight: number = 36;
  @Input() treeIndent: number = 24;

  // 输出事件
  /** 值变化事件 */
  @Output() valueChange = new EventEmitter<string[] | string>();
  /** 选中节点变化事件 */
  @Output() treeSelectChange = new EventEmitter<TreeNodeOptions[]>();
  @Output() selectionChange = new EventEmitter<TreeNodeOptions[]>();
  /** 可见性变化事件 */
  @Output() openChange = new EventEmitter<boolean>();
  @Output() visibleChange = new EventEmitter<boolean>();
  /** 加载数据事件 */
  @Output() loadData = new EventEmitter<TreeNodeOptions>();
  /** 复选框变化事件 */
  @Output() checkBoxChange = new EventEmitter<{ checked: boolean, node: TreeNodeOptions }>();
  /** 状态过滤变化事件 */
  @Output() stateFilterChange = new EventEmitter<'error' | 'warning' | null>();

  // 内部状态
  /** 选中值 */
  value: string | string[] = '';
  /** key到节点的映射 */
  public nodeMap: Map<string, TreeNodeOptions> = new Map();
  /** 浮层引用 */
  overlayRef: OverlayRef | null = null;
  /** 下拉状态 */
  isDropdownOpen: boolean = false;
  /** 搜索关键字 */
  searchValue: string = '';
  /** 中文输入法 */
  compositionValue: string = '';
  /** 多选模式下显示的标签 */
  displayTags: { label: string, value: string, node: TreeNodeOptions }[] = [];
  /** 鼠标悬停关闭定时器 */
  private hoverCloseTimer: any = null;
  /** 目前浮层是否打开 */
  public isNowDropdownOpen: boolean = false;
  /** 父节点集合 */
  private parentNodeKeys: Set<string> = new Set();
  /** 是否已初始化 */
  private isInitialized: boolean = false;
  /** 树组件是否已准备好 */
  private isTreeReady: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private overlayService: OverlayService,
    private elementRef: ElementRef,
    public utilsService: UtilsService
  ) { }

  // 生命周期方法
  ngOnInit(): void {
    // 初始化节点映射
    this.initNodeMap();
  }

  ngAfterViewInit(): void {
    this.isTreeReady = !!this.treeComponent;
    if (this.isTreeReady && !this.isInitialized) {
      this.initNodeMap();
      this.initSelectedState();
      this.isInitialized = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['treeData']) {
      // 当树数据变化时，重新初始化节点映射
      this.initNodeMap();

      // 如果不是首次变更，还需要更新选中状态
      if (!changes['treeData'].firstChange) {
        setTimeout(() => {
          this.initSelectedState();
          if (this.value && this.isDropdownOpen && this.treeComponent) {
            this.expandSelectedPaths();
          }
        }, 100);
      }
    }
  }

  ngOnDestroy(): void {
    this.closeDropdown();
    if (this.hoverCloseTimer) {
      clearTimeout(this.hoverCloseTimer);
    }
  }

  // 初始化节点Map
  private initNodeMap(): void {
    // 创建一个空的Map作为初始值
    this.nodeMap = new Map<string, TreeNodeOptions>();

    // 递归处理节点数据
    const processNodes = (nodes: TreeNodeOptions[], parentKey?: string) => {
      nodes.forEach(node => {
        // 设置父节点引用
        if (parentKey) {
          node["parentKey"] = parentKey;
        }

        // 添加到Map中
        this.nodeMap.set(node.key, node);

        // 处理子节点
        if (node.children && node.children.length > 0) {
          processNodes(node.children, node.key);
        }
      });
    };

    // 初始处理所有节点
    processNodes(this.treeData);

    // 如果树组件已准备好，更新为树组件的扁平节点Map
    if (this.treeComponent) {
      const treeNodeMap = this.treeComponent.getFlattenNodes();
      if (treeNodeMap && treeNodeMap.size > 0) {
        this.nodeMap = treeNodeMap;
      }
    }
  }

  // 获取选中节点
  getSelectedNodes(): TreeNodeOptions[] {
    if (!this.value || (Array.isArray(this.value) && this.value.length === 0)) {
      return [];
    }
    const keys = Array.isArray(this.value) ? this.value : [this.value];
    return keys.map(key => this.nodeMap.get(key)).filter(Boolean) as TreeNodeOptions[];
  }

  openDropdown(): void {
    if (this.disabled || this.isDropdownOpen) return;
    this.isNowDropdownOpen = true;
    this.getExpandedKeys();
    this.openChange.emit(true);
    this.visibleChange.emit(true);
    this.cdr.detectChanges();

    const origin = this.overlayOrigin.elementRef.nativeElement;
    this.renderer.addClass(origin, 'tree-select-open');
    const positions: ConnectedPosition[] = [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetY: 4
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
        offsetY: -4
      }
    ];
    let positionStrategy = this.overlay.position().
      flexibleConnectedTo(origin).
      withPositions(positions).
      withPush(true).
      withGrowAfterOpen(true).
      withLockedPosition(false);

    this.overlayRef = this.overlayService.createOverlay({
      hasBackdrop: true,
      width: origin.getBoundingClientRect().width,
      backdropClass: 'transparent-backdrop',
      maxHeight: '80vh',
      disposeOnNavigation: true,
      positionStrategy: positionStrategy
    }, origin, positions,
      (ref, event) => {
        if (this.isDropdownOpen) {
          const target = event.target as HTMLElement;
          if (target.closest('[data-role="tag-close-button"]') || target.closest('.select-tag-close-icon')) {
            return;
          }
          this.closeDropdown();
        }
      },
      undefined);

    if (this.overlayRef) {
      this.overlayService.attachTemplate(this.overlayRef, this.dropdownTemplate, this.viewContainerRef);
      this.focusSearch();
      setTimeout(() => {
        if (this.treeComponent && this.value) {
          this.expandSelectedPaths();
        }
      }, 100);
    }
    this.isDropdownOpen = true;
  }

  private expandSelectedPaths(): void {
    if (!this.treeComponent || !this.value || (Array.isArray(this.value) && this.value.length === 0)) return;
    const keysToExpand = new Set<string>();
    const getParentKeys = (node: TreeNodeOptions): void => {
      if (!node || !node["parentKey"]) return;
      keysToExpand.add(node["parentKey"]);
      const parentNode = this.nodeMap.get(node["parentKey"]);
      if (parentNode) {
        getParentKeys(parentNode);
      }
    };

    const selectedKeys = Array.isArray(this.value) ? this.value : [this.value];
    selectedKeys.forEach(key => {
      const node = this.nodeMap.get(key);
      if (node) {
        getParentKeys(node);
      }
    });

    if (keysToExpand.size > 0) {
      this.treeComponent.expendNodeByKeys(Array.from(keysToExpand), false, false);
      this.cdr.detectChanges();
    }
  }

  closeDropdown(): void {
    if (!this.isDropdownOpen) return;
    this.getExpandedKeys();
    this.isDropdownOpen = false;
    this.isNowDropdownOpen = false;
    this.resetSearch();
    this.blurSearch();
    this.cdr.detectChanges();
    let timer = setTimeout(() => {
      this.openChange.emit(false);
      this.visibleChange.emit(false);
      const origin = this.overlayOrigin?.elementRef?.nativeElement;
      if (origin) {
        this.renderer.removeClass(origin, 'tree-select-open');
      }
      if (this.overlayRef) {
        this.overlayRef.detach();
        this.overlayRef.dispose();
        this.overlayRef = null;
      }
      this.cdr.detectChanges();
      clearTimeout(timer);
    }, 300)
  }

  public updateDropdownPosition(): void {
    if (!this.overlayRef) return;
    let timer = setTimeout(() => {
      if (this.overlayRef && this.isDropdownOpen) {
        this.overlayRef.updatePosition();
      }
      clearTimeout(timer);
    }, 0);
  }

  onNodeSelect(node: TreeNodeOptions): void {
    if (node.disabled) return;
    if (this.multiple) {
      this.handleMultipleSelect(node);
    } else {
      this.handleSingleSelect(node);
    }
    this.updateData();
  }

  private handleSingleSelect(node: TreeNodeOptions): void {
    // 如果有之前选中的节点，取消选中
    if (this.value) {
      const prevNode = this.nodeMap.get(this.value as string);
      if (prevNode) {
        prevNode.selected = false;
      }
    }
    node.selected = true;
    this.value = node.key;
    this.closeDropdown();
  }

  private handleMultipleSelect(node: TreeNodeOptions): void {
    if (this.treeCheckable) return;
    const valueArray = Array.isArray(this.value) ? this.value : [];
    const index = valueArray.indexOf(node.key);

    if (index !== -1) {
      node.selected = false;
      valueArray.splice(index, 1);
    } else {
      node.selected = true;
      valueArray.push(node.key);
    }
    this.value = valueArray;
    this.getMultipleTags(valueArray);
  }

  getMultipleTags(values: string[]) {
    if (!values) {
      this.displayTags = [];
    }
    let tags: any = [];
    values.forEach(key => {
      const node = this.nodeMap.get(key);
      if (node) {
        tags.push({
          label: node!.title,
          value: node!.key,
          node: node!
        })
      }
    })
    this.displayTags = tags;
    this.cdr.detectChanges();
  }

  onCheckBoxChange(event: { checked: boolean, node: TreeNodeOptions }): void {
    if (!this.multiple || !this.treeCheckable) return;
    this.checkBoxChange.emit(event);

    const checkedKeys = Array.from(this.treeComponent.getCheckedKeys());
    // 只在复选框状态下自动归并子级到父级
    if (this.treeCheckable) {
      const filteredKeys = this.filterChildNodesOfCheckedParents(checkedKeys);
      this.value = filteredKeys;
    } else {
      this.value = checkedKeys;
    }
    this.updateDisplayTags();
    this.updateData();
  }

  private filterChildNodesOfCheckedParents(checkedKeys: string[]): string[] {
    if (checkedKeys.length === 0) return [];

    // 首先找出所有父节点
    const parentNodes: TreeNodeOptions[] = [];
    checkedKeys.forEach(key => {
      const node = this.nodeMap.get(key);
      if (node && node.children && node.children.length > 0) {
        parentNodes.push(node);
      }
    });

    // 获取所有父节点的子节点key集合
    const childrenOfSelectedParents = new Set<string>();
    parentNodes.forEach(parent => {
      const getAllChildrenKeys = (node: TreeNodeOptions): void => {
        if (node.children && node.children.length) {
          node.children.forEach(child => {
            childrenOfSelectedParents.add(child.key);
            getAllChildrenKeys(child);
          });
        }
      };
      getAllChildrenKeys(parent);
    });

    // 只返回不是被选中父节点的子节点的节点key
    return checkedKeys.filter(key => !childrenOfSelectedParents.has(key));
  }

  private updateDisplayTags(): void {
    if (!this.multiple || !this.value || (Array.isArray(this.value) && this.value.length === 0)) {
      this.displayTags = [];
      return;
    }

    if (!this.treeComponent) {
      const selectedKeys = Array.isArray(this.value) ? this.value : [this.value];
      this.displayTags = selectedKeys
        .map(key => this.nodeMap.get(key))
        .filter(Boolean)
        .map(node => ({
          label: node!.title,
          value: node!.key,
          node: node!
        }));
      return;
    }

    // 建立父子关系映射
    const childrenMap: Map<string, Set<string>> = new Map();
    const parentMap: Map<string, string> = new Map();

    this.nodeMap.forEach((node, key) => {
      if (node["parentKey"]) {
        parentMap.set(key, node["parentKey"]);

        if (!childrenMap.has(node["parentKey"])) {
          childrenMap.set(node["parentKey"], new Set());
        }
        childrenMap.get(node["parentKey"])!.add(key);
      }
    });

    // 计算哪些父节点的所有子节点都被选中
    const selectedKeys = Array.isArray(this.value) ? this.value : [this.value];
    const nodeKeysSet = new Set(selectedKeys);
    const fullySelectedParents = new Set<string>();

    selectedKeys.forEach(key => {
      const node = this.nodeMap.get(key);
      if (node && this.parentNodeKeys.has(key)) {
        const childKeys = childrenMap.get(key) || new Set();
        let allChildrenSelected = true;

        childKeys.forEach(childKey => {
          if (!nodeKeysSet.has(childKey)) {
            allChildrenSelected = false;
          }
        });

        if (allChildrenSelected && childKeys.size > 0) {
          fullySelectedParents.add(key);
        }
      }
    });

    // 过滤节点
    const filteredNodes: TreeNodeOptions[] = [];
    selectedKeys.forEach(key => {
      const node = this.nodeMap.get(key);
      if (!node) return;

      let shouldDisplay = true;

      if (node["parentKey"]) {
        let currentParentKey = node["parentKey"];
        while (currentParentKey) {
          if (nodeKeysSet.has(currentParentKey)) {
            shouldDisplay = false;
            break;
          }
          currentParentKey = parentMap.get(currentParentKey);
        }
      }

      if (shouldDisplay) {
        filteredNodes.push(node);
      }
    });

    this.displayTags = filteredNodes.map(node => ({
      label: node.title,
      value: node.key,
      node: node
    }));
  }

  onSearch(value: string): void {
    this.searchValue = value;
  }

  resetSearch(): void {
    this.searchValue = '';
    this.searchInput && this.searchInput.clear();
    this.cdr.detectChanges();
  }

  focusSearch(): void {
    this.searchInput && this.searchInput.focus();
  }

  blurSearch(): void {
    this.searchInput && this.searchInput.blur();
  }

  onCompositionChange(event: string): void {
    this.compositionValue = event;
  }

  clear(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.value = this.multiple ? [] : '';
    this.displayTags = [];
    this.parentNodeKeys.clear();

    if (this.treeComponent) {
      if (this.multiple && this.treeCheckable) {
        const checkedKeys = Array.from(this.treeComponent.getCheckedKeys());
        checkedKeys.forEach(key => {
          const node = this.nodeMap.get(key);
          if (node) {
            node.checked = false;
            node.indeterminate = false;
          }
        });
      } else {
        const selectedKeys = Array.from(this.treeComponent.getSelectedKeys());
        selectedKeys.forEach(key => {
          const node = this.nodeMap.get(key);
          if (node) {
            node.selected = false;
          }
        });
      }
    }

    this.defaultExpandedKeys = [];
    this.updateData();
  }

  removeItem(event: Event, key: string): void {
    event.stopPropagation();

    if (!Array.isArray(this.value)) return;

    const index = this.value.indexOf(key);
    if (index !== -1) {
      if (this.parentNodeKeys.has(key)) {
        this.parentNodeKeys.delete(key);
      }

      const valueArray = [...this.value];
      valueArray.splice(index, 1);
      this.value = valueArray;

      if (this.treeComponent) {
        const treeNode = this.nodeMap.get(key);
        if (treeNode) {
          if (this.treeCheckable) {
            treeNode.checked = false;
            this.treeComponent.onNodeCheck(treeNode, false);
          } else {
            treeNode.selected = false;
          }
        }
      }

      this.updateDisplayTags();
      this.updateData();
    }
  }


  updateData() {
    this.valueChange.emit(this.value);

    // 将value转换为节点列表
    const selectedNodes: TreeNodeOptions[] = [];
    const keys = Array.isArray(this.value) ? this.value : [this.value];
    keys.forEach(key => {
      const node = this.nodeMap.get(key);
      if (node) {
        selectedNodes.push(node);
      }
    });

    this.treeSelectChange.emit(selectedNodes);
    this.selectionChange.emit(selectedNodes);
    this.onChange(this.value);
    this.cdr.detectChanges();
  }

  onLoadData(node: TreeNodeOptions): void {
    this.loadData.emit(node);
  }

  showPlaceHolder(): boolean {
    return (!this.value || (Array.isArray(this.value) && this.value.length === 0)) &&
      !this.searchValue && !this.compositionValue;
  }

  showSingleData(): boolean {
    return !this.multiple && !!this.getSingleNode() &&
      !this.searchValue && !this.compositionValue;
  }

  showMultipleData(): boolean {
    return this.multiple && this.displayTags.length > 0;
  }

  setFilterState(state: 'error' | 'warning' | null): void {
    this.filterState = state;
    this.stateFilterChange.emit(state);
    this.cdr.detectChanges();
  }

  getAllNodes(): Map<string, TreeNodeOptions> {
    return this.nodeMap;
  }

  private initSelectedState(): void {
    if (!this.value || (Array.isArray(this.value) && this.value.length === 0)) {
      this.displayTags = [];
      return;
    }

    if (!this.nodeMap || this.nodeMap.size === 0) {
      return;
    }

    if (this.multiple && Array.isArray(this.value)) {
      this.parentNodeKeys.clear();

      // 只在复选框状态下应用筛选逻辑
      const filteredValues = this.treeCheckable
        ? this.filterChildNodesOfCheckedParents(this.value)
        : this.value;

      filteredValues.forEach(key => {
        const node = this.nodeMap.get(key);
        if (node) {
          if (this.treeComponent) {
            if (this.treeCheckable) {
              node.checked = true;
              this.treeComponent.onNodeCheck(node, true);
            } else {
              node.selected = true;
              this.treeComponent.selectedKeys.add(key);
            }
          } else {
            // 如果树组件未准备好，仍然设置节点状态
            if (this.treeCheckable) {
              node.checked = true;
            } else {
              node.selected = true;
            }
          }

          if (node.children && node.children.length > 0) {
            this.parentNodeKeys.add(node.key);
          }
        }
      });

      this.updateDisplayTags();
    } else if (!this.multiple) {
      const key = this.value as string;
      const node = this.nodeMap.get(key);

      if (node) {
        node.selected = true;
        if (this.treeComponent) {
          this.treeComponent.selectedKeys.add(key);
        }
      }
    }

    this.cdr.detectChanges();
  }

  getExpandedKeys(): void {
    this.defaultExpandedKeys = typeof this.value === 'string' ? [this.value] : [...(this.value as string[])];
  }

  // ControlValueAccessor 接口实现
  onChange: (value: any) => void = () => { };
  onTouched: () => void = () => { };

  writeValue(value: string | string[]): void {
    if (value === null || value === undefined) {
      this.value = this.multiple ? [] : '';
      this.displayTags = [];
      this.defaultExpandedKeys = [];
      this.cdr.detectChanges();
      return;
    }

    this.value = value;
    this.initSelectedState();
    this.cdr.detectChanges();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  // 获取单选节点
  getSingleNode(): TreeNodeOptions | null {
    if (!this.multiple && typeof this.value === 'string' && this.value) {
      return this.nodeMap.get(this.value) || null;
    }
    return null;
  }

  // 获取单选节点标题
  getSingleNodeTitle(): string {
    const node = this.getSingleNode();
    return node ? node.title : '';
  }
}
