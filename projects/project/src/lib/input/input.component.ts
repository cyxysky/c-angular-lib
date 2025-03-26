import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, input, InputSignal, OnChanges, OnInit, Output, SimpleChanges, effect, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
export type InputSize = 'large' | 'default' | 'small';
export type InputStatus = 'error' | 'warning' | '';

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
export class InputComponent implements ControlValueAccessor, OnInit, OnChanges {
  
  ngOnInit(): void {
    // 初始化时计算左右内边距
    this.calculatePadding();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // 属性变更时重新计算内边距
    if (changes['prefix'] || changes['suffix'] || changes['allowClear']) {
      this.calculatePadding();
    }
  }

  /** 输入框大小 */
  size = input<InputSize>('default');
  /** 输入框前缀 */
  prefix = input<string>('');
  /** 输入框后缀 */
  suffix = input<string>('');
  /** 前缀图标 */
  prefixIcon = input<string>('');
  /** 后缀图标 */
  suffixIcon = input<string>('');
  /** 输入框提示 */
  placeholder = input<string>('');
  /** 输入框禁用 */
  disabled = input(false, { transform: coerceBooleanProperty });
  /** 输入框只读 */
  readonly = input(false, { transform: coerceBooleanProperty });
  /** 允许清除 */
  allowClear = input(true, { transform: coerceBooleanProperty });
  /** 输入框最大长度 */
  maxlength = input<number | null>(null);
  /** 输入框最小长度 */
  minlength = input<number | null>(null);
  /** 输入框类型 */
  type = input<string>('text');
  /** 输入框状态 */
  status = input<InputStatus>('');
  /** 边框 */
  bordered = input(true, { transform: coerceBooleanProperty });
  /** 是否显示字数统计 */
  showCount = input(false, { transform: coerceBooleanProperty });
  /** 自动获取焦点 */
  autofocus = input(false, { transform: coerceBooleanProperty });
  /** 是否自动调整大小 */
  autosize = input<boolean | { minRows: number; maxRows: number }>(false);
  /** 输入框id */
  id = input<string>('');
  /** 输入框校验规则 */
  pattern = input<((value: string) => boolean) | RegExp | null>(null);
  /** 输入框自动完成 */
  autocomplete = input<string>('off');
  
  /** 内部状态 */
  hasFocus = signal<boolean>(false);
  paddingLeft = signal<number>(11);
  paddingRight = signal<number>(11);
  
  /** 错误信息 */
  error = '';

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
  /** 值变更事件 */
  @Output() valueChange: EventEmitter<any> = new EventEmitter<any>();

  /** 内部数据 */
  _data: any = '';

  /** 事件处理方法 */
  onFocus(event: FocusEvent): void {
    this.hasFocus.set(true);
    this.focus.emit(event);
    this.onTouched();
  }

  onBlur(event: FocusEvent): void {
    this.hasFocus.set(false);
    this.blur.emit(event);
  }

  onKeyDown(event: KeyboardEvent): void {
    this.keydown.emit(event);
  }

  onKeyUp(event: KeyboardEvent): void {
    this.keyup.emit(event);
  }

  onKeyPress(event: KeyboardEvent): void {
    this.keypress.emit(event);
  }

  onClick(event: MouseEvent): void {
    this.click.emit(event);
  }

  /** 计算内边距 */
  calculatePadding(): void {
    // 默认左右内边距
    let left = 12;
    let right = 12;

    // 根据后缀和清除图标调整右内边距
    if (this.suffix() || this.suffixIcon()) {
      right = 12;
    }

    this.paddingLeft.set(left);
    this.paddingRight.set(right);
  }

  /** 值变更处理 */
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
    this.valueChange.emit(value);
  }

  /** 清除输入内容 */
  clear(event: MouseEvent): void {
    event.stopPropagation();
    this.setAndSubmitData('');
  }

  /** 设置并提交数据 */
  setAndSubmitData(value: any): void {
    this._data = value;
    this.onChange(this._data);
    this.valueChange.emit(this._data);
  }

  /** 计算字符统计 */
  getCharCount(): string {
    const count = this._data?.length || 0;
    if (this.maxlength()) {
      return `${count}/${this.maxlength()}`;
    }
    return `${count}`;
  }

  /** 获取元素类名 */
  getInputClass(): string {
    const classNames = ['lib-input'];
    
    if (this.size() === 'small') classNames.push('lib-input-sm');
    if (this.size() === 'large') classNames.push('lib-input-lg');
    if (this.disabled()) classNames.push('lib-input-disabled');
    if (!this.bordered()) classNames.push('lib-input-borderless');
    if (this.status() === 'error' || this.error) classNames.push('lib-input-status-error');
    if (this.status() === 'warning') classNames.push('lib-input-status-warning');
    classNames.push('lib-input-affix-wrapper');
    if (this.hasFocus()) classNames.push('lib-input-focused');
    
    return classNames.join(' ');
  }

  /** ngModel注册事件 */
  public onChange: any = (value: any) => { };
  public onTouched: any = () => { };
  
  writeValue(obj: any): void {
    this._data = obj ?? '';
  }
  
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  
  setDisabledState?(isDisabled: boolean): void {
    // 使用输入信号不需要在这里设置
  }
}
