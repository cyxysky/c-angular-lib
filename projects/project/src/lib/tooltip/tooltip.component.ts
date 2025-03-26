import { style } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'lib-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.less',
  host: {
    '[style]': 'getMargin()'
  }
})
export class TooltipComponent {
  @Input() content: string | TemplateRef<any> = '';
  @Input() placement: 'top' | 'bottom' | 'left' | 'right' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top';
  @Input() isVisible = false;
  @Input() color = '#000';

  isTemplateRef(value: any): value is TemplateRef<any> {
    return value instanceof TemplateRef;
  }

  getMargin(): string {
    switch (this.placement) {
      case 'top':
      case 'bottom':
      case 'top-left':
      case 'top-right':
      case 'bottom-left':
      case 'bottom-right':
        return 'margin: 8px 0';
      
      case 'left':
      case 'right':
      case 'left-top':
      case 'left-bottom':
      case 'right-top':
      case 'right-bottom':
        return 'margin: 0 8px';
      
      default:
        return 'margin: 0';
    }
  }
}
