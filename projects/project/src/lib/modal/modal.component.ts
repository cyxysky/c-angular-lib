import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, Renderer2, ChangeDetectorRef, TemplateRef, Type, HostListener, OnDestroy, SimpleChanges, ComponentRef, ChangeDetectionStrategy, ViewContainerRef, booleanAttribute } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { maskAnimation, modalAnimation } from '../core/animation';
import { UtilsService } from '../core/utils/utils.service';

@Component({
  selector: 'lib-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.less',
  animations: [
    modalAnimation, maskAnimation
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild(NgComponentOutlet, { static: false }) componentsRef!: NgComponentOutlet;
  @Input({ alias: 'modalVisible', transform: booleanAttribute }) visible: boolean = false;
  @Input({ alias: 'modalWidth' }) width: string | number = '520px';
  @Input({ alias: 'modalHeight' }) height: string | number = 'auto';
  @Input({ alias: 'modalZIndex' }) zIndex: number = 1000;
  @Input({ alias: 'modalClosable', transform: booleanAttribute }) closable: boolean = true;
  @Input({ alias: 'modalTop' }) top: string = '100px';
  @Input({ alias: 'modalCentered', transform: booleanAttribute }) centered: boolean = false;
  @Input({ alias: 'modalMaskClosable', transform: booleanAttribute }) maskClosable: boolean = true;
  @Input({ alias: 'modalHeaderContent' }) headerContent: TemplateRef<any> | null = null;
  @Input({ alias: 'modalBodyContent' }) bodyContent: TemplateRef<any> | null = null;
  @Input({ alias: 'modalFooterContent' }) footerContent: TemplateRef<any> | null = null;
  @Input({ alias: 'modalComponentContent' }) componentContent: Type<any> | null = null;
  @Input({ alias: 'modalComponentInputs' }) componentInputs: any = null;
  @Input({ alias: 'modalComponentOutputs' }) componentOutputs: any = null;
  @Input({ alias: 'modalContentContext' }) contentContext: any = null;
  @Input({ alias: 'modalDrag', transform: booleanAttribute }) drag: boolean = false;

  @Output('modalVisibleChange') visibleChange = new EventEmitter<boolean>();
  @Output('modalAfterOpen') afterOpen = new EventEmitter<void>();
  @Output('modalAfterClose') afterClose = new EventEmitter<void>();

  @ViewChild('modalContent') modalContentRef!: ElementRef;
  @ViewChild('modalBody') modalBodyRef!: ElementRef;
  @ViewChild('modalHeader') modalHeaderRef!: ElementRef;

  isDragging: boolean = false;
  dragStartX: number = 0;
  dragStartY: number = 0;
  transformX: number = 0;
  transformY: number = 0;
  initialTransformX: number = 0;
  initialTransformY: number = 0;
  isVisible: boolean = false;

  constructor(
    public cdr: ChangeDetectorRef,
    private utilsService: UtilsService
  ) { }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    // 初始化组件
    let timer = setInterval(() => {
      if (this.componentsRef) {
        this.initComponents();
        clearInterval(timer);
      }
    }, 50);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      if (this.visible) {
        this.isVisible = this.visible;
      } else {
        this.close();
      }
    }
    if (this.visible) {
      if (this.drag) {
        this.resetDragPosition();
      }
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    // 清理工作
  }

  /**
   * 关闭模态框
   */
  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cdr.detectChanges();
    this.utilsService.delayExecution(() => {
      this.closeModal();
      this.cdr.detectChanges();
    }, 150);
  }

  /**
   * 关闭模态框
   */
  public closeModal(): void {
    this.isVisible = false;
    this.afterClose.emit();
    this.cdr.detectChanges();
  }

  /**
   * 点击背景关闭
   */
  maskClick(): void {
    if (this.maskClosable) {
      this.close();
    }
  }

  /**
   * 初始化组件
   */
  initComponents(): void {
    if (this.componentContent && this.componentOutputs && this.componentsRef) {
      for (const key in this.componentOutputs) {
        if (this.componentsRef.componentInstance && this.componentsRef.componentInstance[key]) {
          this.componentsRef.componentInstance[key].subscribe((result: any) => {
            this.componentOutputs[key](result);
          });
        }
      }
    }
  }

  /**
   * 动画结束
   * @param event 动画事件
   */
  animationDone(event: any): void {
    if (event.toState === 'visible') {
      this.afterOpen.emit();
    }
    this.cdr.detectChanges();
  }

  /**
   * 获取字符串
   * @param value 值
   * @returns 字符串
   */
  getString(value: any): string {
    return this.utilsService.getString(value);
  }

  /**
   * 拖拽开始
   * @param event 鼠标事件
   */
  onDragStart(event: MouseEvent): void {
    if (this.drag) {
      this.isDragging = true;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      event.preventDefault();
      this.cdr.detectChanges();
    }
  }

  /**
   * 拖拽移动
   * @param event 鼠标事件
   */
  @HostListener('document:mousemove', ['$event'])
  onDragMove(event: MouseEvent): void {
    if (this.isDragging && this.drag) {
      const deltaX = event.clientX - this.dragStartX;
      const deltaY = event.clientY - this.dragStartY;
      this.transformX = this.transformX + deltaX;
      this.transformY = this.transformY + deltaY;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      this.cdr.detectChanges();
    }
  }

  /**
   * 拖拽结束
   */
  @HostListener('document:mouseup')
  onDragEnd(): void {
    this.isDragging = false;
    this.cdr.detectChanges();
  }

  /**
   * 重置拖拽位置
   */
  resetDragPosition(): void {
    this.transformX = 0;
    this.transformY = 0;
    this.initialTransformX = 0;
    this.initialTransformY = 0;
    this.cdr.detectChanges();
  }
}
