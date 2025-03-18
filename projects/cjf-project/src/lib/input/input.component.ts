import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'lib-input',
  imports: [FormsModule, CommonModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: () => InputComponent,
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent implements ControlValueAccessor, OnInit, OnChanges {
  ngOnInit(): void {
  }
  ngOnChanges(changes: SimpleChanges): void {
  }

  /** 输入框类型 */
  type = input('text');
  /** 输入框大小 */
  size = input('default');
  /** 输入框前缀 */
  prefix = input('');
  /** 输入框后缀 */
  suffix = input('');
  /** 输入框提示 */
  placeholder = input('');
  /** 输入框禁用 */
  disabled = input(false, { transform: coerceBooleanProperty });
  /** 输入框只读 */
  readonly = input(false, { transform: coerceBooleanProperty });
  /** 允许清除 */
  allowClear = input(true, { transform: coerceBooleanProperty });
  /** 输入框最大长度 */
  maxlength = input(null);
  /** 输入框最小长度 */
  minlength = input(null);
  /** 输入框校验规则 */
  pattern = input<(value: any) => boolean>();
  /** 输入框校验错误提示 */
  error = '';
  /** 输入框获得焦点事件 */
  @Output() focus: EventEmitter<void> = new EventEmitter<void>();
  /** 输入框失去焦点事件 */
  @Output() blur: EventEmitter<void> = new EventEmitter<void>();
  /** 输入框键盘按下事件 */
  @Output() keydown: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();
  /** 输入框键盘弹起事件 */
  @Output() keyup: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();
  /** 输入框键盘按下事件 */
  @Output() keypress: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();
  /** 输入框鼠标点击事件 */
  @Output() click: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();


  public _data: any;

  public changeValue(value: any): void {
    if (this.pattern() && !this.pattern()!(value)) {
      this._data = value;
      console.log('error')
      return;
    }
    this._data = value;
    this.onChange(value);
  }

  public clear(event: any): void {
    this.setAndSubmitData('');
  }

  public setAndSubmitData(value: any): void {
    this._data = value;
    this.onChange(this._data);
  }

  /** ngModel注册事件 */
  public onChange: any = (value: any) => { };
  public onTouched: any = () => { };
  writeValue(obj: any): void {
    obj && (this._data = obj);
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
  }
}
