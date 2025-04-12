export type DateTimerMode = 'year' | 'month' | 'quarter' | 'week' | 'date' | 'time';
export type DateTimerSize = 'large' | 'default' | 'small';
export type DateTimerStatus = 'error' | 'warning' | '' | string;
export type DateTimerSelectType = 'single' | 'range';

export interface RangeValue<T> {
  start: T | null;
  end: T | null;
}

export interface DateTimer {
  mode?: DateTimerMode;
  format?: string;
  size?: DateTimerSize;
  placeholder?: string | [string, string];
  rangePlaceholder?: string[];
  disabledDate?: (date: Date) => boolean;
  disabledTime?: (date: Date) => { hour?: boolean[], minute?: boolean[], second?: boolean[] };
  allowClear?: boolean;
  autoFocus?: boolean;
  borderless?: boolean;
  disabled?: boolean;
  status?: DateTimerStatus;
  dateRender?: (date: Date) => string | any;
  extraFooter?: string | any;
  showTime?: boolean;
  showToday?: boolean;
  selectType?: DateTimerSelectType;
}



