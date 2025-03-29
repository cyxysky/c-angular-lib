import { CommonModule } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output, Renderer2, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayService } from '../service/overlay.service';
import { Subject, fromEvent } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { CdkOverlayOrigin, OverlayRef, Overlay, ConnectedPosition } from '@angular/cdk/overlay';

export interface CascaderOption {
  value: any;
  label: string;
  disabled?: boolean;
  children?: CascaderOption[];
  isLeaf?: boolean;
  disableCheckbox?: boolean;
  [key: string]: any;
  path?: any[];
  loading?: boolean;
}

export type CascaderExpandTrigger = 'click' | 'hover';
export type CascaderTriggerType = 'click' | 'hover';
export type CascaderSize = 'large' | 'default' | 'small';

@Component({
  selector: 'lib-cascader',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkOverlayOrigin],
  templateUrl: './cascader.component.html',
  styleUrl: './cascader.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CascaderComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CascaderComponent implements OnInit, OnDestroy, ControlValueAccessor {
  // 视图引用
  @ViewChild(CdkOverlayOrigin, { static: false }) overlayOrigin!: CdkOverlayOrigin;
  @ViewChild('dropdownTemplate', { static: false }) dropdownTemplate!: TemplateRef<any>;
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef;
  @ViewChild('searchText', { static: false }) searchText!: ElementRef;

  // 输入属性
  /** 选项数据 */
  @Input() options: CascaderOption[] = [];
  /** 默认值 */
  @Input() defaultValue: any[] | any[][] = [];
  /** 展开方式 */
  @Input() expandTrigger: CascaderExpandTrigger = 'click';
  /** 是否显示搜索框 */
  @Input({ transform: booleanAttribute }) showSearch: boolean = false;
  /** 是否禁用 */
  @Input({ transform: booleanAttribute }) disabled: boolean = false;
  /** 占位文本 */
  @Input() placeholder: string = '请选择';
  /** 是否允许清空 */
  @Input({ transform: booleanAttribute }) allowClear: boolean = true;
  /** 改变后立即关闭菜单 */
  @Input({ transform: booleanAttribute }) changeOnSelect: boolean = false;
  /** 是否多选 */
  @Input({ transform: booleanAttribute }) isMultiple: boolean = false;
  /** 多选时是否显示复选框 */
  @Input({ transform: booleanAttribute }) checkable: boolean = true;
  /** 尺寸 */
  @Input() size: CascaderSize = 'default';
  /** 自定义节点属性 */
  @Input() fieldNames: { label: string; value: string; children: string; } = { label: 'label', value: 'value', children: 'children' };
  /** 是否无边框 */
  @Input({ transform: booleanAttribute }) borderless: boolean = false;
  /** 状态 */
  @Input() status: 'error' | 'warning' | null = null;
  /** 下拉菜单的宽度 */
  @Input() menuWidth: number = 160;
  /** 最小宽度 */
  @Input() minWidth: string = '120px';
  /** 自定义选项模板 */
  @Input() optionTemplate: TemplateRef<any> | null = null;
  /** 自定义选项标签模板 */
  @Input() optionLabelTemplate: TemplateRef<any> | null = null;
  /** 是否加载中 */
  @Input({ transform: booleanAttribute }) loading: boolean = false;
  /** 自定义显示渲染函数 */
  @Input() displayRender?: (labels: string[], selectedOptions?: CascaderOption[]) => string;
  /** 选项过滤函数 */
  @Input() optionFilterFn?: (inputValue: string, option: CascaderOption) => boolean;
  /** 选项选择函数，返回 true/false 表示是否可选 */
  @Input() optionSelectFn?: (option: CascaderOption) => boolean;

  // 输出事件
  /** 值变化事件 */
  @Output() valueChange = new EventEmitter<any[] | any[][]>();
  /** 选项变化事件 */
  @Output() selectionChange = new EventEmitter<CascaderOption[]>();
  /** 可见性变化事件 */
  @Output() visibleChange = new EventEmitter<boolean>();
  /** 搜索事件 */
  @Output() search = new EventEmitter<string>();

  // 内部状态
  /** 存储选中的选项路径 - 单选模式下的完整选择路径 */
  selectedOptions: CascaderOption[] = [];
  /** 级联列数据 - 每一列的选项数据数组 */
  columns: CascaderOption[][] = [];
  /** 每一列激活的选项 */
  activatedOptions: CascaderOption[] = [];
  /** 选中值 - 单选时为值数组，多选时为值数组的数组 */
  value: any[] | any[][] = [];
  /** 浮层引用 */
  overlayRef: OverlayRef | null = null;
  /** 下拉状态 */
  isDropdownOpen: boolean = false;
  /** 搜索关键字 */
  searchValue: string = '';
  /** 多选模式下显示的标签 */
  displayTags: { label: string, value: any, option: CascaderOption }[] = [];
  /** 搜索过滤后的选项 */
  filteredOptions: CascaderOption[] = [];
  /** 销毁订阅 */
  private destroy$ = new Subject<void>();
  /** 标记是否正在进行中文输入法输入 */
  private isComposing = false;
  /** 键盘导航索引 */
  public keyboardNavIndex = -1;
  /** 全局点击监听 */
  private globalClickListener: Function | null = null;

  // 缓存和映射
  /** 值到选项的映射 */
  private valueOptionMap = new Map<string, CascaderOption>();
  /** 选项到值的映射 */
  private optionValueMap = new Map<CascaderOption, string>();
  /** 选项到父选项的映射 */
  private optionParentMap = new Map<CascaderOption, CascaderOption>();
  /** 选项路径缓存 */
  private optionPathMap = new Map<string, CascaderOption[]>();
  /** 多选模式下选中的选项路径 */
  private selectedPathsMap = new Map<string, CascaderOption[]>();
  /** 半选状态的选项 */
  private indeterminateSet = new Set<string>();

  // 添加防抖动计时器属性
  private _positionUpdateTimer: any = null;

  // 添加临时选中数组
  tempSelectedOptions: CascaderOption[] = [];

  // getter/setter
  get labelProperty(): string {
    return this.fieldNames.label;
  }

  get valueProperty(): string {
    return this.fieldNames.value;
  }

  get childrenProperty(): string {
    return this.fieldNames.children;
  }

  get displayLabels(): string[] {
    if (!this.selectedOptions.length) return [];
    return this.selectedOptions.map(o => o[this.labelProperty]);
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private overlayService: OverlayService,
    private elementRef: ElementRef
  ) {}

  // 生命周期方法
  ngOnInit(): void {
    // 初始化数据映射
    this.initOptionMaps(this.options);
    // 确保初始列正确设置
    this.columns = [this.options.slice()]; // 使用浅拷贝
    // 应用默认值
    this.setDefaultValue();
    // 设置文档点击事件监听
    this.setupDocumentClickListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.globalClickListener) {
      this.globalClickListener();
      this.globalClickListener = null;
    }
    
    if (this._positionUpdateTimer) {
      clearTimeout(this._positionUpdateTimer);
      this._positionUpdateTimer = null;
    }
    
    this.closeDropdown();
  }

  // ControlValueAccessor 接口实现
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void {
    if (value === null || value === undefined) {
      this.clear();
    } else {
      this.setValue(value, false);
    }
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  // 初始化方法
  private initOptionMaps(options: CascaderOption[], parent?: CascaderOption, path: CascaderOption[] = []): void {
    if (!options?.length) return;

    options.forEach(option => {
      const value = this.getOptionValue(option);
      const valueKey = String(value);
      
      // 记录选项和值的映射关系
      this.valueOptionMap.set(valueKey, option);
      this.optionValueMap.set(option, valueKey);
      
      // 记录父子关系
      if (parent) {
        this.optionParentMap.set(option, parent);
      }
      
      // 记录选项路径
      const currentPath = [...path, option];
      const pathKey = this.getPathKey(currentPath);
      this.optionPathMap.set(pathKey, currentPath);
      
      // 递归处理子选项
      if (this.hasChildren(option)) {
        this.initOptionMaps(this.getChildren(option), option, currentPath);
      }
    });
  }

  private setDefaultValue(): void {
    if (!this.defaultValue || (Array.isArray(this.defaultValue) && this.defaultValue.length === 0)) {
      return;
    }
    
    this.setValue(this.defaultValue, false);
  }

  private setupDocumentClickListener(): void {
    if (this.globalClickListener) {
      this.globalClickListener();
    }
    
    this.globalClickListener = this.renderer.listen('document', 'click', (event: MouseEvent) => {
      if (this.isDropdownOpen && !this.elementRef.nativeElement.contains(event.target)) {
        this.closeDropdown();
      }
    });
  }

  // 下拉菜单控制
  toggleDropdown(event: MouseEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    if (this.isDropdownOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown(): void {
    if (this.disabled || this.isDropdownOpen) return;
    
    this.isDropdownOpen = true;
    this.visibleChange.emit(true);
    
    // 重置临时选中路径为当前实际选中路径
    this.tempSelectedOptions = [...this.selectedOptions];
    
    // 准备列数据
    this.prepareColumnsFromSelection();
    
    this.cdr.detectChanges();
    
    // 创建浮层
    const origin = this.overlayOrigin.elementRef.nativeElement;
    
    // 添加打开状态样式类
    this.renderer.addClass(origin, 'cascader-open');
    
    try {
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
      
      // 计算固定宽度
      const dropdownWidth = Math.max(
        origin.offsetWidth,
        this.columns.length * this.menuWidth
      );
      
      // 创建浮层（添加错误处理）
      this.overlayRef = this.overlayService.createOverlay({
        hasBackdrop: true,
        backdropClass: 'transparent-backdrop',
        width: dropdownWidth,
        minWidth: origin.offsetWidth,
        maxHeight: '80vh',         // 限制最大高度
        disposeOnNavigation: true  // 导航时自动销毁
      }, origin, positions, 
      () => {
        // 点击背景关闭
        if (this.isDropdownOpen) {
          this.closeDropdown();
        }
      }, 
      undefined); // 使用undefined代替null以符合类型要求
      
      // 附加模板
      if (this.overlayRef) {
        this.overlayService.attachTemplate(
          this.overlayRef,
          this.dropdownTemplate,
          this.viewContainerRef
        );
        
        // 聚焦搜索框
        if (this.showSearch) {
          setTimeout(() => {
            if (this.searchInput) {
              this.searchInput.nativeElement.focus();
            }
          }, 100);
        }
      }
      
      // 设置键盘导航索引
      this.keyboardNavIndex = -1;
    } catch (err) {
      console.error('Error opening dropdown:', err);
      this.isDropdownOpen = false;
      this.visibleChange.emit(false);
    }
  }

  closeDropdown(): void {
    if (!this.isDropdownOpen) return;
    
    this.isDropdownOpen = false;
    this.visibleChange.emit(false);
    
    // 移除打开状态样式类
    const origin = this.overlayOrigin?.elementRef?.nativeElement;
    if (origin) {
      this.renderer.removeClass(origin, 'cascader-open');
    }
    
    this.searchValue = '';
    this.filteredOptions = [];
    this.keyboardNavIndex = -1;
    
    // 安全地销毁浮层
    if (this.overlayRef) {
      try {
        this.overlayRef.detach();
        this.overlayRef.dispose();
      } catch (err) {
        console.error('Error closing dropdown:', err);
      } finally {
        this.overlayRef = null;
      }
    }
    
    this.cdr.markForCheck();
  }

  // 列和选项管理
  private prepareColumnsFromSelection(): void {
    // 始终从第一列开始
    this.columns = [this.options];
    this.activatedOptions = [];
    
    // 只有在有选中项且为单选模式时才展开列
    if (!this.isMultiple && this.selectedOptions && this.selectedOptions.length > 0) {
      let currentOptions = this.options;
      
      // 遍历已选路径，展开所有级别
      for (let i = 0; i < this.selectedOptions.length; i++) {
        const option = this.selectedOptions[i];
        // 添加到激活项
        this.activatedOptions.push(option);
        
        // 重要: 无论是否是最后一项，只要有子级，就加载下一列
        if (this.hasChildren(option)) {
          currentOptions = this.getChildren(option);
          // 添加子级列
          this.columns.push([...currentOptions]);
        }
      }
    }
    
    // 强制更新
    this.cdr.detectChanges();
  }

  private updateDropdownPosition(): void {
    if (!this.overlayRef) return;
    
    try {
      // 稳定的宽度计算，避免反复变化触发更新循环
      const dropdownWidth = Math.max(
        this.overlayOrigin.elementRef.nativeElement.offsetWidth,
        this.columns.length * this.menuWidth
      );
      
      const overlayElement = this.overlayRef.overlayElement;
      if (overlayElement) {
        // 一次性设置宽度，避免布局抖动
        this.renderer.setStyle(overlayElement, 'width', `${dropdownWidth}px`);
        
        // 延迟更新位置，避免立即触发可能的循环
        setTimeout(() => {
          if (this.overlayRef && this.isDropdownOpen) {
            this.overlayRef.updatePosition();
          }
        }, 0);
      }
    } catch (err) {
      console.error('Error updating dropdown position:', err);
    }
  }

  // 选项操作方法
  onOptionClick(option: CascaderOption, columnIndex: number, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (!option || option.disabled) return;
    
    // 激活选项（这会更新临时选中状态）
    this.activateOption(option, columnIndex);
    
    // 可选择性检查
    if (this.optionSelectFn && !this.optionSelectFn(option)) {
      return;
    }
    
    // 多选模式复选框禁用检查
    if (this.isMultiple && option.disableCheckbox) {
      return;
    }
    
    // 判断是否可以选择
    const canSelect = this.isLeaf(option) || this.changeOnSelect;
    
    if (canSelect) {
      if (this.isMultiple) {
        this.toggleMultipleSelection(option);
      } else {
        // 单选模式 - 只有在叶子节点或开启了选择即改变时，才确认临时选择为正式选择
        this.confirmSelection();
        
        // 叶子节点或选择即改变且没有子节点时关闭下拉
        if (this.isLeaf(option) || (this.changeOnSelect && !this.hasChildren(option))) {
          this.closeDropdown();
        }
      }
    }
  }

  onOptionMouseEnter(option: CascaderOption, columnIndex: number): void {
    if (option.disabled || this.expandTrigger !== 'hover') return;
    
    this.activateOption(option, columnIndex);
  }

  activateOption(option: CascaderOption, columnIndex: number): void {
    if (!option || option.disabled) return;
    
    // 清除当前列及后续列的激活状态
    this.activatedOptions = this.activatedOptions.slice(0, columnIndex);
    this.activatedOptions.push(option);
    
    // 关键修复：重置临时选中路径，确保每列只有一个选中项
    this.tempSelectedOptions = this.tempSelectedOptions.slice(0, columnIndex);
    this.tempSelectedOptions.push(option);
    
    // 更新列数据
    this.columns = this.columns.slice(0, columnIndex + 1);
    
    // 如果有子节点，添加子节点列
    if (this.hasChildren(option)) {
      this.columns.push(this.getChildren(option));
    }
    
    // 更新下拉位置和UI
    this.updateDropdownPosition();
    this.cdr.markForCheck();
  }

  isOptionActivated(option: CascaderOption, columnIndex: number): boolean {
    if (!option) return false;
    
    // 确保选项在正确的位置被激活
    return columnIndex < this.activatedOptions.length && 
           this.activatedOptions[columnIndex] === option;
  }

  selectSingleOption(option: CascaderOption, columnIndex: number): void {
    if (!option) return;
    
    // 重要修复: 选择新路径前，清空所有状态
    const newPath = [];
    
    // 只保留当前列及之前的路径
    for (let i = 0; i < columnIndex; i++) {
      if (i < this.activatedOptions.length) {
        newPath.push(this.activatedOptions[i]);
      }
    }
    
    // 添加当前选中项
    newPath.push(option);
    
    // 更新选中路径 - 完全替换，不保留任何旧数据
    this.selectedOptions = newPath;
    
    // 更新值
    this.value = this.selectedOptions.map(opt => this.getOptionValue(opt));
    
    // 触发事件
    this.emitValueChange();
    
    // 如果是叶子节点或设置了选择即改变且没有子级，关闭下拉
    if (this.isLeaf(option) || (this.changeOnSelect && !this.hasChildren(option))) {
      this.closeDropdown();
    }
    
    // 强制更新 UI
    this.cdr.detectChanges();
  }

  toggleMultipleSelection(option: CascaderOption): void {
    if (!option) return;
    
    try {
      const isSelected = this.isOptionSelected(option);
      console.log('切换选项:', option.label, '当前状态:', isSelected ? '选中' : '未选中');
      
      // 安全构建选项路径
      let path: CascaderOption[] = [];
      
      // 对于搜索结果，使用预存路径
      if (option.path && Array.isArray(option.path)) {
        path = [...option.path];
      } else {
        // 否则从父映射构建路径
        path = this.buildOptionPath(option);
      }
      
      if (!path.length) return;
      
      const pathKey = this.getPathKey(path);
      
      if (!isSelected) {
        // 选中选项
        this.selectedPathsMap.set(pathKey, path);
        
        // 选中所有子选项
        if (this.hasChildren(option)) {
          this.selectAllChildren(option, path);
        }
      } else {
        // 取消选中
        this.selectedPathsMap.delete(pathKey);
        
        // 取消选中所有子选项
        if (this.hasChildren(option)) {
          this.deselectAllChildren(option);
        }
      }
      
      // 更新半选状态
      this.updateIndeterminateStatus();
      
      // 更新多选值
      this.updateMultipleValues();
      
      // 触发事件
      this.emitValueChange();
    } catch (err) {
      console.error('多选切换错误:', err);
    }
  }

  onCheckboxClick(option: CascaderOption, columnIndex: number, event: Event): void {
    event.stopPropagation();
    
    if (option.disabled || option.disableCheckbox) return;
    
    this.toggleMultipleSelection(option);
  }

  // 搜索相关
  onSearch(value: string): void {
    this.searchValue = value;
    this.search.emit(value);
    
    if (!value) {
      this.filteredOptions = [];
      return;
    }
    
    // 设置为加载状态
    this.loading = true;
    this.cdr.markForCheck();
    
    // 延迟搜索，提高性能
    setTimeout(() => {
      this.performSearch(value);
      this.loading = false;
      this.cdr.markForCheck();
    }, 150);
  }

  private performSearch(value: string): void {
    if (!value) {
      this.filteredOptions = [];
      return;
    }
    
    const results: CascaderOption[] = [];
    
    // 递归搜索选项，加强健壮性
    const searchInOptions = (options: CascaderOption[] | undefined, currentPath: CascaderOption[] = []): void => {
      if (!options || !Array.isArray(options) || options.length === 0) return;
      
      for (const option of options) {
        // 严格检查选项有效性
        if (!option || typeof option !== 'object') continue;
        if (option.disabled) continue;
        
        // 复制当前路径并添加当前选项
        const path = [...currentPath];
        
        try {
          // 确保属性存在
          if (option[this.labelProperty] !== undefined) {
            path.push(option);
            
            // 使用更安全的过滤函数
            if (this.safeFilterOption(value, option)) {
              // 克隆选项并添加路径信息
              results.push({...option, path: [...path]});
            }
            
            // 递归搜索子选项
            if (this.hasChildren(option)) {
              searchInOptions(this.getChildren(option), path);
            }
          } else {
            console.warn('选项缺少必要属性:', this.labelProperty, option);
          }
        } catch (err) {
          console.error('搜索过程中出错:', err);
        }
      }
    };
    
    // 开始搜索
    searchInOptions(this.options, []);
    
    // 确保安全排序
    this.safeSort(results);
    
    this.filteredOptions = results;
  }

  // 安全过滤方法
  private safeFilterOption(inputValue: string, option: CascaderOption): boolean {
    if (!option || typeof option !== 'object') return false;
    if (this.optionFilterFn) {
      try {
        return this.optionFilterFn(inputValue, option);
      } catch (err) {
        console.error('自定义过滤函数错误:', err);
        return false;
      }
    }
    
    // 默认过滤逻辑
    try {
      const label = option[this.labelProperty];
      if (typeof label !== 'string' && typeof label !== 'number') return false;
      return String(label).toLowerCase().includes(inputValue.toLowerCase());
    } catch (err) {
      console.error('默认过滤逻辑错误:', err);
      return false;
    }
  }

  // 安全排序方法
  private safeSort(options: CascaderOption[]): void {
    if (!Array.isArray(options)) return;
    
    try {
      options.sort((a, b) => {
        // 确保a和b都是有效对象
        if (!a || !b) return 0;
        
        // 安全获取标签
        let aLabel = '';
        let bLabel = '';
        
        try {
          if (a[this.labelProperty] !== undefined) {
            aLabel = String(a[this.labelProperty]);
          }
        } catch (e) {}
        
        try {
          if (b[this.labelProperty] !== undefined) {
            bLabel = String(b[this.labelProperty]);
          }
        } catch (e) {}
        
        // 精确匹配优先
        const searchValue = this.searchValue || '';
        if (aLabel === searchValue && bLabel !== searchValue) return -1;
        if (aLabel !== searchValue && bLabel === searchValue) return 1;
        
        // 路径长度排序
        const aPathLength = Array.isArray(a.path) ? a.path.length : 0;
        const bPathLength = Array.isArray(b.path) ? b.path.length : 0;
        
        return aPathLength - bPathLength;
      });
    } catch (err) {
      console.error('排序错误:', err);
    }
  }

  // 安全的选项路径获取方法
  getOptionPath(option: CascaderOption | undefined): string {
    if (!option) return '';
    
    try {
      // 对于搜索结果，使用保存的路径
      if (option.path && Array.isArray(option.path)) {
        return option.path
          .map(o => {
            if (!o) return '未知';
            try {
              return o[this.labelProperty] !== undefined ? String(o[this.labelProperty]) : '未知';
            } catch (e) {
              return '未知';
            }
          })
          .join(' / ');
      }
      
      // 对于普通选项，返回标签
      if (option[this.labelProperty] !== undefined) {
        return String(option[this.labelProperty]);
      }
    } catch (err) {
      console.error('获取选项路径时出错:', err);
    }
    
    return '未知';
  }

  onSearchOptionClick(option: CascaderOption): void {
    if (option.disabled) return;
    
    if (!option.path) return;
    
    if (this.isMultiple) {
      const path = option.path;
      const pathKey = this.getPathKey(path);
      const isSelected = this.isOptionSelected(option);
      
      if (!isSelected) {
        // 选中
        this.selectedPathsMap.set(pathKey, path);
        
        // 选中子级
        if (this.hasChildren(option)) {
          this.selectChildren(option, path);
        }
      } else {
        // 取消选中
        this.selectedPathsMap.delete(pathKey);
        
        // 取消选中子级
        if (this.hasChildren(option)) {
          this.deselectChildren(option);
        }
      }
      
      // 更新状态
      this.updateIndeterminateStatus();
      this.updateMultipleValues();
      this.emitValueChange();
    } else {
      // 单选模式
      this.selectedOptions = option.path;
      this.value = option.path.map(opt => this.getOptionValue(opt));
      this.emitValueChange();
      this.closeDropdown();
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    // ESC键关闭下拉
    if (event.key === 'Escape') {
      this.closeDropdown();
      return;
    }
    
    // 处理搜索模式下的键盘导航
    if (this.searchValue && this.filteredOptions.length > 0) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.keyboardNavIndex = Math.min(this.keyboardNavIndex + 1, this.filteredOptions.length - 1);
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          this.keyboardNavIndex = Math.max(this.keyboardNavIndex - 1, 0);
          break;
          
        case 'Enter':
          event.preventDefault();
          if (this.keyboardNavIndex >= 0 && this.keyboardNavIndex < this.filteredOptions.length) {
            this.onSearchOptionClick(this.filteredOptions[this.keyboardNavIndex]);
          } else if (this.filteredOptions.length > 0) {
            this.onSearchOptionClick(this.filteredOptions[0]);
          }
          break;
      }
    }
  }

  onCompositionChange(event: CompositionEvent): void {
    // 处理中文输入法
    if (event.type === 'compositionstart') {
      this.isComposing = true;
    } else if (event.type === 'compositionend') {
      this.isComposing = false;
      
      // 更新搜索框宽度
      if (this.searchText && this.searchInput) {
        const width = Math.max(20, this.searchText.nativeElement.offsetWidth + 10);
        this.renderer.setStyle(this.searchInput.nativeElement, 'width', `${width}px`);
      }
    }
  }

  // 通用工具方法
  getOptionValue(option: CascaderOption | undefined): any {
    if (!option) return undefined;
    
    try {
      return option[this.valueProperty];
    } catch (err) {
      console.error('获取选项值错误:', err);
      return undefined;
    }
  }

  hasChildren(option: CascaderOption | undefined): boolean {
    if (!option) return false;
    
    try {
      // 先根据 isLeaf 判断
      if (option.isLeaf !== undefined) {
        return !option.isLeaf;
      }
      
      // 再根据子节点数组判断
      const children = this.getChildren(option);
      return Array.isArray(children) && children.length > 0;
    } catch (err) {
      console.error('hasChildren错误:', err);
      return false;
    }
  }

  getChildren(option: CascaderOption | undefined): CascaderOption[] {
    if (!option) return [];
    
    try {
      const children = option[this.childrenProperty];
      return Array.isArray(children) ? children : [];
    } catch (err) {
      console.error('getChildren错误:', err);
      return [];
    }
  }

  isLeaf(option: CascaderOption): boolean {
    if (option.isLeaf !== undefined) {
      return option.isLeaf;
    }
    
    return !this.hasChildren(option);
  }

  isOptionSelected(option: CascaderOption): boolean {
    if (!option) return false;
    
    const optionValue = this.getOptionValue(option);
    
    if (this.isMultiple) {
      // 多选模式 - 检查选项是否在任何选中路径中
      for (const path of this.selectedPathsMap.values()) {
        if (path.some(opt => this.getOptionValue(opt) === optionValue)) {
          return true;
        }
      }
      return false;
    } else {
      // 单选模式 - 检查是否在正式选中路径中
      return this.selectedOptions.some(opt => this.getOptionValue(opt) === optionValue);
    }
  }

  isOptionIndeterminate(option: CascaderOption): boolean {
    if (!this.isMultiple) return false;
    
    const optionValue = this.getOptionValue(option);
    return this.indeterminateSet.has(String(optionValue));
  }

  getPathKey(path: CascaderOption[]): string {
    if (!Array.isArray(path) || path.length === 0) return '';
    
    try {
      return path.map(opt => {
        if (!opt) return 'undefined';
        const val = this.getOptionValue(opt);
        return val === undefined ? 'undefined' : String(val);
      }).join('/');
    } catch (err) {
      console.error('获取路径键错误:', err);
      return '';
    }
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  // 清除方法
  clear(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.isMultiple) {
      this.selectedPathsMap.clear();
      this.indeterminateSet.clear();
      this.value = [];
      this.displayTags = [];
    } else {
      this.selectedOptions = [];
      this.value = [];
    }
    
    this.emitValueChange();
  }

  removeItem(event: Event, value: any): void {
    event.stopPropagation();
    
    if (!this.isMultiple) {
      this.clear();
      return;
    }
    
    // 找到对应选项
    const option = this.valueOptionMap.get(String(value));
    if (!option) return;
    
    // 找到包含此选项的所有路径
    for (const [key, path] of Array.from(this.selectedPathsMap.entries())) {
      if (path.some(opt => this.getOptionValue(opt) === value)) {
        this.selectedPathsMap.delete(key);
      }
    }
    
    // 更新状态
    this.updateIndeterminateStatus();
    this.updateMultipleValues();
    this.emitValueChange();
  }

  // 值处理方法
  setValue(value: any[] | any[][], emitChange: boolean = true): void {
    if (this.isMultiple) {
      this.setMultipleValue(value, emitChange);
    } else {
      this.setSingleValue(value, emitChange);
    }
  }

  private setSingleValue(value: any[] | any, emitChange: boolean = true): void {
    if (!value) {
      this.value = [];
      this.selectedOptions = [];
      return;
    }
    
    const valueArray = Array.isArray(value) ? value : [value];
    if (valueArray.length === 0) return;
    
    // 查找完整路径
    const path = this.findOptionPath(valueArray);
    
    if (path.length > 0) {
      this.selectedOptions = path;
      this.value = valueArray;
      
      if (emitChange) {
        this.emitValueChange();
      }
    }
  }

  private setMultipleValue(values: any[] | any[][], emitChange: boolean = true): void {
    this.selectedPathsMap.clear();
    
    if (!values || values.length === 0) {
      this.value = [];
      this.displayTags = [];
      return;
    }
    
    // 处理值格式
    const valueArrays = Array.isArray(values[0]) ? values as any[][] : [values as any[]];
    
    // 为每个值找到路径
    for (const valueArray of valueArrays) {
      const path = this.findOptionPath(valueArray);
      if (path.length > 0) {
        const pathKey = this.getPathKey(path);
        this.selectedPathsMap.set(pathKey, path);
      }
    }
    
    this.updateIndeterminateStatus();
    this.updateMultipleValues();
    
    if (emitChange) {
      this.emitValueChange();
    }
  }

  private findOptionPath(values: any[]): CascaderOption[] {
    if (!values || values.length === 0) return [];
    
    const path: CascaderOption[] = [];
    let currentOptions = this.options;
    
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const option = currentOptions.find(opt => this.getOptionValue(opt) === value);
      
      if (!option) break;
      
      path.push(option);
      
      if (i < values.length - 1) {
        if (!this.hasChildren(option)) break;
        currentOptions = this.getChildren(option);
      }
    }
    
    return path;
  }

  private emitValueChange(): void {
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    
    if (this.isMultiple) {
      this.selectionChange.emit(Array.from(this.selectedPathsMap.values()).flat());
    } else {
      this.selectionChange.emit(this.selectedOptions);
    }
    
    this.cdr.markForCheck();
  }

  // 多选辅助方法
  private selectChildren(option: CascaderOption, parentPath: CascaderOption[]): void {
    const children = this.getChildren(option);
    if (!children || children.length === 0) return;
    
    for (const child of children) {
      if (child.disabled || child.disableCheckbox) continue;
      
      const childPath = [...parentPath, child];
      const childPathKey = this.getPathKey(childPath);
      
      // 添加子节点选择
      this.selectedPathsMap.set(childPathKey, childPath);
      
      // 递归选择子节点
      if (this.hasChildren(child)) {
        this.selectChildren(child, childPath);
      }
    }
  }

  private deselectChildren(option: CascaderOption): void {
    const optionValue = this.getOptionValue(option);
    
    // 删除所有包含此选项的路径
    for (const [key, path] of Array.from(this.selectedPathsMap.entries())) {
      if (path.some(opt => this.getOptionValue(opt) === optionValue)) {
        this.selectedPathsMap.delete(key);
      }
    }
  }

  private updateIndeterminateStatus(): void {
    this.indeterminateSet.clear();
    
    if (!this.isMultiple) return;
    
    // 记录每个节点的选中状态
    const nodeStatus: Map<string, {selected: number, total: number}> = new Map();
    
    // 根据当前选中路径更新节点状态
    for (const path of this.selectedPathsMap.values()) {
      // 对路径中的每个节点进行处理
      for (let i = 0; i < path.length; i++) {
        const node = path[i];
        const nodeValue = String(this.getOptionValue(node));
        
        // 叶子节点或路径中的最后一个节点
        if (i === path.length - 1 || this.isLeaf(node)) {
          nodeStatus.set(nodeValue, {selected: 1, total: 1});
        } 
        // 中间节点，需要汇总子节点状态
        else {
          if (!nodeStatus.has(nodeValue)) {
            nodeStatus.set(nodeValue, {selected: 0, total: 0});
          }
        }
      }
    }
    
    // 计算所有节点的状态
    const calculateNodeStatus = (options: CascaderOption[]): void => {
      if (!options || !options.length) return;
      
      for (const option of options) {
        if (option.disabled) continue;
        
        const value = String(this.getOptionValue(option));
        
        // 如果有子节点，计算子节点状态
        if (this.hasChildren(option)) {
          calculateNodeStatus(this.getChildren(option));
          
          // 汇总子节点状态
          let selectedCount = 0;
          let totalCount = 0;
          
          for (const child of this.getChildren(option)) {
            if (child.disabled) continue;
            
            const childValue = String(this.getOptionValue(child));
            const status = nodeStatus.get(childValue);
            
            if (status) {
              selectedCount += status.selected;
              totalCount += status.total;
            } else {
              totalCount += 1; // 未选中的子节点
            }
          }
          
          // 更新当前节点状态
          nodeStatus.set(value, {selected: selectedCount, total: totalCount});
          
          // 部分选中时设置半选状态
          if (selectedCount > 0 && selectedCount < totalCount) {
            this.indeterminateSet.add(value);
          }
        }
      }
    };
    
    // 从根节点开始计算
    calculateNodeStatus(this.options);
  }

  private updateMultipleValues(): void {
    // 转换选中路径为值数组
    this.value = Array.from(this.selectedPathsMap.values()).map(
      path => path.map(opt => this.getOptionValue(opt))
    );
    
    // 更新显示标签
    this.updateDisplayTags();
  }

  private updateDisplayTags(): void {
    if (!this.isMultiple || this.selectedPathsMap.size === 0) {
      this.displayTags = [];
      return;
    }
    
    const tags: { label: string, value: any, option: CascaderOption }[] = [];
    
    // 使用Map存储路径信息，键为路径字符串
    const pathMap = new Map<string, {
      path: CascaderOption[], 
      isParentOfOtherSelected: boolean
    }>();
    
    // 第一步：收集所有路径信息
    for (const path of this.selectedPathsMap.values()) {
      if (!path.length) continue;
      
      const pathKey = this.getPathKey(path);
      pathMap.set(pathKey, {
        path,
        isParentOfOtherSelected: false
      });
    }
    
    // 第二步：标记哪些路径是其他选中路径的父路径
    for (const [pathKey, info] of pathMap.entries()) {
      // 检查此路径是否是其他路径的父路径
      for (const [otherKey, otherInfo] of pathMap.entries()) {
        if (pathKey === otherKey) continue;
        
        // 判断当前路径是否是其他路径的父路径
        const isParent = this.isPathParentOf(info.path, otherInfo.path);
        if (isParent) {
          info.isParentOfOtherSelected = true;
          break;
        }
      }
    }
    
    // 第三步：只显示父级标签（不是其他选中路径父级的路径）
    for (const info of pathMap.values()) {
      if (!info.isParentOfOtherSelected) {
        const path = info.path;
        const lastOption = path[path.length - 1];
        const optionValue = this.getOptionValue(lastOption);
        
        // 对于叶子节点或者不是其他选中项的父节点的选项，显示完整路径
        const pathLabels = path.map(opt => {
          try {
            return opt[this.labelProperty] !== undefined ? String(opt[this.labelProperty]) : '未知';
          } catch (e) {
            return '未知';
          }
        }).join(' / ');
        
        tags.push({
          label: pathLabels,
          value: optionValue,
          option: lastOption
        });
      }
    }
    
    this.displayTags = tags;
  }

  // 判断一个路径是否是另一个路径的父路径
  private isPathParentOf(parentPath: CascaderOption[], childPath: CascaderOption[]): boolean {
    if (parentPath.length >= childPath.length) return false;
    
    // 检查父路径是否是子路径的前缀
    for (let i = 0; i < parentPath.length; i++) {
      if (this.getOptionValue(parentPath[i]) !== this.getOptionValue(childPath[i])) {
        return false;
      }
    }
    
    return true;
  }

  // 选中所有子选项
  private selectAllChildren(option: CascaderOption, parentPath: CascaderOption[]): void {
    if (!this.hasChildren(option)) return;
    
    const children = this.getChildren(option);
    if (!children || !children.length) return;
    
    for (const child of children) {
      if (child.disabled || child.disableCheckbox) continue;
      
      const childPath = [...parentPath, child];
      const childPathKey = this.getPathKey(childPath);
      
      // 添加子选项路径
      this.selectedPathsMap.set(childPathKey, childPath);
      
      // 递归处理子选项的子选项
      if (this.hasChildren(child)) {
        this.selectAllChildren(child, childPath);
      }
    }
  }

  // 取消选中所有子选项
  private deselectAllChildren(option: CascaderOption): void {
    const optionValue = this.getOptionValue(option);
    
    // 找到并删除所有包含此选项的路径
    for (const [key, path] of Array.from(this.selectedPathsMap.entries())) {
      if (path.some(opt => this.getOptionValue(opt) === optionValue)) {
        this.selectedPathsMap.delete(key);
      }
    }
  }

  // 辅助方法：检查选项是否有被选中的后代节点
  private hasSelectedDescendants(option: CascaderOption): boolean {
    if (!this.hasChildren(option)) return false;
    
    const checkChildren = (children: CascaderOption[]): boolean => {
      for (const child of children) {
        // 如果子节点被选中
        if (this.isOptionSelected(child)) {
          return true;
        }
        
        // 递归检查子节点的子节点
        if (this.hasChildren(child) && checkChildren(this.getChildren(child))) {
          return true;
        }
      }
      return false;
    };
    
    return checkChildren(this.getChildren(option));
  }
  
  // 键盘导航支持
  navigateOptions(direction: 'up' | 'down' | 'left' | 'right' | 'enter'): void {
    if (!this.isDropdownOpen || this.searchValue) return;
    
    if (direction === 'enter') {
      // 选择当前激活选项
      if (this.activatedOptions.length > 0) {
        const activeOption = this.activatedOptions[this.activatedOptions.length - 1];
        const columnIndex = this.activatedOptions.length - 1;
        
        if (this.isMultiple) {
          this.toggleMultipleSelection(activeOption);
        } else {
          this.selectSingleOption(activeOption, columnIndex);
        }
      }
      return;
    }
    
    // 当前激活的列
    const activeColumnIndex = this.activatedOptions.length - 1 >= 0 ? 
                             this.activatedOptions.length - 1 : 0;
    
    // 当前列中激活的选项索引
    let activeOptionIndex = -1;
    if (activeColumnIndex >= 0 && activeColumnIndex < this.columns.length) {
      const column = this.columns[activeColumnIndex];
      const activeOption = this.activatedOptions[activeColumnIndex];
      activeOptionIndex = column.findIndex(opt => opt === activeOption);
    }
    
    switch (direction) {
      case 'up':
        if (activeOptionIndex > 0) {
          // 向上移动选择当前列的上一个选项
          const column = this.columns[activeColumnIndex];
          let nextIndex = activeOptionIndex - 1;
          
          // 跳过禁用选项
          while (nextIndex >= 0 && column[nextIndex].disabled) {
            nextIndex--;
          }
          
          if (nextIndex >= 0) {
            this.activateOption(column[nextIndex], activeColumnIndex);
          }
        }
        break;
        
      case 'down':
        if (activeColumnIndex < this.columns.length) {
          const column = this.columns[activeColumnIndex];
          let nextIndex = activeOptionIndex + 1;
          
          // 如果没有激活的选项，选择第一个
          if (activeOptionIndex === -1) {
            nextIndex = 0;
          }
          
          // 跳过禁用选项
          while (nextIndex < column.length && column[nextIndex].disabled) {
            nextIndex++;
          }
          
          if (nextIndex < column.length) {
            this.activateOption(column[nextIndex], activeColumnIndex);
          }
        }
        break;
        
      case 'left':
        // 向左移动到上一列的已激活选项
        if (activeColumnIndex > 0) {
          this.activatedOptions.pop();
          this.columns.pop();
          this.updateDropdownPosition();
          this.cdr.markForCheck();
        }
        break;
        
      case 'right':
        // 向右移动展开当前激活选项的子级
        if (activeColumnIndex >= 0 && activeColumnIndex < this.activatedOptions.length) {
          const activeOption = this.activatedOptions[activeColumnIndex];
          
          if (this.hasChildren(activeOption)) {
            const children = this.getChildren(activeOption);
            
            // 选择第一个非禁用子选项
            for (let i = 0; i < children.length; i++) {
              if (!children[i].disabled) {
                this.activateOption(children[i], activeColumnIndex + 1);
                break;
              }
            }
          }
        }
        break;
    }
  }
  
  // 键盘事件处理增强
  enhancedKeyboardHandler(event: KeyboardEvent): void {
    if (!this.isDropdownOpen) return;
    
    // 如果正在搜索，使用搜索模式的键盘处理
    if (this.searchValue) {
      this.handleKeydown(event);
      return;
    }
    
    // 导航键盘处理
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.navigateOptions('up');
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        this.navigateOptions('down');
        break;
        
      case 'ArrowLeft':
        event.preventDefault();
        this.navigateOptions('left');
        break;
        
      case 'ArrowRight':
        event.preventDefault();
        this.navigateOptions('right');
        break;
        
      case 'Enter':
        event.preventDefault();
        this.navigateOptions('enter');
        break;
        
      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;
        
      case 'Tab':
        this.closeDropdown();
        break;
    }
  }
  
  // 处理动态加载数据
  loadData(option: CascaderOption, columnIndex: number): void {
    if (!option) return;
    
    // 没有children但不是叶子节点，且未加载中
    if (option.isLeaf === false && !this.hasChildren(option) && !option.loading) {
      // 标记为加载中
      option.loading = true;
      this.cdr.detectChanges();
      
      // 触发加载事件，由外部处理数据加载
      if (typeof this['loadData'] === 'function') {
        const loadFn = this['loadData'] as (option: CascaderOption, index: number) => Promise<CascaderOption[]>;
        
        loadFn(option, columnIndex)
          .then(children => {
            // 更新选项的子节点
            option.loading = false;
            option[this.childrenProperty] = children || [];
            
            // 如果该选项仍然被激活，更新列显示
            if (this.activatedOptions[columnIndex] === option) {
              // 确保添加新列，而不是替换
              if (this.columns.length <= columnIndex + 1) {
                this.columns.push(children || []);
              } else {
                this.columns[columnIndex + 1] = children || [];
              }
              
              // 更新位置和强制刷新UI
              this.updateDropdownPosition();
            }
            
            this.cdr.detectChanges();
          })
          .catch(error => {
            console.error('Failed to load cascader options:', error);
            option.loading = false;
            this.cdr.detectChanges();
          });
      }
    }
  }
  
  // 公共暴露方法
  /**
   * 聚焦级联选择器
   */
  focus(): void {
    if (this.disabled) return;
    
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    } else {
      this.elementRef.nativeElement.focus();
    }
  }
  
  /**
   * 失焦级联选择器
   */
  blur(): void {
    if (this.searchInput) {
      this.searchInput.nativeElement.blur();
    } else {
      this.elementRef.nativeElement.blur();
    }
  }
  
  /**
   * 获取当前选择的完整值
   */
  getSelections(): any {
    if (this.isMultiple) {
      return {
        values: this.value,
        options: Array.from(this.selectedPathsMap.values())
      };
    } else {
      return {
        value: this.value,
        options: this.selectedOptions
      };
    }
  }

  // 添加 TrackBy 方法以优化渲染性能
  trackByColumn(index: number, column: CascaderOption[]): any {
    return index;
  }

  trackByOption(index: number, option: CascaderOption): any {
    return  index;
  }

  // 新增异步加载子节点方法
  loadChildrenAsync(option: CascaderOption, columnIndex: number): void {
    // 标记为加载中
    option.loading = true;
    this.cdr.detectChanges();
    
    if (typeof this['loadData'] === 'function') {
      const loadFn = this['loadData'] as (option: CascaderOption, index: number) => Promise<CascaderOption[]>;
      
      loadFn(option, columnIndex)
        .then(children => {
          // 更新选项
          option.loading = false;
          option[this.childrenProperty] = children || [];
          
          // 如果该选项仍然被激活，更新列
          if (this.activatedOptions[columnIndex] === option) {
            // 添加子列
            if (this.columns.length <= columnIndex + 1) {
              this.columns.push(children || []);
            } else {
              this.columns[columnIndex + 1] = children || [];
            }
            
            // 刷新UI
            this.cdr.detectChanges();
            this.safeUpdatePosition();
          }
        })
        .catch(error => {
          console.error('加载子节点失败:', error);
          option.loading = false;
          this.cdr.detectChanges();
        });
    } else {
      // 没有配置加载函数时
      setTimeout(() => {
        option.loading = false;
        this.cdr.detectChanges();
      }, 500);
    }
  }

  // 新增安全的位置更新方法
  private safeUpdatePosition(): void {
    if (!this.overlayRef || !this.isDropdownOpen) return;
    
    try {
      // 计算所需的宽度
      const minWidth = this.overlayOrigin.elementRef.nativeElement.offsetWidth;
      const calculatedWidth = Math.max(minWidth, this.columns.length * this.menuWidth);
      
      // 设置宽度
      const element = this.overlayRef.overlayElement;
      if (element) {
        this.renderer.setStyle(element, 'width', `${calculatedWidth}px`);
      }
      
      // 更新位置
      this.overlayRef.updatePosition();
    } catch (error) {
      console.error('更新浮层位置时出错:', error);
    }
  }

  // 新增：确认选择方法
  confirmSelection(): void {
    if (!this.tempSelectedOptions.length) return;
    
    // 更新正式选中状态
    this.selectedOptions = [...this.tempSelectedOptions];
    this.value = this.selectedOptions.map(opt => this.getOptionValue(opt));
    
    // 触发事件
    this.emitValueChange();
  }

  // 新增：临时选中状态判断
  isOptionTempSelected(option: CascaderOption, columnIndex: number): boolean {
    if (!option) return false;
    
    // 检查选项是否在临时选中路径中的对应位置
    return columnIndex < this.tempSelectedOptions.length && 
           this.tempSelectedOptions[columnIndex] === option;
  }

  // 新增辅助方法：安全地构建选项路径
  private buildOptionPath(option: CascaderOption): CascaderOption[] {
    if (!option) return [];
    
    try {
      // 使用父映射表
      const path: CascaderOption[] = [option];
      let parent = this.optionParentMap.get(option);
      
      while (parent) {
        path.unshift(parent);
        parent = this.optionParentMap.get(parent);
      }
      
      return path;
    } catch (err) {
      console.error('构建路径错误:', err);
      return [option]; // 至少返回选项本身
    }
  }

  // 增加一个方法来检查一个路径是否是另一个路径的子路径
  private isSubPath(subPath: string, parentPath: string): boolean {
    const subParts = subPath.split('/');
    const parentParts = parentPath.split('/');
    
    if (subParts.length <= parentParts.length) {
      return false;
    }
    
    for (let i = 0; i < parentParts.length; i++) {
      if (parentParts[i] !== subParts[i]) {
        return false;
      }
    }
    
    return true;
  }
}