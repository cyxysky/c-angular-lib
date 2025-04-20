import { Component, ElementRef, forwardRef, HostListener, Input, OnInit, TemplateRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TooltipDirective, UtilsService } from '@project';
import * as _ from 'lodash';

interface Mark {
  value: number;
  label: string;
}

@Component({
  selector: 'lib-slider',
  standalone: true,
  imports: [CommonModule, TooltipDirective],
  templateUrl: './slider.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderComponent),
      multi: true
    }
  ],
  encapsulation: ViewEncapsulation.None,
})
export class SliderComponent implements OnInit, ControlValueAccessor {
  //#region 输入属性 (Inputs)
  /** 最小值 */
  @Input({ alias: 'sliderMin' }) min = 0;
  /** 最大值 */
  @Input({ alias: 'sliderMax' }) max = 100;
  /** 步长 */
  @Input({ alias: 'sliderStep' }) 
  set step(value: number) {
    // 确保步长为正整数
    this._step = Math.max(1, Math.round(value));
  }
  get step(): number {
    return this._step;
  }
  /** 轨道颜色 */
  @Input({ alias: 'sliderTrackColor' }) trackColor = '#1890ff';
  /** 手柄颜色 */
  @Input({ alias: 'sliderHandleColor' }) handleColor = '';
  /** 是否范围 */
  @Input({ alias: 'sliderIsRange' }) isRange = false;
  /** 刻度 */
  @Input({ alias: 'sliderMarks' }) marks: Record<number, string> | null = null;
  /** 是否吸附到刻度 */
  @Input({ alias: 'sliderSnapToMarks' }) snapToMarks = false;
  /** 提示格式化 */
  @Input({ alias: 'sliderTipFormatter' }) tipFormatter: ((value: number) => string) | null = null;
  /** 标签模板 */
  @Input({ alias: 'sliderLabelTemplate' }) labelTemplate: TemplateRef<any> | null = null;
  //#endregion

  //#region 内部状态变量
  /** 当前值（百分比） */
  value = 0;
  /** 范围值（百分比，[左值, 右值]） */
  rangeValues = [0, 0];
  /** 轨道宽度 */
  trackWidth = '0%';
  /** 刻度列表 */
  markList: Mark[] = [];
  /** 单滑块手柄是否可见 */
  singalSliderHandleVisible = false;
  /** 左滑块手柄是否可见 */
  rangeLeftSliderHandleVisible = false;
  /** 右滑块手柄是否可见 */
  rangeRightSliderHandleVisible = false;
  /** 工具提示实例 */
  private tooltip: TooltipDirective | null = null;
  /** 是否正在拖动 */
  private isDragging = false;
  /** 当前操作的手柄索引 */
  private currentHandle = 0;
  /** 内部步长值 */
  private _step = 1;
  //#endregion

  //#region 构造函数
  constructor(private elementRef: ElementRef, private utilsService: UtilsService) { }
  //#endregion

  //#region 生命周期钩子
  ngOnInit(): void {
    this.parseMarks();
  }
  //#endregion

  //#region 数据初始化与处理
  /**
   * 解析刻度标记
   */
  parseMarks(): void {
    if (this.marks) {
      this.markList = Object.entries(this.marks).map(([key, value]) => ({
        value: this.percentOf(Number(key)),
        label: value
      }));
    }
  }
  //#endregion

  //#region 事件处理
  /**
   * 滑块手柄鼠标按下事件
   */
  onHandleMouseDown(event: MouseEvent, handleIndex: number, direction: 'left' | 'right' | 'single', tooltip: TooltipDirective): void {
    this.tooltip = tooltip;
    
    // 设置相应手柄的可见状态
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

  /**
   * 滑块点击事件
   */
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.isDragging) return;

    const sliderRect = this.elementRef.nativeElement.querySelector('.lib-slider-container').getBoundingClientRect();
    const offsetX = event.clientX - sliderRect.left;
    const percent = Math.min(Math.max(offsetX / sliderRect.width * 100, 0), 100);
    const newValue = this.valueFromPercent(percent);

    if (this.isRange) {
      this.handleRangeValueChange(newValue);
    } else {
      this.handleSingleValueChange(newValue);
    }
  }

  /**
   * 鼠标移动事件处理
   */
  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging) return;

    const sliderRect = this.elementRef.nativeElement.querySelector('.lib-slider-container').getBoundingClientRect();
    const offsetX = event.clientX - sliderRect.left;
    const percent = Math.min(Math.max(offsetX / sliderRect.width * 100, 0), 100);
    const newValue = this.valueFromPercent(percent);

    if (this.isRange) {
      this.handleRangeDrag(newValue);
    } else {
      this.handleSingleValueChange(newValue);
    }
  };

  /**
   * 鼠标释放事件处理
   */
  private onMouseUp = (): void => {
    this.isDragging = false;
    console.log('onMouseUp');
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    this.singalSliderHandleVisible = false;
    this.rangeLeftSliderHandleVisible = false;
    this.rangeRightSliderHandleVisible = false;

  };
  //#endregion

  //#region 值处理方法
  /**
   * 处理范围值变化
   */
  private handleRangeValueChange(newValue: number): void {
    // 点击时选择距离最近的手柄
    const percentValue = this.percentOf(newValue);
    if (Math.abs(percentValue - this.rangeValues[0]) <= Math.abs(percentValue - this.rangeValues[1])) {
      this.rangeValues[0] = percentValue;
    } else {
      this.rangeValues[1] = percentValue;
    }
    
    this.updateRangeValues();
  }

  /**
   * 处理范围拖动
   */
  private handleRangeDrag(newValue: number): void {
    const percentValue = this.percentOf(newValue);
    this.rangeValues[this.currentHandle] = percentValue;

    // 确保左侧手柄不会超过右侧手柄，反之亦然
    if (this.currentHandle === 0 && this.rangeValues[0] > this.rangeValues[1]) {
      this.rangeValues[0] = this.rangeValues[1];
    } else if (this.currentHandle === 1 && this.rangeValues[1] < this.rangeValues[0]) {
      this.rangeValues[1] = this.rangeValues[0];
    }
    
    this.updateRangeValues();
  }

  /**
   * 更新范围值并触发变更
   */
  private updateRangeValues(): void {
    this.rangeValues = this.rangeValues.map(value => _.round(value));
    this.updateTrackWidth();
    
    // 计算实际值并通知变更
    const actualValues = [
      this.valueFromPercent(this.rangeValues[0] / 100 * (this.max - this.min) + this.min),
      this.valueFromPercent(this.rangeValues[1] / 100 * (this.max - this.min) + this.min)
    ];
    this.onChange(actualValues);
  }

  /**
   * 处理单值变化
   */
  private handleSingleValueChange(newValue: number): void {
    this.value = this.percentOf(newValue);
    this.value = _.round(this.value);
    this.updateTrackWidth();
    this.onChange(newValue);
  }

  /**
   * 更新轨道宽度和提示
   */
  updateTrackWidth(): void {
    let value: string | TemplateRef<any> = '';
    
    if (this.isRange) {
      // 范围模式下设置轨道宽度为两个值之间的差
      if (this.rangeLeftSliderHandleVisible) {
        value = this.toString(this.tipFormatter ? this.tipFormatter(this.rangeValues[0]) : this.rangeValues[0]);
      }
      if (this.rangeRightSliderHandleVisible) {
        value = this.toString(this.tipFormatter ? this.tipFormatter(this.rangeValues[1]) : this.rangeValues[1]);
      }
      this.trackWidth = (this.rangeValues[1] - this.rangeValues[0]) + '%';
    } else {
      // 单值模式下设置轨道宽度为当前值
      this.trackWidth = this.value + '%';
      value = this.toString(this.tipFormatter ? this.tipFormatter(this.value) : this.value);
    }
    
    // 更新提示位置和内容
    this.tooltip?.updatePosition();
    this.tooltip?.updateContent(value);
  }
  //#endregion

  //#region 工具方法
  /**
   * 将实际值转换为百分比
   */
  percentOf(value: number): number {
    return ((value - this.min) / (this.max - this.min)) * 100;
  }

  /**
   * 将百分比转换为实际值
   */
  valueFromPercent(percent: number): number {
    let rawValue = (percent / 100) * (this.max - this.min) + this.min;

    if (this.snapToMarks && this.marks) {
      // 找到最近的刻度值
      const markValues = Object.keys(this.marks).map(Number);
      rawValue = markValues.reduce((closest, mark) => {
        return Math.abs(mark - rawValue) < Math.abs(closest - rawValue) ? mark : closest;
      }, this.max);
    } else if (this.step > 0) {
      // 按步长对齐
      rawValue = Math.round(rawValue / this.step) * this.step;
    }

    // 确保最终值为整数
    return Math.round(rawValue);
  }

  /**
   * 转换为字符串(去掉小数部分)
   */
  toString(value: any): string {
    if (value === undefined || value === null) return '';
    return value.toString().split('.')[0];
  }
  //#endregion

  //#region ControlValueAccessor 实现
  private onChange: (value: any) => void = () => { };
  private onTouched: () => void = () => { };

  /**
   * 写入值
   */
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
    // 实现禁用状态逻辑
  }
  //#endregion
}