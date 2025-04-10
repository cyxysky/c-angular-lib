import { Component, Input, TemplateRef, ViewChild, ContentChild, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-template #contentTemplate>
      <ng-content></ng-content>
    </ng-template>
  `
})
export class TabComponent implements AfterContentInit {
  @Input() title: string = '';
  @Input() disabled: boolean = false;
  @Input() key: string = '';
  @ViewChild('contentTemplate', { static: true }) contentTemplate!: TemplateRef<any>;
  
  ngAfterContentInit(): void {
    // 初始化逻辑
  }
} 