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
  HostBinding,
  ViewChild,
  NgZone,
  Renderer2,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabComponent } from './tab.component';
import { Subject, timer } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

export interface TabItem {
  key: string;
  title: string;
  disabled?: boolean;
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
export class TabsComponent implements OnChanges, AfterContentInit, AfterViewInit, OnDestroy {
  @Input() selectedIndex = 0;
  @Input() tabPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() size: 'default' | 'small' | 'large' = 'default';
  @Input() type: 'line' | 'card' = 'line';
  @Input() animated = true;
  @Input() centered = false;
  @Input() hideAdd = true;
  @Input() addIcon = 'bi-plus-circle';
  @Input() closeIcon = 'bi-x-lg';
  @Input() closable = false;

  @Output() selectedIndexChange = new EventEmitter<number>();
  @Output() tabClick = new EventEmitter<{ index: number, tab: TabItem }>();
  @Output() add = new EventEmitter<void>();
  @Output() close = new EventEmitter<{ index: number, tab: TabItem }>();
  @Output() selectChange = new EventEmitter<TabItem>();

  @ContentChildren(TabComponent) tabComponents!: QueryList<TabComponent>;
  @ViewChildren('tabItem') tabElements!: QueryList<ElementRef>;
  @ViewChild('tabsNav') tabsNav!: ElementRef;
  @ViewChild('tabsNavList') tabsNavList!: ElementRef;
  @ViewChild('navWrapper', { static: false }) navWrapper!: ElementRef;

  @HostBinding('class.animate-forward') animateForward = false;
  @HostBinding('class.animate-backward') animateBackward = false;

  // 滚动相关状态
  canScrollLeft = false;
  canScrollRight = false;
  showScrollNav = false;

  allTabs: TabItem[] = [];
  inkBarStyle: { [key: string]: string } = {};
  private previousIndex = 0;
  private destroy$ = new Subject<void>();
  private resizeObserver: ResizeObserver | null = null;
  private scrollDebounce$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private renderer: Renderer2
  ) {
    // 设置滚动防抖
    this.scrollDebounce$.pipe(
      debounceTime(50),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.checkScrollButtons();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedIndex'] && !changes['selectedIndex'].firstChange) {
      this.updateSelectedIndex();
    }

    if (changes['tabPosition']) {
      this.updateInkBarStyles();
    }
  }

  ngAfterContentInit(): void {
    this.buildAllTabs();
    if (this.tabComponents) {
      this.tabComponents.changes.pipe(takeUntil(this.destroy$)).subscribe(() => this.buildAllTabs());
    }
  }

  ngAfterViewInit(): void {
    let timer = setTimeout(() => {
      this.setupResizeObserver();
      this.updateInkBarStyles();
      this.checkScrollButtons();
      this.scrollToActiveTab();
      clearTimeout(timer);
    }, 0);
    if (this.tabElements) {
      this.tabElements.changes
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateInkBarStyles();
          this.checkScrollButtons();
          this.scrollToActiveTab();
        });
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.scrollDebounce$.complete();
  }

  selectTab(index: number): void {
    if (this.allTabs[index]?.disabled || this.selectedIndex === index) {
      return;
    }
    this.previousIndex = this.selectedIndex;
    this.selectedIndex = index;
    // 设置动画方向
    this.animateForward = this.selectedIndex > this.previousIndex;
    this.animateBackward = this.selectedIndex < this.previousIndex;
    this.selectedIndexChange.emit(index);
    this.tabClick.emit({ index, tab: this.allTabs[index] });
    this.selectChange.emit(this.allTabs[index]);
    this.updateInkBarStyles();
    this.scrollToActiveTab();
    this.cdr.markForCheck();
  }

  isActive(index: number): boolean {
    return index === this.selectedIndex;
  }

  onAddTab(): void {
    this.add.emit();
    this.recalculateAll();
  }

  onCloseTab(index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.close.emit({ index, tab: this.allTabs[index] });
  }

  trackByTab(index: number, tab: TabItem): string {
    return tab.key || index.toString();
  }

  /**
   * 向左滚动
   */
  scrollPrev(): void {
    if (!this.canScrollLeft || !this.tabsNav || !this.isHorizontal) return;
    const navContainer = this.tabsNav.nativeElement;
    const navWidth = navContainer.offsetWidth;
    const currentScroll = navContainer.scrollLeft;
    navContainer.scrollTo({
      left: Math.max(0, currentScroll - navWidth / 2),
      behavior: 'smooth'
    });
    // 滚动后更新按钮状态
    timer(0).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkScrollButtons();
      this.updateInkBarStyles();
    });
  }

  /**
   * 向右滚动
   */
  scrollNext(): void {
    if (!this.canScrollRight || !this.tabsNav || !this.isHorizontal) return;
    const navContainer = this.tabsNav.nativeElement;
    const navWidth = navContainer.offsetWidth;
    const navScrollWidth = navContainer.scrollWidth;
    const currentScroll = navContainer.scrollLeft;
    navContainer.scrollTo({
      left: Math.min(navScrollWidth - navWidth, currentScroll + navWidth / 2),
      behavior: 'smooth'
    });
    // 滚动后更新按钮状态
    timer(0).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkScrollButtons();
      this.updateInkBarStyles();
    });
  }

  /**
   * 滚动到活动标签
   */
  scrollToActiveTab(): void {
    if (!this.tabElements || !this.tabsNav || !this.isHorizontal) return;
    if (this.selectedIndex < 0 || this.selectedIndex >= this.tabElements.length) return;
    const navContainer = this.tabsNav.nativeElement;
    const activeTab = this.tabElements.toArray()[this.selectedIndex].nativeElement;
    const navWidth = navContainer.offsetWidth;
    const tabLeft = activeTab.offsetLeft;
    const tabWidth = activeTab.offsetWidth;
    const tabRight = tabLeft + tabWidth;
    const scrollLeft = navContainer.scrollLeft;
    const scrollRight = scrollLeft + navWidth;
    if (tabLeft < scrollLeft) {
      // 如果活动标签在左侧不可见
      navContainer.scrollTo({
        left: tabLeft,
        behavior: 'smooth'
      });
    } else if (tabRight > scrollRight) {
      // 如果活动标签在右侧不可见
      navContainer.scrollTo({
        left: tabRight - navWidth,
        behavior: 'smooth'
      });
    }
    timer(0).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkScrollButtons();
      this.updateInkBarStyles();
    });
  }

  /**
   * 处理滚动事件
   */
  onScroll(): void {
    // 直接检查滚动按钮状态
    this.checkScrollButtons();
    this.updateInkBarStyles();
  }

  /**
   * 检查是否需要显示滚动按钮
   */
  checkScrollButtons(): void {
    if (!this.tabsNav || !this.tabsNavList || !this.isHorizontal) return;

    const container = this.tabsNav.nativeElement;
    const group = this.tabsNavList.nativeElement;

    // 获取导航包装器和滚动按钮的宽度
    let wrapperWidth = 0;
    const buttonWidth = 40; // 按钮宽度 + 间距

    // 优先使用导航包装器宽度
    if (this.navWrapper) {
      wrapperWidth = this.navWrapper.nativeElement.offsetWidth;
    } else {
      // 如果没有navWrapper引用，则使用父元素宽度
      const navParent = container.parentElement;
      if (navParent && navParent.parentElement) {
        wrapperWidth = navParent.parentElement.offsetWidth;
      }
    }
    // 计算实际可用容器宽度（减去按钮的空间）
    const availableWidth = Math.max(0, wrapperWidth - (buttonWidth * 2));
    // 内容宽度
    const contentWidth = group.scrollWidth;
    // 判断是否需要显示滚动按钮（内容宽度大于可用宽度）
    const hasOverflow = contentWidth > availableWidth;
    // 更新按钮显示状态
    const oldShowScrollNav = this.showScrollNav;
    this.showScrollNav = hasOverflow;
    if (hasOverflow) {
      // 更新按钮可用状态
      this.canScrollLeft = container.scrollLeft > 0;
      this.canScrollRight = container.scrollLeft + container.clientWidth < contentWidth;
    } else {
      this.canScrollLeft = false;
      this.canScrollRight = false;

      // 如果不需要滚动但有滚动位置，则重置
      if (container.scrollLeft > 0) {
        container.scrollLeft = 0;
      }
    }

    // 只有状态变化时才触发变更检测
    if (oldShowScrollNav !== this.showScrollNav ||
      this.showScrollNav) { // 当按钮显示时，总是更新视图以反映按钮状态
      this.cdr.detectChanges();
    }
  }

  /**
   * 重新计算所有状态（添加tab或窗口大小改变时使用）
   */
  recalculateAll(): void {
    if (!this.tabsNav || !this.tabsNavList) return;

    // 强制检查滚动按钮
    this.checkScrollButtons();

    // 更新选中标签的指示器样式
    this.updateInkBarStyles();

    // 确保选中的标签可见
    if (this.tabElements && this.tabElements.length > 0) {
      this.scrollToActiveTab();
    }
  }

  /**
   * 判断是否是水平布局
   */
  get isHorizontal(): boolean {
    return this.tabPosition === 'top' || this.tabPosition === 'bottom';
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.ngZone.runOutsideAngular(() => {
        this.resizeObserver = new ResizeObserver(() => {
          this.ngZone.run(() => {
            // 在窗口大小改变时重新计算所有状态
            this.recalculateAll();
          });
        });

        if (this.tabsNav) {
          this.resizeObserver.observe(this.tabsNav.nativeElement);
        }

        if (this.tabsNavList) {
          this.resizeObserver.observe(this.tabsNavList.nativeElement);
        }

        // 监听整个文档和body的变化
        const documentElement = document.documentElement;
        if (documentElement) {
          this.resizeObserver.observe(documentElement);
        }

        if (document.body) {
          this.resizeObserver.observe(document.body);
        }

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
          this.ngZone.run(() => {
            this.recalculateAll();
          });
        });
      });
    }
  }

  private buildAllTabs(): void {
    this.allTabs = [
      ...this.tabComponents?.map(tab => ({
        key: tab.key,
        title: tab.title,
        disabled: tab.disabled,
        content: tab.contentTemplate,
        customTitle: tab.customTemplate
      })) || []
    ];

    if (this.selectedIndex >= this.allTabs.length) {
      this.selectedIndex = Math.max(0, this.allTabs.length - 1);
    }

    this.cdr.detectChanges();
    this.recalculateAll();
  }

  private updateSelectedIndex(): void {
    this.previousIndex = this.selectedIndex;
    this.cdr.markForCheck();
    this.updateInkBarStyles();
    this.scrollToActiveTab();
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
    if (!this.tabsNav) return;

    const navContainer = this.tabsNav.nativeElement;
    const { offsetWidth, offsetHeight, offsetLeft, offsetTop } = element;
    const isHorizontal = this.tabPosition === 'top' || this.tabPosition === 'bottom';

    // 获取滚动位置，以修正ink-bar的位置
    const scrollLeft = navContainer.scrollLeft;

    this.inkBarStyle = isHorizontal ?
      {
        width: `${offsetWidth}px`,
        height: '2px',
        transform: `translate3d(${offsetLeft - scrollLeft}px, 0, 0)`,
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
