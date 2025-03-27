import { Component, ElementRef, forwardRef, HostListener, Input, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TooltipDirective } from '@project';
import { OverlayBasicDirective } from '../overlay/overlay-basic.directive';
interface Mark {
  value: number;
  label: string;
}

@Component({
  selector: 'lib-slider',
  standalone: true,
  imports: [CommonModule, TooltipDirective],
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderComponent),
      multi: true
    }
  ]
})
export class SliderComponent implements OnInit, ControlValueAccessor {
  // 输入属性
  @Input() min = 0;
  @Input() max = 100;
  @Input() set step(value: number) {
    // 确保步长为正整数
    this._step = Math.max(1, Math.round(value));
  }
  get step(): number {
    return this._step;
  }
  private _step = 1;

  @Input() trackColor = '#1890ff';
  @Input() handleColor = '';
  @Input() isRange = false;
  @Input() marks: Record<number, string> | null = null;
  @Input() snapToMarks = false;
  @Input() tipFormatter: ((value: number) => string) | null = null;
  @Input() labelTemplate: TemplateRef<any> | null = null;

  // 内部状态
  value = 0;
  rangeValues = [0, 0];
  trackWidth = '0%';
  markList: Mark[] = [];
  singalSliderHandleVisible = false;
  rangeLeftSliderHandleVisible = false;
  rangeRightSliderHandleVisible = false;
  private tooltip: OverlayBasicDirective | null = null;
  private isDragging = false;
  private currentHandle = 0;
  // ControlValueAccessor 接口实现
  private onChange: (value: any) => void = () => { };
  private onTouched: () => void = () => { };

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    this.parseMarks();
  }

  parseMarks(): void {
    if (this.marks) {
      this.markList = Object.entries(this.marks).map(([key, value]) => ({
        value: this.percentOf(Number(key)),
        label: value
      }));
    }
  }

  percentOf(value: number): number {
    return ((value - this.min) / (this.max - this.min)) * 100;
  }

  valueFromPercent(percent: number): number {
    let rawValue = (percent / 100) * (this.max - this.min) + this.min;

    if (this.snapToMarks && this.marks) {
      // 找到最近的刻度值
      const markValues = Object.keys(this.marks).map(Number);
      rawValue = markValues.reduce((closest, mark) => {
        return Math.abs(mark - rawValue) < Math.abs(closest - rawValue) ? mark : closest;
      }, this.max);
    } else if (this.step > 0) {
      // 按步长对齐，并确保结果为整数
      rawValue = Math.round(rawValue / this.step) * this.step;
    }

    // 确保最终值为整数
    return Math.round(rawValue);
  }

  toString(value: any): string {
    if (value === undefined || value === null) return '';
    return value.toString().split('.')[0];
  }

  updateTrackWidth(): void {
    let value: string | TemplateRef<any> = '';
    if (this.isRange) {
      if (this.rangeLeftSliderHandleVisible) {
        value = this.toString(this.tipFormatter ? this.tipFormatter(this.rangeValues[0]) : this.rangeValues[0]);
      }
      if (this.rangeRightSliderHandleVisible) {
        value = this.toString(this.tipFormatter ? this.tipFormatter(this.rangeValues[1]) : this.rangeValues[1]);
      }
      this.trackWidth = (this.rangeValues[1] - this.rangeValues[0]) + '%';
    } else {
      this.trackWidth = this.value + '%';
      value = this.toString(this.tipFormatter ? this.tipFormatter(this.value) : this.value);
    }
    this.tooltip?.updatePosition();
    this.tooltip?.updateContent(value);
  }

  onHandleMouseDown(event: MouseEvent, handleIndex: number, direction: 'left' | 'right' | 'single', tooltip: OverlayBasicDirective): void {
    this.tooltip = tooltip;
    switch (direction) {
      case 'left':
        this.rangeLeftSliderHandleVisible = true;
        break;
      case 'right':
        this.rangeRightSliderHandleVisible = true;
        break;
      case 'single':
        this.singalSliderHandleVisible = true;
        break;
    }
    event.preventDefault();
    event.stopPropagation();

    this.isDragging = true;
    this.currentHandle = handleIndex;

    // 注册全局事件
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);

    this.onTouched();
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.isDragging) return;

    const sliderRect = this.elementRef.nativeElement.querySelector('.lib-slider-container').getBoundingClientRect();
    const offsetX = event.clientX - sliderRect.left;
    const percent = Math.min(Math.max(offsetX / sliderRect.width * 100, 0), 100);
    const newValue = this.valueFromPercent(percent);

    if (this.isRange) {
      // 点击时选择距离最近的手柄
      const percentValue = this.percentOf(newValue);
      if (Math.abs(percentValue - this.rangeValues[0]) <= Math.abs(percentValue - this.rangeValues[1])) {
        this.rangeValues[0] = percentValue;
      } else {
        this.rangeValues[1] = percentValue;
      }
      this.updateTrackWidth();
      this.onChange([this.valueFromPercent(this.rangeValues[0] / 100 * (this.max - this.min) + this.min),
      this.valueFromPercent(this.rangeValues[1] / 100 * (this.max - this.min) + this.min)]);
    } else {
      this.value = this.percentOf(newValue);
      this.updateTrackWidth();
      this.onChange(newValue);
    }
  }

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging) return;

    const sliderRect = this.elementRef.nativeElement.querySelector('.lib-slider-container').getBoundingClientRect();
    const offsetX = event.clientX - sliderRect.left;
    const percent = Math.min(Math.max(offsetX / sliderRect.width * 100, 0), 100);
    const newValue = this.valueFromPercent(percent);

    if (this.isRange) {
      const percentValue = this.percentOf(newValue);
      this.rangeValues[this.currentHandle] = percentValue;

      // 确保左侧手柄不会超过右侧手柄，反之亦然
      if (this.currentHandle === 0 && this.rangeValues[0] > this.rangeValues[1]) {
        this.rangeValues[0] = this.rangeValues[1];
      } else if (this.currentHandle === 1 && this.rangeValues[1] < this.rangeValues[0]) {
        this.rangeValues[1] = this.rangeValues[0];
      }

      this.updateTrackWidth();
      this.onChange([this.valueFromPercent(this.rangeValues[0] / 100 * (this.max - this.min) + this.min),
      this.valueFromPercent(this.rangeValues[1] / 100 * (this.max - this.min) + this.min)]);
    } else {
      this.value = this.percentOf(newValue);
      this.updateTrackWidth();
      this.onChange(newValue);
    }
  };

  private onMouseUp = (): void => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    this.singalSliderHandleVisible = false;
    this.rangeLeftSliderHandleVisible = false;
    this.rangeRightSliderHandleVisible = false;
  };

  // ControlValueAccessor 接口方法实现
  writeValue(value: number | number[]): void {
    if (this.isRange && Array.isArray(value)) {
      // 确保范围值为整数
      const roundedValues = [Math.round(value[0]), Math.round(value[1])];
      this.rangeValues = [
        this.percentOf(roundedValues[0]),
        this.percentOf(roundedValues[1])
      ];
    } else if (!this.isRange && typeof value === 'number') {
      // 确保单值为整数
      this.value = this.percentOf(Math.round(value));
    }
    this.updateTrackWidth();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // 实现禁用状态逻辑
  }
}
