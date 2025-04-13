import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, OnDestroy, TemplateRef, ViewEncapsulation, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { Message } from './message.interface';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AnimationEvent } from '@angular/animations';
import { messageMotion } from './message.animations';

@Component({
  selector: 'lib-message',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  templateUrl: './message.component.html',
  styleUrl: './message.component.less',
  animations: [messageMotion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'class': 'lib-message',
    '[@messageMotion]': 'state',
    '(@messageMotion.done)': 'onAnimationEnd($event)'
  }
})
export class MessageComponent implements OnInit, OnDestroy {
  @Input() id: string = '';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() content: string | TemplateRef<{ $implicit: any }> = '';
  @Input() duration: number = 3000;
  @Input() closeable: boolean = true;
  @Input() data: any = null;
  @Input() onClose?: () => void;
  
  state: 'enter' | 'leave' = 'enter';
  private destroy$ = new Subject<void>();
  private autoCloseTimer: any = null;
  
  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}
  
  ngOnInit(): void {
    setTimeout(() => {
      this.startAutoCloseTimer();
    }, 100);
  }
  
  ngOnDestroy(): void {
    this.clearAutoCloseTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private startAutoCloseTimer(): void {
    this.clearAutoCloseTimer();
    if (this.duration > 0) {
      this.ngZone.runOutsideAngular(() => {
        this.autoCloseTimer = setTimeout(() => {
          this.ngZone.run(() => {
            this.close();
          });
        }, this.duration);
      });
    }
  }
  
  private clearAutoCloseTimer(): void {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }
  
  close(): void {
    this.clearAutoCloseTimer();
    this.state = 'leave';
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }
  
  onAnimationEnd(event: AnimationEvent): void {
    if (event.toState === 'leave') {
      if (this.onClose) {
        this.onClose();
      }
    }
  }
  
  isTemplateRef(content: string | TemplateRef<{ $implicit: any }>): content is TemplateRef<{ $implicit: any }> {
    return content instanceof TemplateRef;
  }
  
  getIconType(): string {
    switch (this.type) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'error':
        return 'bi-x-circle-fill';
      case 'warning':
        return 'bi-exclamation-triangle-fill';
      default:
        return 'bi-info-circle-fill';
    }
  }

  getIconColor(): string {
    switch (this.type) {
      case 'success':
        return '#19be6b';
      case 'error':
        return '#f56c6c';
      case 'warning':
        return '#faad14';
      default:
        return '#1890ff';
    }
  }
}
