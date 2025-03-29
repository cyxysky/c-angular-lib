import { Component, Input, forwardRef, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface CheckboxOption {
  label: string;
  value: any;
  disabled?: boolean;
  indeterminate?: boolean;
}

export type CheckboxDirection = 'horizontal' | 'vertical';

@Component({
  selector: 'lib-checkbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ]
})
export class CheckboxComponent implements ControlValueAccessor, OnInit {
  //#region 输入属性 (Inputs)
  /** 选项 */
  @Input({ alias: 'checkboxOptions' }) options: CheckboxOption[] = [];
  /** 方向 */
  @Input({ alias: 'checkboxDirection' }) direction: CheckboxDirection = 'horizontal';
  /** 复选框颜色 */
  @Input({ alias: 'checkboxColor' }) checkboxColor: string = '#1890ff';
  /** 是否半选 */
  @Input({ alias: 'checkboxIndeterminate' }) indeterminate: boolean = false;
  /** 标签模板 */
  @Input({ alias: 'checkboxLabelTemplate' }) labelTemplate: TemplateRef<any> | null = null;
  //#endregion

  //#region 内部状态变量
  /** 选中的值数组 */
  value: any[] = [];
  /** 选项选中状态映射 */
  isChecked: { [key: string]: boolean } = {};
  /** 是否禁用 */
  disabled: boolean = false;
  //#endregion

  //#region 生命周期钩子
  ngOnInit(): void {
    this.updateCheckedStatus();
  }
  //#endregion

  //#region 数据处理方法
  /**
   * 更新选中状态
   */
  updateCheckedStatus(): void {
    this.isChecked = {};
    if (this.value && this.options) {
      this.options.forEach(option => {
        const key = this.getOptionKey(option.value);
        this.isChecked[key] = this.value.some(
          val => this.getOptionKey(val) === key
        );
        
        if (option.indeterminate && !this.isChecked[key]) {
          this.value = [...this.value, option.value];
          this.isChecked[key] = true;
        }
      });
    }
  }

  /**
   * 切换选项状态
   */
  toggleOption(option: CheckboxOption): void {
    if (this.disabled || option.disabled) return;
    
    const optionValue = option.value;
    const optionValueKey = this.getOptionKey(optionValue);
    
    if (option.indeterminate) {
      option.indeterminate = false;
      if (!this.isChecked[optionValueKey]) {
        this.value = [...this.value, optionValue];
        this.isChecked[optionValueKey] = true;
      }
    } else {
      if (this.isChecked[optionValueKey]) {
        this.value = this.value.filter(
          val => this.getOptionKey(val) !== optionValueKey
        );
      } else {
        this.value = [...this.value, optionValue];
      }
    }
    
    this.updateCheckedStatus();
    this.onChange(this.value);
    this.onTouched();
  }

  /**
   * 切换全选状态
   */
  toggleAll(): void {
    if (this.disabled) return;
    const shouldCheckAll = !this.isAllChecked();
    if (shouldCheckAll) {
      // 选中所有未禁用的选项
      this.value = this.options
        .filter(opt => !opt.disabled)
        .map(opt => opt.value);
    } else {
      // 取消所有选中
      this.value = [];
    }
    this.updateCheckedStatus();
    this.onChange(this.value);
    this.onTouched();
  }
  //#endregion

  //#region 工具方法
  /**
   * 获取选项键
   */
  getOptionKey(value: any): string {
    return JSON.stringify(value);
  }

  /**
   * 获取不确定状态
   */
  getIndeterminateState(): boolean {
    if (this.indeterminate) return true;
    
    const checkedCount = Object.values(this.isChecked).filter(v => v).length;
    return checkedCount > 0 && checkedCount < this.options.length;
  }

  /**
   * 是否全选
   */
  isAllChecked(): boolean {
    return this.options.length > 0 && 
           this.options.every(opt => this.isChecked[this.getOptionKey(opt.value)]);
  }

  /**
   * 获取选项选中状态
   */
  getOptionCheckedState(option: any): boolean {
    // 如果有唯一ID，优先使用
    if (option.id !== undefined) {
      return this.isChecked[this.getOptionKey(option.value)];
    }
    
    // 否则尝试使用值本身作为键（如果是简单类型）
    if (typeof option.value === 'string' || typeof option.value === 'number') {
      return this.isChecked[this.getOptionKey(option.value)];
    }
    
    // 最后才使用JSON序列化（可以添加缓存机制以提高性能）
    return this.isChecked[this.getOptionKey(option.value)];
  }
  //#endregion

  //#region ControlValueAccessor 实现
  /** 值变更回调函数 */
  onChange: any = () => {};
  /** 触摸回调函数 */
  onTouched: any = () => {};

  /**
   * 写入值
   */
  writeValue(value: any[]): void {
    this.value = value || [];
    this.updateCheckedStatus();
  }

  /**
   * 注册变更函数
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * 注册触摸函数
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * 设置禁用状态
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  //#endregion
}
