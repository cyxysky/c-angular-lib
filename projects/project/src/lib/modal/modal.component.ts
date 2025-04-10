import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, Renderer2, ChangeDetectorRef, TemplateRef, Type, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'lib-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.less',
  animations: [
    trigger('modalAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'scale(0.7)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'scale(1)'
      })),
      transition('void => visible', animate('150ms cubic-bezier(0, 0, 0.2, 1)')),
      transition('visible => void', animate('100ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ])
  ]
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  @Input() visible: boolean = false;
  @Input() width: string | number = '520px';
  @Input() height: string | number = 'auto';
  @Input() zIndex: number = 1000;
  @Input() closable: boolean = true;
  @Input() centered: boolean = false;
  @Input() maskClosable: boolean = true;
  @Input() isServiceMode: boolean = false;
  @Input() headerContent: TemplateRef<any> | null = null;
  @Input() bodyContent: TemplateRef<any> | null = null;
  @Input() footerContent: TemplateRef<any> | null = null;
  @Input() contentContext: any = null;
  @Input() drag: boolean = false;
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() afterOpen = new EventEmitter<void>();
  @Output() afterClose = new EventEmitter<void>();
  
  @ViewChild('modalContent') modalContentRef!: ElementRef;
  @ViewChild('modalBody') modalBodyRef!: ElementRef;
  @ViewChild('modalHeader') modalHeaderRef!: ElementRef;
  
  animationState: 'void' | 'visible' = 'void';
  
  isDragging: boolean = false;
  dragStartX: number = 0;
  dragStartY: number = 0;
  transformX: number = 0;
  transformY: number = 0;
  initialTransformX: number = 0;
  initialTransformY: number = 0;
  
  constructor(private renderer: Renderer2, private cd: ChangeDetectorRef) {}
  
  ngAfterViewInit(): void {
    this.updateAnimationState();
    this.cd.detectChanges();
  }
  
  ngOnChanges(): void {
    this.updateAnimationState();
    if (this.visible) {
      setTimeout(() => this.afterOpen.emit(), 0);
      if (this.drag) {
        this.resetDragPosition();
      }
    }
  }
  
  ngOnDestroy(): void {
    // 清理工作
  }
  
  updateAnimationState(): void {
    this.animationState = this.visible ? 'visible' : 'void';
  }
  
  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.afterClose.emit();
  }
  
  maskClick(): void {
    if (this.maskClosable) {
      this.close();
    }
  }
  
  animationDone(event: any): void {
    if (event.toState === 'visible') {
      this.afterOpen.emit();
    } else if (event.toState === 'void') {
      this.afterClose.emit();
    }
  }
  
  getModalStyle(): object {
    const style: any = {
      width: typeof this.width === 'number' ? `${this.width}px` : this.width,
      height: typeof this.height === 'number' ? `${this.height}px` : this.height,
      zIndex: this.zIndex
    };
    
    if (this.centered) {
      style.marginTop = 'auto';
      style.marginBottom = 'auto';
    } else {
      style.marginTop = '100px';
    }

    if (this.drag) {
      style.transform = `translate(${this.transformX}px, ${this.transformY}px)`;
    }
    
    return style;
  }
  
  onDragStart(event: MouseEvent): void {
    if (this.drag) {
      this.isDragging = true;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      event.preventDefault();
    }
  }
  
  @HostListener('document:mousemove', ['$event'])
  onDragMove(event: MouseEvent): void {
    if (this.isDragging && this.drag) {
      const deltaX = event.clientX - this.dragStartX;
      const deltaY = event.clientY - this.dragStartY;
      this.transformX = this.transformX + deltaX;
      this.transformY = this.transformY + deltaY;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      this.cd.detectChanges();
    }
  }
  
  @HostListener('document:mouseup')
  onDragEnd(): void {
    this.isDragging = false;
  }
  
  resetDragPosition(): void {
    this.transformX = 0;
    this.transformY = 0;
    this.initialTransformX = 0;
    this.initialTransformY = 0;
  }
}
