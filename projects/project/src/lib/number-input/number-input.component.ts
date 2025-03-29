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
  //#region 输入属性 (Inputs)
  /** 最小值 */
  min = input<number | null>(null, { alias: 'numberInputMin' });
  /** 最大值 */
  max = input<number | null>(null, { alias: 'numberInputMax' });
  /** 步长 */
  step = input<number>(1, { alias: 'numberInputStep' });
  /** 小数精度 */
  precision = input<number>(0, { alias: 'numberInputPrecision' });
  /** 占位符 */
  placeholder = input<string>('', { alias: 'numberInputPlaceholder' });
  /** 是否禁用 */
  disabled = input<boolean>(false, { alias: 'numberInputDisabled' });
  /** 是否只读 */
  readonly = input<boolean>(false, { alias: 'numberInputReadonly' });
  /** 颜色 */
  color = input<string>('black', { alias: 'numberInputColor' });
  /** 前缀 */
  prefix = input<string>('', { alias: 'numberInputPrefix' });
  /** 后缀 */
  suffix = input<string>('', { alias: 'numberInputSuffix' });
  /** 前缀图标 */
  prefixIcon = input<string>('', { alias: 'numberInputPrefixIcon' });
  /** 后缀图标 */
  suffixIcon = input<string>('', { alias: 'numberInputSuffixIcon' });
  /** 状态 */
  status = input<'normal' | 'error' | 'warning'>('normal', { alias: 'numberInputStatus' });
  /** 格式化函数 */
  formatter = input<(value: number) => any>(value => value, { alias: 'numberInputFormatter' });
  //#endregion

  //#region 内部状态变量
  /** 当前值 */
  valueSignal = signal<number | null>(null);
  /** 是否获得焦点 */
  focused = signal<boolean>(false);
  /** 输入框值 */
  inputValue = signal<number | null>(null);

  /** 状态CSS类 */
  statusClass = computed(() => {
    return this.status() === 'error' ? 'lib-number-input-error' : 
           this.status() === 'warning' ? 'lib-number-input-warning' : '';
  });

  /** 显示值（经过格式化处理） */
  displayValue = computed(() => {
    const value = this.valueSignal();
    if (value === null) return '';
    
    let formattedValue = this.formatter()(value);
    if (typeof formattedValue === 'number') {
      formattedValue = value.toFixed(this.precision());
    }
    return formattedValue;
  });
  //#endregion

  //#region 业务方法
  /**
   * 增加值
   */
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

  /**
   * 减少值
   */
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
  
  /**
   * 设置值
   */
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

  /**
   * 模型值变更处理
   */
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

  /**
   * 失去焦点事件处理
   */
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

  /**
   * 获得焦点事件处理
   */
  onFocus(): void {
    this.focused.set(true);
  }
  //#endregion

  //#region 工具方法
  /**
   * 更新输入框值
   */
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
  //#endregion

  //#region ControlValueAccessor 实现
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * 写入值
   */
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

  /**
   * 注册变更处理函数
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * 注册触摸处理函数
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * 设置禁用状态
   */
  setDisabledState(isDisabled: boolean): void {
    // 由于使用信号API，我们不能直接修改input信号
  }
  //#endregion
}
