import { afterNextRender, Directive, Host, Injectable, Input, Optional, TemplateRef } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class WidgetSource {
  public SourceMap: Map<string, TemplateRef<void>> = new Map();
  constructor() { }

  public set(templateString: string, templateRef: TemplateRef<void>): void {
    this.SourceMap.set(templateString, templateRef);
  }

  public get(templateString: string): TemplateRef<void> | undefined {
    return this.SourceMap.get(templateString);
  }
}

@Directive({
  selector: '[widget]',
})
export class WidgetDirective {
  @Input() widget!: string;

  constructor(
    private ref: TemplateRef<void>,
    @Optional() public source: WidgetSource
  ) {
  }

  ngOnInit() {
    this.source.set(this.widget, this.ref);
  }
}
