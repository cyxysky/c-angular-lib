import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnDestroy,
  TemplateRef,
  SimpleChanges,
  OnChanges, 
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewContainerRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationEvent } from '@angular/animations';
import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';
import { drawerAnimations } from './drawer.animations';
import { DrawerOptions } from './drawer.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'lib-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.less',
  animations: [drawerAnimations.drawerMotion, drawerAnimations.maskMotion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.lib-drawer-open]': 'visible',
    '[style.zIndex]': 'zIndex'
  }
})
export class DrawerComponent implements OnInit, OnChanges, OnDestroy {
  // 输入属性
  /** 抽屉是否可见 */
  @Input() visible: boolean = false;
  /** 抽屉标题 */
  @Input() title: string | TemplateRef<{ $implicit: any }> = '';
  /** 抽屉内容 */
  @Input() content: string | TemplateRef<{ $implicit: any }> = '';
  /** 自定义数据，传递给内容模板 */
  @Input() data: any = null;
  /** 抽屉宽度 */
  @Input() width: string = '256px';
  /** 抽屉高度 */
  @Input() height: string = '100%';
  @Input() top: number = 0;
  @Input() left: number = 0;
  /** 抽屉位置，从哪个方向滑出 */
  @Input() placement: 'left' | 'right' | 'top' | 'bottom' = 'right';
  /** 是否显示遮罩 */
  @Input() mask: boolean = true;
  /** 点击遮罩是否允许关闭 */
  @Input() maskClosable: boolean = true;
  /** 是否显示关闭按钮 */
  @Input() closable: boolean = true;
  /** 抽屉层级 */
  @Input() zIndex: number = 1000;
  
  // 输出事件
  /** 关闭抽屉事件 */
  @Output() visibleChange = new EventEmitter<boolean>();
  /** 抽屉打开后的事件 */
  @Output() afterOpen = new EventEmitter<void>();
  /** 抽屉关闭后的事件 */
  @Output() afterClose = new EventEmitter<void>();

  // 内部状态
  /** 当前内容上下文 */
  contentContext: any = {};
  /** 动画状态 */
  animationState: string = '';
  /** 遮罩是否可见 */
  maskVisible: boolean = false;
  /** 抽屉是否实际可见（用于控制DOM节点） */
  isVisible: boolean = false;
  /** 抽屉自定义类映射 */
  drawerClassMap: { [key: string]: boolean } = {};
  /** 抽屉变换样式 */
  transformStyle: string = '';
  /** 用于取消订阅 */
  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.updateContentContext();
    this.updateClassMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { visible, placement, data } = changes;
    if (visible) {
      this.handleVisibleChange(this.visible);
    }
    if (placement) {
      this.updateClassMap();
      this.updateAnimationState();
    }
    if (data) {
      this.updateContentContext();
    }
  }

  ngOnDestroy(): void {
    // 发出销毁信号并完成subject
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 处理可见性变化
   */
  public handleVisibleChange(visible: boolean): void {
    if (visible) {
      this.isVisible = true;
      this.maskVisible = this.mask;
      this.updateAnimationState();
    } else {
      this.updateAnimationState();
      this.maskVisible = false;
    }
    
    this.cdr.markForCheck();
  }
  
  /**
   * 根据位置更新动画状态
   */
  private updateAnimationState(): void {
    this.animationState = this.visible ? `enter-from-${this.placement}` : 'void';
    this.cdr.markForCheck();
  }

  /**
   * 更新内容上下文
   */
  private updateContentContext(): void {
    this.contentContext = {
      $implicit: this.data,
      close: () => this.close()
    };
  }

  /**
   * 更新样式类映射
   */
  private updateClassMap(): void {
    this.drawerClassMap = {
      [`lib-drawer-${this.placement}`]: true
    };
  }
  
  /**
   * 关闭抽屉
   */
  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.afterClose.emit();
    this.updateAnimationState();
  }

  /**
   * 动画完成回调
   */
  animationDone(event: AnimationEvent): void {
    if (event.toState === 'void') {
      this.isVisible = false;
    } else if (event.toState.includes('enter-from-')) {
      this.afterOpen.emit();
    }
    this.cdr.markForCheck();
  }

  /**
   * 判断值是否为模板引用
   */
  isTemplateRef(value: any): value is TemplateRef<any> {
    return value instanceof TemplateRef;
  }
}
