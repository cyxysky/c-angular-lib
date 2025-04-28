import { Component, ChangeDetectionStrategy, ViewEncapsulation, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, TemplateRef, Pipe, PipeTransform, ElementRef, Renderer2, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableColumn, TableSize } from './table.interface';
import { DropMenuDirective } from '../drop-menu/drop-menu.directive';
import { SelectComponent } from '../select/select.component';
import { NumberInputComponent } from '../number-input/number-input.component';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from "../button/button.component";
import { InputComponent } from "../input/input.component";
import { DateTimerComponent } from '../date-timer/date-timer.component';
import { CascaderComponent } from '../cascader/cascader.component';
import { TreeSelectComponent } from '../tree-select/tree-select.component';
import { RadioComponent } from '../radio/radio.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import * as _ from 'lodash';
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
    ButtonComponent,
    InputComponent,
    DateTimerComponent,
    CascaderComponent,
    TreeSelectComponent,
    RadioComponent,
    CheckboxComponent
  ],
  selector: 'lib-table',
  standalone: true,
  templateUrl: './table.component.html',
  styleUrl: './table.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TableComponent implements OnInit, OnChanges {
  // 表格数据
  @Input() data: any[] = [];

  // 表格列配置
  @Input() columns: TableColumn[] = [];

  // 表格大小
  @Input() size: TableSize = 'default';

  // 是否显示边框
  @Input() bordered: boolean = false;

  // 是否显示loading状态
  @Input() loading: boolean = false;

  // 自定义loading模板
  @Input() loadingIndicator: TemplateRef<void> | null = null;

  // 表格标题
  @Input() title: string | TemplateRef<void> | null = null;

  // 表格底部
  @Input() footer: string | TemplateRef<void> | null = null;

  // 是否显示工具栏
  @Input() showToolbar: boolean = false;

  // 工具栏模板
  @Input() toolbarTemplate: TemplateRef<void> | null = null;

  // 工具栏操作区域模板
  @Input() toolbarActionsTemplate: TemplateRef<void> | null = null;

  // 自定义空数据模板
  @Input() emptyTemplate: TemplateRef<void> | null = null;

  // 分页相关
  @Input() showPagination: boolean = true;
  @Input() pageIndex: number = 1;
  @Input() pageSize: number = 10;
  @Input() total: number = 0;
  @Input() pageSizeOptions: number[] = [10, 20, 30, 50];
  @Input() showQuickJumper: boolean = true;
  @Input() showTotal: boolean = true;
  @Input() fixedPagination: boolean = false;
  @Input() paginationTemplate: TemplateRef<any> | null = null;

  // 是否前端分页
  @Input() frontPagination: boolean = true;

  // 用于表格滚动的配置
  @Input() scroll: { x?: string | null; y?: string | null } = { x: null, y: null };

  // 排序变化事件
  @Output() sortChange = new EventEmitter<{ field: string; order: 'ascend' | 'descend' | null }>();

  // 过滤变化事件
  @Output() filterChange = new EventEmitter<{ field: string; value: any[] }>();

  // 页码变化事件
  @Output() pageIndexChange = new EventEmitter<number>();

  // 每页条数变化事件
  @Output() pageSizeChange = new EventEmitter<number>();

  // 当前页数据变化事件
  @Output() currentPageDataChange = new EventEmitter<any[]>();

  // 当前页数据
  currentPageData: any[] = [];

  // 是否有左侧固定列
  hasFixedLeft: boolean = false;

  // 是否有右侧固定列
  hasFixedRight: boolean = false;

  // 各列的宽度缓存
  private columnWidths: Map<string, number> = new Map();

  // 各列的筛选状态
  public filterVisibleMap: { [key: string]: boolean } = {};

  // 原始数据备份，用于筛选和排序
  private originalData: any[] = [];

  // 各列的筛选值
  public filterValueMap: { [key: string]: any } = {};
  public filterValueMapTemplate: { [key: string]: any } = {};

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    public cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // 备份原始数据
    this.originalData = [...this.data];
    this.refreshData();
    this.checkFixedColumns();
    // 初始化设置滚动状态，只有在有水平滚动条时才添加阴影效果
    setTimeout(() => {
      const tableElement = this.elementRef.nativeElement.querySelector('.lib-table');
      const container = this.elementRef.nativeElement.querySelector('.lib-table-container');
      if (tableElement && container) {
        // 检查是否有水平滚动条
        const hasHorizontalScroll = container.scrollWidth > container.clientWidth;

        if (hasHorizontalScroll) {
          this.renderer.addClass(tableElement, 'lib-table-scroll-start');
          this.renderer.removeClass(tableElement, 'lib-table-scroll-middle');
          this.renderer.removeClass(tableElement, 'lib-table-scroll-end');
        } else {
          // 没有滚动条时移除所有滚动相关类
          this.renderer.removeClass(tableElement, 'lib-table-scroll-start');
          this.renderer.removeClass(tableElement, 'lib-table-scroll-middle');
          this.renderer.removeClass(tableElement, 'lib-table-scroll-end');
        }
      }
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      // 当数据源变化时，备份原始数据
      this.originalData = [...this.data];
    }
    if (changes['data'] || changes['pageIndex'] || changes['pageSize'] || changes['columns']) {
      this.refreshData();
    }
    if (changes['columns']) {
      this.checkFixedColumns();
    }
  }

  /**
   * 处理表格滚动事件，根据滚动位置控制阴影效果
   */
  onTableScroll(event: Event): void {
    const container = event.target as HTMLElement;
    if (!container) return;
    const tableElement = this.elementRef.nativeElement.querySelector('.lib-table');
    if (!tableElement) return;
    // 检查是否有水平滚动条
    const hasHorizontalScroll = container.scrollWidth > container.clientWidth;
    // 如果没有水平滚动条，移除所有滚动相关类名
    if (!hasHorizontalScroll) {
      this.renderer.removeClass(tableElement, 'lib-table-scroll-start');
      this.renderer.removeClass(tableElement, 'lib-table-scroll-middle');
      this.renderer.removeClass(tableElement, 'lib-table-scroll-end');
      return;
    }
    const scrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    // 在最左侧时，左侧无阴影，右侧有阴影
    if (scrollLeft === 0) {
      this.renderer.addClass(tableElement, 'lib-table-scroll-start');
      this.renderer.removeClass(tableElement, 'lib-table-scroll-middle');
      this.renderer.removeClass(tableElement, 'lib-table-scroll-end');
    }
    // 在最右侧时，左侧有阴影，右侧无阴影
    else if (Math.abs(scrollLeft - maxScrollLeft) < 1) {
      this.renderer.removeClass(tableElement, 'lib-table-scroll-start');
      this.renderer.removeClass(tableElement, 'lib-table-scroll-middle');
      this.renderer.addClass(tableElement, 'lib-table-scroll-end');
    }
    // 在中间位置时，两侧都显示阴影
    else {
      this.renderer.removeClass(tableElement, 'lib-table-scroll-start');
      this.renderer.addClass(tableElement, 'lib-table-scroll-middle');
      this.renderer.removeClass(tableElement, 'lib-table-scroll-end');
    }
  }

  /**
   * 刷新表格数据
   */
  refreshData(): void {
    if (this.frontPagination) {
      // 前端分页
      const start = (this.pageIndex - 1) * this.pageSize;
      const end = start + this.pageSize;
      this.currentPageData = this.data.slice(start, end);
    } else {
      // 服务端分页
      this.currentPageData = this.data;
    }
    // 触发当前页数据变化事件
    this.currentPageDataChange.emit(this.currentPageData);
  }

  /**
   * 检查是否有固定列
   */
  checkFixedColumns(): void {
    this.hasFixedLeft = this.columns.some(column => column.fixed === true || column.fixed === 'left');
    this.hasFixedRight = this.columns.some(column => column.fixed === 'right');
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
    this.onSortChange(field, newOrder);
  }

  /**
   * 处理排序变化
   */
  onSortChange(field: string, order: 'ascend' | 'descend' | null): void {
    // 更新所有列的排序状态
    this.columns.forEach(column => {
      if (column.field === field) {
        column.sortOrder = order;
      } else {
        column.sortOrder = null;
      }
    });
    // 如果是前端排序，则直接排序数据
    if (this.frontPagination && order) {
      const isAscend = order === 'ascend';
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
    // 发送排序事件
    this.sortChange.emit({ field, order });
  }

  /**
   * 打开过滤弹窗
   */
  openFilter(column: TableColumn): void {
    this.filterValueMapTemplate = _.cloneDeep(this.filterValueMap);
  }

  /**
   * 处理页码变化
   */
  onPageIndexChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.pageIndexChange.emit(pageIndex);
    this.refreshData();
  }

  /**
   * 处理每页条数变化
   */
  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageSizeChange.emit(pageSize);
    this.refreshData();
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
   * 处理选择器变化事件
   */
  handleSelectChange(event: Event): number {
    const target = event.target as HTMLSelectElement;
    return +target.value;
  }

  /**
   * 处理输入框变化事件
   */
  handleInputChange(event: Event): number {
    const target = event.target as HTMLInputElement;
    return +target.value;
  }


  /**
   * 处理筛选项变化
   */
  onFilterItemChange(column: TableColumn, value: any, event: Event): void {

  }

  /**
   * 确认筛选
   */
  confirmFilter(column: TableColumn): void {
    this.filterVisibleMap[column.field] = false;
    this.filterValueMap[column.field] = this.filterValueMapTemplate[column.field];
    this.cdr.detectChanges();
  }

  /**
   * 应用所有筛选条件
   */
  private applyFilters(data: any[]): any[] {
    return data.filter(item => {
    });
  }

  /**
   * 重置筛选
   */
  resetFilter(column: TableColumn): void {
    this.filterVisibleMap[column.field] = false;
    delete this.filterValueMap[column.field];
    delete this.filterValueMapTemplate[column.field];
    this.filterChange.emit({ field: column.field, value: [] });
  }

  /**
   * 重置所有筛选和排序
   */
  resetAll(): void {
    // 重置所有列的筛选和排序状态
    this.columns.forEach(column => {
      column.sortOrder = null;
    });
    // 恢复原始数据
    this.data = [...this.originalData];
    // 刷新数据
    this.refreshData();
  }

  /**
   * 获取左侧固定列的位置
   */
  getLeftPosition(column: TableColumn): string | null {
    if (column.fixed !== 'left' && column.fixed !== true) {
      return null;
    }
    let position = 0;
    for (let i = 0; i < this.columns.length; i++) {
      const col = this.columns[i];
      if (col === column) {
        break;
      }
      if (col.fixed === 'left' || col.fixed === true) {
        // 使用默认宽度或从DOM获取实际宽度
        position += this.getColumnWidth(col);
      }
    }
    return `${position}px`;
  }

  /**
   * 获取右侧固定列的位置
   */
  getRightPosition(column: TableColumn): string | null {
    if (column.fixed !== 'right') {
      return null;
    }
    let position = 0;
    for (let i = this.columns.length - 1; i >= 0; i--) {
      const col = this.columns[i];
      if (col === column) {
        break;
      }
      if (col.fixed === 'right') {
        position += this.getColumnWidth(col);
      }
    }
    return `${position}px`;
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
      }
      return 100; // 默认宽度
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
}
