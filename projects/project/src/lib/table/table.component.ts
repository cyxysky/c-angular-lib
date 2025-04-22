import { Component, ChangeDetectionStrategy, ViewEncapsulation, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, TemplateRef, Pipe, PipeTransform, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableColumn } from './table.interface';
import { DropMenuDirective } from '../drop-menu/drop-menu.directive';
import { SelectComponent } from '../select/select.component';
import { NumberInputComponent } from '../number-input/number-input.component';
import { FormsModule } from '@angular/forms';
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
  selector: 'lib-table',
  imports: [
    CommonModule, 
    DropMenuDirective, 
    SelectComponent, 
    NumberInputComponent,
    FormsModule,
    PageSizeOptionsFormatPipe
  ],
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
  @Input() size: 'default' | 'middle' | 'small' = 'default';

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

  // 原始数据备份，用于筛选和排序
  private originalData: any[] = [];

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    // 备份原始数据
    this.originalData = [...this.data];
    this.refreshData();
    this.checkFixedColumns();
    
    // 初始化设置滚动状态为起始状态（显示右侧阴影）
    setTimeout(() => {
      const tableElement = this.elementRef.nativeElement.querySelector('.lib-table');
      if (tableElement) {
        this.renderer.addClass(tableElement, 'lib-table-scroll-start');
        this.renderer.removeClass(tableElement, 'lib-table-scroll-middle');
        this.renderer.removeClass(tableElement, 'lib-table-scroll-end');
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
   * 处理过滤项点击
   */
  onFilterItemClick(column: TableColumn, item: any): void {
    if (!column) return;
    
    // 防止项目为undefined
    if (!column.selectedFilters) {
      column.selectedFilters = [];
    }
    
    if (!item || item.value === undefined) return;
    
    const index = column.selectedFilters.findIndex(value => value === item.value);
    
    // 如果是单选模式
    if (!column.filterMultiple) {
      column.selectedFilters = [item.value];
    } else {
      // 多选模式，切换选中状态
      if (index === -1) {
        column.selectedFilters.push(item.value);
      } else {
        column.selectedFilters.splice(index, 1);
      }
    }
    
    // 设置item的checked属性
    if (column.filters) {
      column.filters.forEach(filter => {
        if (filter) {
          filter.checked = column.selectedFilters?.includes(filter.value);
        }
      });
    }
  }

  /**
   * 处理过滤变化
   */
  onFilterChange(field: string, value: any[]): void {
    this.filterChange.emit({ field, value });
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
   * 关闭一个列的筛选下拉框，并打开另一个
   */
  toggleFilterDropdown(column: TableColumn): void {
    // 初始化selectedFilters，如果还没有初始化的话
    if (!column.selectedFilters) {
      column.selectedFilters = [];
    }
    
    // 先关闭其他列的筛选下拉框
    this.columns.forEach(col => {
      if (col !== column) {
        col.showFilterDropdown = false;
      }
    });
    
    // 切换当前列的筛选下拉框
    column.showFilterDropdown = column.showFilterDropdown === true ? false : true;
  }

  /**
   * 处理过滤器可见性变化的事件
   */
  handleFilterVisibleChange(column: TableColumn, visible: boolean): void {
    if (!column) return;

    if (!column.selectedFilters) {
      column.selectedFilters = [];
    }
    
    // 先关闭其他列的筛选下拉框
    if (visible) {
      this.columns.forEach(col => {
        if (col && col !== column) {
          col.showFilterDropdown = false;
        }
      });
    }
    
    column.showFilterDropdown = visible;
  }

  /**
   * 判断筛选项是否被选中
   */
  isFilterChecked(column: TableColumn, value: any): boolean | undefined {
    if (!column || !column.selectedFilters) return false;
    return column.selectedFilters.indexOf(value) >= 0;
  }

  /**
   * 处理筛选项变化
   */
  onFilterItemChange(column: TableColumn, value: any, event: Event): void {
    if (!column) return;
    
    const target = event.target as HTMLInputElement;
    const checked = target.checked;
    
    if (!column.selectedFilters) {
      column.selectedFilters = [];
    }
    
    if (checked) {
      // 如果是单选模式，清空之前的选择
      if (!column.filterMultiple) {
        column.selectedFilters = [value];
      } else {
        // 多选模式，添加到已选择的数组中
        if (column.selectedFilters.indexOf(value) < 0) {
          column.selectedFilters.push(value);
        }
      }
    } else {
      // 从已选择的数组中移除
      const index = column.selectedFilters.indexOf(value);
      if (index >= 0) {
        column.selectedFilters.splice(index, 1);
      }
    }
  }

  /**
   * 确认筛选
   */
  confirmFilter(column: TableColumn): void {
    if (!column) return;
    
    column.showFilterDropdown = false;
    
    // 前端过滤
    if (this.frontPagination && column.selectedFilters && column.selectedFilters.length > 0) {
      // 应用所有列的过滤条件
      const filteredData = this.applyFilters(this.data);
      this.data = filteredData;
      
      // 刷新数据
      this.refreshData();
    }

    this.filterChange.emit({ field: column.field, value: column.selectedFilters || [] });
  }

  /**
   * 应用所有筛选条件
   */
  private applyFilters(data: any[]): any[] {
    return data.filter(item => {
      // 检查每一列的筛选条件
      return this.columns.every(column => {
        if (!column) return true;
        
        // 如果该列没有筛选或筛选值为空，则通过筛选
        if (!column.selectedFilters || column.selectedFilters.length === 0) {
          return true;
        }

        const itemValue = item && column.field ? item[column.field] : undefined;
        if (itemValue === undefined) return true;
        
        // 根据不同类型的比较方式处理
        if (typeof itemValue === 'string') {
          // 字符串值，检查是否包含在筛选值中
          return column.selectedFilters.some(filterValue => 
            typeof filterValue === 'string' && itemValue.indexOf(filterValue) >= 0);
        } else if (typeof itemValue === 'number') {
          // 数字值，可能是范围或精确值
          return column.selectedFilters.some(filterValue => {
            if (typeof filterValue === 'number') {
              // 精确匹配
              return itemValue === filterValue;
            } else if (filterValue) {
              // 对于范围值的处理（如"30岁以下"、"30-40岁"等）
              // 这里假设筛选值定义为分界点，例如30、40
              // 比较方式可以根据实际需求调整
              if (column.filters) {
                const filterObj = column.filters.find(f => f && f.value === filterValue);
                if (filterObj) {
                  if (filterObj.text.indexOf('以下') >= 0) {
                    return itemValue < filterValue;
                  } else if (filterObj.text.indexOf('以上') >= 0) {
                    return itemValue >= filterValue;
                  }
                }
              }
              return itemValue === filterValue;
            }
            return false;
          });
        } else {
          // 其他类型，如布尔值等
          return column.selectedFilters.includes(itemValue);
        }
      });
    });
  }

  /**
   * 重置筛选
   */
  resetFilter(column: TableColumn): void {
    if (!column) return;
    
    column.selectedFilters = [];
    column.showFilterDropdown = false;
    
    // 如果是前端筛选，恢复为原始数据后再应用其他筛选条件
    if (this.frontPagination) {
      // 先恢复原始数据
      this.data = [...this.originalData];
      
      // 然后应用其他列的筛选条件
      const filteredData = this.applyFilters(this.data);
      this.data = filteredData;
      
      // 刷新数据
      this.refreshData();
    }
    
    this.filterChange.emit({ field: column.field, value: [] });
  }

  /**
   * 重置所有筛选和排序
   */
  resetAll(): void {
    // 重置所有列的筛选和排序状态
    this.columns.forEach(column => {
      column.selectedFilters = [];
      column.sortOrder = null;
    });
    
    // 恢复原始数据
    this.data = [...this.originalData];
    
    // 刷新数据
    this.refreshData();
  }

  /**
   * 获取表头内容
   */
  getTitleContent(): string | TemplateRef<void> | null {
    // 检查是否有标题内容
    if (this.title) {
      return this.title;
    }
    
    // 检查是否有名为'title'的模板引用
    const titleElement = document.querySelector('#title');
    if (titleElement) {
      return titleElement as any;
    }
    
    return null;
  }

  /**
   * 获取表尾内容
   */
  getFooterContent(): string | TemplateRef<void> | null {
    // 检查是否有底部内容
    if (this.footer) {
      return this.footer;
    }
    
    // 检查是否有名为'footer'的模板引用
    const footerElement = document.querySelector('#footer');
    if (footerElement) {
      return footerElement as any;
    }
    
    return null;
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
}
