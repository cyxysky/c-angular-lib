import { ChangeDetectorRef, Component, EventEmitter, Input, Output, TemplateRef, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { OverlayBasicPosition } from '../overlay/overlay-basic.directive';
import { CommonModule } from '@angular/common';
import { ButtonType, ButtonColor } from '../button/button.component.interface';
import { ButtonComponent } from '../button/button.component';
@Component({
  selector: 'lib-popover',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './popover.component.html',
  styleUrl: './popover.component.less',
  host: {
    '[style]': 'getMargin()'
  }
})
export class PopoverComponent implements AfterViewInit {
  /** 标题 */
  @Input('title') title: string | TemplateRef<any> = '';
  /** 内容 */
  @Input('content') content: string | TemplateRef<any> = '';
  /** 位置 */
  @Input('placement') placement: OverlayBasicPosition = 'left';
  /** 是否显示 */
  @Input('isVisible') isVisible: boolean = false;
  /** 确认 */
  @Input('confirm') confirm: boolean = false;
  /** 确认按钮类型 */
  @Input('confirmButtonType') confirmButtonType: ButtonType = 'default';
  /** 确认按钮颜色 */
  @Input('confirmButtonColor') confirmButtonColor: ButtonColor = 'primary';
  /** 确认按钮内容 */
  @Input('confirmButtonContent') confirmButtonContent: string | TemplateRef<void> = '';
  /** 取消按钮类型 */
  @Input('cancelButtonType') cancelButtonType: ButtonType = 'default';
  /** 取消按钮颜色 */
  @Input('cancelButtonColor') cancelButtonColor: ButtonColor = 'primary';
  /** 取消按钮内容 */
  @Input('cancelButtonContent') cancelButtonContent: string | TemplateRef<void> = '';
  /** 底部模板 */
  @Input('bottomTemplate') bottomTemplate: null | TemplateRef<void> = null;
  /** 确认 */
  @Output('onConfirm') onConfirm: EventEmitter<void> = new EventEmitter<void>();
  /** 取消 */
  @Output('onCancel') onCancel: EventEmitter<void> = new EventEmitter<void>();
  constructor(public cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
  }

  ngOnChanges(changes: any): void {
  }

  isTemplateRef(value: any): value is TemplateRef<any> {
    return value instanceof TemplateRef;
  }

  getMargin(): string {
    this.cdr.detectChanges();
    switch (this.placement) {
      case 'top':
      case 'bottom':
      case 'top-left':
      case 'top-right':
      case 'bottom-left':
      case 'bottom-right':
        return 'margin: 12px 0';
      
      case 'left':
      case 'right':
      case 'left-top':
      case 'left-bottom':
      case 'right-top':
      case 'right-bottom':
        return 'margin: 0 12px';
      
      default:
        return 'margin: 0';
    }
  }

  onConfirmClick(): void {
    this.onConfirm.emit();
  }

  onCancelClick(): void {
    this.onCancel.emit();
  }
  
  
}
