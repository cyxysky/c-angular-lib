import { Component, Input, Output, EventEmitter, forwardRef, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';

export interface RadioOption {
  label: string;
  value: any;
  disabled?: boolean;
}

@Component({
  selector: 'lib-radio',
  imports: [CommonModule, FormsModule],
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.less',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioComponent),
      multi: true
    }
  ]
})
export class RadioComponent implements ControlValueAccessor {
  @Input() options: RadioOption[] = [];
  @Input() direction: 'horizontal' | 'vertical' = 'horizontal';
  @Input() color: string = ''; // 默认颜色
  @Input() labelTemplate: TemplateRef<any> | null = null;
  @Output() valueChange = new EventEmitter<any>();

  value: any;
  disabled: boolean = false;

  // ControlValueAccessor 接口实现
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.value = value;
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

  // 选择选项
  selectOption(option: RadioOption): void {
    if (this.disabled || option.disabled) {
      return;
    }
    
    this.value = option.value;
    this.onChange(this.value);
    this.onTouched();
    this.valueChange.emit(this.value);
  }

  // 判断选项是否被选中
  isChecked(option: RadioOption): boolean {
    return this.value === option.value;
  }
}
