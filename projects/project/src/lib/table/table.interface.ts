import { TemplateRef } from '@angular/core';

// 表格列筛选项接口
export interface TableColumnFilter {
  text: string;
  value: any;
  byDefault?: boolean;
  checked?: boolean; // 添加checked属性用于跟踪选中状态
}

// 表格列接口
export interface TableColumn {
  // 列标题
  title: string;
  // 列标题模板
  titleTemplate?: TemplateRef<{ $implicit: TableColumn }> | null;
  // 字段名，对应数据对象的属性
  field: string;
  // 列类型，operation表示操作列
  type?: 'operation' | string;
  // 列宽度
  width?: string | number;
  // 列对齐方式
  align?: 'left' | 'center' | 'right';
  // 列是否可排序
  sortable?: boolean;
  // 当前排序方向
  sortOrder?: 'ascend' | 'descend' | null;
  // 列是否可筛选
  filterable?: boolean;
  // 筛选项
  filters?: TableColumnFilter[];
  // 已选择的筛选值
  selectedFilters?: any[];
  // 是否多选筛选
  filterMultiple?: boolean;
  // 筛选下拉框是否显示
  showFilterDropdown?: boolean;
  // 自定义单元格渲染
  customCell?: TemplateRef<{ $implicit: any; text: any; record: any; index: number }> | null;
  // 自定义筛选模板
  filterTemplate?: TemplateRef<{ $implicit: TableColumn }> | null;
  // 操作列模板，用于渲染操作列的内容
  operationTemplate?: TemplateRef<{ $implicit: any; record: any; index: number }> | null;
  // 是否固定列 (true/'left' 表示左固定，'right' 表示右固定)
  fixed?: boolean | 'left' | 'right';
}

export interface TableSize {
  default: 'default';
  middle: 'middle';
  small: 'small';
}
  