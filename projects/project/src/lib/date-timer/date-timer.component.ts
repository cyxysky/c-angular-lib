import { Component, OnInit, Input, Output, EventEmitter, forwardRef, TemplateRef, ViewEncapsulation, ElementRef, ViewChild, HostListener, ChangeDetectorRef, NgZone, ViewContainerRef, SimpleChanges, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { DateTimer, DateTimerMode, DateTimerSize, DateTimerStatus, DateTimerSelectType, RangeValue } from './date-timer.interface';
import { addDays, addMonths, addQuarters, addWeeks, addYears, differenceInDays, endOfDay, endOfMonth, endOfQuarter, endOfWeek, endOfYear, format, getDay, getDate, getHours, getMinutes, getMonth, getSeconds, getYear, isAfter, isBefore, isSameDay, isSameMonth, isSameYear, parse, setDate, setHours, setMinutes, setMonth, setSeconds, setYear, startOfDay, startOfMonth, startOfQuarter, startOfWeek, startOfYear, subMonths, subYears } from 'date-fns';
import { OverlayService } from '../core/overlay/overlay.service';
import { OverlayRef, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { UtilsService } from '@project';

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
  @Input({ alias: 'dateTimerMode' }) mode: DateTimerMode = 'date';
  @Input({ alias: 'dateTimerFormat' }) format = 'yyyy-MM-dd';
  @Input({ alias: 'dateTimerSize' }) size: DateTimerSize = 'default';
  @Input({ alias: 'dateTimerStatus' }) status: DateTimerStatus = '';
  @Input({ alias: 'dateTimerPlaceholder' }) placeholder: string | [string, string] = '请选择日期';
  @Input({ alias: 'dateTimerRangePlaceholder' }) rangePlaceholder: string[] = ['开始日期', '结束日期'];
  @Input({ alias: 'dateTimerAllowClear', transform: booleanAttribute }) allowClear = true;
  @Input({ alias: 'dateTimerAutoFocus', transform: booleanAttribute }) autoFocus = false;
  @Input({ alias: 'dateTimerDisabled', transform: booleanAttribute }) disabled = false;
  @Input({ alias: 'dateTimerBorderless', transform: booleanAttribute }) borderless = false;
  @Input({ alias: 'dateTimerShowTime', transform: booleanAttribute }) showTime = false;
  @Input({ alias: 'dateTimerShowToday', transform: booleanAttribute }) showToday = true;
  @Input({ alias: 'dateTimerSelectType' }) selectType: DateTimerSelectType = 'single';
  @Input({ alias: 'dateTimerDateRender' }) dateRender: ((date: Date) => string | TemplateRef<any>) | undefined = undefined;
  @Input({ alias: 'dateTimerDisabledDate' }) disabledDate: ((date: Date) => boolean) | undefined = undefined;
  @Input({ alias: 'dateTimerDisabledTime' }) disabledTime: ((date: Date) => { hour?: boolean[], minute?: boolean[], second?: boolean[] }) | undefined = undefined;
  @Input({ alias: 'dateTimerExtraFooter' }) extraFooter: string | TemplateRef<void> | undefined = undefined;
  @Input({ alias: 'dateTimerCustomFormat' }) customFormat: ((value: Date | RangeValue<Date>) => string) | undefined = undefined;

  @Output('dateTimerPanelModeChange') panelModeChange = new EventEmitter<DateTimerMode>();
  @Output('dateTimerCalendarChange') calendarChange = new EventEmitter<Date[] | null>();
  @Output('dateTimerOpenChange') openChange = new EventEmitter<boolean>();
  @Output('dateTimerOk') ok = new EventEmitter<Date | RangeValue<Date> | null>();

  @ViewChild('inputElement') inputElement?: ElementRef;
  @ViewChild('dropdown') dropdown?: ElementRef;
  @ViewChild('datePickerInput') datePickerInput?: ElementRef;
  @ViewChild(CdkOverlayOrigin, { static: false }) overlayOrigin!: CdkOverlayOrigin;
  @ViewChild('dropdownTemplate', { static: false }) dropdownTemplate!: TemplateRef<any>;
  @ViewChild('hourList', { static: false }) hourListRef?: ElementRef;
  @ViewChild('minuteList', { static: false }) minuteListRef?: ElementRef;
  @ViewChild('secondList', { static: false }) secondListRef?: ElementRef;

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
    private viewContainerRef: ViewContainerRef,
    private utilsService: UtilsService
  ) { }

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
    if (this.disabled || this.showDropdown) return;

    // 每次打开时，重置为选择开始时间
    this.rangePart = 'start';

    // 如果是时间范围选择模式且已经完成选择，重置为选择开始时间
    if (this.selectType === 'range' && this.mode === 'time' && this.timeSelectStep === 'complete') {
      this.timeSelectStep = 'hour';
    }

    this.showDropdown = true;
    this.isFocused = true;

    if (this.mode !== this.currentPanelMode) {
      this.currentPanelMode = this.mode;
    }

    // 根据当前模式生成初始数据
    if (this.currentPanelMode === 'date') {
      this.generateDateMatrix();
    } else if (this.currentPanelMode === 'month') {
      // 月份选择不需要特殊处理
    } else if (this.currentPanelMode === 'year') {
      this.updateYears();
    }

    this.createDropdownOverlay();
    this.openChange.emit(true);
    
    // 在下一个渲染周期滚动到选中的时间选项
    setTimeout(() => {
      this.scrollToSelectedTime();
    }, 0);
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
    this.showDropdown = false;
    this.isFocused = false;
    // 关闭时将rangePart重置为'start'，以便下次打开时从开始选择
    this.rangePart = 'start';
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.openChange.emit(false);
    this.cdr.markForCheck();
  }

  // 清除选择
  clearValue(event: Event): void {
    event.stopPropagation();
    this.value = null;
    this.selectedValue = null;
    this.displayValue = '';
    this.rangeStart = null;
    this.rangePart = 'start';
    this.timeSelectStep = 'hour';
    this._onChange(null);
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
    if (!value) return '';

    // 单选模式
    if (this.isSingleDate(value)) {
      // 根据不同模式格式化
      if (this.mode === 'year') {
        // 年份模式只显示年份
        return `${value.getFullYear()}`;
      } else if (this.mode === 'month') {
        // 月份模式显示 yyyy-M
        return `${value.getFullYear()}-${value.getMonth() + 1}`;
      } else if (this.mode === 'quarter') {
        // 季度模式显示 yyyy-Q季度
        const quarter = Math.floor(value.getMonth() / 3) + 1;
        return `${value.getFullYear()}-Q${quarter}`;
      } else if (this.mode === 'week') {
        // 周模式
        const weekNumber = this.getWeekNumber(value);
        return `${value.getFullYear()}-W${weekNumber}`;
      } else {
        // 日期模式使用标准格式
        if (this.customFormat) {
          return this.customFormat(value);
        }
        let dateStr = this.formatDate(value);
        return dateStr;
      }
    }

    // 范围选择模式
    if (this.isRangeValue(value)) {
      const start = value.start;
      const end = value.end;
      if (!start) return '';
      // 范围的结束时间不存在时，只显示开始时间
      if (!end) {
        if (this.mode === 'year') {
          return `${start.getFullYear()} ~`;
        } else if (this.mode === 'month') {
          return `${start.getFullYear()}-${start.getMonth() + 1} ~`;
        } else if (this.mode === 'quarter') {
          const quarter = Math.floor(start.getMonth() / 3) + 1;
          return `${start.getFullYear()}-Q${quarter} ~`;
        } else if (this.mode === 'week') {
          const weekNumber = this.getWeekNumber(start);
          return `${start.getFullYear()}-W${weekNumber} ~`;
        } else {
          let startStr = this.formatDate(start);
          if (this.showTime) {
            startStr += ' ' + this.formatTime(start);
          }
          return `${startStr} ~`;
        }
      }

      // 有开始和结束时间
      if (this.mode === 'year') {
        if (start.getFullYear() === end.getFullYear()) {
          // 同一年份时只显示一个年份
          return `${start.getFullYear()}`;
        } else {
          return `${start.getFullYear()} ~ ${end.getFullYear()}`;
        }
      } else if (this.mode === 'month') {
        if (start.getFullYear() === end.getFullYear() &&
          start.getMonth() === end.getMonth()) {
          // 同一月份时只显示一个月份
          return `${start.getFullYear()}-${start.getMonth() + 1}`;
        } else {
          return `${start.getFullYear()}-${start.getMonth() + 1} ~ ${end.getFullYear()}-${end.getMonth() + 1}`;
        }
      } else if (this.mode === 'quarter') {
        const startQuarter = Math.floor(start.getMonth() / 3) + 1;
        const endQuarter = Math.floor(end.getMonth() / 3) + 1;

        if (start.getFullYear() === end.getFullYear() && startQuarter === endQuarter) {
          // 同一季度时只显示一个季度
          return `${start.getFullYear()}-Q${startQuarter}`;
        } else {
          return `${start.getFullYear()}-Q${startQuarter} ~ ${end.getFullYear()}-Q${endQuarter}`;
        }
      } else if (this.mode === 'week') {
        const startWeek = this.getWeekNumber(start);
        const endWeek = this.getWeekNumber(end);

        if (start.getFullYear() === end.getFullYear() && startWeek === endWeek) {
          // 同一周时只显示一个周
          return `${start.getFullYear()}-W${startWeek}`;
        } else {
          return `${start.getFullYear()}-W${startWeek} ~ ${end.getFullYear()}-W${endWeek}`;
        }
      } else {
        // 日期范围
        let startStr = this.formatDate(start);
        let endStr = this.formatDate(end);

        if (this.showTime) {
          startStr += ' ' + this.formatTime(start);
          endStr += ' ' + this.formatTime(end);
        }

        return `${startStr} ~ ${endStr}`;
      }
    }

    return '';
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
    const oldViewDate = new Date(this.currentViewDate);
    this.currentViewDate.setFullYear(year);

    // 单选模式
    if (this.selectType === 'single') {
      if (this.mode === 'year') {
        // 年份选择模式，设置为整年范围
        const startDate = new Date(year, 0, 1); // 1月1日
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // 12月31日 23:59:59.999

        // 虽然是单选模式，但返回的是一个代表整年的日期对象
        this.selectedValue = startDate;
        this.value = startDate;
        this.displayValue = this.formatSelectedValue(this.selectedValue);
        this._onChange(this.selectedValue);

        // 触发额外事件
        this.ok.emit(this.selectedValue);

        if (!this.showTime) {
          this.closeDropdown();
        } else {
          this.currentPanelMode = 'date';
          this.generateDateMatrix();
        }
      } else {
        // 其他模式设置年份后跳转到月份选择
        this.currentPanelMode = 'month';
        this.generateDateMatrix();
      }
    }
    // 范围选择模式
    else if (this.selectType === 'range') {
      if (this.mode === 'year') {
        // 年份选择模式
        if (this.rangePart === 'start' || !this.rangeStart) {
          // 开始日期 - 设置为年份第一天
          const startDate = new Date(year, 0, 1);
          this.rangeStart = startDate;
          this.selectedValue = { start: startDate, end: null };
          this.displayValue = `${this.formatSelectedValue(startDate)} ~`;

          // 自动切换到结束日期选择
          this.rangePart = 'end';
          this._onChange(this.selectedValue);
        } else {
          // 结束日期 - 设置为年份最后一天
          let endDate = new Date(year, 11, 31, 23, 59, 59, 999);

          // 如果选择的结束年份早于开始年份，则交换
          if (this.rangeStart && year < this.rangeStart.getFullYear()) {
            const tempStart = new Date(year, 0, 1);
            endDate = new Date(this.rangeStart.getFullYear(), 11, 31, 23, 59, 59, 999);
            this.rangeStart = tempStart;
          }

          this.selectedValue = {
            start: this.rangeStart,
            end: endDate
          };

          // 完成选择
          this.value = [this.selectedValue.start!, this.selectedValue.end!];
          this.displayValue = this.formatSelectedValue(this.selectedValue);
          this._onChange(this.selectedValue);
          this.ok.emit(this.selectedValue);

          this.closeDropdown();
        }
      } else {
        // 其他模式下，设置年份后跳转到月份选择
        this.currentPanelMode = 'month';
        this.generateDateMatrix();
      }
    }

    this.years = [];
    this.updateYears();
    this.cdr.markForCheck();
  }

  onSelectMonth(month: number): void {
    // 保存当前视图日期
    this.currentViewDate.setMonth(month);
    // 单选模式
    if (this.selectType === 'single') {
      if (this.mode === 'month') {
        // 月份选择模式，设置为整月范围
        const year = this.currentViewDate.getFullYear();
        const startDate = new Date(year, month, 1); // 月份第一天
        const lastDay = new Date(year, month + 1, 0).getDate(); // 获取月份最后一天的日期
        // 虽然是单选模式，但返回的是一个代表整月的日期对象
        this.selectedValue = startDate;
        this.value = startDate;
        this.displayValue = this.formatSelectedValue(this.selectedValue);
        this._onChange(this.selectedValue);
        // 触发额外事件
        this.ok.emit(this.selectedValue);
        if (!this.showTime) {
          this.closeDropdown();
        } else {
          this.currentPanelMode = 'date';
          this.generateDateMatrix();
        }
      } else {
        // 其他模式设置月份后返回到日期选择
        this.currentPanelMode = 'date';
        this.generateDateMatrix();
      }
    }
    // 范围选择模式
    else if (this.selectType === 'range') {
      if (this.mode === 'month') {
        // 月份选择模式
        const year = this.currentViewDate.getFullYear();
        const lastDay = new Date(year, month + 1, 0).getDate();
        if (this.rangePart === 'start' || !this.rangeStart) {
          // 开始日期 - 设置为月份第一天
          const startDate = new Date(year, month, 1);
          this.rangeStart = startDate;
          this.selectedValue = { start: startDate, end: null };
          this.displayValue = `${this.formatSelectedValue(startDate)} ~`;
          // 自动切换到结束日期选择
          this.rangePart = 'end';
          this._onChange(this.selectedValue);
        } else {
          // 结束日期 - 设置为月份最后一天
          let endDate = new Date(year, month, lastDay, 23, 59, 59, 999);
          // 如果结束日期早于开始日期，则交换
          if (this.rangeStart) {
            const startYear = this.rangeStart.getFullYear();
            const startMonth = this.rangeStart.getMonth();
            if ((year < startYear) || (year === startYear && month < startMonth)) {
              const tempStart = new Date(year, month, 1);
              const tempLastDay = new Date(startYear, startMonth + 1, 0).getDate();
              endDate = new Date(startYear, startMonth, tempLastDay, 23, 59, 59, 999);
              this.rangeStart = tempStart;
            }
          }
          this.selectedValue = {
            start: this.rangeStart,
            end: endDate
          };
          // 完成选择
          this.value = [this.selectedValue.start!, this.selectedValue.end!];
          this.displayValue = this.formatSelectedValue(this.selectedValue);
          this._onChange(this.selectedValue);
          this.ok.emit(this.selectedValue);
          this.closeDropdown();
        }
      } else {
        // 其他模式下，设置月份后返回到日期选择
        this.currentPanelMode = 'date';
        this.generateDateMatrix();
      }
    }
    this.cdr.markForCheck();
  }

  onSelectQuarter(quarter: number): void {
    const year = this.currentViewDate.getFullYear();
    // 计算季度的起止月份
    const startMonth = quarter * 3;
    const endMonth = startMonth + 2;
    // 单选模式
    if (this.selectType === 'single') {
      if (this.mode === 'quarter') {
        // 季度选择模式，设置为整季度范围
        const startDate = new Date(year, startMonth, 1); // 季度第一天
        const lastDay = new Date(year, endMonth + 1, 0).getDate(); // 季度最后一个月的最后一天
        // 虽然是单选模式，但返回的是一个代表整季度的日期对象
        this.selectedValue = startDate;
        this.value = startDate;
        this.displayValue = this.formatSelectedValue(this.selectedValue);
        this._onChange(this.selectedValue);
        // 触发额外事件
        this.ok.emit(this.selectedValue);
        if (!this.showTime) {
          this.closeDropdown();
        } else {
          this.currentPanelMode = 'date';
          this.generateDateMatrix();
        }
      } else {
        // 其他模式，一般不会进入这里
        this.currentPanelMode = 'date';
        this.generateDateMatrix();
      }
    }
    // 范围选择模式
    else if (this.selectType === 'range') {
      if (this.mode === 'quarter') {
        // 季度选择模式
        if (this.rangePart === 'start' || !this.rangeStart) {
          // 开始日期 - 设置为季度第一天
          const startDate = new Date(year, startMonth, 1);
          this.rangeStart = startDate;
          this.selectedValue = { start: startDate, end: null };
          this.displayValue = `${this.formatSelectedValue(startDate)} ~`;
          // 自动切换到结束日期选择
          this.rangePart = 'end';
          this._onChange(this.selectedValue);
        } else {
          // 结束日期 - 设置为季度最后一天
          const lastDay = new Date(year, endMonth + 1, 0).getDate();
          let endDate = new Date(year, endMonth, lastDay, 23, 59, 59, 999);
          // 如果结束日期早于开始日期，则交换
          if (this.rangeStart) {
            const startYear = this.rangeStart.getFullYear();
            const startQuarter = Math.floor(this.rangeStart.getMonth() / 3);
            if ((year < startYear) || (year === startYear && quarter < startQuarter)) {
              const tempStart = new Date(year, startMonth, 1);
              const tempEndMonth = startQuarter * 3 + 2;
              const tempLastDay = new Date(startYear, tempEndMonth + 1, 0).getDate();
              endDate = new Date(startYear, tempEndMonth, tempLastDay, 23, 59, 59, 999);
              this.rangeStart = tempStart;
            }
          }
          this.selectedValue = {
            start: this.rangeStart,
            end: endDate
          };
          // 完成选择
          this.value = [this.selectedValue.start!, this.selectedValue.end!];
          this.displayValue = this.formatSelectedValue(this.selectedValue);
          this._onChange(this.selectedValue);
          this.ok.emit(this.selectedValue);
          this.closeDropdown();
        }
      } else {
        // 其他模式，一般不会进入这里
        this.currentPanelMode = 'date';
        this.generateDateMatrix();
      }
    }

    this.cdr.markForCheck();
  }

  onSelectWeek(dates: Date[]): void {
    if (dates.length === 0) return;
    if (this.mode === 'week') {
      if (this.selectType === 'single') {
        const weekStart = startOfWeek(dates[0], { weekStartsOn: 1 });
        const weekEnd = endOfWeek(dates[0], { weekStartsOn: 1 });
        this.selectedValue = { start: weekStart, end: weekEnd };
        this.displayValue = this.formatSelectedValue(this.selectedValue);
        this._onChange(this.selectedValue);
        this.closeDropdown();
      } else if (this.selectType === 'range') {
        // 范围选择模式，需要选择两次
        this.onSelectRangeDate(dates[0]);
      }
    }
    this.cdr.markForCheck();
  }

  onCellHover(date: Date): void {
    if (this.selectType === 'range' && this.rangePart === 'end' && this.rangeStart) {
      this.hoverValue = date;
      this.cdr.markForCheck();
    }
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
          this.utilsService.delayExecution(() => {
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
    // 处理开始时间选择
    if (this.rangePart === 'start' || !this.rangeStart) {
      // 选择范围开始日期
      let startDate = new Date(date);
      // 如果需要支持时间选择，保留默认时间为00:00:00
      if (this.showTime) {
        startDate.setHours(0, 0, 0, 0);
      }
      this.rangeStart = startDate;
      this.selectedValue = { start: startDate, end: null };
      if (this.showTime) {
        this.displayValue = `${this.formatDate(startDate)} 00:00:00 ~`;
        // 完成日期选择后，如果是showTime模式，直接进入时间选择模式
        this.timeSelectStep = 'hour';
      } else {
        this.displayValue = `${this.formatDate(startDate)} ~`;
      }
      // 选择完开始日期后，自动切换到结束选择
      if (!this.showTime) {
        this.rangePart = 'end';
        this._onChange(this.selectedValue);
      }
      // 如果是showTime模式，不要立即切换到结束选择，等完成时间选择后再切换
    } else if (this.rangePart === 'end') {
      // 选择范围结束日期
      let endDate = new Date(date);
      // 如果需要支持时间选择，保留时间为当前选择的时间或默认23:59:59
      if (this.showTime) {
        if (this.isRangeValue(this.selectedValue) && this.selectedValue.end) {
          // 保留已选择的时间部分
          endDate.setHours(
            this.selectedValue.end.getHours(),
            this.selectedValue.end.getMinutes(),
            this.selectedValue.end.getSeconds()
          );
        } else {
          // 默认设置结束时间为23:59:59
          endDate.setHours(23, 59, 59, 0);
        }
      }
      // 如果结束日期早于开始日期，则交换
      if (endDate < this.rangeStart) {
        const temp = this.rangeStart;
        this.rangeStart = endDate;
        endDate = temp;
      }
      this.selectedValue = { start: this.rangeStart, end: endDate };
      this.value = [this.rangeStart, endDate];
      if (this.showTime) {
        this.displayValue = `${this.formatDate(this.rangeStart)} ${this.formatTime(this.rangeStart)} ~ ${this.formatDate(endDate)} ${this.timeSelectStep === 'complete' ? this.formatTime(endDate) : '00:00:00'}`;
        // 如果是showTime模式，选择完日期后切换到时间选择面板
        this.timeSelectStep = 'hour';
      } else {
        this.displayValue = `${this.formatDate(this.rangeStart)} ~ ${this.formatDate(endDate)}`;
        // 非showTime模式，选择完成后关闭下拉
        this.closeDropdown();
      }
      // 如果不显示时间，则直接触发onChange和完成选择
      if (!this.showTime) {
        this._onChange(this.selectedValue);
        this.ok.emit(this.selectedValue);
      }
    }
    this.cdr.markForCheck();
  }

  // 时间选择方法部分的修改
  onSelectHour(hour: number): void {
    // 检查是否禁用
    if (this.isTimeDisabled('hour', hour)) {
      return;
    }
    if (this.selectType === 'single') {
      // 单选模式，更新小时值
      this.updateTimeValue('hour', hour);
      this.cdr.markForCheck();
      
      // 在选择小时后滚动到选中的分钟
      setTimeout(() => {
        if (this.minuteListRef && this.minuteListRef.nativeElement) {
          const minuteValue = this.getCurrentTimeValue()?.getMinutes() || 0;
          this.minuteListRef.nativeElement.scrollTop = minuteValue * 32;
        }
      }, 0);
      
      return;
    }
    if (this.selectType === 'range') {
      // 范围选择模式
      // 检查是否是结束时间选择且小于开始时间
      if (this.rangePart === 'end' && this.rangeStart) {
        const startDate = new Date(this.rangeStart);
        // 如果是同一天，确保时间不早于开始时间
        if (this.isRangeValue(this.selectedValue) && this.selectedValue.end) {
          const endDate = new Date(this.selectedValue.end);
          const isSameDay = startDate.getFullYear() === endDate.getFullYear() &&
            startDate.getMonth() === endDate.getMonth() &&
            startDate.getDate() === endDate.getDate();
          if (isSameDay && hour < startDate.getHours()) {
            // 不允许选择早于开始时间的小时
            return;
          }
        }
      }
      // 更新小时值
      this.updateTimeRangeValue('hour', hour);
      this.cdr.markForCheck();
      
      // 在选择小时后滚动到选中的分钟
      setTimeout(() => {
        if (this.minuteListRef && this.minuteListRef.nativeElement) {
          const minuteValue = this.getCurrentTimeValue()?.getMinutes() || 0;
          this.minuteListRef.nativeElement.scrollTop = minuteValue * 32;
        }
      }, 0);
    }
  }

  onSelectMinute(minute: number): void {
    // 检查是否禁用
    if (this.isTimeDisabled('minute', minute)) {
      return;
    }
    if (this.selectType === 'single') {
      // 单选模式，更新分钟值
      this.updateTimeValue('minute', minute);
      this.cdr.markForCheck();
      
      // 在选择分钟后滚动到选中的秒钟
      setTimeout(() => {
        if (this.secondListRef && this.secondListRef.nativeElement) {
          const secondValue = this.getCurrentTimeValue()?.getSeconds() || 0;
          this.secondListRef.nativeElement.scrollTop = secondValue * 32;
        }
      }, 0);
      
      return;
    }
    if (this.selectType === 'range') {
      // 范围选择模式
      // 检查是否是结束时间选择且可能小于开始时间
      if (this.rangePart === 'end' && this.rangeStart) {
        const startDate = new Date(this.rangeStart);
        // 如果是同一天同一小时，确保分钟不早于开始时间
        if (this.isRangeValue(this.selectedValue) && this.selectedValue.end) {
          const endDate = new Date(this.selectedValue.end);
          const isSameDay = startDate.getFullYear() === endDate.getFullYear() &&
            startDate.getMonth() === endDate.getMonth() &&
            startDate.getDate() === endDate.getDate();
          if (isSameDay && endDate.getHours() === startDate.getHours() && minute < startDate.getMinutes()) {
            // 不允许选择早于开始时间的分钟
            return;
          }
        }
      }
      // 更新分钟值
      this.updateTimeRangeValue('minute', minute);
      this.cdr.markForCheck();
      
      // 在选择分钟后滚动到选中的秒钟
      setTimeout(() => {
        if (this.secondListRef && this.secondListRef.nativeElement) {
          const secondValue = this.getCurrentTimeValue()?.getSeconds() || 0;
          this.secondListRef.nativeElement.scrollTop = secondValue * 32;
        }
      }, 0);
    }
  }

  onSelectSecond(second: number): void {
    // 检查是否禁用
    if (this.isTimeDisabled('second', second)) {
      return;
    }

    if (this.selectType === 'single') {
      // 单选模式，更新秒值
      this.updateTimeValue('second', second);
      this.cdr.markForCheck();
      return;
    }

    if (this.selectType === 'range') {
      // 范围选择模式

      // 检查是否是结束时间选择且可能小于开始时间
      if (this.rangePart === 'end' && this.rangeStart) {
        const startDate = new Date(this.rangeStart);

        // 如果是同一天同一小时同一分钟，确保秒不早于开始时间
        if (this.isRangeValue(this.selectedValue) && this.selectedValue.end) {
          const endDate = new Date(this.selectedValue.end);
          const isSameDay = startDate.getFullYear() === endDate.getFullYear() &&
            startDate.getMonth() === endDate.getMonth() &&
            startDate.getDate() === endDate.getDate() &&
            endDate.getHours() === startDate.getHours() &&
            endDate.getMinutes() === startDate.getMinutes();

          if (isSameDay && second < startDate.getSeconds()) {
            // 不允许选择早于开始时间的秒
            return;
          }
        }
      }

      // 更新秒值
      this.updateTimeRangeValue('second', second);
      this.cdr.markForCheck();
    }
  }

  // 更新范围选择中的时间值
  updateTimeRangeValue(type: 'hour' | 'minute' | 'second', value: number): void {
    // 如果当前是开始时间选择
    if (this.rangePart === 'start') {
      // 开始时间的选择逻辑
      if (type === 'hour') {
        // 初始化开始时间或更新已有开始时间的小时
        const startDate = this.rangeStart ? new Date(this.rangeStart) : new Date();
        startDate.setHours(value, 0, 0);

        this.rangeStart = startDate;
        this.selectedValue = { start: startDate, end: null };
        this.displayValue = `${this.formatDate(startDate)} ${this.formatTime(startDate)} ~`;

        // 更新为分钟选择步骤
        this.timeSelectStep = 'minute';

        this._onChange(this.selectedValue);
        this.cdr.markForCheck();
      }
      else if (type === 'minute') {
        // 更新开始时间的分钟
        if (this.rangeStart) {
          const updatedStart = new Date(this.rangeStart);
          updatedStart.setMinutes(value);

          this.rangeStart = updatedStart;
          this.selectedValue = { start: updatedStart, end: null };
          this.displayValue = `${this.formatDate(updatedStart)} ${this.formatTime(updatedStart)} ~`;

          // 更新为秒选择步骤
          this.timeSelectStep = 'second';

          this._onChange(this.selectedValue);
          this.cdr.markForCheck();
        }
      }
      else if (type === 'second') {
        // 更新开始时间的秒钟
        if (this.rangeStart) {
          const updatedStart = new Date(this.rangeStart);
          updatedStart.setSeconds(value);

          this.rangeStart = updatedStart;
          this.selectedValue = { start: updatedStart, end: null };
          this.displayValue = `${this.formatDate(updatedStart)} ${this.formatTime(updatedStart)} ~`;

          // 选择完成后切换到结束选择
          this.rangePart = 'end';

          // 如果是日期模式+showTime，选择完开始时间后应该返回到日期面板选择结束日期
          if (this.showTime && ['date', 'week', 'month', 'year', 'quarter'].includes(this.mode)) {
            this.currentPanelMode = this.mode === 'week' ? 'date' : this.mode;
            this.timeSelectStep = 'hour';
          } else {
            // 纯时间模式，继续选择结束时间
            this.timeSelectStep = 'hour';
          }

          this._onChange(this.selectedValue);
          this.cdr.markForCheck();
        }
      }
    }
    // 如果当前是结束时间选择
    else if (this.rangePart === 'end') {
      // 纯时间模式的结束时间选择逻辑
      if (type === 'hour') {
        // 初始化结束时间或更新已有结束时间的小时
        if (this.rangeStart) {
          let end = new Date();

          // 从rangeStart复制年月日
          end.setFullYear(this.rangeStart.getFullYear());
          end.setMonth(this.rangeStart.getMonth());
          end.setDate(this.rangeStart.getDate());

          // 设置小时，重置分钟和秒
          end.setHours(value, 0, 0);

          // 更新临时结束时间
          this.selectedValue = { start: this.rangeStart, end };
          this.displayValue = `${this.formatDate(this.rangeStart)} ${this.formatTime(this.rangeStart)} ~ ${this.formatDate(end)} ${this.padZero(value)}:00:00`;

          // 更新为分钟选择步骤
          this.timeSelectStep = 'minute';

          this.cdr.markForCheck();
        }
      }
      else if (type === 'minute') {
        // 更新结束时间的分钟
        if (this.rangeStart && this.isRangeValue(this.selectedValue) && this.selectedValue.end) {
          const updatedEnd = new Date(this.selectedValue.end);
          updatedEnd.setMinutes(value);

          this.selectedValue = { start: this.rangeStart, end: updatedEnd };
          this.displayValue = `${this.formatDate(this.rangeStart)} ${this.formatTime(this.rangeStart)} ~ ${this.formatDate(updatedEnd)} ${this.padZero(updatedEnd.getHours())}:${this.padZero(value)}:00`;

          // 更新为秒选择步骤
          this.timeSelectStep = 'second';

          this.cdr.markForCheck();
        }
      }
      else if (type === 'second') {
        // 更新结束时间的秒钟，完成整个选择
        if (this.rangeStart && this.isRangeValue(this.selectedValue) && this.selectedValue.end) {
          const updatedEnd = new Date(this.selectedValue.end);
          updatedEnd.setSeconds(value);

          // 确保结束时间不早于开始时间
          if (updatedEnd < this.rangeStart) {
            updatedEnd.setTime(this.rangeStart.getTime() + 60 * 60 * 1000); // 加一小时
          }

          this.selectedValue = { start: this.rangeStart, end: updatedEnd };
          this.value = [this.rangeStart, updatedEnd];
          this.displayValue = `${this.formatDate(this.rangeStart)} ${this.formatTime(this.rangeStart)} ~ ${this.formatDate(updatedEnd)} ${this.formatTime(updatedEnd)}`;

          // 选择完成
          this.timeSelectStep = 'complete';

          // 触发onChange
          this._onChange(this.selectedValue);

          // 选择完成后，关闭弹出层
          this.closeDropdown();

          this.cdr.markForCheck();
        }
      }
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
      const range = this.selectedValue as RangeValue<Date>;

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
    // 对于时间模式，直接设置时间
    if (!this.selectedValue) {
      this.selectedValue = now;
    } else if (this.isSingleDate(this.selectedValue)) {
      // 保留年月日，只改变时分秒
      this.selectedValue = setHours(this.selectedValue, getHours(now));
      this.selectedValue = setMinutes(this.selectedValue, getMinutes(now));
      this.selectedValue = setSeconds(this.selectedValue, getSeconds(now));
    }
    this.displayValue = this.formatSelectedValue(this.selectedValue);
    this._onChange(this.selectedValue);
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
    }
    !this.showTime && this.closeDropdown();
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

  isSelectedMonth(month: number): boolean | any {
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

  getTimeDisabled(type: 'hour' | 'minute' | 'second', value: number, startDate: Date, endDate: Date): boolean {
    if (type === 'hour') {
      // 禁用小于开始时间的小时
      return value < startDate.getHours();
    } else if (type === 'minute') {
      // 如果是同一小时，禁用小于开始时间的分钟
      if (endDate && endDate.getHours() === startDate.getHours()) {
        return value < startDate.getMinutes();
      }
    } else if (type === 'second') {
      // 如果是同一小时和分钟，禁用小于开始时间的秒钟
      if (endDate && endDate.getHours() === startDate.getHours() && endDate.getMinutes() === startDate.getMinutes()) {
        return value < startDate.getSeconds();
      }
    }
    return false;
  }

  isTimeDisabled(type: 'hour' | 'minute' | 'second', value: number): boolean {
    // 如果有自定义禁用规则
    if (this.disabledTime) {
      const currentDate = this.getCurrentTimeValue() || new Date();
      const disabledTimeConfig = this.disabledTime(currentDate);
      if (disabledTimeConfig) {
        if (type === 'hour' && disabledTimeConfig.hour && disabledTimeConfig.hour[value]) {
          return true;
        } else if (type === 'minute' && disabledTimeConfig.minute && disabledTimeConfig.minute[value]) {
          return true;
        } else if (type === 'second' && disabledTimeConfig.second && disabledTimeConfig.second[value]) {
          return true;
        }
      }
    }

    if (this.mode === 'time' && this.selectType === 'range' && this.rangePart === 'end' && this.rangeStart) {
      const startDate = new Date(this.rangeStart);
      const endDate = new Date((this.selectedValue as any).end);
      return this.getTimeDisabled(type, value, startDate, endDate);
    }

    if (this.selectType === 'range' && this.rangePart === 'end' && this.rangeStart && this.mode !== 'time') {
      const startDate = new Date(this.rangeStart);
      // 如果当前正在构建的日期存在
      if (this.isRangeValue(this.selectedValue) && this.selectedValue.end) {
        const endDate = new Date(this.selectedValue.end);
        // 检查日期是否是同一天
        const isSameDay = startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth() && startDate.getDate() === endDate.getDate();
        // 只有同一天才需要检查时间大小
        if (isSameDay) {
          return this.getTimeDisabled(type, value, startDate, endDate);
        }
      } else if (type === 'hour' && this.timeSelectStep === 'hour') {
        // 正在选择结束时间的小时，但还没有选择日期的情况
        // 检查是否是同一天的选择
        if (this.hoverValue) {
          const isSameDay = startDate.getFullYear() === this.hoverValue.getFullYear() &&
            startDate.getMonth() === this.hoverValue.getMonth() &&
            startDate.getDate() === this.hoverValue.getDate();
          if (isSameDay) {
            return value < startDate.getHours();
          }
        }
      }
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
    if (!week || week.length === 0) {
      return false;
    }
    // 检查是否有选中的值
    if (!this.selectedValue) {
      return false;
    }
    // 对于单选模式
    if (this.selectType === 'single' && this.isSingleDate(this.selectedValue)) {
      // 检查周是否包含选中的日期
      const selectedDate = this.selectedValue;
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      // 检查周内是否有选中的日期
      return week.some(day => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        return dayStart.getTime() === startOfDay.getTime();
      });
    }
    // 对于范围选择模式
    if (this.selectType === 'range' && this.isRangeValue(this.selectedValue)) {
      const start = this.selectedValue.start;
      const end = this.selectedValue.end;
      // 如果没有完整的范围，则无法确定
      if (!start || !end) {
        return false;
      }
      // 格式化日期，忽略时间部分
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      // 检查周内的任何一天是否在选定范围内
      return week.some(day => {
        const dayDate = new Date(day);
        return dayDate >= startDate && dayDate <= endDate;
      });
    }
    return false;
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
        // 重新生成年份列表
        this.years = [];
        this.updateYears();
      } else if (headerType === 'month') {
        // 点击月份部分，进入月份选择面板
        this.currentPanelMode = 'month';
      }
      this.cdr.markForCheck();
    }
  }

  private _onChange: (value: Date | RangeValue<Date> | null) => void = () => { };
  private _onTouched: () => void = () => { };

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
    if (this.selectType === 'range' && this.rangePart === 'end' && this.rangeStart) {
      const date = new Date(year, 0, 1);
      this.hoverValue = date;
      this.cdr.markForCheck();
    }
  }

  // 月份选择的Hover事件
  onCellMonthHover(month: number): void {
    if (this.selectType === 'range' && this.rangePart === 'end' && this.rangeStart) {
      const date = new Date(getYear(this.currentViewDate), month, 1);
      this.hoverValue = date;
      this.cdr.markForCheck();
    }
  }

  // 季度选择的Hover事件
  onCellQuarterHover(quarter: number): void {
    if (this.selectType === 'range' && this.rangePart === 'end' && this.rangeStart) {
      const startMonth = quarter * 3;
      const date = new Date(getYear(this.currentViewDate), startMonth, 1);
      this.hoverValue = date;
      this.cdr.markForCheck();
    }
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
        // 范围选择模式下，根据当前选择的部分(start/end)和当前步骤判断
        if (this.rangePart === 'start' && range.start) {
          // 在选择开始时间的情况下
          if (this.timeSelectStep === 'hour' && unit === 'hour') {
            return getHours(range.start) === value;
          } else if (this.timeSelectStep === 'minute' && unit === 'minute') {
            return getMinutes(range.start) === value;
          } else if (this.timeSelectStep === 'second' && unit === 'second') {
            return getSeconds(range.start) === value;
          }
          return this.isTimeUnitMatch(range.start, unit, value);
        } else if (this.rangePart === 'end' && range.end) {
          // 在选择结束时间的情况下
          if (this.timeSelectStep === 'hour' && unit === 'hour') {
            return getHours(range.end) === value;
          } else if (this.timeSelectStep === 'minute' && unit === 'minute') {
            return getMinutes(range.end) === value;
          } else if (this.timeSelectStep === 'second' && unit === 'second') {
            return getSeconds(range.end) === value;
          }
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

  // 添加切换范围选择部分的方法
  switchRangePart(part: 'start' | 'end'): void {
    if (this.rangePart === part) return;
    // 切换到目标部分
    this.rangePart = part;
    // 如果切换到开始时间选择
    if (part === 'start') {
      // 保留原有的开始时间，以便重新选择
      if (this.isRangeValue(this.selectedValue) && this.selectedValue && (this.selectedValue as RangeValue<Date>).start) {
        const originalStart = (this.selectedValue as RangeValue<Date>).start!;

        // 仅保留开始时间，删除结束时间
        this.selectedValue = { start: originalStart, end: null };

        if (this.mode === 'time') {
          this.displayValue = `${this.formatTime(originalStart)} ~`;
        } else {
          this.displayValue = `${this.formatDate(originalStart)} ~`;
        }
      } else {
        // 如果没有原始开始时间，则重置选择
        this.rangeStart = null;
        this.selectedValue = null;
        this.displayValue = '';
      }
      // 重置时间选择步骤
      if (this.mode === 'time' || this.showTime) {
        this.timeSelectStep = 'hour';
      }
    }
    // 如果从开始时间切换到结束时间，但开始时间还未选择，则设置默认值
    else if (part === 'end' && (!this.rangeStart || !this.selectedValue)) {
      // 创建当前时间作为默认开始时间
      const defaultStart = new Date();
      // 如果是时间模式，设置时分秒
      if (this.mode === 'time') {
        // 设置默认时间为当前时间的整点，分秒为0
        defaultStart.setMinutes(0);
        defaultStart.setSeconds(0);
        this.rangeStart = defaultStart;
        this.selectedValue = { start: defaultStart, end: null };
        this.displayValue = `${this.formatTime(defaultStart)} ~`;
      }
      // 如果是日期相关模式，设置日期
      else {
        if (this.mode === 'date' || this.mode === 'week') {
          // 不做特殊处理，使用当前日期
        } else if (this.mode === 'month') {
          // 设置为当月1日
          defaultStart.setDate(1);
        } else if (this.mode === 'year') {
          // 设置为当年1月1日
          defaultStart.setMonth(0);
          defaultStart.setDate(1);
        } else if (this.mode === 'quarter') {
          // 设置为当季度第一个月1日
          const currentMonth = defaultStart.getMonth();
          const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
          defaultStart.setMonth(quarterStartMonth);
          defaultStart.setDate(1);
        }
        // 如果还有showTime，则设置时分秒为0
        if (this.showTime) {
          defaultStart.setHours(0);
          defaultStart.setMinutes(0);
          defaultStart.setSeconds(0);
        }
        this.rangeStart = defaultStart;
        this.selectedValue = { start: defaultStart, end: null };
        this.displayValue = `${this.formatDate(defaultStart)} ~`;
      }
    }
    // 更新onChange
    this._onChange(this.selectedValue);
    this.cdr.markForCheck();
    
    // 切换范围选择部分后，滚动到新选择部分的选中时间
    setTimeout(() => {
      this.scrollToSelectedTime();
    }, 0);
  }

  /**
   * 滚动到选中的时间选项
   */
  scrollToSelectedTime(): void {
    if (!this.selectedValue) return;
    
    const getSelectedTimeValue = (unit: 'hour' | 'minute' | 'second'): number => {
      let date: Date | null = null;
      
      if (this.selectType === 'single') {
        if (this.isSingleDate(this.selectedValue)) {
          date = this.selectedValue as Date;
        } else if (this.isRangeValue(this.selectedValue) && (this.selectedValue as RangeValue<Date>).start) {
          date = (this.selectedValue as RangeValue<Date>).start;
        }
      } else if (this.selectType === 'range') {
        if (this.isRangeValue(this.selectedValue)) {
          if (this.rangePart === 'start' && (this.selectedValue as RangeValue<Date>).start) {
            date = (this.selectedValue as RangeValue<Date>).start;
          } else if (this.rangePart === 'end' && (this.selectedValue as RangeValue<Date>).end) {
            date = (this.selectedValue as RangeValue<Date>).end;
          } else if (this.rangePart === 'end' && (this.selectedValue as RangeValue<Date>).start) {
            // 如果end不存在但正在选择end，使用start作为参考
            date = (this.selectedValue as RangeValue<Date>).start;
          }
        }
      }
      
      if (!date) return 0;
      
      switch (unit) {
        case 'hour': return getHours(date);
        case 'minute': return getMinutes(date);
        case 'second': return getSeconds(date);
        default: return 0;
      }
    };
    
    // 获取每个时间列表项的高度，默认是32px
    const itemHeight = 32;
    
    // 滚动小时列表
    if (this.hourListRef && this.hourListRef.nativeElement) {
      const hourValue = getSelectedTimeValue('hour');
      this.hourListRef.nativeElement.scrollTop = hourValue * itemHeight;
    }
    
    // 滚动分钟列表
    if (this.minuteListRef && this.minuteListRef.nativeElement) {
      const minuteValue = getSelectedTimeValue('minute');
      this.minuteListRef.nativeElement.scrollTop = minuteValue * itemHeight;
    }
    
    // 滚动秒钟列表
    if (this.secondListRef && this.secondListRef.nativeElement) {
      const secondValue = getSelectedTimeValue('second');
      this.secondListRef.nativeElement.scrollTop = secondValue * itemHeight;
    }
  }
}
