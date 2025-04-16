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