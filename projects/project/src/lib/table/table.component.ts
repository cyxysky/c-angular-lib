import { Component, ViewEncapsulation, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, TemplateRef, Pipe, PipeTransform, ElementRef, Renderer2, ChangeDetectorRef, Optional, Host, afterNextRender, ChangeDetectionStrategy, booleanAttribute, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { defaultTableFilterConditions, TableCheckedSelections, TableColumn, TableColumnFilterCondition, TableSize, TableRefreshEvent, TableVirtualScrollConfig, TableData } from './table.interface';
import { DropMenuDirective } from '../drop-menu/drop-menu.directive';
import { SelectComponent } from '../select/select.component';
import { NumberInputComponent } from '../number-input/number-input.component';
import { FormsModule } from '@angular/forms';
import { InputComponent } from "../input/input.component";
import { DateTimerComponent } from '../date-timer/date-timer.component';
import { CascaderComponent } from '../cascader/cascader.component';
import { TreeSelectComponent } from '../tree-select/tree-select.component';
import { RadioComponent } from '../radio/radio.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import * as _ from 'lodash';
import { UtilsService, WidgetSource } from '../core';
import { DropMenu } from '../drop-menu/drop-menu.interface';
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
// 创建分页大小选项格式化管道
@Pipe({
  name: 'pageSizeOptionsFormat',
  standalone: true
})
export class PageSizeOptionsFormatPipe implements PipeTransform {
  transform(options: number[]): any[] {
    if (!options || !Array.isArray(options)) return [];
    return options.map(size => ({
      label: `${size} 条/页`,
      value: size
    }));
  }
}

@Component({
  imports: [
    CommonModule,
    DropMenuDirective,
    SelectComponent,
    NumberInputComponent,
    FormsModule,
    PageSizeOptionsFormatPipe,
    InputComponent,
    DateTimerComponent,
    CascaderComponent,
    TreeSelectComponent,
    RadioComponent,
    CheckboxComponent,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
  ],
  selector: 'lib-table',
  standalone: true,
  templateUrl: './table.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  /** 表格数据 */
  @Input({ alias: 'tableData' }) data: TableData[] = [];
  /** 表格列配置 */
  @Input({ alias: 'tableColumns' }) columns: TableColumn[] = [];
  /** 是否允许选择 */
  @Input({ alias: 'tableCheckable', transform: booleanAttribute }) checkable: boolean = false;
  /** 选择的key */
  @Input({ alias: 'tableCheckedKey' }) checkedKey: string = 'id';
  /** 自定义选择项 */
  @Input({ alias: 'tableCheckedSelections' }) checkedSelections: Array<TableCheckedSelections> = [];
  /** 选择的内容 */
  @Input({ alias: 'tableCheckedRows' }) checkedRows: TableData[] = [];
  /** 表格大小 */
  @Input({ alias: 'tableSize' }) size: TableSize = 'default';
  /** 是否显示边框 */
  @Input({ alias: 'tableBordered', transform: booleanAttribute }) bordered: boolean = false;
  /** 是否显示loading状态 */
  @Input({ alias: 'tableLoading', transform: booleanAttribute }) loading: boolean = false;
  /** 表格标题 */
  @Input({ alias: 'tableTitle' }) title: string | TemplateRef<void> | null = null;
  /** 表格底部 */
  @Input({ alias: 'tableFooter' }) footer: string | TemplateRef<void> | null = null;
  /** 是否显示工具栏 */
  @Input({ alias: 'tableShowToolbar', transform: booleanAttribute }) showToolbar: boolean = false;
  // 自定义空数据模板
  @Input({ alias: 'tableEmptyTemplate' }) emptyTemplate: TemplateRef<void> | null = null;
  /** 是否为树形表格 */
  @Input({ alias: 'tableIsTree', transform: booleanAttribute }) isTree: boolean = false;
  /** 是否表格单元格合并 */
  @Input({ alias: 'tableComplex', transform: booleanAttribute }) isComplex: boolean = false;
  /** 是否显示分页 */
  @Input({ alias: 'tableShowPagination', transform: booleanAttribute }) showPagination: boolean = true;
  /** 当前页码 */
  @Input({ alias: 'tablePageIndex' }) pageIndex: number = 1;
  /** 每页条数 */
  @Input({ alias: 'tablePageSize' }) pageSize: number = 10;
  /** 总条数 */
  @Input({ alias: 'tableTotal' }) total: number = 0;
  /** 分页大小选项 */
  @Input({ alias: 'tablePageSizeOptions' }) pageSizeOptions: number[] = [10, 20, 30, 50];
  /** 是否显示快速跳转 */
  @Input({ alias: 'tableShowQuickJumper', transform: booleanAttribute }) showQuickJumper: boolean = true;
  /** 是否显示总条数 */
  @Input({ alias: 'tableShowTotal', transform: booleanAttribute }) showTotal: boolean = true;
  /** 是否固定分页 */
  @Input({ alias: 'tableFixedPagination', transform: booleanAttribute }) fixedPagination: boolean = false;
  /** 分页模板 */
  @Input({ alias: 'tablePaginationTemplate' }) paginationTemplate: TemplateRef<any> | null = null;
  /** 是否前端分页 */
  @Input({ alias: 'tableFrontPagination', transform: booleanAttribute }) frontPagination: boolean = false;
  /** 用于表格滚动的配置 */
  @Input({ alias: 'tableScroll' }) scroll: { x?: string | null; y?: string | null } = { x: null, y: null };
  /** 虚拟滚动相关属性 */
  @Input({ alias: 'tableVirtualScroll', transform: booleanAttribute }) virtualScroll: boolean = false;
  /** 虚拟滚动行高 */
  @Input({ alias: 'tableVirtualItemSize' }) virtualItemSize: number = 48;
  /** 虚拟滚动最小缓冲区 */
  @Input({ alias: 'tableVirtualMinBufferPx' }) virtualMinBufferPx: number = 100;
  /** 虚拟滚动最大缓冲区 */
  @Input({ alias: 'tableVirtualMaxBufferPx' }) virtualMaxBufferPx: number = 200;
  /** 虚拟滚动视口引用 */
  @ViewChild(CdkVirtualScrollViewport) virtualScrollViewport!: CdkVirtualScrollViewport;
  /** 虚拟滚动表头引用 */
  @ViewChild('tableHeader') tableHeader!: ElementRef;
  /** 自定义滚动条轨道引用 */
  @ViewChild('scrollTrack') scrollTrack!: ElementRef;
  /** 表格容器引用 */
  @ViewChild('tableContainer') tableContainer!: ElementRef;
  /** 自定义滚动条滑块引用 */
  @ViewChild('scrollThumb') scrollThumb!: ElementRef;
  /** 表格容器盒子引用 */
  @ViewChild('tableContainerBox') tableContainerBox!: ElementRef;
  /** 表格滚动容器引用 */
  @ViewChild('tableScrollContainer') tableScrollContainer!: ElementRef;
  /** 虚拟滚动表头引用 */
  @ViewChild('virtualScrollHeader') virtualScrollHeader!: ElementRef;
  /** 选择变化事件 */
  @Output() tableCheckedRowsChange = new EventEmitter<any[]>();
  /** 表格筛选，排序，页码变化事件 */
  @Output() tableRefresh = new EventEmitter<TableRefreshEvent>();
  /** 页码变化事件 */
  @Output() pageIndexChange = new EventEmitter<number>();
  /** 每页条数变化事件 */
  @Output() pageSizeChange = new EventEmitter<number>();
  /** 当前页数据 */
  public currentPageData: any[] = [];
  /** 是否有左侧固定列 */
  public hasFixedLeft: boolean = false;
  /** 是否有右侧固定列 */
  public hasFixedRight: boolean = false;
  /** 各列的筛选状态 */
  public filterVisibleMap: { [key: string]: boolean } = {};
  /** 各列的筛选值 */
  public filterValueMap: { [key: string]: any } = {};
  /** 各列的筛选条件 */
  public filterConditionMap: { [key: string]: any } = {};
  /** 各列的显示筛选值 */
  public displayFilterValueMap: { [key: string]: any } = {};
  /** 各列的显示筛选条件 */
  public displayFilterConditionMap: { [key: string]: any } = {};
  /** 表格数据 */
  public tableData: Array<any> = [];
  /** 筛选条件 */
  public filterConditions: TableColumnFilterCondition[] = defaultTableFilterConditions;
  /** 表格宽度 */
  public tableWidth = 0;
  /** 表格宽度观察器 */
  private resizeObserver: ResizeObserver | null = null;
  /** 处理后的表头数据结构 */
  public headerRows: TableColumn[][] = [];
  /** 表头最大深度 */
  public maxHeaderDepth: number = 1;
  /** 叶子节点列（用于表体数据展示） */
  public leafColumns: TableColumn[] = [];

  headerLeftPositions: number[][] = [];
  headerRightPositions: number[][] = [];

  bodyLeftPositions: Map<string, number> = new Map();
  bodyRightPositions: Map<string, number> = new Map();
  /** 是否有左侧阴影 */
  hasLeftShadow: boolean = false;
  /** 是否有右侧阴影 */
  hasRightShadow: boolean = false;
  /** 是否有滚动条 */
  hasScroll: boolean = false;
  /** 复杂表格数据 */
  complexTableObj: { data: any, totalRows: number } = { data: [], totalRows: 0 };

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    public cdr: ChangeDetectorRef,
    private utilsService: UtilsService,
    @Optional() public widgetSource: WidgetSource
  ) {
    afterNextRender(() => { })
  }

  ngOnInit(): void {
    // 备份原始数据
    this.tableData = _.cloneDeep(this.data);
    // 初始化表头结构
    this.initializeHeader();
    // 刷新数据
    this.refreshData();
    this.checkFixedColumns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      // 当数据源变化时，备份原始数据
      this.tableData = _.cloneDeep(this.data);
    }
    this.refreshData();
    if (changes['columns']) {
      this.checkFixedColumns();
      this.initializeHeader();
    }
    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    // 初始化自定义滚动条逻辑
    this.initCustomScroll();
  }

  ngOnDestroy(): void {
    // 清理自定义滚动条逻辑
    this.cleanupCustomScroll();
  }

  /**
   * 处理滚动轨道的滚动事件
   */
  onTrackScroll(event: Event): void {
    const trackElement = event.target as HTMLElement;
    const scrollLeft = trackElement.scrollLeft;
    // 同步所有需要滚动的容器
    if (!this.virtualScroll && this.tableScrollContainer) {
      this.tableScrollContainer.nativeElement.scrollLeft = scrollLeft;
    }
    if (this.virtualScroll) {
      this.virtualScrollViewport && (this.virtualScrollViewport.elementRef.nativeElement.scrollLeft = scrollLeft);
      this.virtualScrollHeader && (this.virtualScrollHeader.nativeElement.scrollLeft = scrollLeft);
    }
    this.updateScrollShadow(scrollLeft, trackElement);
  }

  /**
   * 更新滚动阴影效果
   */
  private updateScrollShadow(scrollLeft: number, element: HTMLElement): void {
    // 计算最大滚动距离
    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    // 没有横向滚动条时，移除所有阴影
    if (maxScrollLeft <= 0) {
      this.hasLeftShadow = false;
      this.hasRightShadow = false;
      return;
    }
    // 在最左侧时，左侧无阴影，右侧有阴影
    if (scrollLeft === 0) {
      this.hasLeftShadow = false;
      this.hasRightShadow = true;
    }
    // 在最右侧时，左侧有阴影，右侧无阴影
    else if (Math.abs(scrollLeft - maxScrollLeft) < 1) {
      this.hasLeftShadow = true;
      this.hasRightShadow = false;
    }
    // 在中间位置时，两侧都显示阴影
    else {
      this.hasLeftShadow = true;
      this.hasRightShadow = true;
    }
    this.cdr.detectChanges();
  }

  /**
   * 扁平化表格数据
   * @returns 扁平化的树形数据数组
   */
  flatTableData(): Array<any> {
    let flattenNodes: any[] = [];
    // 递归处理树形数据，只处理可见的节点
    const processTree = (nodes: any[], level: number = 0, parent: any = null): void => {
      if (!nodes || !Array.isArray(nodes)) return;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        // 初始化展开状态
        if (node.expanded === undefined) {
          node.expanded = false;
        }
        // 添加当前节点
        flattenNodes.push({
          node,
          nowLevel: level,
          parentNode: parent,
          isLast: i === nodes.length - 1,
          index: i
        });
        // 如果节点已展开且有子节点，则递归处理子节点
        if (node.expanded && node.children && node.children.length) {
          processTree(node.children, level + 1, node);
        }
      }
    };
    // 从根节点开始处理
    processTree(this.isTree ? this.data : this.tableData);
    return flattenNodes;
  }

  /**
   * 切换树节点展开/折叠状态
   * @param node 树节点
   */
  toggleTreeNode(node: any): void {
    node.expanded = !node.expanded;
    this.currentPageData = this.flatTableData();
    this.cdr.detectChanges();
  }

  /**
   * 刷新表格数据
   */
  refreshData(): void {
    // 如果是树形表格，直接使用扁平化后的树形数据
    if (this.isTree) {
      this.currentPageData = this.flatTableData();
    }
    // 前端分页
    else if (this.frontPagination) {
      const start = (this.pageIndex - 1) * this.pageSize;
      const end = start + this.pageSize;
      this.currentPageData = this.data.slice(start, end);
      this.total = this.data.length;
    }
    // 复杂表格
    else if (this.isComplex) {
      this.initComplexTableData(this.data);
    }
    // 服务端分页
    else {
      this.currentPageData = this.data;
    }
    this.cdr.detectChanges();
  }

  /**
   * 初始化复杂表格数据
   */
  initComplexTableData(data: any[]): void {
    if (!this.isComplex || this.leafColumns.length === 0) return;
    this.currentPageData = this.getComplexFlattenData(this.data);
    let resultMap = new Map();
    let fieldIndexMap = new Map();
    const nodeLeafCountCache = new Map();
    let totalRows = 0;
    // 计算节点的叶子节点数量（使用缓存）
    function countLeafNodes(item: any): number {
      if (nodeLeafCountCache.has(item)) return nodeLeafCountCache.get(item);
      let leafCount;
      if (!item.children || item.children.length === 0) {
        leafCount = 1;
      } else {
        leafCount = 0;
        for (const child of item.children) {
          leafCount += countLeafNodes(child);
        }
      }
      nodeLeafCountCache.set(item, leafCount);
      return leafCount;
    }
    // 预计算所有节点的叶子节点数量
    function precomputeLeafCounts(item: any): void {
      countLeafNodes(item);
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          precomputeLeafCounts(child);
        }
      }
    }
    // 构建结果
    const buildResult = (item: any, level: number = 0): void => {
      let field = this.leafColumns[level].field;
      // 初始化map
      if (!resultMap.has(field)) resultMap.set(field, new Map());
      if (!fieldIndexMap.has(field)) fieldIndexMap.set(field, 0);
      // 计算节点行数
      const nodeRows = nodeLeafCountCache.get(item);
      // 设置结果
      resultMap.get(field)?.set(fieldIndexMap.get(field), { data: item, length: nodeRows });
      // 更新字段索引
      fieldIndexMap.set(field, fieldIndexMap.get(field) + nodeRows);
      // 递归处理子节点
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          buildResult(child, level + 1);
        }
      } else {
        for (let i = 1; i < this.leafColumns.length - level; i++) {
          field = this.leafColumns[level + i].field;
          if (!resultMap.has(field)) resultMap.set(field, new Map());
          if (!fieldIndexMap.has(field)) fieldIndexMap.set(field, 0);
          resultMap.get(field)?.set(fieldIndexMap.get(field), { data: item, length: 1 });
          fieldIndexMap.set(field, fieldIndexMap.get(field) + 1);
        }
      }
    }
    // 处理所有顶层数据
    for (const item of data) {
      precomputeLeafCounts(item);
      totalRows += nodeLeafCountCache.get(item);
      buildResult(item);
    }
    this.complexTableObj = {
      data: resultMap,
      totalRows: totalRows
    };
  }

  /**
   * 复杂表格扁平化数据
   * @param data 复杂表格数据
   */
  getComplexFlattenData(data: any[]) {
    // 扁平化的结果数组
    const flattenedData: any[] = [];
    // 递归处理嵌套数据的函数
    const flattenData = (item: any, parentContext: any = {}) => {
      // 创建当前上下文，合并父级上下文和当前项的属性
      const currentContext = { ...parentContext };
      // 将当前项的所有属性添加到上下文中，排除children属性
      for (const key in item) {
        if (key !== 'children') {
          currentContext[key] = item[key];
        }
      }
      // 如果有子节点，递归处理
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          flattenData(child, currentContext);
        }
      } else {
        // 如果没有子节点，将当前上下文添加到结果数组
        flattenedData.push({ ...currentContext });
      }
    };
    // 处理所有顶级数据
    for (const item of data) {
      flattenData(item);
    }
    return flattenedData;
  }

  /**
   * 获取虚拟滚动配置
   */
  getVirtualScrollConfig(): TableVirtualScrollConfig {
    return {
      height: this.scroll?.y ? parseInt(this.scroll.y as string, 10) : 400,
      itemSize: this.virtualItemSize,
      minBufferPx: this.virtualMinBufferPx,
      maxBufferPx: this.virtualMaxBufferPx
    };
  }

  /**
   * 追踪虚拟滚动项的变化，用于性能优化
   */
  trackByFn(index: number, item: any): any {
    return index;
  }

  /**
   * 检查是否有固定列
   */
  checkFixedColumns(): void {
    // 更新叶子节点的固定状态，确保子列继承父列的固定属性
    const updateFixedStatus = (columns: TableColumn[], parentFixed: boolean | 'left' | 'right' | null = null) => {
      columns.forEach(column => {
        // 如果父列是固定的，子列应该继承相同的固定属性
        if (parentFixed && !column.fixed) {
          column.fixed = parentFixed;
        }
        // 递归处理子列
        if (column.children && column.children.length > 0) {
          updateFixedStatus(column.children, column.fixed || parentFixed);
        }
      });
    };
    // 更新所有列的固定状态
    updateFixedStatus(this.columns);
    // 检查是否有左右固定列
    this.hasFixedLeft = this.leafColumns.some(column => column.fixed === true || column.fixed === 'left');
    this.hasFixedRight = this.leafColumns.some(column => column.fixed === 'right');
  }

  /**
   * 处理排序点击
   * 按照升序、降序、无序的循环顺序进行排序
   */
  onSortClick(field: string, currentOrder: 'ascend' | 'descend' | null): void {
    let newOrder: 'ascend' | 'descend' | null;
    // 排序顺序：null -> ascend -> descend -> null
    if (currentOrder === null) {
      newOrder = 'ascend';
    } else if (currentOrder === 'ascend') {
      newOrder = 'descend';
    } else {
      newOrder = null;
    }
    // 更新 headerRows 中的排序状态
    this.headerRows.forEach(row => {
      row.forEach(column => {
        if (column.field === field) {
          column.sortOrder = newOrder;
        } else {
          column.sortOrder = null;
        }
      });
    });
    // 如果是前端排序，则直接排序数据
    if (this.frontPagination && newOrder) {
      const isAscend = newOrder === 'ascend';
      this.data = [...this.data].sort((a, b) => {
        const aValue = a[field];
        const bValue = b[field];
        // 处理不同类型的值
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return isAscend ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        } else {
          // 数字或其他类型
          return isAscend ? (aValue > bValue ? 1 : -1) : (aValue > bValue ? -1 : 1);
        }
      });
      // 刷新数据
      this.refreshData();
    }
    // 更新变更检测，确保视图更新
    this.cdr.detectChanges();
    // 发出刷新事件
    this.refreshTable();
  }

  /**
   * 打开过滤弹窗
   */
  openFilter(column: TableColumn): void {
    this.displayFilterValueMap = _.cloneDeep(this.filterValueMap);
    this.displayFilterConditionMap = _.cloneDeep(this.filterConditionMap);
  }

  /**
   * 处理页码变化
   */
  onPageIndexChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.pageIndexChange.emit(pageIndex);
    this.refreshData();
    this.refreshTable();
  }

  /**
   * 处理每页条数变化
   */
  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageSizeChange.emit(pageSize);
    this.refreshData();
    this.refreshTable();
  }

  /**
   * 判断是否为模板引用
   */
  isTemplateRef(value: any): value is TemplateRef<void> {
    return value instanceof TemplateRef;
  }

  /**
   * 获取总页数
   */
  getLastPage(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  /**
   * 获取分页页码数组
   */
  getPageNumbers(): number[] {
    const lastPage = this.getLastPage();
    const current = this.pageIndex;
    const result: number[] = [];
    // 简单分页逻辑，最多显示5个页码
    const maxDisplayPages = 5;
    if (lastPage <= maxDisplayPages) {
      // 少于maxDisplayPages页，全部显示
      for (let i = 1; i <= lastPage; i++) {
        result.push(i);
      }
    } else {
      // 超过maxDisplayPages页，显示当前页附近的页码
      let start = Math.max(1, current - 2);
      let end = Math.min(lastPage, start + maxDisplayPages - 1);
      // 调整start，确保显示maxDisplayPages个页码
      if (end - start + 1 < maxDisplayPages) {
        start = Math.max(1, end - maxDisplayPages + 1);
      }
      for (let i = start; i <= end; i++) {
        result.push(i);
      }
    }
    return result;
  }

  /**
   * 确认筛选
   */
  confirmFilter(column: TableColumn): void {
    this.filterVisibleMap[column.field] = false;
    this.filterValueMap[column.field] = this.displayFilterValueMap[column.field];
    this.filterConditionMap[column.field] = this.displayFilterConditionMap[column.field];
    this.cdr.detectChanges();
    this.refreshTable();
  }

  /**
   * 重置筛选
   */
  resetFilter(column: TableColumn): void {
    this.filterVisibleMap[column.field] = false;
    delete this.filterValueMap[column.field];
    delete this.displayFilterValueMap[column.field];
    this.refreshTable();
  }

  /**
   * 重置所有筛选和排序
   */
  resetAll(): void {
    this.columns.forEach(column => column.sortOrder = null);
    this.tableData = _.cloneDeep(this.data);
    this.refreshData();
    this.filterValueMap = {};
    this.filterConditionMap = {};
    this.refreshTable();
  }

  /**
   * 获取列的宽度
   */
  private getColumnWidth(column: TableColumn): number {
    if (column.width) {
      // 如果有明确设置的宽度，解析它
      const width = column.width.toString();
      if (width.endsWith('px')) {
        return parseInt(width, 10);
      } else if (!isNaN(parseInt(width, 10))) {
        return parseInt(width, 10);
      }
    }
    return 100; // 默认宽度
  }

  /**
   * 获取列的Z-Index
   */
  getZIndex(column: TableColumn): number {
    // 固定列的z-index设置得比普通列高
    if (this.scroll?.y && (column.fixed === 'left' || column.fixed === true || column.fixed === 'right')) {
      return 3; // 表头固定列
    } else if (this.scroll?.y) {
      return 2; // 普通固定表头
    } else if (column.fixed === 'left' || column.fixed === true || column.fixed === 'right') {
      return 1; // 普通固定列
    }
    return 0;
  }

  /**
   * 获取列的筛选类型
   */
  getFilterType(column: TableColumn, type: 'select' | 'cascader' | 'tree-select' | 'date'): string {
    switch (type) {
      case 'select':
        if (column.filters?.type === 'select-multiple' || column.filters?.type === 'select') {
          return column.filters?.type;
        }
        return '';
      case 'cascader':
        if (column.filters?.type === 'cascader-multiple' || column.filters?.type === 'cascader') {
          return column.filters?.type;
        }
        return '';
      case 'tree-select':
        if (column.filters?.type === 'tree-select-multiple' || column.filters?.type === 'tree-select' || column.filters?.type === 'tree-select-checkable') {
          return column.filters?.type;
        }
        return '';
      case 'date':
        if (column.filters?.type === 'date-range' || column.filters?.type === 'date') {
          return column.filters?.type;
        }
        return '';
    }
  }

  /**
   * 生成缩进数组
   * @param level 层级
   * @returns 缩进数组
   */
  getIndentArray(level: number): number[] {
    return Array(level).fill(0).map((_, i) => i);
  }

  /**
   * 展开所有树节点
   */
  expandAllTreeNodes(): void {
    if (!this.isTree) return;
    // 递归设置所有节点为展开状态
    const expandNodes = (nodes: any[]): void => {
      if (!nodes || !Array.isArray(nodes)) return;
      for (const node of nodes) {
        node.expanded = true;
        if (node.children && node.children.length) {
          expandNodes(node.children);
        }
      }
    };
    expandNodes(this.data);
    this.refreshData();
  }

  /**
   * 折叠所有树节点
   */
  collapseAllTreeNodes(): void {
    if (!this.isTree) return;
    // 递归设置所有节点为折叠状态
    const collapseNodes = (nodes: any[]): void => {
      if (!nodes || !Array.isArray(nodes)) return;
      for (const node of nodes) {
        node.expanded = false;
        if (node.children && node.children.length) {
          collapseNodes(node.children);
        }
      }
    };
    collapseNodes(this.data);
    this.refreshData();
  }

  /**
   * 根据ID数组展开指定节点及其所有父节点
   * @param ids 要展开的节点ID数组
   */
  expandByIds(ids: string[]): void {
    if (!this.isTree) return;
    // 建立节点父子关系映射
    const parentMap = new Map<string, any>();
    const findParents = (nodes: any[], parent: any = null): void => {
      if (!nodes || !Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (parent) {
          parentMap.set(node.id, parent);
        }
        if (node.children && node.children.length) {
          findParents(node.children, node);
        }
      }
    };
    findParents(this.data);
    // 找到所有需要展开的路径
    const nodesToExpand = new Set<string>();
    ids.forEach(id => {
      nodesToExpand.add(id);
      let currentId = id;
      let parentNode = parentMap.get(currentId);
      while (parentNode) {
        nodesToExpand.add(parentNode.id);
        currentId = parentNode.id;
        parentNode = parentMap.get(currentId);
      }
    });
    // 展开所有需要展开的节点
    const expandNodes = (nodes: any[]): void => {
      if (!nodes || !Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (nodesToExpand.has(node.id)) {
          node.expanded = true;
        }
        if (node.children && node.children.length) {
          expandNodes(node.children);
        }
      }
    };
    expandNodes(this.data);
    this.refreshData();
  }

  /**
   * 获取可见按钮
   * @param column 表格列配置
   */
  getVisibleButtons(column: TableColumn, data: any, rowIndex: number): any[] {
    if (!column.buttons || !column.buttons.length) {
      return [];
    }
    // 过滤出应该显示的按钮
    const visibleButtons = column.buttons.filter(button =>
      button.show ? button.show(data, rowIndex) : true
    );
    // 如果设置了最大按钮数，则只返回前maxButtons个按钮
    if (column.maxButtons && column.maxButtons > 0 && visibleButtons.length > column.maxButtons) {
      return visibleButtons.slice(0, column.maxButtons);
    }
    return visibleButtons;
  }

  /**
   * 获取更多按钮（超出显示限制的按钮）
   * @param column 表格列配置
   */
  getMoreButtons(column: TableColumn, data: any, rowIndex: number): any[] {
    if (!column.buttons || !column.buttons.length || !column.maxButtons) {
      return [];
    }
    // 过滤出应该显示的按钮
    const visibleButtons = column.buttons.filter(button =>
      button.show ? button.show(data, rowIndex) : true
    );
    // 如果可见按钮数量超过最大按钮数，返回超出的部分
    if (column.maxButtons && column.maxButtons > 0 && visibleButtons.length > column.maxButtons) {
      return visibleButtons.slice(column.maxButtons);
    }
    return [];
  }

  /**
   * 将普通按钮转换为下拉菜单项
   * @param buttons 按钮数组
   * @param data 行数据
   * @param rowIndex 行索引
   */
  convertButtonsToMenuItems(buttons: any[], data: any, rowIndex: number): DropMenu[] {
    return buttons.map(button => ({
      title: button.text,
      icon: button.icon,
      disabled: button.disabled,
      data: {
        originalButton: button,
        rowData: data,
        rowIndex: rowIndex
      }
    }));
  }

  /**
   * 处理下拉菜单项点击
   * @param item 下拉菜单项
   */
  onMenuItemClick(item: DropMenu): void {
    if (item.data && item.data.originalButton && item.data.originalButton.click) {
      item.data.originalButton.click(item.data.rowData, item.data.rowIndex);
    }
  }

  /**
   * 获取列的最大按钮数量
   * @param column 表格列配置
   */
  getMaxButtons(column: TableColumn): number {
    if (column.maxButtons !== undefined) {
      return column.maxButtons;
    }
    // 默认显示所有按钮
    return column.buttons ? column.buttons.length : 0;
  }

  /**
   * 获取选中状态
   * @param row 行数据
   */
  getCheckedStatus(row: any): boolean {
    return this.checkedRows.some(r => r[this.checkedKey] === row[this.checkedKey]);
  }

  /**
   * 选中行变化
   */
  checkedChange(checked: boolean, row: any): void {
    checked ? this.addCheckedRow(row) : this.removeCheckedRow(row);
  }

  /**
   * 添加选中行
   * @param row 行数据
   */
  addCheckedRow(row: any): void {
    this.checkedRows.push(row);
    this.tableCheckedRowsChange.emit(this.checkedRows);
  }

  /**
   * 移除选中行
   * @param row 行数据
   */
  removeCheckedRow(row: any): void {
    this.checkedRows = this.checkedRows.filter(r => r[this.checkedKey] !== row[this.checkedKey]);
    this.tableCheckedRowsChange.emit(this.checkedRows);
  }

  /**
   * 选择自定义选择项
   * @param selection 自定义选择项
   */
  selectCheckedSelection(selection: any): void {
    selection.onSelect(this.checkedRows);
  }

  /**
   * 刷新表格
   */
  refreshTable(): void {
    let sortInfo: any = null;
    // 获取所有列的排序信息
    this.headerRows.forEach(row => {
      row.forEach(column => {
        if (column.sortOrder !== null && column.field) {
          sortInfo = column;
        }
      });
    });
    const sort = sortInfo ? {
      field: sortInfo.field as string,
      order: sortInfo.sortOrder as 'ascend' | 'descend' | null
    } : null;
    // 创建表格刷新事件对象
    const refreshEvent: TableRefreshEvent = {
      pagination: {
        pageIndex: this.pageIndex,
        pageSize: this.pageSize,
        total: this.total
      },
      sort: sort,
      filters: this.filterValueMap
    };
    // 发送事件
    this.tableRefresh.emit(refreshEvent);
  }

  /**
   * 获取表格宽度
   */
  getTableWidth(): void {
    if (!this.tableHeader?.nativeElement) return;
    const headerWidth = this.tableHeader.nativeElement.offsetWidth;
    const containerWidth = this.tableContainer?.nativeElement?.offsetWidth || 0;
    this.tableWidth = Math.max(headerWidth, containerWidth - 1); // +1 确保出现滚动条
    this.cdr.detectChanges();
  }

  // 自定义滚动条逻辑
  private initCustomScroll(): void {
    this.cleanupCustomScroll();
    this.utilsService.delayExecution(() => {
      this.getTableWidth();
      this.resizeObserver = new ResizeObserver(() => {
        this.getTableWidth();
        this.initHasScroll();
      });
      this.tableHeader && this.resizeObserver.observe(this.tableHeader.nativeElement);
      this.initHasScroll();
    });
  }

  /**
   * 初始化表格滚动状态
   */
  private initHasScroll(): void {
    const scrollTrack = this.scrollTrack.nativeElement;
    if (scrollTrack) {
      this.hasScroll = scrollTrack.scrollWidth > scrollTrack.clientWidth;
      if (this.hasScroll) {
        if (scrollTrack.scrollLeft === 0) {
          this.hasLeftShadow = false;
          this.hasRightShadow = true;
        } else if (scrollTrack.scrollLeft + scrollTrack.clientWidth === scrollTrack.scrollWidth) {
          this.hasLeftShadow = true;
          this.hasRightShadow = false;
        } else {
          this.hasLeftShadow = true;
          this.hasRightShadow = true;
        }
      } else {
        this.hasLeftShadow = false;
        this.hasRightShadow = false;
      }
    }
  }

  /**
   * 清理自定义滚动条逻辑
   */
  private cleanupCustomScroll(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  /**
   * 初始化表头结构
   * 处理嵌套表头，计算行列合并信息
   */
  initializeHeader(): void {
    this.headerRows = [];
    this.maxHeaderDepth = 0;
    this.leafColumns = [];
    // 一次递归中完成所有表头相关的计算和处理
    const processHeaderTree = (columns: TableColumn[], depth: number = 0): number => {
      // 更新最大深度
      this.maxHeaderDepth = Math.max(this.maxHeaderDepth, depth + 1);
      // 确保headerRows数组长度足够
      while (this.headerRows.length <= depth) {
        this.headerRows.push([]);
      }
      let totalColspan = 0;
      for (const column of columns) {
        // 创建列副本
        const columnCopy: any = { ...column };
        !columnCopy.__id && (columnCopy.__id = this.utilsService.getUUID());
        if (column.children && column.children.length > 0) {
          // 处理有子列的情况
          columnCopy.colspan = processHeaderTree(column.children, depth + 1);
          columnCopy.rowspan = 1;
        } else {
          // 没有子列的情况（叶子节点）
          columnCopy.colspan = 1;
          this.leafColumns.push(columnCopy);
        }
        // 将列添加到对应深度的行中
        this.headerRows[depth].push(columnCopy);
        // 累加列宽
        totalColspan += columnCopy.colspan || 1;
      }
      return totalColspan;
    };
    // 开始处理表头树
    processHeaderTree(this.columns);
    // 计算行合并
    for (let i = 0; i < this.headerRows.length; i++) {
      for (let j = 0; j < this.headerRows[i].length; j++) {
        const column = this.headerRows[i][j];
        if (!column.children || column.children.length === 0) {
          // 计算该列应当跨越的行数（叶子节点）
          column.rowspan = this.maxHeaderDepth - i;
        }
      }
    }
    // 标记每行最后一个左固定列和第一个右固定列
    this.markFixedColumnsForShadow();
    // 计算表头固定列位置
    this.calculateHeaderFixedPositions();
    // 计算表体叶子节点列的固定位置
    this.calculateBodyFixedPositions();
    // 检查表头列的固定属性
    this.checkFixedColumns();
  }

  /**
   * 标记每行最后一个左固定列和第一个右固定列，用于显示阴影
   */
  markFixedColumnsForShadow(): void {
    // 处理表头行
    for (let rowIndex = 0; rowIndex < this.headerRows.length; rowIndex++) {
      const row = this.headerRows[rowIndex];
      // 找到最后一个左固定列
      const lastLeftFixedIndex = row.reduceRight((index, column, currentIndex) => {
        if (index === -1 && (column.fixed === 'left' || column.fixed === true)) {
          return currentIndex;
        }
        return index;
      }, -1);
      // 找到第一个右固定列
      const firstRightFixedIndex = row.findIndex(column => column.fixed === 'right');
      // 标记最后一个左固定列和第一个右固定列
      row.forEach((column, colIndex) => {
        column.isLastLeftFixed = colIndex === lastLeftFixedIndex;
        column.isFirstRightFixed = colIndex === firstRightFixedIndex;
      });
    }
    // 同样处理叶子节点列
    const lastLeftFixedLeafIndex = this.leafColumns.reduceRight((index, column, currentIndex) => {
      if (index === -1 && (column.fixed === 'left' || column.fixed === true)) {
        return currentIndex;
      }
      return index;
    }, -1);
    const firstRightFixedLeafIndex = this.leafColumns.findIndex(column => column.fixed === 'right');
    this.leafColumns.forEach((column, index) => {
      column.isLastLeftFixed = index === lastLeftFixedLeafIndex;
      column.isFirstRightFixed = index === firstRightFixedLeafIndex;
    });
  }

  /**
   * 计算表头固定列位置
   * 需要按行计算，考虑每行的colspan和rowspan
   */
  calculateHeaderFixedPositions(): void {
    // 初始化位置数组
    this.headerLeftPositions = Array(this.maxHeaderDepth).fill(0).map(() => []);
    this.headerRightPositions = Array(this.maxHeaderDepth).fill(0).map(() => []);
    // 计算列宽
    const columnWidths: Map<string, number> = new Map();
    this.leafColumns.forEach(column => {
      columnWidths.set(column.__id!, this.getColumnWidth(column));
    });
    // 为每行计算左侧固定列位置
    for (let rowIndex = 0; rowIndex < this.headerRows.length; rowIndex++) {
      let leftPosition = 0;
      const row = this.headerRows[rowIndex];
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const column = row[colIndex];
        // 保存位置
        this.headerLeftPositions[rowIndex][colIndex] = leftPosition;
        // 计算这个列占据的宽度（考虑colspan）
        let columnWidth = 0;
        if (column.children && column.children.length > 0) {
          // 父级表头宽度是所有子列宽度之和
          columnWidth = this.calculateParentColumnWidth(column, columnWidths);
        } else {
          // 叶子节点直接使用自己的宽度
          columnWidth = columnWidths.get(column.__id!) || this.getColumnWidth(column);
        }
        // 更新下一列的起始位置
        leftPosition += columnWidth;
        // 如果不是固定左列，后面的就不需要计算了
        if (column.fixed !== 'left' && column.fixed !== true) {
          break;
        }
      }
    }
    // 为每行计算右侧固定列位置
    for (let rowIndex = 0; rowIndex < this.headerRows.length; rowIndex++) {
      let rightPosition = 0;
      const row = this.headerRows[rowIndex];
      for (let colIndex = row.length - 1; colIndex >= 0; colIndex--) {
        const column = row[colIndex];
        // 保存位置
        this.headerRightPositions[rowIndex][colIndex] = rightPosition;
        // 计算这个列占据的宽度（考虑colspan）
        let columnWidth = 0;
        if (column.children && column.children.length > 0) {
          // 父级表头宽度是所有子列宽度之和
          columnWidth = this.calculateParentColumnWidth(column, columnWidths);
        } else {
          // 叶子节点直接使用自己的宽度
          columnWidth = columnWidths.get(column.__id!) || this.getColumnWidth(column);
        }
        // 更新下一列的起始位置
        rightPosition += columnWidth;
        // 如果不是固定右列，后面的就不需要计算了
        if (column.fixed !== 'right') {
          break;
        }
      }
    }
  }

  /**
   * 计算表体叶子节点列的固定位置
   */
  calculateBodyFixedPositions(): void {
    this.bodyLeftPositions.clear();
    this.bodyRightPositions.clear();
    // 计算左固定列位置
    let leftPosition = 0;
    for (const column of this.leafColumns) {
      if (column.fixed === 'left' || column.fixed === true) {
        this.bodyLeftPositions.set(column.__id!, leftPosition);
        leftPosition += this.getColumnWidth(column);
      } else {
        // 一旦遇到非左固定列，就停止计算
        break;
      }
    }
    // 计算右固定列位置
    let rightPosition = 0;
    for (let i = this.leafColumns.length - 1; i >= 0; i--) {
      const column = this.leafColumns[i];
      if (column.fixed === 'right') {
        this.bodyRightPositions.set(column.__id!, rightPosition);
        rightPosition += this.getColumnWidth(column);
      } else {
        // 一旦遇到非右固定列，就停止计算
        break;
      }
    }
  }

  /**
   * 计算父列宽度（所有子列宽度之和）
   */
  calculateParentColumnWidth(column: TableColumn, columnWidths: Map<string, number>): number {
    let width = 0;
    const calculateWidth = (col: TableColumn) => {
      if (col.children && col.children.length > 0) {
        col.children.forEach(child => calculateWidth(child));
      } else {
        // 叶子节点
        width += columnWidths.get(col.__id!) || this.getColumnWidth(col);
      }
    };
    calculateWidth(column);
    return width;
  }

  /**
   * 获取表头列的左侧固定位置
   */
  getHeaderLeftPosition(rowIndex: number, colIndex: number): string | null {
    const position = this.headerLeftPositions[rowIndex]?.[colIndex];
    return position !== undefined ? `${position}px` : null;
  }

  /**
   * 获取表头列的右侧固定位置
   */
  getHeaderRightPosition(rowIndex: number, colIndex: number): string | null {
    const position = this.headerRightPositions[rowIndex]?.[colIndex];
    return position !== undefined ? `${position}px` : null;
  }

  /**
   * 获取表体列的左侧固定位置
   */
  getBodyLeftPosition(column: TableColumn): string | null {
    if (column.fixed !== 'left' && column.fixed !== true) {
      return null;
    }
    const position = this.bodyLeftPositions.get(column.__id!);
    return position !== undefined ? `${position}px` : null;
  }

  /**
   * 获取表体列的右侧固定位置
   */
  getBodyRightPosition(column: TableColumn): string | null {
    if (column.fixed !== 'right') {
      return null;
    }
    const position = this.bodyRightPositions.get(column.__id!);
    return position !== undefined ? `${position}px` : null;
  }

  /**
   * 获取嵌套值
   * @param data 数据
   * @param field 字段
   * @returns 嵌套值
   */
  getValue(data: any, field: string): any {
    return _.get(data, field, '--');
  }

  /**
   * 获取范围数
   * @param min 最小值
   * @param max 最大值
   */
  getRange(min: number, max: number): Array<number> {
    return this.utilsService.getRange(min, max);
  }

}


