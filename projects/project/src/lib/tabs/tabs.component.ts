import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ContentChildren, 
  QueryList, 
  AfterContentInit, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef, 
  TemplateRef, 
  OnDestroy, 
  OnChanges, 
  SimpleChanges, 
  ViewChildren, 
  ElementRef, 
  HostBinding 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabComponent } from './tab.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface TabItem {
  key: string;
  title: string;
  disabled?: boolean;
  icon?: string;
  content: TemplateRef<any>;
  customTitle?: TemplateRef<any>;
}

export interface TabConfig extends Omit<TabItem, 'key'> {
  key?: string;
}

@Component({
  selector: 'lib-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent implements OnChanges, AfterContentInit, OnDestroy {
  @Input() selectedIndex = 0;
  @Input() tabPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() size: 'default' | 'small' | 'large' = 'default';
  @Input() type: 'line' | 'card' = 'line';
  @Input() animated = true;
  @Input() centered = false;
  @Input() hideAdd = true;
  @Input() addIcon = '+';
  @Input() closable = false;

  @Output() selectedIndexChange = new EventEmitter<number>();
  @Output() tabClick = new EventEmitter<{ index: number, tab: TabItem }>();
  @Output() add = new EventEmitter<void>();
  @Output() close = new EventEmitter<{ index: number, tab: TabItem }>();
  @Output() selectChange = new EventEmitter<TabItem>();

  @ContentChildren(TabComponent) tabComponents!: QueryList<TabComponent>;
  @ViewChildren('tabItem') tabElements!: QueryList<ElementRef>;

  @HostBinding('class.animate-forward') animateForward = false;
  @HostBinding('class.animate-backward') animateBackward = false;

  allTabs: TabItem[] = [];
  inkBarStyle: { [key: string]: string } = {};
  private previousIndex = 0;
  private destroy$ = new Subject<void>();
  private resizeObserver: ResizeObserver | null = null;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedIndex'] && !changes['selectedIndex'].firstChange) {
      this.updateSelectedIndex();
    }

    if (changes['tabPosition']) {
      setTimeout(() => this.updateInkBarStyles(), 0);
    }
  }

  ngAfterContentInit(): void {
    this.buildAllTabs();

    if (this.tabComponents) {
      this.tabComponents.changes
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.buildAllTabs());
    }

    setTimeout(() => {
      this.setupResizeObserver();
      this.updateInkBarStyles();
    }, 0);

    if (this.tabElements) {
      this.tabElements.changes
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.updateInkBarStyles());
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  selectTab(index: number): void {
    if (this.allTabs[index]?.disabled || this.selectedIndex === index) {
      return;
    }
    
    this.previousIndex = this.selectedIndex;
    this.selectedIndex = index;
    this.selectedIndexChange.emit(index);
    this.tabClick.emit({ index, tab: this.allTabs[index] });
    this.selectChange.emit(this.allTabs[index]);
    this.updateInkBarStyles();
    this.cdr.markForCheck();
  }

  isActive(index: number): boolean {
    return index === this.selectedIndex;
  }

  onAddTab(): void {
    this.add.emit();
  }

  onCloseTab(index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.close.emit({ index, tab: this.allTabs[index] });
  }

  trackByTab(index: number, tab: TabItem): string {
    return tab.key || index.toString();
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updateInkBarStyles());

      const tabsElement = document.querySelector('.lib-tabs');
      if (tabsElement) {
        this.resizeObserver.observe(tabsElement);
      }
    }
  }

  private buildAllTabs(): void {
    this.allTabs = [
      ...this.tabComponents?.map(tab => ({
        key: tab.key,
        title: tab.title,
        disabled: tab.disabled,
        icon: tab.icon,
        content: tab.contentTemplate,
        customTitle: tab.customTemplate
      })) || []
    ];
    
    if (this.selectedIndex >= this.allTabs.length) {
      this.selectedIndex = Math.max(0, this.allTabs.length - 1);
    }
    
    this.cdr.markForCheck();
    setTimeout(() => this.updateInkBarStyles(), 0);
  }

  private updateSelectedIndex(): void {
    this.previousIndex = this.selectedIndex;
    this.cdr.markForCheck();
    this.updateInkBarStyles();
  }

  private updateInkBarStyles(): void {
    if (this.type !== 'line' || this.allTabs.length === 0) {
      return;
    }
    
    if (this.tabElements && this.tabElements.length > this.selectedIndex) {
      const activeElement = this.tabElements.toArray()[this.selectedIndex].nativeElement;
      if (activeElement) {
        this.setInkBarStyles(activeElement);
        return;
      }
    }
    
    const tabElements = document.querySelectorAll('.lib-tabs-tab');
    if (tabElements && tabElements.length > this.selectedIndex) {
      const activeElement = tabElements[this.selectedIndex] as HTMLElement;
      if (activeElement) {
        this.setInkBarStyles(activeElement);
      }
    }
  }

  private setInkBarStyles(element: HTMLElement): void {
    const { offsetWidth, offsetHeight, offsetLeft, offsetTop } = element;
    const isHorizontal = this.tabPosition === 'top' || this.tabPosition === 'bottom';

    this.inkBarStyle = isHorizontal ? 
      {
        width: `${offsetWidth}px`,
        height: '2px',
        transform: `translate3d(${offsetLeft}px, 0, 0)`,
        top: this.tabPosition === 'top' ? 'auto' : '0',
        bottom: this.tabPosition === 'top' ? '0' : 'auto',
        left: '0'
      } : 
      {
        width: '2px',
        height: `${offsetHeight}px`,
        transform: `translate3d(0, ${offsetTop}px, 0)`,
        top: '0',
        left: this.tabPosition === 'left' ? '100%' : '0',
        right: 'auto'
      };

    this.cdr.markForCheck();
  }
}
