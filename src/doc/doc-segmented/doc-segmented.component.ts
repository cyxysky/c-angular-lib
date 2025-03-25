import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { ApiData, DocApiTableComponent } from '../doc-api-table/doc-api-table.component';
import { SegmentedComponent } from '@project';
import { ProjectModule } from "../../../projects/cjf-project/src/lib/project.module";
import { NumberInputComponent } from "../../../projects/cjf-project/src/lib/number-input/number-input.component";

@Component({
  selector: 'app-doc-segmented',
  imports: [
    CommonModule,
    FormsModule,
    DocBoxComponent,
    DocApiTableComponent,
    SegmentedComponent,
    ProjectModule,
    NumberInputComponent
  ],
  templateUrl: './doc-segmented.component.html',
  styleUrl: './doc-segmented.component.less'
})
export class DocSegmentedComponent {
  // 基本用法示例
  basicValue: string = 'day';
  basicOptions = [
    { value: 'day', label: '日' },
    { value: 'week', label: '周' },
    { value: 'month', label: '月' },
    { value: 'year', label: '年' },
    { value: 'quarter', label: '季度' },
    { value: 'half-year', label: '半年半年半年半年半年' },
    { value: 'years', label: '年' },
    { value: 'years1', label: '年' },
    { value: 'years2', label: '年' },
    { value: 'years3', label: '年' },

  ];
  maxWidth = signal(900);

  // 带图标示例
  iconValue: string = 'list';
  iconOptions = [
    { value: 'list', label: '列表', icon: 'icon-list' },
    { value: 'kanban', label: '看板', icon: 'icon-appstore' },
    { value: 'calendar', label: '日历', icon: 'icon-calendar' }
  ];

  // 禁用示例
  disabledValue: string = 'apple';
  disabledOptions = [
    { value: 'apple', label: '苹果' },
    { value: 'orange', label: '橙子' },
    { value: 'banana', label: '香蕉', disabled: true }
  ];
  componentDisabled = false;

  // 尺寸示例
  currentSize: 'large' | 'default' | 'small' = 'default';
  sizeOptions = [
    { value: 'large', label: '大' },
    { value: 'default', label: '默认' },
    { value: 'small', label: '小' }
  ];

  // 块级示例
  isBlock = true;
  blockOptions = [
    { value: 'inline', label: '内联' },
    { value: 'block', label: '块级' }
  ];

  // API 文档
  apiSections: ApiData[] = [
    {
      title: '属性',
      items: [
        { name: 'options', description: '选项列表', type: 'SegmentedOption[]', default: '[]' },
        { name: 'disabled', description: '是否禁用', type: 'boolean', default: 'false' },
        { name: 'block', description: '是否为块级元素', type: 'boolean', default: 'false' },
        { name: 'size', description: '尺寸大小', type: "'large' | 'default' | 'small'", default: "'default'" }
      ]
    },
    {
      title: '事件',
      items: [
        { name: 'valueChange', description: '选项变化时的回调', type: 'EventEmitter<string | number>' }
      ]
    },
    {
      title: 'SegmentedOption接口',
      items: [
        { name: 'value', description: '选项值', type: 'string | number', default: '-' },
        { name: 'label', description: '选项标签', type: 'string', default: '-' },
        { name: 'disabled', description: '是否禁用该选项', type: 'boolean', default: 'false' },
        { name: 'icon', description: '选项图标类名', type: 'string', default: '-' }
      ]
    }
  ];

  // 演示代码
  // 基本用法
  basicSource = `
import { Component } from '@angular/core';
import { SegmentedComponent } from 'your-lib';

@Component({
  selector: 'app-basic-demo',
  standalone: true,
  imports: [SegmentedComponent],
  template: \`
    <lib-segmented
      [options]="options"
      [(ngModel)]="value">
    </lib-segmented>
    <p>当前值: {{ value }}</p>
  \`,
})
export class BasicDemoComponent {
  value: string = 'day';
  options = [
    { value: 'day', label: '日' },
    { value: 'week', label: '周' },
    { value: 'month', label: '月' }
  ];
}`;
  basicHTML = ``;
  basicCSS = ``;

  // 带图标
  iconSource = `
import { Component } from '@angular/core';
import { SegmentedComponent } from 'your-lib';

@Component({
  selector: 'app-icon-demo',
  standalone: true,
  imports: [SegmentedComponent],
  template: \`
    <lib-segmented
      [options]="options"
      [(ngModel)]="value">
    </lib-segmented>
    <p>当前值: {{ value }}</p>
  \`,
})
export class IconDemoComponent {
  value: string = 'list';
  options = [
    { value: 'list', label: '列表', icon: 'icon-list' },
    { value: 'kanban', label: '看板', icon: 'icon-appstore' },
    { value: 'calendar', label: '日历', icon: 'icon-calendar' }
  ];
}`;
  iconHTML = ``;
  iconCSS = ``;

  // 禁用
  disabledSource = `
import { Component } from '@angular/core';
import { SegmentedComponent } from 'your-lib';

@Component({
  selector: 'app-disabled-demo',
  standalone: true,
  imports: [SegmentedComponent],
  template: \`
    <lib-segmented
      [options]="options"
      [(ngModel)]="value"
      [disabled]="componentDisabled">
    </lib-segmented>
    <button (click)="componentDisabled = !componentDisabled">
      {{ componentDisabled ? '启用' : '禁用' }}
    </button>
    <p>当前值: {{ value }}</p>
  \`,
})
export class DisabledDemoComponent {
  value: string = 'apple';
  options = [
    { value: 'apple', label: '苹果' },
    { value: 'orange', label: '橙子' },
    { value: 'banana', label: '香蕉', disabled: true }
  ];
  componentDisabled = false;
}`;
  disabledHTML = ``;
  disabledCSS = ``;

  // 尺寸
  sizeSource = `
import { Component } from '@angular/core';
import { SegmentedComponent } from 'your-lib';

@Component({
  selector: 'app-size-demo',
  standalone: true,
  imports: [SegmentedComponent],
  template: \`
    <lib-segmented
      [options]="sizeOptions"
      [(ngModel)]="currentSize">
    </lib-segmented>
    <div style="margin-top: 16px;">
      <lib-segmented
        [options]="options"
        [(ngModel)]="value"
        [size]="currentSize">
      </lib-segmented>
    </div>
    <p>当前尺寸: {{ currentSize }}</p>
  \`,
})
export class SizeDemoComponent {
  value: string = 'day';
  currentSize: 'large' | 'default' | 'small' = 'default';
  options = [
    { value: 'day', label: '日' },
    { value: 'week', label: '周' },
    { value: 'month', label: '月' }
  ];
  sizeOptions = [
    { value: 'large', label: '大' },
    { value: 'default', label: '默认' },
    { value: 'small', label: '小' }
  ];
}`;
  sizeHTML = ``;
  sizeCSS = ``;

  // 块级
  blockSource = `
import { Component } from '@angular/core';
import { SegmentedComponent } from 'your-lib';

@Component({
  selector: 'app-block-demo',
  standalone: true,
  imports: [SegmentedComponent],
  template: \`
    <div style="margin-top: 16px;">
          <div style="display: grid; gap: 16px;grid-template-columns: 1fr;">
            <div>
              <div>
                默认占满宽度
              </div>
              <lib-segmented [options]="basicOptions" [(ngModel)]="basicValue"></lib-segmented>
            </div>
            <div>
              <div>
                设置最大宽度 500px, 超出宽度出现移动按钮
              </div>
              <div>
                <lib-number-input [(ngModel)]="maxWidth"></lib-number-input>
              </div>
              <lib-segmented [options]="basicOptions" [(ngModel)]="basicValue" [maxWidth]="maxWidth"></lib-segmented>
            </div>
          </div>
        </div>

  \`,
})
export class BlockDemoComponent {
  value: string = 'day';
  isBlock = true;
  options = [
    { value: 'day', label: '日' },
    { value: 'week', label: '周' },
    { value: 'month', label: '月' }
  ];
  blockOptions = [
    { value: 'inline', label: '内联' },
    { value: 'block', label: '块级' }
  ];
}`;
  blockHTML = ``;
  blockCSS = ``;

  toggleDisabled(): void {
    this.componentDisabled = !this.componentDisabled;
  }

  onSizeChange(size: any): void {
    this.currentSize = size;
  }

  onBlockChange(value: any): void {
    this.isBlock = value === 'block';
  }
}
