import { Component, Input, Output, EventEmitter, forwardRef, ViewChildren, QueryList, ElementRef, AfterViewInit, ChangeDetectorRef, OnChanges, SimpleChanges, ViewChild, OnDestroy, NgZone, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Subject, timer, Subscription } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

export interface SegmentedOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: string;
}

@Component({
  selector: 'lib-segmented',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './segmented.component.html',
  styleUrl: './segmented.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegmentedComponent),
      multi: true
    }
  ]
})
export class SegmentedComponent implements ControlValueAccessor, AfterViewInit, OnChanges, OnDestroy {
  @Input() options: SegmentedOption[] = [];
  @Input() disabled = false;
  @Input() block = false;
  @Input() size: 'large' | 'default' | 'small' = 'default';
  @Input() maxWidth?: number;
  @Input() adaptParentWidth = true;  // 是否适应父容器宽度
  @Output() valueChange = new EventEmitter<string | number>();

  @ViewChildren('segmentItem') segmentItems!: QueryList<ElementRef>;
  @ViewChild('segmentContainer') segmentContainer!: ElementRef;
  @ViewChild('segmentGroup') segmentGroup!: ElementRef;
  @ViewChild('thumb') thumbElement!: ElementRef;
  @ViewChild('rootElement') rootElement!: ElementRef;
  
  value: string | number | null = null;
  firstRender = true;  // 标记是否为首次渲染
  
  // 滚动控制变量
  canScrollLeft = false;
  canScrollRight = false;
  scrollStep = 150;
  
  // 新增属性
  showScrollButtons = false;
  thumbPosition = 0;
  thumbWidth = 0;
  selectedIndex = -1;
  
  private resizeObserver: ResizeObserver | null = null;
  private destroy$ = new Subject<void>();
  private scrollDebounce$ = new Subject<void>();
  private subscriptions: Subscription[] = [];
  
  // ControlValueAccessor接口实现
  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};
  
  // 添加一个Map来存储每个选项的位置信息
  private optionPositions = new Map<string | number, { left: number, width: number }>();
  
  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private renderer: Renderer2,
    private el: ElementRef
  ) {
    // 设置滚动防抖
    const scrollSub = this.scrollDebounce$.pipe(
      debounceTime(50),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateThumbPosition();
      this.checkScrollButtons();
    });
    
    this.subscriptions.push(scrollSub);
  }
  
  ngAfterViewInit() {
    // 应用最大宽度并适应父容器
    this.applyWidthSettings();
    
    // 延迟初始化，确保DOM已完全渲染
    const initSub = timer(0).pipe(takeUntil(this.destroy$)).subscribe(() => {
      // 确保滑块初始化
      if (this.value !== null) {
        this.updateThumbPosition(true);
      } else if (this.options.length > 0) {
        // 如果没有初始值，可以选择默认选中第一项非禁用选项
        const firstEnabled = this.options.find(opt => !opt.disabled);
        if (firstEnabled) {
          this.value = firstEnabled.value;
          this.onChange(this.value);
          this.valueChange.emit(this.value);
          this.updateThumbPosition(true);
        }
      }
      
      this.checkScrollButtons();
      this.updateScrollButtonsVisibility();
      
      // 计算并存储所有选项的位置
      this.calculateAllOptionPositions();
      
      // 监听容器大小变化
      this.observeResize();
      
      // 监听选项变化
      this.segmentItems.changes.pipe(takeUntil(this.destroy$)).subscribe(() => {
        timer(0).pipe(takeUntil(this.destroy$)).subscribe(() => {
          this.updateThumbPosition();
          this.checkScrollButtons();
          this.updateScrollButtonsVisibility();
        });
      });
      
      // 首次渲染后更改标记
      this.firstRender = false;
      this.cdr.detectChanges();
    });
    
    this.subscriptions.push(initSub);
  }
  
  // 监听容器大小变化
  private observeResize() {
    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => {
        this.ngZone.run(() => {
          this.applyWidthSettings();
          // 重新计算所有选项位置
          this.calculateAllOptionPositions();
          this.updateThumbPosition();
          this.checkScrollButtons();
          this.updateScrollButtonsVisibility();
        });
      });
      
      // 监听父容器大小变化
      const body = document.body;
      if (body) {
        this.resizeObserver.observe(body);
      }
    });
  }
  
  ngOnDestroy() {
    // 断开所有观察器
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // 完成所有Subjects
    this.destroy$.next();
    this.destroy$.complete();
    this.scrollDebounce$.complete();
    
    // 取消所有订阅
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['maxWidth']) {
      this.applyWidthSettings();
      this.updateScrollButtonsVisibility();
    }
    if (changes['disabled'] && !changes['disabled'].firstChange) {
      // 禁用状态改变时，需要重置滑块
      const updateSub = timer(0).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.updateThumbPosition();
        this.checkScrollButtons();
        this.updateScrollButtonsVisibility();
      });
      
      this.subscriptions.push(updateSub);
    }
    
    if (changes['options'] || changes['value'] || changes['size']) {
      const updateSub = timer(0).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.updateThumbPosition();
        this.checkScrollButtons();
        this.updateScrollButtonsVisibility();
      });
      
      this.subscriptions.push(updateSub);
    }
    
    if (changes['options']) {
      // 当选项变化时，在DOM更新后重新计算位置
      const calculateSub = timer(10).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.calculateAllOptionPositions();
        this.updateThumbPosition();
      });
      
      this.subscriptions.push(calculateSub);
    }
  }
  
  // 应用宽度设置 - 完全重写
  private applyWidthSettings() {
    // 应用父容器宽度适配
    if (this.adaptParentWidth) {
      this.renderer.setStyle(this.el.nativeElement, 'width', '100%');
      
      if (!this.maxWidth || this.maxWidth <= 0) {
        // 获取父元素
        const parent = this.el.nativeElement.parentElement;
        if (parent) {
          const parentWidth = parent.clientWidth;
          // 保留一些边距
          const availableWidth = parentWidth - 10;
          if (availableWidth > 0) {
            this.renderer.setStyle(this.el.nativeElement, 'max-width', `${availableWidth}px`);
          }
        }
      }
    }
    timer(100).subscribe(() => {
      this.updateScrollButtonsVisibility();
    });
  }

  writeValue(value: string | number | null): void {
    // 检测值是否变化
    const valueChanged = this.value !== value;
    this.value = value;
    
    if (valueChanged && this.segmentItems) {
      // 先标记为检测变更
      this.cdr.markForCheck();
      
      // 延迟更新滑块位置
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          this.ngZone.run(() => {
            // 如果是首次设置值，使用无动画更新
            this.updateThumbPosition(this.firstRender);
            this.scrollToSelected();
          });
        }, 0);
      });
    }
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
    
    // 禁用状态改变后，需要更新滑块
    const updateSub = timer(0).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateThumbPosition();
    });
    
    this.subscriptions.push(updateSub);
  }

  selectOption(option: SegmentedOption): void {
    if (this.disabled || option.disabled) {
      return;
    }
    
    // 只在值有变化时更新
    if (this.value !== option.value) {
      // 先更新选中值
      this.value = option.value;
      this.onChange(this.value);
      this.onTouched();
      this.valueChange.emit(this.value);
      
      // 找到对应选项的索引和元素
      const index = this.options.findIndex(o => o.value === option.value);
      if (index !== -1 && this.segmentItems) {
        const element = this.segmentItems.toArray()[index]?.nativeElement;
        if (element) {
          // 直接将滑块移动到目标位置
          this.moveThumbToPosition(element.offsetLeft, element.offsetWidth);
        }
      }
      // 滚动到选中项
      this.scrollToSelected();
    }
  }

  isSelected(option: SegmentedOption): boolean {
    return this.value === option.value;
  }
  
  // 更新左右滚动按钮的可见性
  updateScrollButtonsVisibility(): void {
    if (!this.segmentContainer || !this.segmentGroup || !this.rootElement) return;
    
    // 使用rootElement获取wrapper的宽度
    const wrapper = this.rootElement.nativeElement;
    const container = this.segmentContainer.nativeElement;
    const group = this.segmentGroup.nativeElement;
    
    // 检查真实的内容是否溢出wrapper宽度
    const wrapperWidth = wrapper.clientWidth;
    const contentWidth = group.getBoundingClientRect().width;
    const hasOverflow = contentWidth > wrapperWidth + 4; // 添加一点容差
    
    // 添加调试日志
    
    // 更新显示状态
    const oldState = this.showScrollButtons;
    this.showScrollButtons = hasOverflow;
    
    // 强制更新滚动按钮状态
    if (!hasOverflow) {
      this.canScrollLeft = false;
      this.canScrollRight = false;
      
      // 强制滚动回起始位置
      if (container.scrollLeft > 0) {
        container.scrollLeft = 0;
      }
    } else {
      // 重新检查滚动状态
      this.checkScrollButtons();
    }
    
    if (oldState !== this.showScrollButtons) {
      this.cdr.detectChanges();
    }
  }
  
  // 计算并存储所有选项的位置
  private calculateAllOptionPositions(): void {
    if (!this.segmentItems || this.segmentItems.length === 0) return;
    
    this.optionPositions.clear();
    
    this.segmentItems.forEach((item, index) => {
      const element = item.nativeElement;
      const option = this.options[index];
      
      if (option) {
        this.optionPositions.set(option.value, {
          left: element.offsetLeft,
          width: element.offsetWidth
        });
      }
    });
  }
  
  // 更新滑块位置的方法
  updateThumbPosition(immediate = false): void {
    // 确保滑块元素存在且有选中项
    if (!this.thumbElement || this.value === null) return;
    
    // 找到选中项的索引
    this.selectedIndex = this.options.findIndex(option => option.value === this.value);
    if (this.selectedIndex === -1 || !this.segmentItems) return;
    
    // 获取选中项元素
    const selectedElement = this.segmentItems.toArray()[this.selectedIndex]?.nativeElement;
    if (!selectedElement) return;
    
    // 获取选中项的尺寸和位置
    const width = selectedElement.offsetWidth;
    const left = selectedElement.offsetLeft;
    
    // 移动滑块到目标位置
    this.moveThumbToPosition(left, width, immediate);
  }
  
  // 移动滑块到指定位置
  private moveThumbToPosition(left: number, width: number, immediate = false): void {
    if (!this.thumbElement) return;
    
    const thumbElement = this.thumbElement.nativeElement;
    
    // 显示调试信息
    
    if (immediate || this.firstRender) {
      // 无动画移动
      this.renderer.setStyle(thumbElement, 'transition', 'none');
      this.renderer.setStyle(thumbElement, 'width', `${width}px`);
      this.renderer.setStyle(thumbElement, 'transform', `translateX(${left}px)`);
      
      // 强制浏览器重绘
      void thumbElement.offsetWidth;
      
      // 恢复动画
      requestAnimationFrame(() => {
        this.renderer.removeStyle(thumbElement, 'transition');
      });
    } else {
      // 有动画移动
      this.renderer.setStyle(thumbElement, 'transition', 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), width 300ms cubic-bezier(0.4, 0, 0.2, 1)');
      
      // 使用requestAnimationFrame确保过渡效果被正确应用
      requestAnimationFrame(() => {
        this.renderer.setStyle(thumbElement, 'width', `${width}px`);
        this.renderer.setStyle(thumbElement, 'transform', `translateX(${left}px)`);
      });
    }
    
    // 确保滑块可见
    thumbElement.style.display = 'block';
    
    // 确保变化被检测
    this.cdr.detectChanges();
  }
  
  // 检查滚动状态
  checkScrollButtons(): void {
    if (!this.segmentContainer || !this.segmentGroup) return;
    
    const container = this.segmentContainer.nativeElement;
    const group = this.segmentGroup.nativeElement;
    
    // 检查是否有溢出内容
    const hasOverflow = group.scrollWidth > container.clientWidth;
    
    // 更新是否可以滚动
    const oldLeftState = this.canScrollLeft;
    const oldRightState = this.canScrollRight;
    
    this.canScrollLeft = hasOverflow && container.scrollLeft > 1;
    this.canScrollRight = hasOverflow && 
                          (container.scrollLeft + container.clientWidth < group.scrollWidth - 1);
    
    // 只有状态变化时才触发变更检测
    if (oldLeftState !== this.canScrollLeft || oldRightState !== this.canScrollRight) {
      this.cdr.detectChanges();
    }
  }
  
  // 向左滚动
  scrollLeft(): void {
    if (!this.segmentContainer || !this.canScrollLeft) return;
    
    const container = this.segmentContainer.nativeElement;
    container.scrollBy({
      left: -this.scrollStep,
      behavior: 'smooth'
    });
    
    const updateSub = timer(300).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateThumbPosition();
      this.checkScrollButtons();
    });
    
    this.subscriptions.push(updateSub);
  }
  
  // 向右滚动
  scrollRight(): void {
    if (!this.segmentContainer || !this.canScrollRight) return;
    
    const container = this.segmentContainer.nativeElement;
    container.scrollBy({
      left: this.scrollStep,
      behavior: 'smooth'
    });
    
    const updateSub = timer(300).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateThumbPosition();
      this.checkScrollButtons();
    });
    
    this.subscriptions.push(updateSub);
  }
  
  // 滚动到选中项
  scrollToSelected(): void {
    if (!this.segmentItems || !this.segmentContainer) return;
    
    const selectedIndex = this.options.findIndex(option => this.isSelected(option));
    if (selectedIndex === -1) return;
    
    const container = this.segmentContainer.nativeElement;
    const selectedItem = this.segmentItems.toArray()[selectedIndex]?.nativeElement;
    if (!selectedItem) return;
    
    // 获取选中项和容器的位置信息
    const itemLeft = selectedItem.offsetLeft;
    const itemWidth = selectedItem.offsetWidth;
    const itemRight = itemLeft + itemWidth;
    const containerWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    const scrollRight = scrollLeft + containerWidth;
    
    // 确保选中项完全可见
    if (itemLeft < scrollLeft) {
      // 如果选中项在左侧不可见区域
      container.scrollTo({
        left: itemLeft,
        behavior: this.firstRender ? 'auto' : 'smooth'
      });
    } else if (itemRight > scrollRight) {
      // 如果选中项在右侧不可见区域
      const newScrollLeft = Math.min(
        itemRight - containerWidth,
        container.scrollWidth - containerWidth
      );
      container.scrollTo({
        left: newScrollLeft,
        behavior: this.firstRender ? 'auto' : 'smooth'
      });
    }
    
    // 更新按钮状态
    const updateSub = timer(300).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkScrollButtons();
    });
    
    this.subscriptions.push(updateSub);
  }
  
  // 监听滚动事件
  onScroll(): void {
    this.scrollDebounce$.next();
    this.checkScrollButtons();
    
    // 滚动时可能需要重新计算所有位置
    const scrollSub = timer(50).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calculateAllOptionPositions();
    });
    
    this.subscriptions.push(scrollSub);
  }
}
