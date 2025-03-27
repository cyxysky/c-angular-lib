import { Directive, TemplateRef } from '@angular/core';

export type OverlayBasicPosition = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
export type OverlayBasicTrigger = 'hover' | 'click';
@Directive({
  standalone: true,
})
export class OverlayBasicDirective {
  public show() { }
  public hide() { }
  public updatePosition() { }
  public updateContent(content: string | TemplateRef<any>) { }

}
