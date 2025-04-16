import { afterNextRender, afterRender, Directive, Host, Injectable, Input, TemplateRef } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class WidgetSource {
  private SourceMap: Map<string, TemplateRef<void>> = new Map();
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
  providers: [WidgetSource]
})
export class WidgetDirective {
  @Input() widget!: string;
  constructor(
    @Host() source: WidgetSource,
    private ref: TemplateRef<void>
  ) {
    afterNextRender(() => {
      source.set(this.widget, this.ref);
    })
  }

  ngOnInit() {

  }

}

