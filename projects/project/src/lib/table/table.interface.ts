import { TemplateRef } from '@angular/core';

// 表格列筛选项接口
export interface TableColumnFilter {
  type: 'text' | 'number' | 'date' | 'select' | 'select-multiple' | 'cascader' | 'cascader-multiple' | 'tree-select' | 'tree-select-multiple' | 'tree-select-checkable';
  name: string;
  defaultValue?: any | { start: any, end: any };
  options?: any[];
  checked?: boolean;
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
  filters?: TableColumnFilter;
  // 自定义单元格渲染
  customCell?: TemplateRef<{ $implicit: any; text: any; record: any; index: number }> | null;
  // 自定义筛选模板
  filterTemplate?: TemplateRef<{ $implicit: TableColumn }> | null;
  // 是否固定列 (true/'left' 表示左固定，'right' 表示右固定)
  fixed?: boolean | 'left' | 'right';
}

export interface TableSize {
  default: 'default';
  middle: 'middle';
  small: 'small';
}
