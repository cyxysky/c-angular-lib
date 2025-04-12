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
  weekdays = ['一', '二', '三', '四', '五', '六', '日'];
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
  
  // 添加一个新的变量来跟踪时间选择的状态
  timeSelectStep: 'hour' | 'minute' | 'second' | 'complete' = 'hour';
  
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
      // 保存旧值以便后续处理
      const oldMode = changes['mode'].previousValue;
      const newMode = changes['mode'].currentValue;
      
      if (newMode === 'time') {
        this.currentPanelMode = 'time';
        this.format = 'HH:mm:ss';
      } else {
        this.currentPanelMode = newMode === 'week' ? 'date' : newMode;
        
        // 当从time切换到其他模式时，重新格式化显示值
        if (oldMode === 'time' && this.selectedValue) {
          // 设置合适的格式
          if (this.showTime && newMode === 'date') {
            this.format = 'yyyy-MM-dd HH:mm:ss';
          } else if (newMode === 'date') {
            this.format = 'yyyy-MM-dd';
          } else if (newMode === 'year') {
            this.format = 'yyyy';
          } else if (newMode === 'month') {
            this.format = 'yyyy-MM';
          } else if (newMode === 'quarter') {
            this.format = 'yyyy-QQ';
          } else if (newMode === 'week') {
            this.format = 'yyyy-ww';
          }
          
          // 如果是范围值，需要适配到新模式
          if (this.isRangeValue(this.selectedValue)) {
            const rangeValue = this.selectedValue as RangeValue<Date>;
            if (rangeValue.start) {
              let start, end;
              
              if (newMode === 'year') {
                start = startOfYear(rangeValue.start);
                end = rangeValue.end ? endOfYear(rangeValue.end) : null;
              } else if (newMode === 'month') {
                start = startOfMonth(rangeValue.start);
                end = rangeValue.end ? endOfMonth(rangeValue.end) : null;
              } else if (newMode === 'quarter') {
                start = startOfQuarter(rangeValue.start);
                end = rangeValue.end ? endOfQuarter(rangeValue.end) : null;
              } else if (newMode === 'week') {
                start = startOfWeek(rangeValue.start, { weekStartsOn: 1 });
                end = rangeValue.end ? endOfWeek(rangeValue.end, { weekStartsOn: 1 }) : null;
              } else {
                start = startOfDay(rangeValue.start);
                end = rangeValue.end ? endOfDay(rangeValue.end) : null;
              }
              
              this.selectedValue = { start, end };
            }
          } else if (this.isSingleDate(this.selectedValue)) {
            // 单日期值也需要调整
            const date = this.selectedValue as Date;
            if (newMode === 'year') {
              const start = startOfYear(date);
              const end = endOfYear(date);
              this.selectedValue = { start, end };
            } else if (newMode === 'month') {
              const start = startOfMonth(date);
              const end = endOfMonth(date);
              this.selectedValue = { start, end };
            } else if (newMode === 'quarter') {
              const start = startOfQuarter(date);
              const end = endOfQuarter(date);
              this.selectedValue = { start, end };
            } else if (newMode === 'week') {
              const start = startOfWeek(date, { weekStartsOn: 1 });
              const end = endOfWeek(date, { weekStartsOn: 1 });
              this.selectedValue = { start, end };
            }
          }
          
          // 重新格式化显示值
          this.displayValue = this.formatSelectedValue(this.selectedValue);
          
          // 确保视图更新
          this.cdr.detectChanges();
        }
      }
      
      // 重新生成日期矩阵
      this.generateDateMatrix();
      this.cdr.markForCheck();
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
          
          // 重置rangePart
          if (range.end) {
            this.rangePart = 'start';
          } else {
            this.rangePart = 'end';
          }
        } else {
          this.displayValue = '';
        }
      }
    } else {
      this.displayValue = '';
      this.rangePart = 'start'; // 重置rangePart
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
      } else if (this.mode === 'date' || this.mode === 'week') {
        this.currentPanelMode = 'date';
      } else {
        this.currentPanelMode = this.mode;
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
      this.rangePart = 'start'; // 重置rangePart
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
    
    // 修改这里：使用1作为weekStartsOn参数，表示周一是一周的第一天
    const firstWeekday = getDay(firstDayOfMonth) || 7; // 如果是0(周日)则改为7
    const daysFromPrevMonth = firstWeekday === 1 ? 0 : firstWeekday - 1;
    
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
          if (range.end) {
            // 跨年范围
            if (getYear(range.start) !== getYear(range.end)) {
              return `${getYear(range.start)} ~ ${getYear(range.end)}`;
            } 
            // 单年选择
            return `${getYear(range.start)}`;
          }
          return `${getYear(range.start)}`;
          
        case 'month':
          if (range.end) {
            // 跨月范围
            if (getYear(range.start) !== getYear(range.end) || getMonth(range.start) !== getMonth(range.end)) {
              return `${getYear(range.start)}-${String(getMonth(range.start) + 1).padStart(2, '0')} ~ ${getYear(range.end)}-${String(getMonth(range.end) + 1).padStart(2, '0')}`;
            }
            // 单月选择
            return `${getYear(range.start)}-${String(getMonth(range.start) + 1).padStart(2, '0')}`;
          }
          return `${getYear(range.start)}-${String(getMonth(range.start) + 1).padStart(2, '0')}`;
          
        case 'quarter':
          if (range.end) {
            const startQuarter = Math.floor(getMonth(range.start) / 3) + 1;
            const endQuarter = Math.floor(getMonth(range.end) / 3) + 1;
            // 跨季度范围
            if (getYear(range.start) !== getYear(range.end) || startQuarter !== endQuarter) {
              return `${getYear(range.start)}-Q${startQuarter} ~ ${getYear(range.end)}-Q${endQuarter}`;
            }
            // 单季度选择
            return `${getYear(range.start)}-Q${startQuarter}`;
          }
          const quarter = Math.floor(getMonth(range.start) / 3) + 1;
          return `${getYear(range.start)}-Q${quarter}`;
          
        case 'week':
          if (range.end) {
            // 获取周数
            const startFirstDayOfYear = new Date(getYear(range.start), 0, 1);
            const startPastDaysOfYear = differenceInDays(range.start, startFirstDayOfYear);
            const startWeekNumber = Math.ceil((startPastDaysOfYear + getDay(startFirstDayOfYear)) / 7);
            
            const endFirstDayOfYear = new Date(getYear(range.end), 0, 1);
            const endPastDaysOfYear = differenceInDays(range.end, endFirstDayOfYear);
            const endWeekNumber = Math.ceil((endPastDaysOfYear + getDay(endFirstDayOfYear)) / 7);
            
            // 跨周范围
            if (getYear(range.start) !== getYear(range.end) || startWeekNumber !== endWeekNumber) {
              return `${getYear(range.start)}-${startWeekNumber}周 ~ ${getYear(range.end)}-${endWeekNumber}周`;
            }
            // 单周选择
            return `${getYear(range.start)}-${startWeekNumber}周`;
          }
          // 获取周数
          const firstDayOfYear = new Date(getYear(range.start), 0, 1);
          const pastDaysOfYear = differenceInDays(range.start, firstDayOfYear);
          const weekNumber = Math.ceil((pastDaysOfYear + getDay(firstDayOfYear)) / 7);
          return `${getYear(range.start)}-${weekNumber}周`;
          
        case 'time':
          if (range.end) {
            return `${this.formatTime(range.start)} ~ ${this.formatTime(range.end)}`;
          } else {
            return this.formatTime(range.start);
          }
          
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
      if (this.selectType === 'single') {
        const start = new Date(year, 0, 1, 0, 0, 0);  // 1月1日 00:00:00
        const end = new Date(year, 11, 31, 23, 59, 59);  // 12月31日 23:59:59
        
        this.selectedValue = { start, end };
        this.displayValue = this.formatSelectedValue(this.selectedValue);
        this._onChange(this.selectedValue);
        
        this.closeDropdown();
      } else if (this.selectType === 'range') {
        // 范围选择模式，需要选择两次
        const selectedDate = new Date(year, 0, 1);
        this.onSelectRangeDate(selectedDate);
      }
    } else {
      this.currentPanelMode = 'month';
      this.cdr.markForCheck();
    }
  }

  onSelectMonth(month: number): void {
    this.currentViewDate = setMonth(this.currentViewDate, month);
    
    if (this.mode === 'month') {
      if (this.selectType === 'single') {
        const year = getYear(this.currentViewDate);
        const lastDay = new Date(year, month + 1, 0).getDate(); // 获取当月最后一天
        const start = new Date(year, month, 1, 0, 0, 0); // 当月1日 00:00:00
        const end = new Date(year, month, lastDay, 23, 59, 59); // 当月最后一天 23:59:59
        
        this.selectedValue = { start, end };
        this.displayValue = this.formatSelectedValue(this.selectedValue);
        this._onChange(this.selectedValue);
        
        this.closeDropdown();
      } else if (this.selectType === 'range') {
        // 范围选择模式，需要选择两次
        const selectedDate = new Date(getYear(this.currentViewDate), month, 1);
        this.onSelectRangeDate(selectedDate);
      }
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
      if (this.selectType === 'single') {
        const start = new Date(year, startMonth, 1, 0, 0, 0); // 季度第一天 00:00:00
        const endMonth = startMonth + 2;
        const lastDay = new Date(year, endMonth + 1, 0).getDate(); // 季度最后一个月的最后一天
        const end = new Date(year, endMonth, lastDay, 23, 59, 59); // 季度最后一天 23:59:59
        
        this.selectedValue = { start, end };
        this.displayValue = this.formatSelectedValue(this.selectedValue);
        this._onChange(this.selectedValue);
        
        this.closeDropdown();
      } else if (this.selectType === 'range') {
        // 范围选择模式，需要选择两次
        const selectedDate = new Date(year, startMonth, 1);
        this.onSelectRangeDate(selectedDate);
      }
    } else {
      this.currentPanelMode = 'date';
      this.generateDateMatrix();
      this.cdr.markForCheck();
    }
  }

  onSelectWeek(dates: Date[]): void {
    if (dates && dates.length === 0) return;
    
    const firstDate = dates[0];
    
    if (this.selectType === 'single') {
      const weekStart = startOfWeek(firstDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(firstDate, { weekStartsOn: 1 });
      
      this.selectedValue = { start: weekStart, end: weekEnd };
      this.displayValue = this.formatSelectedValue(this.selectedValue);
      this._onChange(this.selectedValue);
      this.closeDropdown();
    } else if (this.selectType === 'range') {
      // 范围选择模式，需要选择两次
      this.onSelectRangeDate(firstDate);
    }
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
      // 根据不同mode设置范围起始值
      let start = date;
      if (this.mode === 'year') {
        start = startOfYear(date);
      } else if (this.mode === 'month') {
        start = startOfMonth(date);
      } else if (this.mode === 'quarter') {
        start = startOfQuarter(date);
      } else if (this.mode === 'week') {
        start = startOfWeek(date, { weekStartsOn: 0 });
      } else if (this.mode === 'date') {
        start = startOfDay(date);
      }
      
      this.rangeStart = start;
      this.rangePart = 'end';
      this.selectedValue = { start, end: null };
      this.displayValue = `${this.formatDate(start)} ~`;
      
      // 对于时间模式，在选择第一部分后强制刷新UI
      if (this.mode === 'time') {
        setTimeout(() => {
          if (this.overlayRef) {
            this.overlayRef.updatePosition();
          }
        }, 0);
      }
    } else {
      let start = this.rangeStart;
      let end = date;
      
      // 根据不同mode生成正确的结束日期
      if (this.mode === 'year') {
        end = endOfYear(date);
      } else if (this.mode === 'month') {
        end = endOfMonth(date);
      } else if (this.mode === 'quarter') {
        end = endOfQuarter(date);
      } else if (this.mode === 'week') {
        end = endOfWeek(date, { weekStartsOn: 0 });
      } else if (this.mode === 'date') {
        end = endOfDay(date);
      }
      
      // 确保开始日期在结束日期之前
      if (isBefore(end, start)) {
        const temp = start;
        start = end;
        end = temp;
      }
      
      // 保留时间部分
      if (this.showTime) {
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
    if (this.isTimeDisabled('hour', hour)) {
      return;
    }
    
    if (this.selectType === 'single') {
      this.updateTimeValue('hour', hour);
    } else if (this.selectType === 'range') {
      // 将步骤设为小时选择
      this.timeSelectStep = 'hour';
      // 范围选择模式下的时间选择
      this.updateTimeRangeValue('hour', hour);
    }
  }

  onSelectMinute(minute: number): void {
    if (this.isTimeDisabled('minute', minute)) {
      return;
    }
    
    if (this.selectType === 'single') {
      this.updateTimeValue('minute', minute);
    } else if (this.selectType === 'range') {
      // 将步骤设为分钟选择
      this.timeSelectStep = 'minute';
      // 范围选择模式下的时间选择
      this.updateTimeRangeValue('minute', minute);
    }
  }

  onSelectSecond(second: number): void {
    if (this.isTimeDisabled('second', second)) {
      return;
    }
    
    if (this.selectType === 'single') {
      this.updateTimeValue('second', second);
    } else if (this.selectType === 'range') {
      // 将步骤设为秒选择
      this.timeSelectStep = 'second';
      // 范围选择模式下的时间选择
      this.updateTimeRangeValue('second', second);
    }
  }

  // 更新范围选择中的时间值
  updateTimeRangeValue(type: 'hour' | 'minute' | 'second', value: number): void {
    if (!this.rangeStart && type === 'hour') {
      // 第一次选择，创建初始时间并选择小时
      const now = new Date();
      const start = new Date(now);
      start.setHours(value);
      start.setMinutes(0);
      start.setSeconds(0);
      
      this.rangeStart = start;
      this.selectedValue = { start, end: null };
      this.displayValue = `${this.padZero(value)}:00:00`;
      this._onChange(this.selectedValue);
      
      // 设置为分钟选择步骤
      this.timeSelectStep = 'minute';
      this.cdr.markForCheck();
    } else if (this.rangeStart && this.isRangeValue(this.selectedValue) && !this.selectedValue.end && this.timeSelectStep === 'minute' && type === 'minute') {
      // 选择分钟
      const updatedStart = new Date(this.rangeStart);
      updatedStart.setMinutes(value);
      
      this.rangeStart = updatedStart;
      this.selectedValue = { start: updatedStart, end: null };
      this.displayValue = `${this.padZero(updatedStart.getHours())}:${this.padZero(value)}:00`;
      this._onChange(this.selectedValue);
      
      // 设置为秒选择步骤
      this.timeSelectStep = 'second';
      this.cdr.markForCheck();
    } else if (this.rangeStart && this.isRangeValue(this.selectedValue) && !this.selectedValue.end && this.timeSelectStep === 'second' && type === 'second') {
      // 选择秒，完成起始时间选择
      const updatedStart = new Date(this.rangeStart);
      updatedStart.setSeconds(value);
      
      this.rangeStart = updatedStart;
      this.selectedValue = { start: updatedStart, end: null };
      this.displayValue = `${this.formatTime(updatedStart)} ~`;
      this._onChange(this.selectedValue);
      
      // 重置为小时选择步骤，为结束时间选择做准备
      this.timeSelectStep = 'hour';
      this.rangePart = 'end';
      this.cdr.markForCheck();
    } else if (this.rangeStart && this.rangePart === 'end' && type === 'hour') {
      // 选择结束时间的小时
      let end = new Date();
      
      // 从rangeStart复制年月日
      end.setFullYear(this.rangeStart.getFullYear());
      end.setMonth(this.rangeStart.getMonth());
      end.setDate(this.rangeStart.getDate());
      
      // 设置小时，重置分钟和秒
      end.setHours(value);
      end.setMinutes(0);
      end.setSeconds(0);
      
      this.selectedValue = { start: this.rangeStart, end };
      this.displayValue = `${this.formatTime(this.rangeStart)} ~ ${this.padZero(value)}:00:00`;
      this._onChange(this.selectedValue);
      
      // 设置为分钟选择步骤
      this.timeSelectStep = 'minute';
      this.cdr.markForCheck();
    } else if (this.rangeStart && this.rangePart === 'end' && this.isRangeValue(this.selectedValue) && this.timeSelectStep === 'minute' && type === 'minute') {
      // 选择结束时间的分钟
      let end = this.selectedValue.end ? new Date(this.selectedValue.end) : new Date();
      
      if (!this.selectedValue.end) {
        // 从rangeStart复制年月日
        end.setFullYear(this.rangeStart.getFullYear());
        end.setMonth(this.rangeStart.getMonth());
        end.setDate(this.rangeStart.getDate());
      }
      
      // 设置分钟，重置秒
      end.setMinutes(value);
      end.setSeconds(0);
      
      this.selectedValue = { start: this.rangeStart, end };
      this.displayValue = `${this.formatTime(this.rangeStart)} ~ ${this.padZero(end.getHours())}:${this.padZero(value)}:00`;
      this._onChange(this.selectedValue);
      
      // 设置为秒选择步骤
      this.timeSelectStep = 'second';
      this.cdr.markForCheck();
    } else if (this.rangeStart && this.rangePart === 'end' && this.isRangeValue(this.selectedValue) && this.timeSelectStep === 'second' && type === 'second') {
      // 选择结束时间的秒，完成整个时间范围选择
      let end = this.selectedValue.end ? new Date(this.selectedValue.end) : new Date();
      
      if (!this.selectedValue.end) {
        // 从rangeStart复制年月日
        end.setFullYear(this.rangeStart.getFullYear());
        end.setMonth(this.rangeStart.getMonth());
        end.setDate(this.rangeStart.getDate());
      }
      
      // 设置秒
      end.setSeconds(value);
      
      // 确保开始时间在结束时间之前
      let start = this.rangeStart;
      if (isBefore(end, start)) {
        const temp = start;
        start = end;
        end = temp;
      }
      
      this.selectedValue = { start, end };
      this.displayValue = `${this.formatTime(start)} ~ ${this.formatTime(end)}`;
      this._onChange(this.selectedValue);
      
      // 重置状态
      this.rangeStart = null;
      this.rangePart = 'start';
      this.timeSelectStep = 'hour';
      
      // 如果不显示时间选择器，关闭下拉框
      if (!this.showTime) {
        this.closeDropdown();
      }
      
      this.cdr.markForCheck();
    } else {
      // 处理单步选择的情况或类型不匹配的情况
      if (type === 'hour') {
        this.timeSelectStep = 'hour';
        
        // 更新当前选择的时间值
        if (this.rangePart === 'start' && this.rangeStart) {
          const updatedStart = new Date(this.rangeStart);
          updatedStart.setHours(value);
          this.rangeStart = updatedStart;
          if (this.isRangeValue(this.selectedValue)) {
            this.selectedValue = { start: updatedStart, end: this.selectedValue.end };
          } else {
            this.selectedValue = { start: updatedStart, end: null };
          }
          this.displayValue = this.formatSelectedValue(this.selectedValue);
          this._onChange(this.selectedValue);
        } else if (this.rangePart === 'end' && this.isRangeValue(this.selectedValue) && this.selectedValue.end) {
          const updatedEnd = new Date(this.selectedValue.end);
          updatedEnd.setHours(value);
          this.selectedValue = { start: this.selectedValue.start, end: updatedEnd };
          this.displayValue = this.formatSelectedValue(this.selectedValue);
          this._onChange(this.selectedValue);
        }
      } else if (type === 'minute') {
        this.timeSelectStep = 'minute';
        
        // 更新当前选择的时间值
        if (this.rangePart === 'start' && this.rangeStart) {
          const updatedStart = new Date(this.rangeStart);
          updatedStart.setMinutes(value);
          this.rangeStart = updatedStart;
          if (this.isRangeValue(this.selectedValue)) {
            this.selectedValue = { start: updatedStart, end: this.selectedValue.end };
          } else {
            this.selectedValue = { start: updatedStart, end: null };
          }
          this.displayValue = this.formatSelectedValue(this.selectedValue);
          this._onChange(this.selectedValue);
        } else if (this.rangePart === 'end' && this.isRangeValue(this.selectedValue) && this.selectedValue.end) {
          const updatedEnd = new Date(this.selectedValue.end);
          updatedEnd.setMinutes(value);
          this.selectedValue = { start: this.selectedValue.start, end: updatedEnd };
          this.displayValue = this.formatSelectedValue(this.selectedValue);
          this._onChange(this.selectedValue);
        }
      } else if (type === 'second') {
        this.timeSelectStep = 'second';
        
        // 更新当前选择的时间值
        if (this.rangePart === 'start' && this.rangeStart) {
          const updatedStart = new Date(this.rangeStart);
          updatedStart.setSeconds(value);
          this.rangeStart = updatedStart;
          if (this.isRangeValue(this.selectedValue)) {
            this.selectedValue = { start: updatedStart, end: this.selectedValue.end };
          } else {
            this.selectedValue = { start: updatedStart, end: null };
          }
          this.displayValue = this.formatSelectedValue(this.selectedValue);
          this._onChange(this.selectedValue);
        } else if (this.rangePart === 'end' && this.isRangeValue(this.selectedValue) && this.selectedValue.end) {
          const updatedEnd = new Date(this.selectedValue.end);
          updatedEnd.setSeconds(value);
          this.selectedValue = { start: this.selectedValue.start, end: updatedEnd };
          this.displayValue = this.formatSelectedValue(this.selectedValue);
          this._onChange(this.selectedValue);
        }
      }
      
      this.cdr.markForCheck();
    }
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
          let start = new Date(range.start);
          let end = range.end ? new Date(range.end) : null;
          
          if (type === 'hour') {
            start = setHours(start, value);
            if (end) end = setHours(end, value);
          } else if (type === 'minute') {
            start = setMinutes(start, value);
            if (end) end = setMinutes(end, value);
          } else if (type === 'second') {
            start = setSeconds(start, value);
            if (end) end = setSeconds(end, value);
          }
          
          range.start = start;
          if (end) range.end = end;
        }
        
        this.selectedValue = range;
        this.displayValue = this.formatSelectedValue(range);
        this._onChange(this.selectedValue);
      }
    } else {
      // 范围选择模式
      const range = this.selectedValue as RangeValue<Date> || { start: null, end: null };
      
      if (this.rangePart === 'start' && range.start) {
        let date = new Date(range.start);
        
        if (type === 'hour') {
          date = setHours(date, value);
        } else if (type === 'minute') {
          date = setMinutes(date, value);
        } else if (type === 'second') {
          date = setSeconds(date, value);
        }
        
        range.start = date;
      } else if (this.rangePart === 'end' && range.end) {
        let date = new Date(range.end);
        
        if (type === 'hour') {
          date = setHours(date, value);
        } else if (type === 'minute') {
          date = setMinutes(date, value);
        } else if (type === 'second') {
          date = setSeconds(date, value);
        }
        
        range.end = date;
      } else if (this.rangePart === 'start' && !range.start) {
        // 创建新的开始时间
        const date = new Date();
        if (type === 'hour') {
          date.setHours(value);
        } else if (type === 'minute') {
          date.setMinutes(value);
        } else if (type === 'second') {
          date.setSeconds(value);
        }
        
        range.start = date;
      } else if (this.rangePart === 'end' && !range.end && range.start) {
        // 创建新的结束时间，基于开始时间
        const date = new Date(range.start);
        if (type === 'hour') {
          date.setHours(value);
        } else if (type === 'minute') {
          date.setMinutes(value);
        } else if (type === 'second') {
          date.setSeconds(value);
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
      if (this.mode === 'date' || this.mode === 'week') {
        const isStartSelected = range.start ? isSameDay(date, range.start) : false;
        const isEndSelected = range.end ? isSameDay(date, range.end) : false;
        return isStartSelected || isEndSelected;
      } else if (this.mode === 'month') {
        const isStartSelected = range.start ? isSameMonth(date, range.start) : false;
        const isEndSelected = range.end ? isSameMonth(date, range.end) : false;
        return isStartSelected || isEndSelected;
      } else if (this.mode === 'quarter') {
        const isStartSelected = range.start ? (Math.floor(getMonth(date) / 3) === Math.floor(getMonth(range.start) / 3) && getYear(date) === getYear(range.start)) : false;
        const isEndSelected = range.end ? (Math.floor(getMonth(date) / 3) === Math.floor(getMonth(range.end) / 3) && getYear(date) === getYear(range.end)) : false;
        return isStartSelected || isEndSelected;
      } else if (this.mode === 'year') {
        const isStartSelected = range.start ? (getYear(date) === getYear(range.start)) : false;
        const isEndSelected = range.end ? (getYear(date) === getYear(range.end)) : false;
        return isStartSelected || isEndSelected;
      }
    } else if (this.isSingleDate(this.selectedValue)) {
      return isSameDay(date, this.selectedValue);
    }
    
    return false;
  }

  isSelectedMonth(month: number): boolean| any {
    if (!this.selectedValue) return false;
    
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      if (range.start) {
        const isStartSelected = getMonth(range.start) === month && isSameYear(range.start, this.currentViewDate);
        const isEndSelected = range.end && getMonth(range.end) === month && isSameYear(range.end, this.currentViewDate);
        return isStartSelected || isEndSelected;
      }
    } else if (this.isSingleDate(this.selectedValue)) {
      return getMonth(this.selectedValue) === month && isSameYear(this.selectedValue, this.currentViewDate);
    }
    return false;
  }

  isSelectedQuarter(quarter: number): boolean | any {
    if (!this.selectedValue) return false;
    
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      if (range.start) {
        const isStartSelected = Math.floor(getMonth(range.start) / 3) === quarter && isSameYear(range.start, this.currentViewDate);
        const isEndSelected = range.end && Math.floor(getMonth(range.end) / 3) === quarter && isSameYear(range.end, this.currentViewDate);
        return isStartSelected || isEndSelected;
      }
    } else if (this.isSingleDate(this.selectedValue)) {
      return Math.floor(getMonth(this.selectedValue) / 3) === quarter && isSameYear(this.selectedValue, this.currentViewDate);
    }
    return false;
  }

  isSelectedYear(year: number): boolean | any {
    if (!this.selectedValue) return false;
    
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      if (range.start) {
        const isStartSelected = getYear(range.start) === year;
        const isEndSelected = range.end && getYear(range.end) === year;
        return isStartSelected || isEndSelected;
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

  isInRange(date: Date | null): boolean {
    if (!date || this.selectType !== 'range') return false;
    
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      
      // 处理还未完成的范围选择（用户选择了起始日期但还未选择结束日期）
      if (!range.start || !range.end) {
        if (this.rangeStart && this.hoverValue) {
          // 根据不同mode比较日期
          if (this.mode === 'year') {
            const startYear = getYear(this.rangeStart);
            const endYear = getYear(this.hoverValue);
            const currentYear = getYear(date);
            
            return (startYear <= currentYear && currentYear <= endYear) || 
                   (endYear <= currentYear && currentYear <= startYear);
          } else if (this.mode === 'month') {
            const startYear = getYear(this.rangeStart);
            const startMonth = getMonth(this.rangeStart);
            const endYear = getYear(this.hoverValue);
            const endMonth = getMonth(this.hoverValue);
            const currentYear = getYear(date);
            const currentMonth = getMonth(date);
            
            const startValue = startYear * 12 + startMonth;
            const endValue = endYear * 12 + endMonth;
            const currentValue = currentYear * 12 + currentMonth;
            
            return (startValue <= currentValue && currentValue <= endValue) || 
                   (endValue <= currentValue && currentValue <= startValue);
          } else if (this.mode === 'quarter') {
            const startYear = getYear(this.rangeStart);
            const startQuarter = Math.floor(getMonth(this.rangeStart) / 3);
            const endYear = getYear(this.hoverValue);
            const endQuarter = Math.floor(getMonth(this.hoverValue) / 3);
            const currentYear = getYear(date);
            const currentQuarter = Math.floor(getMonth(date) / 3);
            
            const startValue = startYear * 4 + startQuarter;
            const endValue = endYear * 4 + endQuarter;
            const currentValue = currentYear * 4 + currentQuarter;
            
            return (startValue <= currentValue && currentValue <= endValue) || 
                   (endValue <= currentValue && currentValue <= startValue);
          } else if (this.mode === 'week') {
            // 周模式使用日期比较
            const start = isBefore(this.rangeStart, this.hoverValue) ? this.rangeStart : this.hoverValue;
            const end = isBefore(this.rangeStart, this.hoverValue) ? this.hoverValue : this.rangeStart;
            return isAfter(date, start) && isBefore(date, end);
          } else {
            // 日期模式使用日期比较
            const start = isBefore(this.rangeStart, this.hoverValue) ? this.rangeStart : this.hoverValue;
            const end = isBefore(this.rangeStart, this.hoverValue) ? this.hoverValue : this.rangeStart;
            return isAfter(date, start) && isBefore(date, end);
          }
        }
        return false;
      }
      
      // 已完成的范围选择
      if (this.mode === 'year') {
        const startYear = getYear(range.start);
        const endYear = getYear(range.end);
        const currentYear = getYear(date);
        
        return startYear <= currentYear && currentYear <= endYear;
      } else if (this.mode === 'month') {
        const startYear = getYear(range.start);
        const startMonth = getMonth(range.start);
        const endYear = getYear(range.end);
        const endMonth = getMonth(range.end);
        const currentYear = getYear(date);
        const currentMonth = getMonth(date);
        
        const startValue = startYear * 12 + startMonth;
        const endValue = endYear * 12 + endMonth;
        const currentValue = currentYear * 12 + currentMonth;
        
        return startValue <= currentValue && currentValue <= endValue;
      } else if (this.mode === 'quarter') {
        const startYear = getYear(range.start);
        const startQuarter = Math.floor(getMonth(range.start) / 3);
        const endYear = getYear(range.end);
        const endQuarter = Math.floor(getMonth(range.end) / 3);
        const currentYear = getYear(date);
        const currentQuarter = Math.floor(getMonth(date) / 3);
        
        const startValue = startYear * 4 + startQuarter;
        const endValue = endYear * 4 + endQuarter;
        const currentValue = currentYear * 4 + currentQuarter;
        
        return startValue <= currentValue && currentValue <= endValue;
      } else {
        // 日期和周模式使用日期比较
        return isAfter(date, range.start) && isBefore(date, range.end);
      }
    }
    
    return false;
  }

  // 年份选择的Hover事件
  onCellYearHover(year: number): void {
    const date = new Date(year, 0, 1);
    this.hoverValue = date;
    this.cdr.markForCheck();
  }

  // 月份选择的Hover事件
  onCellMonthHover(month: number): void {
    const date = new Date(getYear(this.currentViewDate), month, 1);
    this.hoverValue = date;
    this.cdr.markForCheck();
  }

  // 季度选择的Hover事件
  onCellQuarterHover(quarter: number): void {
    const startMonth = quarter * 3;
    const date = new Date(getYear(this.currentViewDate), startMonth, 1);
    this.hoverValue = date;
    this.cdr.markForCheck();
  }

  // 判断年份是否在选择范围内
  isInYearRange(year: number): boolean {
    if (this.selectType !== 'range') return false;
    
    // 处理已完成的范围选择
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      if (range.start && range.end) {
        const startYear = getYear(range.start);
        const endYear = getYear(range.end);
        return year >= startYear && year <= endYear;
      }
    }
    
    // 处理还未完成的范围选择（用户选择了起始日期但还未选择结束日期）
    if (this.rangeStart && this.hoverValue) {
      const startYear = getYear(this.rangeStart);
      const endYear = getYear(this.hoverValue);
      
      if (startYear <= endYear) {
        return year >= startYear && year <= endYear;
      } else {
        return year >= endYear && year <= startYear;
      }
    }
    
    return false;
  }

  // 判断月份是否在选择范围内
  isInMonthRange(month: number): boolean {
    if (this.selectType !== 'range') return false;
    
    const currentYear = getYear(this.currentViewDate);
    const currentMonthValue = currentYear * 12 + month;
    
    // 处理已完成的范围选择
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      if (range.start && range.end) {
        const startYear = getYear(range.start);
        const startMonth = getMonth(range.start);
        const endYear = getYear(range.end);
        const endMonth = getMonth(range.end);
        
        const startValue = startYear * 12 + startMonth;
        const endValue = endYear * 12 + endMonth;
        
        return currentMonthValue >= startValue && currentMonthValue <= endValue;
      }
    }
    
    // 处理还未完成的范围选择
    if (this.rangeStart && this.hoverValue) {
      const startYear = getYear(this.rangeStart);
      const startMonth = getMonth(this.rangeStart);
      const endYear = getYear(this.hoverValue);
      const endMonth = getMonth(this.hoverValue);
      
      const startValue = startYear * 12 + startMonth;
      const endValue = endYear * 12 + endMonth;
      
      if (startValue <= endValue) {
        return currentMonthValue >= startValue && currentMonthValue <= endValue;
      } else {
        return currentMonthValue >= endValue && currentMonthValue <= startValue;
      }
    }
    
    return false;
  }

  // 判断季度是否在选择范围内
  isInQuarterRange(quarter: number): boolean {
    if (this.selectType !== 'range') return false;
    
    const currentYear = getYear(this.currentViewDate);
    const currentQuarterValue = currentYear * 4 + quarter;
    
    // 处理已完成的范围选择
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      if (range.start && range.end) {
        const startYear = getYear(range.start);
        const startQuarter = Math.floor(getMonth(range.start) / 3);
        const endYear = getYear(range.end);
        const endQuarter = Math.floor(getMonth(range.end) / 3);
        
        const startValue = startYear * 4 + startQuarter;
        const endValue = endYear * 4 + endQuarter;
        
        return currentQuarterValue >= startValue && currentQuarterValue <= endValue;
      }
    }
    
    // 处理还未完成的范围选择
    if (this.rangeStart && this.hoverValue) {
      const startYear = getYear(this.rangeStart);
      const startQuarter = Math.floor(getMonth(this.rangeStart) / 3);
      const endYear = getYear(this.hoverValue);
      const endQuarter = Math.floor(getMonth(this.hoverValue) / 3);
      
      const startValue = startYear * 4 + startQuarter;
      const endValue = endYear * 4 + endQuarter;
      
      if (startValue <= endValue) {
        return currentQuarterValue >= startValue && currentQuarterValue <= endValue;
      } else {
        return currentQuarterValue >= endValue && currentQuarterValue <= startValue;
      }
    }
    
    return false;
  }

  // 周选择的Hover事件
  onCellWeekHover(week: Date[]): void {
    if (week && week.length > 0) {
      this.hoverValue = week[0];  // 使用周的第一天作为hover值
      this.cdr.markForCheck();
    }
  }

  // 判断周是否在选择范围内
  isInWeekRange(week: Date[]): boolean {
    if (this.selectType !== 'range' || !week || week.length === 0) return false;
    
    const weekStart = week[0];
    const weekEnd = week[week.length - 1];
    
    // 处理已完成的范围选择
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      if (range.start && range.end) {
        // 检查周的开始或结束日期是否在选择范围内
        return (
          !isBefore(weekStart, range.start) && !isAfter(weekStart, range.end) ||
          !isBefore(weekEnd, range.start) && !isAfter(weekEnd, range.end) ||
          !isBefore(range.start, weekStart) && !isAfter(range.start, weekEnd)
        );
      }
    }
    
    // 处理还未完成的范围选择
    if (this.rangeStart && this.hoverValue) {
      const start = isBefore(this.rangeStart, this.hoverValue) ? this.rangeStart : this.hoverValue;
      const end = isBefore(this.rangeStart, this.hoverValue) ? this.hoverValue : this.rangeStart;
      
      // 检查周的开始或结束日期是否在选择范围内
      return (
        !isBefore(weekStart, start) && !isAfter(weekStart, end) ||
        !isBefore(weekEnd, start) && !isAfter(weekEnd, end) ||
        !isBefore(start, weekStart) && !isAfter(start, weekEnd)
      );
    }
    
    return false;
  }

  // 获取周数
  getWeekNumber(date: Date): number {
    if (!date) return 0;
    
    const firstDayOfYear = new Date(getYear(date), 0, 1);
    const pastDaysOfYear = differenceInDays(date, firstDayOfYear);
    const weekNumber = Math.ceil((pastDaysOfYear + getDay(firstDayOfYear)) / 7);
    
    return weekNumber;
  }

  // 获取时间面板的标题文本
  getTimeHeaderText(): string {
    if (this.selectType === 'range') {
      if (this.isRangeValue(this.selectedValue)) {
        const range = this.selectedValue as RangeValue<Date>;
        if (this.rangePart === 'start') {
          if (range.start) {
            return `选择开始时间: ${this.formatTime(range.start)}`;
          } else {
            return `选择开始时间: 请选择${this.timeSelectStep === 'hour' ? '小时' : this.timeSelectStep === 'minute' ? '分钟' : '秒'}`;
          }
        } else {
          if (range.start) {
            if (range.end) {
              return `${this.formatTime(range.start)} ~ ${this.formatTime(range.end)}`;
            } else {
              return `选择结束时间: 请选择${this.timeSelectStep === 'hour' ? '小时' : this.timeSelectStep === 'minute' ? '分钟' : '秒'}`;
            }
          }
        }
      }
      return '请选择时间范围';
    } else {
      if (this.isSingleDate(this.selectedValue)) {
        return this.formatTime(this.selectedValue as Date);
      }
      return '请选择时间';
    }
  }

  // 格式化时间（不包含日期部分）
  formatTime(date: Date): string {
    if (!date) return '';
    return `${this.padZero(getHours(date))}:${this.padZero(getMinutes(date))}:${this.padZero(getSeconds(date))}`;
  }

  // 为数字补0
  padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  // 判断时间单位是否被选中
  isSelectedTimeUnit(unit: 'hour' | 'minute' | 'second', value: number): boolean {
    if (!this.selectedValue) return false;
    
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      
      if (this.selectType === 'range') {
        // 范围选择模式下，根据当前选择的部分(start/end)判断
        if (this.rangePart === 'start' && range.start) {
          return this.isTimeUnitMatch(range.start, unit, value);
        } else if (this.rangePart === 'end' && range.end) {
          return this.isTimeUnitMatch(range.end, unit, value);
        }
      } else {
        // 单选模式下，判断start和end
        const isStartMatch = range.start ? this.isTimeUnitMatch(range.start, unit, value) : false;
        const isEndMatch = range.end ? this.isTimeUnitMatch(range.end, unit, value) : false;
        
        return isStartMatch || isEndMatch;
      }
    } else if (this.isSingleDate(this.selectedValue)) {
      return this.isTimeUnitMatch(this.selectedValue, unit, value);
    }
    
    return false;
  }

  // 判断指定时间单位是否匹配
  isTimeUnitMatch(date: Date, unit: 'hour' | 'minute' | 'second', value: number): boolean {
    if (!date) return false;
    
    switch (unit) {
      case 'hour':
        return getHours(date) === value;
      case 'minute':
        return getMinutes(date) === value;
      case 'second':
        return getSeconds(date) === value;
      default:
        return false;
    }
  }

  // 判断时间单位是否在范围内
  isInTimeRange(unit: 'hour' | 'minute' | 'second', value: number): boolean {
    if (this.selectType !== 'range') return false;
    
    // 处理已完成的范围选择
    if (this.isRangeValue(this.selectedValue)) {
      const range = this.selectedValue as RangeValue<Date>;
      if (range.start && range.end) {
        const startValue = this.getTimeUnitValue(range.start, unit);
        const endValue = this.getTimeUnitValue(range.end, unit);
        
        // 只有在同一天内的时间范围才显示范围高亮
        if (isSameDay(range.start, range.end)) {
          // 如果其他时间单位不同，则需要考虑它们
          if (unit === 'hour') {
            return value > startValue && value < endValue;
          } else if (unit === 'minute') {
            const startHour = getHours(range.start);
            const endHour = getHours(range.end);
            
            if (startHour === endHour) {
              return value > startValue && value < endValue;
            } else {
              // 不同小时，只在边界小时显示范围
              const currentVal = this.getCurrentTimeValue();
              if (!currentVal) return false;
              
              if (getHours(currentVal) === startHour) {
                return value > startValue;
              } else if (getHours(currentVal) === endHour) {
                return value < endValue;
              }
            }
          } else if (unit === 'second') {
            const startHour = getHours(range.start);
            const endHour = getHours(range.end);
            const startMinute = getMinutes(range.start);
            const endMinute = getMinutes(range.end);
            
            if (startHour === endHour && startMinute === endMinute) {
              return value > startValue && value < endValue;
            } else {
              // 不同小时或分钟，只在边界显示范围
              const currentVal = this.getCurrentTimeValue();
              if (!currentVal) return false;
              
              if (getHours(currentVal) === startHour && getMinutes(currentVal) === startMinute) {
                return value > startValue;
              } else if (getHours(currentVal) === endHour && getMinutes(currentVal) === endMinute) {
                return value < endValue;
              }
            }
          }
        }
      }
    }
    
    // 处理还未完成的范围选择
    if (this.rangeStart && this.hoverValue) {
      const startValue = this.getTimeUnitValue(this.rangeStart, unit);
      const endValue = this.getTimeUnitValue(this.hoverValue, unit);
      
      // 只有在同一天内的时间范围才显示范围高亮
      if (isSameDay(this.rangeStart, this.hoverValue)) {
        // 为不同的时间单位应用不同的逻辑
        if (unit === 'hour') {
          return (startValue < endValue && value > startValue && value < endValue) ||
                 (startValue > endValue && value > endValue && value < startValue);
        } else if (unit === 'minute') {
          const startHour = getHours(this.rangeStart);
          const endHour = getHours(this.hoverValue);
          
          if (startHour === endHour) {
            return (startValue < endValue && value > startValue && value < endValue) ||
                   (startValue > endValue && value > endValue && value < startValue);
          }
        } else if (unit === 'second') {
          const startHour = getHours(this.rangeStart);
          const endHour = getHours(this.hoverValue);
          const startMinute = getMinutes(this.rangeStart);
          const endMinute = getMinutes(this.hoverValue);
          
          if (startHour === endHour && startMinute === endMinute) {
            return (startValue < endValue && value > startValue && value < endValue) ||
                   (startValue > endValue && value > endValue && value < startValue);
          }
        }
      }
    }
    
    return false;
  }

  // 获取时间单位的值
  getTimeUnitValue(date: Date, unit: 'hour' | 'minute' | 'second'): number {
    if (!date) return 0;
    
    switch (unit) {
      case 'hour':
        return getHours(date);
      case 'minute':
        return getMinutes(date);
      case 'second':
        return getSeconds(date);
      default:
        return 0;
    }
  }

  // 判断两个日期除了指定单位外的其他时间单位是否相同
  isSameTimeExcept(date1: Date, date2: Date, exceptUnit: 'hour' | 'minute' | 'second'): boolean {
    if (!date1 || !date2) return false;
    
    // 如果不是同一天，则认为不在同一个范围内
    if (!isSameDay(date1, date2)) return false;
    
    switch (exceptUnit) {
      case 'hour':
        // 比较分钟和秒
        return getMinutes(date1) === getMinutes(date2) && getSeconds(date1) === getSeconds(date2);
      case 'minute':
        // 比较小时和秒
        return getHours(date1) === getHours(date2) && getSeconds(date1) === getSeconds(date2);
      case 'second':
        // 比较小时和分钟
        return getHours(date1) === getHours(date2) && getMinutes(date1) === getMinutes(date2);
      default:
        return false;
    }
  }

  // 处理时间选择的hover事件
  onTimeHover(unit: 'hour' | 'minute' | 'second', value: number): void {
    if (!this.rangeStart) return;
    
    // 根据当前所选时间单位创建一个新的日期对象
    let hoverDate: Date;
    
    if (this.isRangeValue(this.selectedValue) && (this.selectedValue as RangeValue<Date>).start) {
      const start = (this.selectedValue as RangeValue<Date>).start!;
      
      // 复制开始日期，然后修改相应的时间单位
      hoverDate = new Date(start);
      
      switch (unit) {
        case 'hour':
          hoverDate = setHours(hoverDate, value);
          break;
        case 'minute':
          hoverDate = setMinutes(hoverDate, value);
          break;
        case 'second':
          hoverDate = setSeconds(hoverDate, value);
          break;
      }
      
      this.hoverValue = hoverDate;
      this.cdr.markForCheck();
    }
  }

  // 获取当前正在操作的时间值
  getCurrentTimeValue(): Date | null {
    if (!this.selectedValue) return null;
    
    if (this.selectType === 'single') {
      if (this.isSingleDate(this.selectedValue)) {
        return this.selectedValue;
      } else if (this.isRangeValue(this.selectedValue)) {
        return this.selectedValue.start;
      }
    } else { // range
      if (this.isRangeValue(this.selectedValue)) {
        if (this.rangePart === 'start') {
          return this.selectedValue.start;
        } else {
          return this.selectedValue.end || this.selectedValue.start; // 如果end不存在，使用start作为模板
        }
      }
    }
    
    return null;
  }
}
