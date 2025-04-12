import { Component, OnInit, Input, Output, EventEmitter, forwardRef, TemplateRef, ViewEncapsulation, ElementRef, ViewChild, HostListener, ChangeDetectorRef, NgZone, ViewContainerRef, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { DateTimer, DateTimerMode, DateTimerSize, DateTimerStatus, DateTimerSelectType, RangeValue } from './date-timer.interface';
import { addDays, addMonths, addQuarters, addWeeks, addYears, differenceInDays, endOfDay, endOfMonth, endOfQuarter, endOfWeek, endOfYear, format, getDay, getDate, getHours, getMinutes, getMonth, getSeconds, getYear, isAfter, isBefore, isSameDay, isSameMonth, isSameYear, parse, setDate, setHours, setMinutes, setMonth, setSeconds, setYear, startOfDay, startOfMonth, startOfQuarter, startOfWeek, startOfYear, subMonths, subYears } from 'date-fns';
import { OverlayService } from '../overlay/overlay.service';
import { OverlayRef, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';

@Component({
  selector: 'lib-date-timer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CdkOverlayOrigin
  ],
  templateUrl: './date-timer.component.html',
  styleUrl: './date-timer.component.less',
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTimerComponent),
      multi: true
    }
  ]
})
export class DateTimerComponent implements OnInit, ControlValueAccessor {
  @Input() mode: DateTimerMode = 'date';
  @Input() format = 'yyyy-MM-dd';
  @Input() size: DateTimerSize = 'default';
  @Input() status: DateTimerStatus = '';
  @Input() placeholder: string | [string, string] = '请选择日期';
  @Input() rangePlaceholder: string[] = ['开始日期', '结束日期'];
  @Input() allowClear = true;
  @Input() autoFocus = false;
  @Input() disabled = false;
  @Input() borderless = false;
  @Input() showTime = false;
  @Input() showToday = true;
  @Input() selectType: DateTimerSelectType = 'single';
  @Input() dateRender: ((date: Date) => string | TemplateRef<any>) | undefined = undefined;
  @Input() disabledDate: ((date: Date) => boolean) | undefined = undefined;
  @Input() disabledTime: ((date: Date) => { hour?: boolean[], minute?: boolean[], second?: boolean[] }) | undefined = undefined;
  @Input() extraFooter: string | TemplateRef<void> | undefined = undefined;
  @Input() customFormat: ((value: Date | RangeValue<Date>) => string) | undefined = undefined;

  @Output() valueChange = new EventEmitter<Date | [Date, Date] | null>();
  @Output() panelModeChange = new EventEmitter<DateTimerMode>();
  @Output() calendarChange = new EventEmitter<Date[] | null>();
  @Output() openChange = new EventEmitter<boolean>();
  @Output() ok = new EventEmitter<Date | RangeValue<Date> | null>();

  @ViewChild('inputElement') inputElement?: ElementRef;
  @ViewChild('dropdown') dropdown?: ElementRef;
  @ViewChild('datePickerInput') datePickerInput?: ElementRef;
  @ViewChild(CdkOverlayOrigin, { static: false }) overlayOrigin!: CdkOverlayOrigin;
  @ViewChild('dropdownTemplate', { static: false }) dropdownTemplate!: TemplateRef<any>;
  
  value: Date | [Date, Date] | null = null;
  
  // UI状态
  showDropdown = false;
  currentPanelMode: DateTimerMode = 'date';
  isFocused = false;
  selectedValue: Date | RangeValue<Date> | null = null;
  displayValue = '';
  hoverValue: Date | null = null;
  
  // 日期面板数据
  currentDate = new Date();
  currentViewDate = new Date();
  years: number[] = [];
  months = Array.from({ length: 12 }, (_, i) => i);
  quarters = [0, 1, 2, 3];
  weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  dateMatrix: Date[][] = [];
  
  // 时间面板数据
  hours = Array.from({ length: 24 }, (_, i) => i);
  minutes = Array.from({ length: 60 }, (_, i) => i);
  seconds = Array.from({ length: 60 }, (_, i) => i);
  
  // 选择范围相关
  rangeStart: Date | null = null;
  rangePart: 'start' | 'end' = 'start';
  
  // 格式化显示
  yearRangeText = '';
  
  // 新增变量
  private overlayRef: OverlayRef | null = null;
  
  constructor(
    private elementRef: ElementRef, 
    private cdr: ChangeDetectorRef,
    private overlayService: OverlayService,
    private ngZone: NgZone,
    private viewContainerRef: ViewContainerRef
  ) {}

  ngOnInit(): void {
    this.generateDateMatrix();
    this.updateYears();
    
    // 根据模式设置合适的格式
    if (this.mode === 'time') {
      this.format = 'HH:mm:ss';
      this.currentPanelMode = 'time';
    } else if (this.showTime && this.mode === 'date') {
      this.format = 'yyyy-MM-dd HH:mm:ss';
    }
    
    // 设置初始面板模式 - 直接对应当前mode
    if (this.mode !== 'time') {
      this.currentPanelMode = this.mode === 'week' ? 'date' : this.mode;
    }
    
    if (this.autoFocus && this.datePickerInput) {
      setTimeout(() => {
        this.datePickerInput?.nativeElement.focus();
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode']) {
      if (this.mode === 'time') {
        this.currentPanelMode = 'time';
        this.format = 'HH:mm:ss';
      } else {
        this.currentPanelMode = this.mode === 'week' ? 'date' : this.mode;
      }
    }
  }
    

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    // 移除这个方法的内容，由OverlayService处理点击外部事件
  }

  writeValue(value: Date | RangeValue<Date> | null): void {
    this.selectedValue = value;
    
    if (value) {
      if (this.selectType === 'single') {
        if (this.isRangeValue(value)) {
          // 如果是范围对象
          const range = value as RangeValue<Date>;
          if (range.start) {
            this.currentViewDate = new Date(range.start);
            this.displayValue = this.formatSelectedValue(value);
          } else {
            this.displayValue = '';
          }
        } else {
          // 如果是单个日期
          const date = value as Date;
          this.currentViewDate = new Date(date);
          this.displayValue = this.formatSelectedValue(date);
        }
      } else {
        // 范围选择模式
        const range = value as RangeValue<Date>;
        if (range?.start) {
          this.currentViewDate = new Date(range.start);
          this.displayValue = this.formatSelectedValue(range);
        } else {
          this.displayValue = '';
        }
      }
    } else {
      this.displayValue = '';
    }
    
    this.generateDateMatrix();
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: Date | RangeValue<Date> | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // 打开下拉框
  openDropdown(): void {
    if (!this.disabled && !this.showDropdown) {
      this.showDropdown = true;
      // 确保mode为time时直接显示时间面板
      if (this.mode === 'time') {
        this.currentPanelMode = 'time';
      }
      this.openChange.emit(true);
      this.createDropdownOverlay();
    }
  }

  /**
   * 创建下拉浮层
   */
  private createDropdownOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }

    // 确保有模板和源元素
    if (!this.dropdownTemplate || !this.overlayOrigin) {
      console.error('缺少必要的模板或原始元素');
      return;
    }

    // 获取原始元素
    const origin = this.overlayOrigin.elementRef.nativeElement;
    
    // 定义位置策略
    const positions: ConnectedPosition[] = [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetY: 4
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
        offsetY: -4
      }
    ];
    
    // 创建浮层
    this.overlayRef = this.overlayService.createOverlay(
      { 
        minWidth: this.elementRef.nativeElement.getBoundingClientRect().width,
        panelClass: ['date-timer-dropdown-panel', this.showTime || this.mode === 'time' ? 'date-timer-dropdown-panel-time' : '']
      },
      origin,
      positions,
      (overlayRef: OverlayRef, event: Event) => {
        // 点击外部关闭
        this.closeDropdown();
      },
      (position, isBackupUsed) => {
        // 位置变化回调，添加额外的样式类来应对不同位置的变化
        const element = this.overlayRef?.overlayElement;
        if (element) {
          // 移除所有位置相关类
          element.classList.remove('date-timer-dropdown-position-top');
          element.classList.remove('date-timer-dropdown-position-bottom');
          // 添加新的位置类
          if (position.overlayY === 'top') {
            element.classList.add('date-timer-dropdown-position-top');
          } else {
            element.classList.add('date-timer-dropdown-position-bottom');
          }
        }
      }
    );

    // 附加模板
    if (this.overlayRef) {
      this.overlayService.attachTemplate(this.overlayRef, this.dropdownTemplate, this.viewContainerRef);
    }
    
    // 在重新定位前，检查面板是否需要特殊处理
    if ((this.showTime || this.mode === 'time') && this.currentPanelMode === 'time') {
      setTimeout(() => {
        this.overlayRef?.updatePosition();
      }, 0);
    }
    
    // 监听浮层关闭
    this.overlayRef.detachments().subscribe(() => {
      this.ngZone.run(() => {
        this.showDropdown = false;
        this.openChange.emit(false);
        this.overlayRef = null;
      });
    });
  }

  // 关闭下拉框
  closeDropdown(): void {
    if (this.showDropdown) {
      this.showDropdown = false;
      this.openChange.emit(false);
      this.rangeStart = null;
      
      if (this.overlayRef) {
        this.overlayRef.dispose();
        this.overlayRef = null;
      }
      
      this.cdr.markForCheck();
    }
  }

  // 清除选择
  clearValue(event: Event): void {
    event.stopPropagation();
    if (this.allowClear) {
      this.value = null;
      this.selectedValue = null;
      this.rangeStart = null;
      this.displayValue = '';
      this._onChange(null);
      this.valueChange.emit(null);
    }
  }

  // 模式切换
  setMode(mode: 'year' | 'month' | 'quarter' | 'week' | 'date'): void {
    this.currentPanelMode = mode;
    this.generateDateMatrix();
    this.cdr.markForCheck();
  }

  // 日期生成和格式化
  updateYears(): void {
    const year = getYear(this.currentViewDate);
    const startYear = Math.floor(year / 10) * 10;
    this.years = Array.from({ length: 12 }, (_, i) => startYear - 1 + i);
    this.yearRangeText = `${this.years[0]} - ${this.years[11]}`;
  }

  generateDateMatrix(): void {
    // 为日期模式生成日历矩阵
    const firstDayOfMonth = startOfMonth(this.currentViewDate);
    const lastDayOfMonth = endOfMonth(this.currentViewDate);
    const daysInMonth = differenceInDays(lastDayOfMonth, firstDayOfMonth) + 1;
    
    const firstWeekday = getDay(firstDayOfMonth);
    const daysFromPrevMonth = firstWeekday;
    
    const matrix: Date[][] = [];
    let week: Date[] = [];
    
    // 上个月的天数
    for (let i = 0; i < daysFromPrevMonth; i++) {
      const date = addDays(firstDayOfMonth, -daysFromPrevMonth + i);
      week.push(date);
    }
    
    // 当前月的天数
    for (let i = 0; i < daysInMonth; i++) {
      const date = addDays(firstDayOfMonth, i);
      week.push(date);
      
      if (week.length === 7) {
        matrix.push(week);
        week = [];
      }
    }
    
    // 下个月的天数
    if (week.length > 0) {
      const daysFromNextMonth = 7 - week.length;
      for (let i = 0; i < daysFromNextMonth; i++) {
        const date = addDays(lastDayOfMonth, i + 1);
        week.push(date);
      }
      matrix.push(week);
    }
    
    this.dateMatrix = matrix;
  }

  formatSelectedValue(value: Date | RangeValue<Date>): string {
    if (this.customFormat) {
      return this.customFormat(value);
    }
    
    if (this.isRangeValue(value)) {
      const range = value as RangeValue<Date>;
      if (!range.start) return '';
      
      switch (this.mode) {
        case 'year':
          return `${getYear(range.start)}`;
        case 'month':
          return `${getYear(range.start)}-${String(getMonth(range.start) + 1).padStart(2, '0')}`;
        case 'quarter':
          const quarter = Math.floor(getMonth(range.start) / 3) + 1;
          return `${getYear(range.start)}-Q${quarter}`;
        case 'week':
          // 获取周数
          const firstDayOfYear = new Date(getYear(range.start), 0, 1);
          const pastDaysOfYear = differenceInDays(range.start, firstDayOfYear);
          const weekNumber = Math.ceil((pastDaysOfYear + getDay(firstDayOfYear)) / 7);
          return `${getYear(range.start)}-${weekNumber}`;
        default:
          if (range.end) {
            return `${this.formatDate(range.start)} ~ ${this.formatDate(range.end)}`;
          } else {
            return this.formatDate(range.start);
          }
      }
    } else {
      // 对于date和time模式，直接使用formatDate
      return this.formatDate(value as Date);
    }
  }

  formatDate(date: Date): string {
    if (!date) return '';
    return format(date, this.format);
  }

  // 导航控制
  prevYear(): void {
    this.currentViewDate = subYears(this.currentViewDate, 1);
    this.generateDateMatrix();
    this.updateYears();
    this.cdr.markForCheck();
  }

  nextYear(): void {
    this.currentViewDate = addYears(this.currentViewDate, 1);
    this.generateDateMatrix();
    this.updateYears();
    this.cdr.markForCheck();
  }

  prevMonth(): void {
    this.currentViewDate = subMonths(this.currentViewDate, 1);
    this.generateDateMatrix();
    this.cdr.markForCheck();
  }

  nextMonth(): void {
    this.currentViewDate = addMonths(this.currentViewDate, 1);
    this.generateDateMatrix();
    this.cdr.markForCheck();
  }

  prevYearRange(): void {
    this.currentViewDate = subYears(this.currentViewDate, 10);
    this.updateYears();
    this.cdr.markForCheck();
  }

  nextYearRange(): void {
    this.currentViewDate = addYears(this.currentViewDate, 10);
    this.updateYears();
    this.cdr.markForCheck();
  }

  // 日期选择方法
  onSelectYear(year: number): void {
    this.currentViewDate = setYear(this.currentViewDate, year);
    
    if (this.mode === 'year') {
      const start = new Date(year, 0, 1, 0, 0, 0);  // 1月1日 00:00:00
      const end = new Date(year, 11, 31, 23, 59, 59);  // 12月31日 23:59:59
      
      this.selectedValue = { start, end };
      this.displayValue = this.formatSelectedValue(this.selectedValue);
      this._onChange(this.selectedValue);
      
      this.closeDropdown();
    } else {
      this.currentPanelMode = 'month';
      this.cdr.markForCheck();
    }
  }

  onSelectMonth(month: number): void {
    this.currentViewDate = setMonth(this.currentViewDate, month);
    
    if (this.mode === 'month') {
      const year = getYear(this.currentViewDate);
      const lastDay = new Date(year, month + 1, 0).getDate(); // 获取当月最后一天
      const start = new Date(year, month, 1, 0, 0, 0); // 当月1日 00:00:00
      const end = new Date(year, month, lastDay, 23, 59, 59); // 当月最后一天 23:59:59
      
      this.selectedValue = { start, end };
      this.displayValue = this.formatSelectedValue(this.selectedValue);
      this._onChange(this.selectedValue);
      
      this.closeDropdown();
    } else {
      this.currentPanelMode = 'date';
      this.generateDateMatrix();
      this.cdr.markForCheck();
    }
  }

  onSelectQuarter(quarter: number): void {
    const startMonth = quarter * 3;
    const year = getYear(this.currentViewDate);
    const date = new Date(year, startMonth, 1);
    this.currentViewDate = date;
    
    if (this.mode === 'quarter') {
      const start = new Date(year, startMonth, 1, 0, 0, 0); // 季度第一天 00:00:00
      const endMonth = startMonth + 2;
      const lastDay = new Date(year, endMonth + 1, 0).getDate(); // 季度最后一个月的最后一天
      const end = new Date(year, endMonth, lastDay, 23, 59, 59); // 季度最后一天 23:59:59
      
      this.selectedValue = { start, end };
      this.displayValue = this.formatSelectedValue(this.selectedValue);
      this._onChange(this.selectedValue);
      
      this.closeDropdown();
    } else {
      this.currentPanelMode = 'date';
      this.generateDateMatrix();
      this.cdr.markForCheck();
    }
  }

  onSelectWeek(dates: Date[]): void {
    if (dates && dates.length === 0) return;
    
    const firstDate = dates[0];
    const weekStart = startOfWeek(firstDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(firstDate, { weekStartsOn: 0 });
    
    this.selectedValue = { start: weekStart, end: weekEnd };
    this.displayValue = this.formatSelectedValue(this.selectedValue);
    this._onChange(this.selectedValue);
    this.closeDropdown();
  }

  onCellHover(date: Date): void {
    this.hoverValue = date;
    this.cdr.markForCheck();
  }

  onSelectDate(date: Date): void {
    if (this.isDateDisabled(date)) {
      return;
    }
    
    if (this.selectType === 'single') {
      let selectedDate = date;
      
      // 保留时间部分
      if (this.selectedValue && this.showTime) {
        if (this.isRangeValue(this.selectedValue)) {
          // 如果已经是范围值，保留start的时间部分
          if (this.selectedValue.start) {
            selectedDate = setHours(selectedDate, getHours(this.selectedValue.start));
            selectedDate = setMinutes(selectedDate, getMinutes(this.selectedValue.start));
            selectedDate = setSeconds(selectedDate, getSeconds(this.selectedValue.start));
          }
        } else if (this.isSingleDate(this.selectedValue)) {
          // 如果是单一日期，保留其时间部分
          selectedDate = setHours(selectedDate, getHours(this.selectedValue));
          selectedDate = setMinutes(selectedDate, getMinutes(this.selectedValue));
          selectedDate = setSeconds(selectedDate, getSeconds(this.selectedValue));
        }
      }
      
      // 根据mode决定如何处理选中的日期
      if (this.mode === 'date' || this.mode === 'time') {
        // date和time模式使用单个日期
        this.selectedValue = selectedDate;
        this.displayValue = this.formatSelectedValue(selectedDate);
      } else {
        // 其他模式创建范围
        const start = startOfDay(selectedDate);
        const end = endOfDay(selectedDate);
        this.selectedValue = { start, end };
        this.displayValue = this.formatSelectedValue(this.selectedValue);
      }
      
      this._onChange(this.selectedValue);
      
      // 如果不显示时间，选择后关闭下拉框
      if (!this.showTime) {
        this.closeDropdown();
      } else if (['date', 'week'].includes(this.mode)) {
        // 对于日期和周模式，在有时间选择的情况下不关闭面板
        if (this.overlayRef) {
          setTimeout(() => {
            this.overlayRef?.updatePosition();
          }, 0);
        }
      } else {
        // 其他模式，关闭下拉框
        this.closeDropdown();
      }
    } else {
      this.onSelectRangeDate(date);
    }
    
    this.cdr.markForCheck();
  }

  onSelectRangeDate(date: Date): void {
    if (this.isDateDisabled(date)) {
      return;
    }
    
    if (!this.rangeStart) {
      this.rangeStart = date;
      this.rangePart = 'end';
      this.selectedValue = { start: date, end: null };
      this.displayValue = `${this.formatDate(date)} ~`;
    } else {
      let start = this.rangeStart;
      let end = date;
      
      if (isBefore(date, this.rangeStart)) {
        start = date;
        end = this.rangeStart;
      }
      
      if (this.showTime) {
        // 保留时间部分
        const rangeValue = this.selectedValue as RangeValue<Date> || { start: null, end: null };
        
        if (rangeValue.start) {
          const currentStart = rangeValue.start;
          start = setHours(start, getHours(currentStart));
          start = setMinutes(start, getMinutes(currentStart));
          start = setSeconds(start, getSeconds(currentStart));
        }
        
        if (rangeValue.end) {
          const currentEnd = rangeValue.end;
          end = setHours(end, getHours(currentEnd));
          end = setMinutes(end, getMinutes(currentEnd));
          end = setSeconds(end, getSeconds(currentEnd));
        }
      }
      
      this.selectedValue = { start, end };
      this.displayValue = this.formatSelectedValue(this.selectedValue);
      this._onChange(this.selectedValue);
      
      this.rangeStart = null;
      this.rangePart = 'start';
      
      // 如果不显示时间，选择后关闭下拉框
      if (!this.showTime) {
        this.closeDropdown();
      } else if (['date', 'week'].includes(this.mode)) {
        // 对于日期和周模式，在有时间选择的情况下不关闭面板
        if (this.overlayRef) {
          setTimeout(() => {
            this.overlayRef?.updatePosition();
          }, 0);
        }
      } else {
        // 其他模式，关闭下拉框
        this.closeDropdown();
      }
    }
    
    this.cdr.markForCheck();
  }

  // 时间选择
  onSelectHour(hour: number): void {
    this.updateTimeValue('hour', hour);
  }

  onSelectMinute(minute: number): void {
    this.updateTimeValue('minute', minute);
  }

  onSelectSecond(second: number): void {
    this.updateTimeValue('second', second);
  }

  updateTimeValue(type: 'hour' | 'minute' | 'second', value: number): void {
    if (this.selectType === 'single') {
      if (this.mode === 'date' || this.mode === 'time') {
        // 对于date和time模式，使用单一日期
        let date = (this.selectedValue as Date) || new Date();
        
        if (type === 'hour') {
          date = setHours(date, value);
        } else if (type === 'minute') {
          date = setMinutes(date, value);
        } else if (type === 'second') {
          date = setSeconds(date, value);
        }
        
        this.selectedValue = date;
        this.displayValue = this.formatSelectedValue(date);
        this._onChange(this.selectedValue);
      } else if (this.isRangeValue(this.selectedValue)) {
        // 处理其他模式下的范围对象
        const range = this.selectedValue as RangeValue<Date> || { start: new Date(), end: null };
        
        if (range.start) {
          if (type === 'hour') {
            range.start = setHours(range.start, value);
            if (range.end) range.end = setHours(range.end, value);
          } else if (type === 'minute') {
            range.start = setMinutes(range.start, value);
            if (range.end) range.end = setMinutes(range.end, value);
          } else if (type === 'second') {
            range.start = setSeconds(range.start, value);
            if (range.end) range.end = setSeconds(range.end, value);
          }
        }
        
        this.selectedValue = range;
        this.displayValue = this.formatSelectedValue(range);
        this._onChange(this.selectedValue);
      }
    } else {
      // 范围选择模式
      const range = this.selectedValue as RangeValue<Date> || { start: null, end: null };
      
      if (this.rangePart === 'start' && range.start) {
        let date = range.start;
        
        if (type === 'hour') {
          date = setHours(date, value);
        } else if (type === 'minute') {
          date = setMinutes(date, value);
        } else if (type === 'second') {
          date = setSeconds(date, value);
        }
        
        range.start = date;
      } else if (this.rangePart === 'end' && range.end) {
        let date = range.end;
        
        if (type === 'hour') {
          date = setHours(date, value);
        } else if (type === 'minute') {
          date = setMinutes(date, value);
        } else if (type === 'second') {
          date = setSeconds(date, value);
        }
        
        range.end = date;
      }
      
      this.selectedValue = range;
      this.displayValue = this.formatSelectedValue(range);
      this._onChange(range);
    }
    
    this.cdr.markForCheck();
  }

  // 特殊功能
  setCurrentTime(): void {
    const now = new Date();
    
    if (this.mode === 'time') {
      // 对于时间模式，直接设置时间
      if (!this.selectedValue) {
        this.selectedValue = now;
      } else if (this.isSingleDate(this.selectedValue)) {
        // 保留年月日，只改变时分秒
        this.selectedValue = setHours(this.selectedValue, getHours(now));
        this.selectedValue = setMinutes(this.selectedValue, getMinutes(now));
        this.selectedValue = setSeconds(this.selectedValue, getSeconds(now));
      } else if (this.isRangeValue(this.selectedValue)) {
        // 如果是范围，更新start的时间部分
        const range = this.selectedValue as RangeValue<Date>;
        if (!range.start) {
          range.start = now;
        } else {
          range.start = setHours(range.start, getHours(now));
          range.start = setMinutes(range.start, getMinutes(now));
          range.start = setSeconds(range.start, getSeconds(now));
        }
        this.selectedValue = range;
      }
      
      this.displayValue = this.formatSelectedValue(this.selectedValue);
      this._onChange(this.selectedValue);
      this.cdr.markForCheck();
      return;
    }
    
    if (this.selectType === 'single') {
      if ((this.mode === 'date') || (this.mode as any === 'time')) {
        // 对于date和time模式，使用单一日期
        let date = this.selectedValue as Date || now;
        date = setHours(date, getHours(now));
        date = setMinutes(date, getMinutes(now));
        date = setSeconds(date, getSeconds(now));
        
        this.selectedValue = date;
        this.displayValue = this.formatSelectedValue(date);
        this._onChange(this.selectedValue);
      } else if (this.isRangeValue(this.selectedValue)) {
        // 处理其他模式下的范围对象
        const range = this.selectedValue as RangeValue<Date>;
        if (!range) return;
        
        if (range.start) {
          range.start = setHours(range.start, getHours(now));
          range.start = setMinutes(range.start, getMinutes(now));
          range.start = setSeconds(range.start, getSeconds(now));
          
          if (range.end) {
            range.end = setHours(range.end, getHours(now));
            range.end = setMinutes(range.end, getMinutes(now));
            range.end = setSeconds(range.end, getSeconds(now));
          }
        }
        
        this.selectedValue = range;
        this.displayValue = this.formatSelectedValue(range);
        this._onChange(this.selectedValue);
      }
    } else {
      // 范围选择模式
      const range = this.selectedValue as RangeValue<Date>;
      if (!range) return;
      
      if (this.rangePart === 'start' && range.start) {
        range.start = setHours(range.start, getHours(now));
        range.start = setMinutes(range.start, getMinutes(now));
        range.start = setSeconds(range.start, getSeconds(now));
      } else if (this.rangePart === 'end' && range.end) {
        range.end = setHours(range.end, getHours(now));
        range.end = setMinutes(range.end, getMinutes(now));
        range.end = setSeconds(range.end, getSeconds(now));
      }
      
      this.selectedValue = range;
      this.displayValue = this.formatSelectedValue(range);
      this._onChange(range);
    }
    
    this.cdr.markForCheck();
  }

  today(): void {
    const today = new Date();
    
    if (this.selectType === 'single') {
      if (this.mode === 'date' || this.mode === 'time') {
        // 对于date和time模式，使用单一日期
        this.selectedValue = today;
        this.displayValue = this.formatSelectedValue(today);
      } else {
        // 对于其他模式，选择合适的范围
        let start: Date, end: Date;
        
        switch (this.mode) {
          case 'year':
            start = new Date(getYear(today), 0, 1, 0, 0, 0);
            end = new Date(getYear(today), 11, 31, 23, 59, 59);
            break;
          case 'month':
            const lastDay = new Date(getYear(today), getMonth(today) + 1, 0).getDate();
            start = new Date(getYear(today), getMonth(today), 1, 0, 0, 0);
            end = new Date(getYear(today), getMonth(today), lastDay, 23, 59, 59);
            break;
          case 'quarter':
            const quarter = Math.floor(getMonth(today) / 3);
            const startMonth = quarter * 3;
            const endMonth = startMonth + 2;
            const quarterLastDay = new Date(getYear(today), endMonth + 1, 0).getDate();
            start = new Date(getYear(today), startMonth, 1, 0, 0, 0);
            end = new Date(getYear(today), endMonth, quarterLastDay, 23, 59, 59);
            break;
          case 'week':
            start = startOfWeek(today, { weekStartsOn: 0 });
            end = endOfWeek(today, { weekStartsOn: 0 });
            break;
          default:
            start = startOfDay(today);
            end = endOfDay(today);
        }
        
        this.selectedValue = { start, end };
        this.displayValue = this.formatSelectedValue(this.selectedValue);
      }
      
      this._onChange(this.selectedValue);
    } else {
      // 范围选择模式
      this.onSelectDate(today);
    }
    
    this.closeDropdown();
  }

  confirm(): void {
    this.closeDropdown();
  }

  // 辅助方法
  isToday(date: Date): boolean {
    return isSameDay(date, new Date());
  }

  isSelectedDay(date: Date): boolean {
    if (!this.selectedValue) return false;
    
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      return Boolean(
        (range.start && isSameDay(date, range.start)) || 
        (range.end && isSameDay(date, range.end))
      );
    } else if (this.isSingleDate(this.selectedValue)) {
      return isSameDay(date, this.selectedValue);
    }
    
    return false;
  }

  isInRange(date: Date | null): boolean {
    if (!date || this.selectType !== 'range') return false;
    
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      if (!range.start || !range.end) {
        if (this.rangeStart && this.hoverValue) {
          const start = isBefore(this.rangeStart, this.hoverValue) ? this.rangeStart : this.hoverValue;
          const end = isBefore(this.rangeStart, this.hoverValue) ? this.hoverValue : this.rangeStart;
          return isAfter(date, start) && isBefore(date, end);
        }
        return false;
      }
      
      return isAfter(date, range.start) && isBefore(date, range.end);
    }
    
    return false;
  }

  isSelectedMonth(month: number): boolean {
    if (!this.selectedValue) return false;
    
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      if (range.start) {
        return getMonth(range.start) === month && isSameYear(range.start, this.currentViewDate);
      }
    } else if (this.isSingleDate(this.selectedValue)) {
      return getMonth(this.selectedValue) === month && isSameYear(this.selectedValue, this.currentViewDate);
    }
    return false;
  }

  isSelectedQuarter(quarter: number): boolean {
    if (!this.selectedValue) return false;
    
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      if (range.start) {
        return Math.floor(getMonth(range.start) / 3) === quarter && isSameYear(range.start, this.currentViewDate);
      }
    } else if (this.isSingleDate(this.selectedValue)) {
      return Math.floor(getMonth(this.selectedValue) / 3) === quarter && isSameYear(this.selectedValue, this.currentViewDate);
    }
    return false;
  }

  isSelectedYear(year: number): boolean {
    if (!this.selectedValue) return false;
    
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      if (range.start) {
        return getYear(range.start) === year;
      }
    } else if (this.isSingleDate(this.selectedValue)) {
      return getYear(this.selectedValue) === year;
    }
    return false;
  }

  isDateDisabled(date: Date): boolean {
    return this.disabledDate ? this.disabledDate(date) : false;
  }

  isTimeDisabled(type: 'hour' | 'minute' | 'second', value: number): boolean {
    if (!this.disabledTime) return false;
    
    let date: Date | null = null;
    if (this.selectType === 'single' && this.isSingleDate(this.selectedValue)) {
      date = this.selectedValue;
    } else if (this.selectType === 'range' && this.isRangeValue(this.selectedValue)) {
      date = this.rangePart === 'start' ? this.selectedValue.start : this.selectedValue.end;
    }
    
    if (!date) return false;
    
    const disabledItems = this.disabledTime(date);
    if (!disabledItems) return false;
    
    if (type === 'hour' && disabledItems.hour) {
      return disabledItems.hour[value] === true;
    } else if (type === 'minute' && disabledItems.minute) {
      return disabledItems.minute[value] === true;
    } else if (type === 'second' && disabledItems.second) {
      return disabledItems.second[value] === true;
    }
    
    return false;
  }

  getStartDate(): Date | null {
    if (this.selectType !== 'range') return null;
    
    const range = this.selectedValue as RangeValue<Date>;
    return range ? range.start : null;
  }

  getEndDate(): Date | null {
    if (this.selectType !== 'range') return null;
    
    const range = this.selectedValue as RangeValue<Date>;
    return range ? range.end : null;
  }

  getHeaderText(): string {
    if (this.currentPanelMode === 'year') {
      return this.yearRangeText;
    } else if (this.currentPanelMode === 'month') {
      return `${getYear(this.currentViewDate)}`;
    } else if (this.currentPanelMode === 'quarter') {
      return `${getYear(this.currentViewDate)}`;
    } else {
      return `${getYear(this.currentViewDate)}年${getMonth(this.currentViewDate) + 1}月`;
    }
  }

  getHeaderYear(): string {
    return `${getYear(this.currentViewDate)}年`;
  }

  getHeaderMonth(): string {
    return `${getMonth(this.currentViewDate) + 1}月`;
  }

  renderDateCell(date: Date): string | TemplateRef<any> {
    if (this.dateRender) {
      return this.dateRender(date);
    }
    return getDate(date).toString();
  }

  isWeekInDateRange(week: Date[]): boolean {
    if (!week || week.length === 0) return false;
    return week.some(date => {
      if (!date) return false;
      return this.isInRange(date) || this.isSelectedDay(date);
    });
  }

  // 输入框焦点方法
  onInputFocus(): void {
    this.isFocused = true;
    this.cdr.markForCheck();
  }
  
  onInputBlur(): void {
    this.isFocused = false;
    this.cdr.markForCheck();
  }
  
  // 日期获取辅助方法
  getYear(date: Date | null): number {
    return date ? getYear(date) : 0;
  }
  
  getMonth(date: Date | null): number {
    return date ? getMonth(date) : 0;
  }
  
  getDate(date: Date | null): number {
    return date ? getDate(date) : 0;
  }

  // 类型检查辅助方法
  isSingleDate(value: any): value is Date {
    return value instanceof Date;
  }
  
  isRangeValue(value: any): value is RangeValue<Date> {
    return value && typeof value === 'object' && 'start' in value;
  }

  // 添加一个获取显示值的方法，供外部使用
  getDisplayValue(): string {
    return this.displayValue;
  }

  // 获取实际日期值供外部使用
  getDateValue(): Date | null {
    if (!this.selectedValue) return null;
    
    if (this.isRangeValue(this.selectedValue)) {
      return this.selectedValue.start;
    }
    
    return this.selectedValue as Date;
  }

  // 修改标题点击处理方法
  onHeaderClick(headerType: string): void {
    if (this.mode === 'date') {
      if (headerType === 'year') {
        // 点击年份部分，进入年份选择面板
        this.currentPanelMode = 'year';
      } else if (headerType === 'month') {
        // 点击月份部分，进入月份选择面板
        this.currentPanelMode = 'month';
      }
      this.cdr.markForCheck();
    }
  }

  private _onChange: (value: Date | RangeValue<Date> | null) => void = () => {};
  private _onTouched: () => void = () => {};
}
