export interface TableColumn {
    title: string;
    field: string;
    width?: string | null;
    sortable?: boolean;
    sortOrder?: 'ascend' | 'descend' | null;
    filterable?: boolean;
    filters?: Array<{ text: string; value: any; byDefault?: boolean }>;
    filterMultiple?: boolean;
    align?: 'left' | 'right' | 'center';
    fixed?: boolean | 'left' | 'right';
    customCell?: any;
    showFilterDropdown?: boolean;
    selectedFilters?: any[];
  }
  
  export interface TableSize {
    default: 'default';
    middle: 'middle';
    small: 'small';
  }
  