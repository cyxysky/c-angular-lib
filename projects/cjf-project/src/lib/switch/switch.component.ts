import { booleanAttribute, Component, ElementRef, forwardRef, input, model, output, signal, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { single } from 'rxjs';

@Component({
  selector: 'lib-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true
    }
  ]
})
export class SwitchComponent implements ControlValueAccessor {
  @ViewChild('switchButton') switchButton!: ElementRef;

  // 使用input()函数替代@Input装饰器
  disabled = input(false, { transform: booleanAttribute });
  loading = input(false, { transform: booleanAttribute });
  checkedChildren = input<string>('');
  unCheckedChildren = input<string>('');
  size = input<'default' | 'small'>('default');

  // 使用model()函数创建双向绑定
  checked = signal(false);

  // 使用Signal管理内部状态
  private focusedState = signal(false);
  focused = this.focusedState.asReadonly();

  // ControlValueAccessor接口实现
  private onChange: (value: boolean) => void = () => { };
  private onTouched: () => void = () => { };

  toggle(): void {
    if (this.disabled() || this.loading()) {
      return;
    }
    const newValue = !this.checked();
    this.checked.set(newValue);
    this.onChange(newValue);
  }

  // ControlValueAccessor接口方法
  writeValue(value: boolean): void {
    this.checked.set(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {

  }

  onFocus(): void {
    this.focusedState.set(true);
    this.onTouched();
  }

  onBlur(): void {
    this.focusedState.set(false);
  }
}
