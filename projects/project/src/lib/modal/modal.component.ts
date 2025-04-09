import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, Renderer2, ChangeDetectorRef, TemplateRef, Type } from '@angular/core';
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
export class ModalComponent implements AfterViewInit {
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
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() afterOpen = new EventEmitter<void>();
  @Output() afterClose = new EventEmitter<void>();
  
  @ViewChild('modalContent') modalContentRef!: ElementRef;
  @ViewChild('modalBody') modalBodyRef!: ElementRef;
  
  animationState: 'void' | 'visible' = 'void';
  
  constructor(private renderer: Renderer2, private cd: ChangeDetectorRef) {}
  
  ngAfterViewInit(): void {
    this.updateAnimationState();
    this.cd.detectChanges();
  }
  
  ngOnChanges(): void {
    this.updateAnimationState();
    if (this.visible) {
      setTimeout(() => this.afterOpen.emit(), 0);
    }
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
    
    return style;
  }
}
