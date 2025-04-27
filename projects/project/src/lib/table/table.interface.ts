import { TemplateRef } from '@angular/core';
import { ButtonColor, ButtonShape, ButtonSize, ButtonType } from '../button';

// 表格列筛选项接口
export interface TableColumnFilter {
  type: 'text' | 'number' | 'date' | 'select' | 'select-multiple' | 'cascader' | 'cascader-multiple' | 'tree-select' | 'tree-select-multiple' | 'tree-select-checkable' | 'date-range' | 'radio' | 'checkbox';
  defaultValue?: any | { start: any, end: any };
  options?: any[];
  condition?: TableColumnFilterCondition[];
}

// 表格列接口
export interface TableColumn {
  // 列标题
  title: string;
  // 列头模板
  headTemplate?: TemplateRef<{ $implicit: TableColumn }> | null;
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
  // 自定义筛选模板
  filterTemplate?: TemplateRef<{ $implicit: TableColumn }> | null;
  // 表身模板
  template?: TemplateRef<{ $implicit: any; field: TableColumn; index: number }> | null;
  // 是否固定列 (true/'left' 表示左固定，'right' 表示右固定)
  fixed?: boolean | 'left' | 'right';
  // 按钮配置
  buttons?: Array<{
    type?: ButtonType;
    shape?: ButtonShape;
    size?: ButtonSize;
    color?: ButtonColor;
    text: string;
    icon?: string;
    disabled?: boolean;
    show?: (data: any, rowIndex: number) => boolean;
    click: (data: any, rowIndex: number) => void;
  }>;
}

/**
 * 表格大小
 */
export type TableSize = 'default' | 'middle' | 'small';

/**
 * 表格列筛选条件
 */
export interface TableColumnFilterCondition {
  value: TableFiltterCondition;
  label: string;
}

/**
 * 筛选条件
 */
export enum TableFiltterCondition {
  EQUAL = 'equal',
  NOT_EQUAL = 'notEqual',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual',
  LESS_THAN_OR_EQUAL = 'lessThanOrEqual',
  IN = 'in',
  NOT_IN = 'notIn',
  BETWEEN = 'between',
  NOT_BETWEEN = 'notBetween',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  IS_NULL = 'isNull',
  IS_NOT_NULL = 'isNotNull',
}

