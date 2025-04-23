import { CommonModule } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output, Renderer2, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdkOverlayOrigin, ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { OverlayService } from '../core/overlay/overlay.service';
import { UtilsService } from '../core/utils/utils.service';
import { TreeComponent } from '../tree/tree.component';
import { TreeNodeOptions } from '../tree/tree.interface'; import { TreeSelectSize, TreeSelectTriggerType } from './tree-select.interface';
import { SelectBoxComponent } from '../select-basic/select-box/select-box.component';
import * as _ from 'lodash';

@Component({
  selector: 'lib-tree-select',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkOverlayOrigin, TreeComponent, SelectBoxComponent],
  templateUrl: './tree-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TreeSelectComponent),
      multi: true
    }
  ],
  encapsulation: ViewEncapsulation.None,
})
export class TreeSelectComponent implements OnInit, OnDestroy, ControlValueAccessor {
  // 视图引用
  @ViewChild(CdkOverlayOrigin, { static: false }) overlayOrigin!: CdkOverlayOrigin;
  @ViewChild('dropdownTemplate', { static: false }) dropdownTemplate!: TemplateRef<any>;
  @ViewChild('searchInput', { static: false }) searchInput!: SelectBoxComponent;
  @ViewChild(TreeComponent, { static: false }) treeComponent!: TreeComponent;

  // 输入属性
  /** 树节点数据 */
  @Input({ alias: 'treeData' }) originTreeData: TreeNodeOptions[] = [];
  /** 是否显示搜索框 */
  @Input({ alias: 'treeShowSearch', transform: booleanAttribute }) showSearch: boolean = true;
  /** 是否禁用 */
  @Input({ alias: 'treeDisabled', transform: booleanAttribute }) disabled: boolean = false;
  /** 占位文本 */
  @Input({ alias: 'treePlaceholder' }) placeholder: string = '请选择';
  /** 是否允许清空 */
  @Input({ alias: 'treeAllowClear', transform: booleanAttribute }) allowClear: boolean = true;
  /** 是否多选 */
  @Input({ alias: 'treeMultiple', transform: booleanAttribute }) multiple: boolean = false;
  /** 尺寸 */
  @Input({ alias: 'treeSize' }) size: TreeSelectSize = 'default';
  /** 是否无边框 */
  @Input({ alias: 'treeBorderless', transform: booleanAttribute }) borderless: boolean = false;
  /** 状态 */
  @Input({ alias: 'treeStatus' }) status: 'error' | 'warning' | null = null;
  /** 自定义节点属性 */
  @Input({ alias: 'treeSelectCustomFields' }) customFields: { label: string; value: string; children: string; } = { label: 'title', value: 'key', children: 'children' };
  /** 下拉菜单的宽度 */
  @Input({ alias: 'treeDropdownWidth' }) dropdownWidth: string = '100%';
  /** 下拉菜单的高度 */
  @Input({ alias: 'treeDropdownHeight' }) dropdownHeight: number = 400;
  /** 自定义选项模板 */
  @Input({ alias: 'treeNodeTemplate' }) treeNodeTemplate: TemplateRef<any> | null = null;
  /** 自定义选项标签模板 */
  @Input({ alias: 'treeLabelTemplate' }) labelTemplate: TemplateRef<any> | null = null;
  /** 是否可勾选 */
  @Input({ alias: 'treeCheckable', transform: booleanAttribute }) treeCheckable: boolean = false;
  /** 是否显示搜索结果父级 */
  @Input({ alias: 'treeShowSearchParent', transform: booleanAttribute }) showSearchParent: boolean = false;
  /** 是否显示树线条 */
  @Input({ alias: 'treeShowLine', transform: booleanAttribute }) treeShowLine: boolean = false;
  /** 是否显示树图标 */
  @Input({ alias: 'treeShowIcon', transform: booleanAttribute }) treeShowIcon: boolean = false;
  /** 是否异步加载 */
  @Input({ alias: 'treeAsyncData', transform: booleanAttribute }) treeAsyncData: boolean = false;
  /** 触发方式 */
  @Input({ alias: 'treeActionTrigger' }) actionTrigger: TreeSelectTriggerType = 'click';
  /** 是否加载中 */
  @Input({ alias: 'treeLoading', transform: booleanAttribute }) loading: boolean = false;
  /** 选项过滤函数 */
  @Input({ alias: 'treeFilterTreeNode' }) filterTreeNode?: (inputValue: string, treeNode: TreeNodeOptions) => boolean;
  /** 自定义展开图标 */
  @Input({ alias: 'treeExpandedIcon' }) expandedIcon: TemplateRef<any> | null = null;
  /** 是否虚拟滚动 */
  @Input({ alias: 'treeVirtualScroll', transform: booleanAttribute }) treeVirtualScroll: boolean = false;
  /** 虚拟滚动项高度 */
  @Input({ alias: 'treeVirtualItemSize' }) treeVirtualItemSize: number = 24;
  /** 虚拟滚动最小缓冲区 */
  @Input({ alias: 'treeVirtualMinBuffer' }) treeVirtualMinBuffer: number = 300;
  /** 虚拟滚动最大缓冲区 */
  @Input({ alias: 'treeVirtualMaxBuffer' }) treeVirtualMaxBuffer: number = 600;
  /** 默认展开的节点 */
  @Input({ alias: 'treeDefaultExpandedKeys' }) defaultExpandedKeys: string[] = [];
  /** 选项高度 */
  @Input({ alias: 'treeOptionHeight' }) treeOptionHeight: number = 36;
  /** 树节点缩进 */
  @Input({ alias: 'treeIndent' }) treeIndent: number = 24;

  // 输出事件
  /** 选中节点变化事件 */
  @Output('treeSelectChange') selectionChange = new EventEmitter<TreeNodeOptions[]>();
  /** 可见性变化事件 */
  @Output('treeSelectVisibleChange') visibleChange = new EventEmitter<boolean>();
  /** 加载数据事件 */
  @Output('treeSelectLoadData') loadData = new EventEmitter<TreeNodeOptions>();
  /** 复选框变化事件 */
  @Output('treeSelectCheckBoxChange') checkBoxChange = new EventEmitter<{ checked: boolean, node: TreeNodeOptions }>();

  // 内部状态
  /** 选中值 */
  public value: string[] = [];
  /** key到节点的映射 */
  public nodeMap: Map<string, TreeNodeOptions> = new Map();
  /** 浮层引用 */
  public overlayRef: OverlayRef | null = null;
  /** 下拉状态 */
  public isDropdownOpen: boolean = false;
  /** 搜索关键字 */
  public searchValue: string = '';
  /** 鼠标悬停关闭定时器 */
  public hoverCloseTimer: any = null;
  /** 父节点集合 */
  public parentNodeKeys: Set<string> = new Set();
  /** 是否已初始化 */
  public isInitialized: boolean = false;
  /** 树组件是否已准备好 */
  public isTreeReady: boolean = false;
  /** 默认选中节点 */
  public defaultCheckedKeys: string[] = [];
  /** 默认选中节点 */
  public defaultSelectedKeys: string[] = [];
  /** 选项数据 */
  public treeData: TreeNodeOptions[] = [];
  /** 是否使用展开动画 */
  public treeUseExpandAnimation: boolean = true;
  /** 是否打开浮层 */
  public isOpenOverlay: boolean = false;
  /** 标签属性 */
  get labelProperty(): string {
    return this.customFields?.label || 'title';
  }
  /** 值属性 */
  get valueProperty(): string {
    return this.customFields?.value || 'key';
  }
  /** 子选项属性 */
  get childrenProperty(): string {
    return this.customFields?.children || 'children';
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private overlayService: OverlayService,
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
      this.isInitialized = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['originTreeData']) {
      this.treeData = _.cloneDeep(this.originTreeData);
      // 当树数据变化时，重新初始化节点映射
      this.initNodeMap();
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
        this.nodeMap.set(node[this.valueProperty], node);
        // 处理子节点
        if (node[this.childrenProperty] && node[this.childrenProperty].length > 0) {
          processNodes(node[this.childrenProperty], node[this.valueProperty]);
        }
      });
    };
    // 初始处理所有节点
    processNodes(this.treeData);
  }

  /**
   * 打开下拉菜单
   */
  openDropdown(): void {
    if (this.disabled || this.isOpenOverlay) return;
    this.initTreeKeys();
    this.visibleChange.emit(true);
    this.cdr.detectChanges();
    const origin = this.overlayOrigin.elementRef.nativeElement;
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
      hasBackdrop: false,
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
    }
    this.treeUseExpandAnimation = true;
    this.isDropdownOpen = true;
    this.isOpenOverlay = true;
  }

  /**
   * 关闭下拉菜单
   */
  closeDropdown(): void {
    if (!this.isDropdownOpen) return;
    this.isDropdownOpen = false;
    this.resetSearch();
    this.blurSearch();
    this.cdr.detectChanges();
    this.utilsService.delayExecution(() => {
      this.visibleChange.emit(false);
      this.isOpenOverlay = false;
      this.treeUseExpandAnimation = false;
      if (this.overlayRef) {
        this.overlayRef.detach();
        this.overlayRef.dispose();
        this.overlayRef = null;
      }
      this.cdr.detectChanges();
    }, 150)
  }

  /**
   * 选中节点
   * @param node 节点
   */
  onNodeSelect(node: TreeNodeOptions): void {
    if (node.disabled) return;
    if (this.multiple) {
      this.handleMultipleSelect(node);
      this.focusSearch();
    } else {
      this.handleSingleSelect(node);
    }
    this.updateData();
  }

  /**
   * 单选模式下选中节点
   * @param node 节点
   */
  private handleSingleSelect(node: TreeNodeOptions): void {
    node.selected = true;
    this.value = [node[this.valueProperty]]; // 存储为数组
    this.closeDropdown();
  }

  /**
   * 多选模式下选中节点
   * @param node 节点
   */
  private handleMultipleSelect(node: TreeNodeOptions): void {
    if (this.treeCheckable) return;
    const valueArray = Array.isArray(this.value) ? this.value : [];
    const index = valueArray.indexOf(node[this.valueProperty]);
    if (index !== -1) {
      valueArray.splice(index, 1);
    } else {
      valueArray.push(node[this.valueProperty]);
    }
    this.value = valueArray;
  }

  /**
   * 复选框变化事件
   * @param event 事件
   */
  onCheckBoxChange(event: { checked: boolean, node: TreeNodeOptions }): void {
    if (!this.multiple || !this.treeCheckable) return;
    this.checkBoxChange.emit(event);
    this.value = [...this.treeComponent.getMergedCheckedKeys()];
    this.focusSearch();
    this.updateData();
  }

  /**
   * 搜索
   * @param value 搜索值
   */
  onSearch(value: string): void {
    this.searchValue = value;
  }

  /**
   * 重置搜索
   */
  resetSearch(): void {
    this.searchValue = '';
    this.searchInput && this.searchInput.clearSearchValue();
    this.cdr.detectChanges();
  }

  /**
   * 聚焦搜索
   */
  focusSearch(): void {
    this.searchInput && this.searchInput.focusSearchInput();
  }

  /**
   * 失去焦点
   */
  blurSearch(): void {
    this.searchInput && this.searchInput.blurSearchInput();
  }

  /**
   * 移除节点
   * @param key 节点key
   */
  removeItem(key: string): void {
    if (!Array.isArray(this.value)) return;
    if (this.value.indexOf(key) === -1) return;
    _.pull(this.value, key);
    this.updateData();
  }

  /**
   * 清空所有状态和数据
   * @param event 事件
   */
  clear(event?: Event): void {
    if (event) event.stopPropagation();
    // 清空所有状态和数据
    this.resetAllState();
    this.updateData();
  }

  /**
   * 重置所有状态
   */
  private resetAllState(): void {
    this.value = [];
    this.parentNodeKeys.clear();
    // 重置defaultCheckedKeys和defaultSelectedKeys
    this.defaultCheckedKeys = [];
    this.defaultSelectedKeys = [];
    this.defaultExpandedKeys = [];
  }

  /**
   * 更新下拉菜单位置
   */
  updateOverlayPosition(): void {
    if (this.overlayRef) this.overlayService.asyncUpdateOverlayPosition(this.overlayRef, 0);
  }

  /**
   * 更新数据
   */
  updateData() {
    // 将value转换为节点列表
    const selectedNodes: TreeNodeOptions[] = this.value && this.value.length > 0 ? this.value.map(key => this.nodeMap.get(key) as TreeNodeOptions) : [];
    this.selectionChange.emit(selectedNodes);
    // 单选模式下只返回第一个元素，多选模式下返回整个数组
    this.onChange(this.multiple ? this.value : this.value.length > 0 ? this.value[0] : null);
    this.updateOverlayPosition();
    this.cdr.detectChanges();
  }

  /**
   * 加载数据
   * @param node 节点
   */
  onLoadData(node: TreeNodeOptions): void {
    this.loadData.emit(node);
  }

  /**
   * 获取所有节点
   * @returns 所有节点
   */
  getAllNodes(): Map<string, TreeNodeOptions> {
    return this.nodeMap;
  }

  /**
   * 初始化树节点
   */
  initTreeKeys(): void {
    this.defaultExpandedKeys = [...this.value];
    if (this.treeCheckable) {
      this.defaultCheckedKeys = [...this.value];
    } else {
      this.defaultSelectedKeys = [...this.value];
    }
  }

  /**
   * 获取节点标签
   * @param node 节点
   * @returns 节点标签
   */
  getLabel = (node: any): string => {
    return node && node.title !== undefined && node.title !== null ? node.title : null;
  }

  /**
   * 获取显示的选项
   * @returns 显示的选项
   */
  getDisplayOptions(): any {
    if (this.multiple) {
      return this.value && this.value.length > 0 ? this.value.map(key => this.nodeMap.get(key)) : [];
    } else {
      return this.value && this.value.length > 0 ? [this.nodeMap.get(this.value[0])] : [];
    }
  }

  // ControlValueAccessor 接口实现
  onChange: (value: any) => void = () => { };
  onTouched: () => void = () => { };

  writeValue(value: string | string[] | null): void {
    if (value === null || value === undefined) {
      this.value = [];
      this.cdr.detectChanges();
      return;
    }
    if (Array.isArray(value)) {
      this.value = value;
    } else {
      // 如果是字符串，单选模式下转为数组
      this.value = [value];
    }
    this.cdr.detectChanges();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
