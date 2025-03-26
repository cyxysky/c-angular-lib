import { Component, Input, forwardRef, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface CheckboxOption {
  label: string;
  value: any;
  disabled?: boolean;
  indeterminate?: boolean;
}

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
  @Input() options: CheckboxOption[] = [];
  @Input() direction: 'horizontal' | 'vertical' = 'horizontal';
  @Input() checkboxColor: string = '#1890ff';
  @Input() indeterminate: boolean = false;
  @Input() labelTemplate: TemplateRef<any> | null = null;

  value: any[] = [];
  isChecked: { [key: string]: boolean } = {};
  onChange: any = () => {};
  onTouched: any = () => {};
  disabled: boolean = false;

  ngOnInit(): void {
    this.updateCheckedStatus();
  }

  getOptionKey(value: any): string {
    return JSON.stringify(value);
  }

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

  writeValue(value: any[]): void {
    this.value = value || [];
    this.updateCheckedStatus();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  getIndeterminateState(): boolean {
    if (this.indeterminate) return true;
    
    const checkedCount = Object.values(this.isChecked).filter(v => v).length;
    return checkedCount > 0 && checkedCount < this.options.length;
  }

  isAllChecked(): boolean {
    return this.options.length > 0 && 
           this.options.every(opt => this.isChecked[this.getOptionKey(opt.value)]);
  }

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
}
