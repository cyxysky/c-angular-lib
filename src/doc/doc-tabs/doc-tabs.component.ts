import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { ApiData, DocApiTableComponent } from '../doc-api-table/doc-api-table.component';
import { SegmentedComponent } from '@project';
import { TabComponent, TabsComponent } from "@project";

@Component({
  selector: 'app-doc-tabs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DocBoxComponent,
    DocApiTableComponent,
    SegmentedComponent,
    TabsComponent,
    TabComponent
  ],
  templateUrl: './doc-tabs.component.html',
  styleUrl: './doc-tabs.component.less'
})
export class DocTabsComponent {
  @ViewChild('contentTemplate', { static: true }) contentTemplate!: TemplateRef<any>;
  // 配置项示例
  selectedIndex = 0;

  // 位置示例
  tabPosition: 'top' | 'bottom' = 'top';
  positionOptions = [
    { value: 'top', label: '顶部' },
    { value: 'bottom', label: '底部' }
  ];

  // 动态标签页示例
  dynamicTabs = [
    { key: 'tab1', title: '标签页1', content: '标签页1的内容' },
    { key: 'tab2', title: '标签页2', content: '标签页2的内容' }
  ];
  tabIndex = 2;

  // API 文档
  apiSections: ApiData[] = [
    {
      title: 'Tabs 组件属性',
      items: [
        { name: 'selectedIndex', description: '当前选中的标签页索引', type: 'number', default: '0' },
        { name: 'tabPosition', description: '标签位置', type: "'top' | 'bottom'", default: "'top'" },
        { name: 'type', description: '标签页类型', type: "'line' | 'card'", default: "'line'" },
        { name: 'centered', description: '标签是否居中显示', type: 'boolean', default: 'false' },
        { name: 'closable', description: '标签是否可关闭', type: 'boolean', default: 'false' },
        { name: 'closeIcon', description: '关闭图标的类名', type: 'string', default: "'bi-x-lg'" }
      ]
    },
    {
      title: 'Tabs 组件事件',
      items: [
        { name: 'selectedIndexChange', description: '选中的标签页变化时触发', type: 'EventEmitter<number>' },
        { name: 'tabClick', description: '点击标签时触发', type: 'EventEmitter<{index: number, tab: TabItem}>' },
        { name: 'close', description: '点击关闭按钮时触发', type: 'EventEmitter<{index: number, tab: TabItem}>' },
        { name: 'selectChange', description: '选中的标签页变化时触发', type: 'EventEmitter<TabItem>' }
      ]
    },
    {
      title: 'Tab 组件属性',
      items: [
        { name: 'title', description: '标签页标题', type: 'string', default: "''" },
        { name: 'disabled', description: '是否禁用', type: 'boolean', default: 'false' },
        { name: 'key', description: '标签页唯一标识', type: 'string', default: "''" },
        { name: 'titleTemplate', description: '自定义标题模板', type: 'TemplateRef<any>', default: 'null' }
      ]
    },
    {
      title: 'TabItem 接口',
      items: [
        { name: 'key', description: '唯一标识', type: 'string', default: '-' },
        { name: 'title', description: '标签页标题', type: 'string', default: '-' },
        { name: 'disabled', description: '是否禁用', type: 'boolean', default: 'false' },
        { name: 'content', description: '标签页内容模板', type: 'TemplateRef<any>', default: '-' },
        { name: 'customTitle', description: '自定义标题模板', type: 'TemplateRef<any>', default: '-' }
      ]
    }
  ];

  // 代码示例
  basicSource = `
import { Component } from '@angular/core';
import { TabComponent, TabsComponent } from '@project';

@Component({
  selector: 'app-basic-demo',
  standalone: true,
  imports: [TabsComponent, TabComponent],
  template: \`
    <lib-tabs [selectedIndex]="0">
      <lib-tab title="标签页1">内容1</lib-tab>
      <lib-tab title="标签页2">内容2</lib-tab>
      <lib-tab title="标签页3">内容3</lib-tab>
    </lib-tabs>
  \`
})
export class BasicDemoComponent {}
  `;

  positionSource = `
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TabComponent, TabsComponent, SegmentedComponent } from '@project';

@Component({
  selector: 'app-position-demo',
  standalone: true,
  imports: [TabsComponent, TabComponent, SegmentedComponent, FormsModule],
  template: \`
    <div style="margin-bottom: 16px;">
      <lib-segmented
        [segmentedOptions]="positionOptions"
        [(ngModel)]="tabPosition">
      </lib-segmented>
    </div>
    <lib-tabs [tabPosition]="tabPosition">
      <lib-tab title="标签页1">内容1</lib-tab>
      <lib-tab title="标签页2">内容2</lib-tab>
      <lib-tab title="标签页3">内容3</lib-tab>
    </lib-tabs>
  \`
})
export class PositionDemoComponent {
  tabPosition: 'top' | 'bottom' = 'top';
  positionOptions = [
    { value: 'top', label: '顶部' },
    { value: 'bottom', label: '底部' }
  ];
}
  `;

  cardSource = `
import { Component } from '@angular/core';
import { TabComponent, TabsComponent } from '@project';

@Component({
  selector: 'app-card-demo',
  standalone: true,
  imports: [TabsComponent, TabComponent],
  template: \`
    <lib-tabs [type]="'card'">
      <lib-tab title="标签页1">内容1</lib-tab>
      <lib-tab title="标签页2">内容2</lib-tab>
      <lib-tab title="标签页3">内容3</lib-tab>
    </lib-tabs>
  \`
})
export class CardDemoComponent {}
  `;

  disabledSource = `
import { Component } from '@angular/core';
import { TabComponent, TabsComponent } from '@project';

@Component({
  selector: 'app-disabled-demo',
  standalone: true,
  imports: [TabsComponent, TabComponent],
  template: \`
    <lib-tabs>
      <lib-tab title="标签页1">内容1</lib-tab>
      <lib-tab title="标签页2" [disabled]="true">内容2</lib-tab>
      <lib-tab title="标签页3">内容3</lib-tab>
    </lib-tabs>
  \`
})
export class DisabledDemoComponent {}
  `;

  centeredSource = `
import { Component } from '@angular/core';
import { TabComponent, TabsComponent } from '@project';

@Component({
  selector: 'app-centered-demo',
  standalone: true,
  imports: [TabsComponent, TabComponent],
  template: \`
    <lib-tabs [centered]="true">
      <lib-tab title="标签页1">内容1</lib-tab>
      <lib-tab title="标签页2">内容2</lib-tab>
      <lib-tab title="标签页3">内容3</lib-tab>
    </lib-tabs>
  \`
})
export class CenteredDemoComponent {}
  `;

  closableSource = `
import { Component } from '@angular/core';
import { TabComponent, TabsComponent } from '@project';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-closable-demo',
  standalone: true,
  imports: [TabsComponent, TabComponent, CommonModule],
  template: \`
    <lib-tabs [closable]="true" (close)="closeTab($event)">
      <lib-tab 
        *ngFor="let tab of tabs; let i = index" 
        [title]="tab.title" 
        [key]="tab.key">
        {{ tab.content }}
      </lib-tab>
    </lib-tabs>
  \`
})
export class ClosableDemoComponent {
  tabs = [
    { key: 'tab1', title: '标签页1', content: '标签页1的内容' },
    { key: 'tab2', title: '标签页2', content: '标签页2的内容' }
  ];

  closeTab(event: {index: number}): void {
    this.tabs.splice(event.index, 1);
  }
}
  `;

  customSource = `
import { Component, ViewChild, TemplateRef } from '@angular/core';
import { TabComponent, TabsComponent } from '@project';

@Component({
  selector: 'app-custom-title-demo',
  standalone: true,
  imports: [TabsComponent, TabComponent],
  template: \`
    <lib-tabs>
      <lib-tab [titleTemplate]="customTitle1">
        自定义标题模板内容1
        <ng-template #customTitle1>
          <span style="color: red">自定义</span>标题1
        </ng-template>
      </lib-tab>
      <lib-tab [titleTemplate]="customTitle2">
        自定义标题模板内容2
        <ng-template #customTitle2>
          <span style="color: blue">自定义</span>标题2
        </ng-template>
      </lib-tab>
    </lib-tabs>
  \`
})
export class CustomTitleDemoComponent {}
  `;

  closeTab(event: { index: number }): void {
    this.dynamicTabs.splice(event.index, 1);
  }

  addTab(): void {
    const key = `tab${this.tabIndex}`;
    this.dynamicTabs.push({
      key,
      title: `标签页${this.tabIndex}`,
      content: `这是动态添加的标签页${this.tabIndex}的内容`
    });
    this.tabIndex++;
  }
}
