import { ComponentRef, Directive, ElementRef, EventEmitter, HostListener, Input, Output, SimpleChanges, TemplateRef } from '@angular/core';
import { OverlayBasicDirective, OverlayBasicPosition, OverlayBasicPositionConfigs, OverlayBasicTrigger } from '../overlay/overlay-basic.directive';
import { OverlayRef, Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { PopoverComponent } from '@project';
import _ from 'lodash';
import { OverlayService } from '../service/overlay.service';
import { ButtonType, ButtonColor } from '../button/button.component.interface';

@Directive({
  selector: '[libPopconfirm]'
})
export class PopconfirmDirective implements OverlayBasicDirective {
  /** 提示内容 */
  @Input('popconfirmContent') popconfirmContent: string | TemplateRef<any> = '';
  /** 提示标题 */
  @Input('popconfirmTitle') popconfirmTitle: string | TemplateRef<any> = '';
  /** 提示位置 */
  @Input('popconfirmPlacement') placement: OverlayBasicPosition = 'top';
  /** 提示是否显示 */
  @Input('popconfirmVisible') visible: boolean = false;
  /** 确认按钮类型 */
  @Input('popconfirmConfirmButtonType') confirmButtonType: ButtonType = 'default';
  /** 确认按钮颜色 */
  @Input('popconfirmConfirmButtonColor') confirmButtonColor: ButtonColor = 'primary';
  /** 确认按钮内容 */
  @Input('popconfirmConfirmButtonContent') confirmButtonContent: string | TemplateRef<void> = '确认';
  /** 取消按钮类型 */
  @Input('popconfirmCancelButtonType') cancelButtonType: ButtonType = 'default';
  /** 取消按钮颜色 */
  @Input('popconfirmCancelButtonColor') cancelButtonColor: ButtonColor = 'ghost';
  /** 取消按钮内容 */
  @Input('popconfirmCancelButtonContent') cancelButtonContent: string | TemplateRef<void> = '取消';
  /** 底部模板 */
  @Input('popconfirmBottomTemplate') bottomTemplate: null | TemplateRef<void> = null;
  /** 确认函数 */
  @Output('popconfirmOnConfirm') onConfirm: EventEmitter<void> = new EventEmitter<void>();
  /** 取消函数 */
  @Output('popconfirmOnCancel') onCancel: EventEmitter<void> = new EventEmitter<void>();

  private overlayRef: OverlayRef | null = null;
  private enterTimer: any;
  private leaveTimer: any;
  private portal: ComponentPortal<PopoverComponent> | null = null;
  private popconfirmComponent: PopoverComponent | null = null;
  private popconfirmComponentRef: ComponentRef<PopoverComponent> | null = null;

  constructor(
    private elementRef: ElementRef,
    private overlayService: OverlayService,
    public overlay: Overlay,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tooltipContent']) {
    }
    if (changes['visible']) {
      if (this.visible) {
        this.show();
      } else {
        this.hide();
      }
    }
  }


  ngOnInit(): void {
    // 初始化时如果visible为true，则显示tooltip
    if (this.visible) {
      this.show();
    }
  }

  ngOnDestroy(): void {
    this.closePopover();
    clearTimeout(this.enterTimer);
    clearTimeout(this.leaveTimer);
  }

  @HostListener('click')
  onClick(): void {
    this.visible ? this.hide() : this.show();
  }

  /**
   * 显示
   */
  public show(): void {
    if (this.visible) return;
    this.visible = true;
    this.closePopover();
    const positions = this.overlayService.getPositions(this.placement);
    // 创建overlay
    this.overlayRef = this.overlayService.createOverlay(
      {
        positionStrategy: this.overlay.position().flexibleConnectedTo(this.elementRef).withPositions(positions).withPush(false).withGrowAfterOpen(true).withLockedPosition(false)
      },
      this.elementRef,
      positions,
      (ref) => this.closePopover(),
      (position, isBackupUsed) => {
        if (isBackupUsed) {
          for (const key in OverlayBasicPositionConfigs) {
            if (_.isEqual(OverlayBasicPositionConfigs[key], position)) {
              this.popconfirmComponent!.placement = key as OverlayBasicPosition;
              this.popconfirmComponent?.getMargin();
              this.popconfirmComponent!.cdr.detectChanges();
              break;
            }
          }
        }
        // 根据使用的位置进行UI调整
      }
    );

    // 创建并附加组件
    this.portal = new ComponentPortal(PopoverComponent);
    const componentRef = this.overlayRef.attach(this.portal);

    componentRef.setInput('title', this.popconfirmTitle);
    componentRef.setInput('content', this.popconfirmContent);
    componentRef.setInput('placement', this.placement);
    componentRef.setInput('confirm', true);
    componentRef.setInput('confirmButtonType', this.confirmButtonType);
    componentRef.setInput('confirmButtonColor', this.confirmButtonColor);
    componentRef.setInput('confirmButtonContent', this.confirmButtonContent);
    componentRef.setInput('cancelButtonType', this.cancelButtonType);
    componentRef.setInput('cancelButtonColor', this.cancelButtonColor);
    componentRef.setInput('cancelButtonContent', this.cancelButtonContent);
    componentRef.setInput('bottomTemplate', this.bottomTemplate);
    componentRef.instance.onConfirm.subscribe(() => {
      this.onConfirm.emit();
      this.hide();
    });
    componentRef.instance.onCancel.subscribe(() => {
      this.onCancel.emit();
      this.hide();
    });

    // 设置tooltip内容和位置
    this.popconfirmComponent = componentRef.instance;
    this.popconfirmComponentRef = componentRef;

    // 设置CSS类以添加动画效果
    setTimeout(() => {
      if (componentRef.instance) {
        componentRef.instance.isVisible = true;
      }
    }, 10);
  }

  /**
   * 隐藏
   */
  public hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.closePopover();
  }

  /**
   * 更新位置
   */
  public updatePosition(): void {
    if (this.overlayRef) {
      this.overlayRef.updatePosition();
    }
  }

  /**
   * 更新内容
   * @param content 
   */
  public updateContent(content: string | TemplateRef<any>): void {
    if (this.popconfirmComponent) {
      this.popconfirmComponent.content = content;
    }
  }

  /**
   * 关闭
   */
  private closePopover(): void {
    if (this.overlayRef) {
      this.visible = false;
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

}
