/** 复选框选项 */
export interface CheckboxOption {
    /** 标签 */
    label: string;
    /** 值 */
    value: any;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否半选 */
    indeterminate?: boolean;
}

/** 复选框方向 */
export type CheckboxDirection = 'horizontal' | 'vertical';