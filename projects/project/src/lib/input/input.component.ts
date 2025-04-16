import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, input, InputSignal, OnChanges, OnInit, Output, SimpleChanges, effect, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { InputSize, InputStatus } from './input.interface';

@Component({
  selector: 'lib-input',
  imports: [FormsModule, CommonModule, NzIconModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent implements ControlValueAccessor {
  /** 输入框大小 */
  size = input<InputSize>('default', { alias: 'inputSize' });
  /** 输入框前缀 */
  prefix = input<string>('', { alias: 'inputPrefix' });
  /** 输入框后缀 */
  suffix = input<string>('', { alias: 'inputSuffix' });
  /** 前缀图标 */
  prefixIcon = input<string>('', { alias: 'inputPrefixIcon' });
  /** 后缀图标 */
  suffixIcon = input<string>('', { alias: 'inputSuffixIcon' });
  /** 输入框提示 */
  placeholder = input<string>('', { alias: 'inputPlaceholder' });
  /** 输入框禁用 */
  disabled = input(false, { transform: coerceBooleanProperty, alias: 'inputDisabled' });
  /** 输入框只读 */
  readonly = input(false, { transform: coerceBooleanProperty, alias: 'inputReadonly' });
  /** 允许清除 */
  allowClear = input(true, { transform: coerceBooleanProperty, alias: 'inputAllowClear' });
  /** 输入框最大长度 */
  maxlength = input<number | null>(null, { alias: 'inputMaxlength' });
  /** 输入框最小长度 */
  minlength = input<number | null>(null, { alias: 'inputMinlength' });
  /** 输入框类型 */
  type = input<string>('text', { alias: 'inputType' });
  /** 输入框状态 */
  status = input<InputStatus>('default', { alias: 'inputStatus' });
  /** 边框 */
  bordered = input(true, { transform: coerceBooleanProperty, alias: 'inputBordered' });
  /** 是否显示字数统计 */
  showCount = input(false, { transform: coerceBooleanProperty, alias: 'inputShowCount' });
  /** 自动获取焦点 */
  autofocus = input(false, { transform: coerceBooleanProperty, alias: 'inputAutofocus' });
  /** 是否自动调整大小 */
  autosize = input<boolean | { minRows: number; maxRows: number }>(false, { alias: 'inputAutosize' });
  /** 输入框id */
  id = input<string>('', { alias: 'inputId' });
  /** 输入框校验规则 */
  pattern = input<((value: string) => boolean) | RegExp | null>(null, { alias: 'inputPattern' });
  /** 输入框自动完成 */
  autocomplete = input<string>('off', { alias: 'inputAutocomplete' });

  /** 输入框获得焦点事件 */
  @Output() focus: EventEmitter<FocusEvent> = new EventEmitter<FocusEvent>();
  /** 输入框失去焦点事件 */
  @Output() blur: EventEmitter<FocusEvent> = new EventEmitter<FocusEvent>();
  /** 输入框键盘按下事件 */
  @Output() keydown: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();
  /** 输入框键盘弹起事件 */
  @Output() keyup: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();
  /** 输入框键盘按下事件 */
  @Output() keypress: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();
  /** 输入框鼠标点击事件 */
  @Output() click: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();

  /** 焦点状态 */
  public hasFocus = signal<boolean>(false);
  /** 左内边距 */
  public paddingLeft = signal<number>(12);
  /** 右内边距 */
  public paddingRight = signal<number>(12);
  /** 错误信息 */
  public error = '';
  /** 内部数据 */
  public _data: any = '';

  /**
   * 获得焦点事件处理
   */
  onFocus(event: FocusEvent): void {
    this.hasFocus.set(true);
    this.focus.emit(event);
    this.onTouched();
  }

  /**
   * 失去焦点事件处理
   */
  onBlur(event: FocusEvent): void {
    this.hasFocus.set(false);
    this.blur.emit(event);
  }

  /**
   * 键盘按下事件处理
   */
  onKeyDown(event: KeyboardEvent): void {
    this.keydown.emit(event);
  }

  /**
   * 键盘弹起事件处理
   */
  onKeyUp(event: KeyboardEvent): void {
    this.keyup.emit(event);
  }

  /**
   * 键盘按下事件处理
   */
  onKeyPress(event: KeyboardEvent): void {
    this.keypress.emit(event);
  }

  /**
   * 鼠标点击事件处理
   */
  onClick(event: MouseEvent): void {
    this.click.emit(event);
  }

  /**
   * 值变更处理
   */
  changeValue(value: any): void {
    // 验证输入值
    if (this.pattern()) {
      const pattern = this.pattern();
      if (typeof pattern === 'function' && !pattern(value)) {
        // 自定义验证函数失败
        this.error = '输入不符合规则';
        return;
      } else if (pattern instanceof RegExp && !pattern.test(value)) {
        // 正则表达式验证失败
        this.error = '输入不符合规则';
        return;
      }
    }
    // 清除错误
    this.error = '';
    this._data = value;
    this.onChange(value);
  }

  /**
   * 清除输入内容
   */
  clear(event: MouseEvent): void {
    event.stopPropagation();
    this.setAndSubmitData('');
  }

  /**
   * 设置并提交数据
   */
  setAndSubmitData(value: any): void {
    this._data = value;
    this.onChange(this._data);
  }

  /**
   * 计算字符统计
   */
  getCharCount(): string {
    const count = this._data?.length || 0;
    if (this.maxlength()) {
      return `${count}/${this.maxlength()}`;
    }
    return `${count}`;
  }

  // ControlValueAccessor接口实现
  public onChange: any = (value: any) => { };
  public onTouched: any = () => { };

  /**
   * 写入值
   */
  writeValue(obj: any): void {
    this._data = obj ?? '';
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
  setDisabledState?(isDisabled: boolean): void {
    // 使用输入信号不需要在这里设置
  }
}
