import { Component, forwardRef, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'lib-number-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './number-input.component.html',
  styleUrl: './number-input.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputComponent),
      multi: true
    }
  ]
})
export class NumberInputComponent implements ControlValueAccessor {
  // 输入信号
  min = input<number | null>(null);
  max = input<number | null>(null);
  step = input<number>(1);
  precision = input<number>(0); // 小数精度
  placeholder = input<string>('');
  disabled = input<boolean>(false);
  readonly = input<boolean>(false);
  color = input<string>('black');
  prefix = input<string>('');
  suffix = input<string>('');
  prefixIcon = input<string>('');
  suffixIcon = input<string>('');
  status = input<'normal' | 'error' | 'warning'>('normal');
  formatter = input<(value: number) => any>(value => value);
  
  // 内部状态
  valueSignal = signal<number | null>(null);
  focused = signal<boolean>(false);
  inputValue = signal<number | null>(null);

  statusClass = computed(() => {
    return this.status() === 'error' ? 'lib-number-input-error' : this.status() === 'warning' ? 'lib-number-input-warning' : '';
  })
  // 计算属性
  displayValue = computed(() => {
    const value = this.valueSignal();
    if (value === null) return '';
    
    let formattedValue = this.formatter()(value);
    if (typeof formattedValue === 'number') {
      formattedValue = value.toFixed(this.precision());
    }
    return formattedValue;
  });

  // ControlValueAccessor 接口实现
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    // 确保新值符合精度要求
    if (value !== null) {
      const precision = this.precision();
      if (precision >= 0) {
        value = parseFloat(value.toFixed(precision));
      }
    }
    
    this.valueSignal.set(value);
    this.updateInputValue();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // 由于使用信号API，我们不能直接修改input信号
  }

  // 组件方法
  increase(): void {
    if (this.disabled() || this.readonly()) return;
    
    // 获取当前步进值
    const stepValue = this.step();
    
    // 默认从0开始，或使用当前值
    const currentValue = this.valueSignal() === null ? 0 : this.valueSignal()!;
    const newValue = currentValue + stepValue;
    
    // 检查最大值限制
    if (this.max() !== null && newValue > this.max()!) {
      return;
    }
    
    this.setValue(newValue);
  }

  decrease(): void {
    if (this.disabled() || this.readonly()) return;
    
    // 获取当前步进值
    const stepValue = this.step();
    
    // 默认从0开始，或使用当前值
    const currentValue = this.valueSignal() === null ? 0 : this.valueSignal()!;
    const newValue = currentValue - stepValue;
    
    // 检查最小值限制
    if (this.min() !== null && newValue < this.min()!) {
      return;
    }
    
    this.setValue(newValue);
  }
  
  setValue(value: number | null): void {
    if (value !== null) {
      // 限制在min和max范围内
      if (this.min() !== null && value < this.min()!) {
        value = this.min()!;
      }
      if (this.max() !== null && value > this.max()!) {
        value = this.max()!;
      }
      
      // 根据精度处理值
      const precision = this.precision();
      if (precision >= 0) {
        // 使用toFixed保证精确的小数位数
        value = parseFloat(value.toFixed(precision));
      }
    }
    
    this.valueSignal.set(value);
    this.updateInputValue(); // 更新显示值
    if (this.formatter() !== null) {
      this.onChange(this.formatter()(value!));
    }
  }

  onModelChange(value: number): void {
        // 处理空值
    if (value === null) {
      this.setValue(null);
      return;
    }
        
    // 尝试解析值
    if (!isNaN(value)) {
      // 最小值和最大值限制
      let finalValue = value;
      if (this.min() !== null && finalValue < this.min()!) {
        finalValue = this.min()!;
        this.setValue(finalValue); // 立即限制并更新显示
      } else if (this.max() !== null && finalValue > this.max()!) {
        finalValue = this.max()!;
        this.setValue(finalValue); // 立即限制并更新显示
      } else {
        // 不立即格式化显示，存储原始值
        this.valueSignal.set(value);
        this.onChange(value);
      }
    } else {
      // 解析失败，恢复原值
      this.updateInputValue();
    }
  }

  onBlur(): void {
    this.focused.set(false);
    this.onTouched();
    // 失去焦点时应用精度和验证
    const currentValue = this.valueSignal();
    if (currentValue !== null) {
      // 应用精度
      this.setValue(currentValue);
    }
  }

  onFocus(): void {
    this.focused.set(true);
  }

  // 辅助方法
  private updateInputValue(): void {
    const value = this.valueSignal();
    if (value === null) {
      this.inputValue.set(0);
    } else {
      // 根据精度格式化显示值
      const precision = this.precision();
      if (precision >= 0) {
        this.inputValue.set(Number(value.toFixed(precision)));
      } else {
        this.inputValue.set(Number(value.toString()));
      }
    }
  }
}
