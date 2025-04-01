import { CdkOverlayOrigin, Overlay, OverlayRef, OverlayConfig, ConnectedPosition } from '@angular/cdk/overlay';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { booleanAttribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, forwardRef, Input, OnChanges, OnInit, Renderer2, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import _ from 'lodash';
import { CommonModule, } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OverlayService } from '../service/overlay.service';
import { UtilsService } from '../service/utils.service';

@Component({
  selector: 'lib-select',
  imports: [CommonModule, FormsModule, ScrollingModule, CdkVirtualScrollViewport, CdkOverlayOrigin],
  templateUrl: './select.component.html',
  styleUrl: './select.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectComponent implements ControlValueAccessor, OnChanges, OnInit {
  //#region ViewChild 引用
  /** 浮层初始位置 */
  @ViewChild(CdkOverlayOrigin, { static: false }) _overlayOrigin!: CdkOverlayOrigin;
  /** 浮层tamplet对象 */
  @ViewChild('overlay', { static: false }) overlayTemplate!: TemplateRef<any>;
  /** 搜索盒子 */
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef;
  /** 搜索值 */
  @ViewChild('searchText', { static: false }) searchText!: ElementRef;
  //#endregion

  //#region 输入属性
  /** 弹出浮层最大高度 */
  @Input({ alias: 'selectPanelMaxHeight' }) optionPanelMaxHeight: number = 400;
  /** 数据为空占位符 */
  @Input({ alias: 'selectPlaceHolder' }) placeHolder: string = '请选择';
  /** 选择模式 */
  @Input({ alias: 'selectMode' }) selectMode: 'single' | 'multiple' = 'single';
  /** 是否允许清空 */
  @Input({ alias: 'selectAllowClear', transform: booleanAttribute }) allowClear: boolean = true;
  /** 是否显示搜索框 */
  @Input({ alias: 'selectSearch', transform: booleanAttribute }) search: boolean = true;
  /** 选项列表 */
  @Input({ alias: 'selectOption' }) optionList: Array<any> = [];
  /** 选项列表key */
  @Input({ alias: 'selectOptionKey' }) optionKey: string = 'label';
  /** 选项列表value */
  @Input({ alias: 'selectOptionValue' }) optionValue: string = 'value';
  /** 尺寸大小 */
  @Input({ alias: 'selectSize' }) size: 'large' | 'default' | 'small' = 'default';
  /** 是否支持自定义输入标签 */
  @Input({ alias: 'selectTagMode', transform: booleanAttribute }) tagMode: boolean = false;
  /** 是否无边框 */
  @Input({ alias: 'selectBorderless', transform: booleanAttribute }) borderless: boolean = false;
  /** 状态 */
  @Input({ alias: 'selectStatus' }) status: 'error' | 'warning' | null = null;
  /** 最多可选的数量 */
  @Input({ alias: 'selectMaxMultipleCount' }) maxMultipleCount: number = Infinity;
  /** 是否隐藏已选选项 */
  @Input({ alias: 'selectHideSelected', transform: booleanAttribute }) hideSelected: boolean = false;
  /** 是否加载中 */
  @Input({ alias: 'selectLoading', transform: booleanAttribute }) loading: boolean = false;
  /** 远程搜索方法 */
  @Input({ alias: 'selectSearchFn' }) searchFn: ((value: string) => Promise<any[]>) | null = null;
  /** 最小宽度 */
  @Input({ alias: 'selectMinWidth' }) minWidth: string = '400px';
  /** 选项自定义模板 */
  @Input() optionTemplate: TemplateRef<any> | null = null;
  /** 选择内容自定义模板 */
  @Input() optionLabelTemplate: TemplateRef<any> | null = null;
  /** 选项禁用属性名，默认为 disabled */
  @Input({ alias: 'selectOptionDisabledKey' }) optionDisabledKey: string = 'disabled';
  /** 是否禁用 */
  @Input({ alias: 'selectDisabled', transform: booleanAttribute }) disabled: boolean = false;
  /** 底部操作栏 */
  @Input({ alias: 'selectBottomBar' }) bottomBar: TemplateRef<any> | null = null;
  //#endregion

  //#region 内部状态变量
  /** 组件内部数据 */
  public _data: any = [];
  /** 浮层引用 */
  public overlayRef: OverlayRef | null = null;
  /** 模态框状态 */
  public modalState: 'open' | 'closed' = 'closed';
  /** 搜索值 */
  public searchValue = '';
  /** 输入法输入时的暂存值 */
  public searchOnCompositionValue = '';
  /** 选项分组 */
  public optionsGroups: { [key: string]: any[] } = {};
  /** 远程加载状态 */
  public remoteLoading: boolean = false;
  /** 过滤后的选项 */
  public filteredOptions: any[] = [];
  /** 自定义标签 */
  public customTags: string[] = [];
  /** 是否达到最大选择数量 */
  public reachedMaxCount: boolean = false;
  /** 选项映射表 */
  private optionMap: Map<any, any> = new Map();
  /** 虚拟滚动项目大小 */
  public itemSize: number = 36;
  /** 防抖搜索函数 */
  private debouncedSearch: ((value: string) => void) | null = null;
  /** 扁平化的分组选项 */
  public flattenedGroupOptions: Array<{ type: 'group' | 'option', label?: string, option?: any }> = [];
  //#endregion

  //#region 构造函数
  constructor(
    public overlay: Overlay,
    public viewContainerRef: ViewContainerRef,
    public cdr: ChangeDetectorRef,
    public renderer: Renderer2,
    public overlayService: OverlayService,
    private utilsService: UtilsService
  ) {
    if (this.searchFn) {
      this.debouncedSearch = this.utilsService.debounce(this.searchFn);
    }
  }
  //#endregion

  //#region 生命周期钩子
  ngOnInit() {
    this.initializeOptions();
    this.checkMaxCount();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes) {
      if (changes['optionList']) {
        this.initializeOptions();
      }

      if (changes['maxMultipleCount'] || changes['_data']) {
        this.checkMaxCount();
      }
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    // 清理防抖函数
    if (this.debouncedSearch) {
      this.debouncedSearch = null;
    }
    // 清理选项缓存
    this.optionMap.clear();
    this.customTags = [];
    // 清理浮层
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    // 确保所有引用置空
    this._data = null;
    this.filteredOptions = [];
    this.flattenedGroupOptions = [];
    this.optionsGroups = {};
  }
  //#endregion

  //#region 数据初始化与处理
  /**
   * 初始化选项相关数据
   */
  private initializeOptions(): void {
    this.processOptions();
    this.processGroupedOptions();
    this.filteredOptions = [...this.optionList];
  }

  /**
   * 处理选项数据，建立映射关系
   */
  private processOptions(): void {
    this.optionMap.clear();
    this.optionList && this.optionList.forEach(option => {
      this.optionMap.set(option[this.optionValue], option[this.optionKey]);
    });
  }

  /**
   * 处理分组选项
   */
  private processGroupedOptions(): void {
    this.optionsGroups = {};
    const options = this.filteredOptions.length > 0 ? this.filteredOptions : this.optionList;

    options.forEach(option => {
      if (option.group) {
        this.optionsGroups[option.group] = this.optionsGroups[option.group] || [];
        this.optionsGroups[option.group].push(option);
      }
    });

    this.flattenGroupedOptions();
  }

  /**
   * 将分组选项扁平化处理，用于虚拟滚动
   */
  private flattenGroupedOptions(): void {
    this.flattenedGroupOptions = [];

    if (Object.keys(this.optionsGroups).length === 0) return;
    // 扁平化处理分组数据
    Object.keys(this.optionsGroups).forEach(groupName => {
      // 添加分组标题
      this.flattenedGroupOptions.push({
        type: 'group',
        label: groupName
      });
      // 添加分组内选项
      this.optionsGroups[groupName].forEach(option => {
        this.flattenedGroupOptions.push({
          type: 'option',
          option: option
        });
      });
    });
  }

  /**
   * 检查是否达到最大选择数量
   */
  private checkMaxCount(): void {
    if (this.selectMode === 'multiple' && Array.isArray(this._data)) {
      this.reachedMaxCount = (this._data.length >= this.maxMultipleCount);
    }
  }

  /**
   * 重置选项列表
   */
  public resetOptionList(): void {
    this.filteredOptions = [...this.optionList];
    this.cdr.detectChanges();
  }
  //#endregion

  //#region 选项操作方法
  /**
   * 根据值获取标签
   */
  public getLabel(value: any): string {
    return this.optionMap.get(value) || value;
  }

  /**
   * 获取过滤后的选项
   */
  public getFilteredOptionsWithHideSelected(): any[] {
    const hasGroups = this.getObjectKeys(this.optionsGroups).length > 0;
    const items = hasGroups ? this.flattenedGroupOptions : this.filteredOptions;

    if (!this.hideSelected) return items;

    return hasGroups
      ? items.filter(item => item.type !== 'option' || !this._data.includes(item.option[this.optionValue]))
      : items.filter(item => !this._data.includes(item[this.optionValue]));
  }

  /**
   * 通用数据更新方法 - 处理单选/多选和最大数量限制
   */
  public handleSelectionChange(value: any, action: 'add' | 'remove'): void {
    let data;

    if (this.selectMode === 'single') {
      data = action === 'add' ? value : '';
    } else {
      data = [...this._data];

      if (action === 'add' && !data.includes(value) && data.length < this.maxMultipleCount) {
        data.push(value);
      } else if (action === 'remove') {
        data = _.without(data, value);
      }
    }

    this.updateData(data);
    this.reachedMaxCount = this.selectMode === 'multiple' && data.length >= this.maxMultipleCount;
  }

  /**
   * 选择用户
   */
  public selectUser(value: any, disabled: boolean = false): void {
    if (disabled) return;

    this.resetSearchInputWidth();

    if (this.selectMode === 'single') {
      this.handleSelectionChange(value, 'add');
      this.closeModal(this.overlayRef);
      return;
    }

    // 多选
    this.focusSearchInput();
    const action = this._data.includes(value) ? 'remove' : 'add';
    this.handleSelectionChange(value, action);
  }

  /**
   * 移除用户
   */
  public removeUser(event: Event, userId: any): void {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.handleSelectionChange(userId, 'remove');
  }

  /**
   * 更新数据,并提交。异步更新浮层
   * @param data 数据
   */
  public updateData(data: any): void {
    this._data = data;
    this.onChange(this._data);
    this.updateOverlayRefPosition();
    this.cdr.detectChanges();
  }

  /**
   * 清空数据
   */
  public clear(event: Event): void {
    event.stopPropagation();
    this.updateData(this.selectMode === 'single' ? '' : []);
    this.resetSearchInputWidth();
    this.reachedMaxCount = false;
  }

  /**
   * 检查选项是否禁用
   * @param option 选项
   */
  public isOptionDisabled(option: any): boolean {
    return option[this.optionDisabledKey] === true;
  }
  //#endregion

  //#region 搜索相关方法
  /**
   * 搜索
   * @param value 搜索值
   */
  public onSearch(value: any): void {
    this.searchOnCompositionValue = value;
    this.searchInputWidthChange();

    // 执行搜索
    if (!this.searchFn) {
      this.executeLocalSearch(value);
    } else {
      this.executeRemoteSearch(value);
    }
  }

  /**
   * 执行本地搜索
   */
  private executeLocalSearch(value: string): void {
    this.filteredOptions = !value || value.trim() === ''
      ? [...this.optionList]
      : this.optionList.filter(option => {
        const optionText = String(option[this.optionKey] || '');
        return optionText.toLowerCase().includes(value.toLowerCase());
      });

    // 更新分组数据
    this.processGroupedOptions();
    this.cdr.detectChanges();
  }

  /**
   * 执行远程搜索 (带节流控制)
   */
  private executeRemoteSearch(value: string): void {
    if (!this.searchFn) return;
    this.remoteLoading = true;
    this.cdr.detectChanges();

    if (!this.debouncedSearch) {
      // 创建一个新的防抖处理函数
      this.debouncedSearch = this.utilsService.debounce((searchValue: string) => {
        return this.searchFn!(searchValue)
          .then(results => {
            this.filteredOptions = results;
            this.processGroupedOptions();
            this.remoteLoading = false;
            this.cdr.detectChanges();
            return results;
          })
          .catch(() => {
            this.remoteLoading = false;
            this.cdr.detectChanges();
            return [];
          });
      });
    }
    this.debouncedSearch(value);
  }

  /**
   * 重置搜索状态
   */
  private resetSearchState(): void {
    this.searchValue = '';
    this.searchOnCompositionValue = '';
    this.filteredOptions = [...this.optionList];
    this.processGroupedOptions();
  }
  //#endregion

  //#region 搜索输入框操作
  /**
   * 搜索输入宽度变化
   */
  public searchInputWidthChange(): void {
    const timer = setTimeout(() => {
      let width = (this.searchOnCompositionValue === '' ? 4 : this.searchText.nativeElement.offsetWidth + 20);
      this.renderer.setStyle(this.searchInput.nativeElement, 'width', `${width}px`);
      this.updateOverlayRefPosition();
      clearTimeout(timer);
    });
  }

  /**
   * 搜索输入宽度变化
   * @param event 搜索输入宽度变化
   */
  public compositionchange(event: any): void {
    if (event && event.data) {
      this.searchOnCompositionValue = this.searchValue + event.data;
    }
    this.searchInputWidthChange();
  }

  /**
   * 重置搜索输入宽度
   */
  public resetSearchInputWidth(): void {
    if (!this.searchInput) return;
    this.renderer.setStyle(this.searchInput.nativeElement, 'width', '4px');
    this.cdr.detectChanges();
  }

  /**
   * 聚焦搜索输入
   */
  public focusSearchInput(): void {
    if (this.search && this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }
  //#endregion

  //#region 自定义标签相关
  /**
   * 创建自定义标签
   */
  public createCustomTag(value: string): void {
    if (!this.tagMode || !value || value.trim() === '') return;

    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    if (tags.length === 0) return;

    if (this.selectMode === 'multiple') {
      const newData = [...this._data];
      let tagsAdded = false;

      tags.forEach(tag => {
        if (!newData.includes(tag) && newData.length < this.maxMultipleCount) {
          newData.push(tag);
          this.customTags.push(tag);
          this.optionMap.set(tag, tag);
          tagsAdded = true;
        }
      });

      if (tagsAdded) {
        this.updateData(newData);
        this.reachedMaxCount = (newData.length >= this.maxMultipleCount);
      }
    } else {
      this.updateData(tags[0]);
      this.customTags.push(tags[0]);
      this.optionMap.set(tags[0], tags[0]);
    }

    this.resetSearchInputWidth();
  }
  //#endregion

  //#region 键盘与粘贴事件处理
  /**
   * 粘贴处理
   * @param event 粘贴事件
   */
  public handlePaste(event: ClipboardEvent): void {
    if (!this.tagMode || (this.selectMode !== 'multiple')) {
      return;
    }
    const pastedText = event.clipboardData?.getData('text');
    if (pastedText) {
      event.preventDefault();
      this.createCustomTag(pastedText);
    }
  }

  /**
   * 处理键盘事件
   */
  public handleKeydown(event: KeyboardEvent): void {
    // 退格键删除最后一个选项
    if (event.key === 'Backspace' &&
      this.searchValue === '' &&
      this.modalState === 'open' &&
      this.selectMode === 'multiple' &&
      Array.isArray(this._data) &&
      this._data.length > 0) {

      event.preventDefault();
      const lastItem = this._data[this._data.length - 1];
      this.handleSelectionChange(lastItem, 'remove');
      return;
    }

    // 回车创建标签
    if (event.key === 'Enter' && this.tagMode) {
      event.preventDefault();
      this.createCustomTag(this.searchValue);
      this.resetSearchState();
      this.searchInputWidthChange();
    }
  }
  //#endregion

  //#region 浮层操作
  /**
   * 打开弹窗
   */
  public openModal(): void {
    if (this.overlayRef || this.disabled) return;
    this.focusSearchInput();
    this.resetOptionList();
    this.processGroupedOptions();
    this.renderer.addClass(this._overlayOrigin.elementRef.nativeElement, 'active');
    this.createAndSetupOverlay(this._overlayOrigin.elementRef.nativeElement);
    this.modalState = 'open';
    this.cdr.detectChanges();
  }

  /**
   * 创建并设置浮层
   */
  private createAndSetupOverlay(selectElement: any): void {
    // 配置
    const config = {
      hasBackdrop: true,
      backdropClass: 'transparent-backdrop',
      width: selectElement.clientWidth
    };
    // 位置配置
    const positions: ConnectedPosition[] = [
      { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
      { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' }
    ];

    // 创建浮层
    this.overlayRef = this.overlayService.createOverlay(
      config,
      selectElement,
      positions,
      (ref, event) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-role="tag-close-button"]') || target.closest('.select-tag-close-icon')) {
          return;
        }
        this.closeModal(ref)
      }
    );

    // 附加模板
    this.overlayService.attachTemplate(
      this.overlayRef,
      this.overlayTemplate,
      this.viewContainerRef
    );
  }

  /**
   * 关闭弹窗
   * @param overlayRef 浮层引用
   */
  async closeModal(overlayRef: OverlayRef | null): Promise<void> {
    this.modalState = 'closed';
    this.resetSearchInputWidth();
    this.resetSearchState();
    // 移除激活样式
    this.renderer.removeClass(this._overlayOrigin.elementRef.nativeElement, 'active');
    this.cdr.detectChanges();

    // 使用setTimeout确保CSS过渡动画有时间完成
    const timer = setTimeout(() => {
      if (overlayRef) {
        overlayRef.detach(); // 先分离内容
        overlayRef.dispose(); // 再完全销毁浮层
        this.overlayRef = null;
        this.cdr.detectChanges();
        clearTimeout(timer);
      }
    }, 150); // 给150ms的时间完成过渡动画
  }

  /**
   * 异步更新浮层位置
   */
  public updateOverlayRefPosition(): void {
    let timer = setTimeout(() => {
      this.overlayRef && this.overlayRef.updatePosition();
      clearTimeout(timer);
    }, 0);
  }
  //#endregion

  //#region 工具方法
  /**
   * 跟踪选项
   * @param index 索引
   * @param item 选项
   */
  trackByFn(index: number, item: any): any {
    return index;
  }

  getObjectKeys(obj: any): string[] {
    return this.utilsService.getObjectKeys(obj);
  }

  /**
   * 自定义模板上下文
   */
  public getTemplateContext(option: any) {
    return {
      $implicit: option,
    };
  }
  //#endregion

  //#region ControlValueAccessor 实现
  /** ngModel实现接口 */
  public onTouch = (): void => { };
  public onChange = (value: any): void => { }
  public writeValue(obj: any): void {
    this._data = obj;
    this.cdr.detectChanges();
  }
  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  public registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }
  //#endregion
}
