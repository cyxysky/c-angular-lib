import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'lib-select-tag',
  imports: [CommonModule],
  templateUrl: './select-tag.component.html',
  styleUrl: './select-tag.component.less'
})
export class SelectTagComponent {
  @Input() closable = true;
  @Input() size: 'default' | 'small' | 'large' = 'default';
  @Output() remove = new EventEmitter<MouseEvent>();
  
  public removeSelf($event: MouseEvent): void {
    this.remove.emit($event);
  }
}
