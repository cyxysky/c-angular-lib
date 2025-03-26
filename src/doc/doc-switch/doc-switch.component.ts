import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectModule } from '@project';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { ApiData, DocApiTableComponent } from '../doc-api-table/doc-api-table.component';

@Component({
  selector: 'app-doc-switch',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ProjectModule, 
    DocBoxComponent,
    DocApiTableComponent
  ],
  templateUrl: './doc-switch.component.html',
  styleUrl: './doc-switch.component.less'
})
export class DocSwitchComponent implements OnInit {
  // 基础开关示例
  basicSwitchChecked = false;
  
  // 禁用状态开关
  disabledSwitchChecked = true;
  
  // 加载中状态开关
  loadingSwitchChecked = false;
  
  // 带文字的开关
  textSwitchChecked = true;
  
  // 小尺寸开关
  smallSwitchChecked = false;
  
  // 代码示例
  basicSwitchSource = `
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SwitchComponent } from 'project';

@Component({
  selector: 'app-basic-switch-demo',
  standalone: true,
  imports: [FormsModule, SwitchComponent],
  template: \`
    <lib-switch [(checked)]="checked"></lib-switch>
    <p>当前状态: {{ checked ? '开' : '关' }}</p>
  \`,
})
export class SwitchComponent {
  checked = false;
}`;

  disabledSwitchSource = `
import { Component } from '@angular/core';
import { SwitchComponent } from 'project';

@Component({
  selector: 'app-disabled-switch-demo',
  standalone: true,
  imports: [SwitchComponent],
  template: \`
    <lib-switch [disabled]="true" [checked]="checked"></lib-switch>
  \`,
})
export class SwitchComponent {
  checked = true;
}`;

  loadingSwitchSource = `
import { Component } from '@angular/core';
import { SwitchComponent } from 'project';

@Component({
  selector: 'app-loading-switch-demo',
  standalone: true,
  imports: [SwitchComponent],
  template: \`
    <lib-switch [loading]="true" [checked]="checked"></lib-switch>
  \`,
})
export class SwitchComponent {
  checked = false;
}`;

  textSwitchSource = `
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SwitchComponent } from 'project';

@Component({
  selector: 'app-text-switch-demo',
  standalone: true,
  imports: [FormsModule, SwitchComponent],
  template: \`
    <lib-switch 
        [(ngModel)]="textSwitchChecked"
        [checkedChildren]="'开'"
        [unCheckedChildren]="'关'">
      </lib-switch>
      <lib-switch 
        [(ngModel)]="textSwitchChecked"
        [checkedChildren]="checkedChildren"
        [unCheckedChildren]="unCheckedChildren">
      </lib-switch>
      <ng-template #checkedChildren>
        使用template 开
      </ng-template>
      <ng-template #unCheckedChildren>
        使用template 关
      </ng-template>
      <lib-switch 
        [(ngModel)]="textSwitchChecked"
        >
        <span checkedChildren>
          <i class="bi bi-check2"></i>
        </span>
        <span unCheckedChildren>
          <i class="bi bi-x"></i>
        </span>
      </lib-switch>
  \`,
})
export class SwitchComponent {
  checked = true;
}`;

  smallSwitchSource = `
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SwitchComponent } from 'project';

@Component({
  selector: 'app-small-switch-demo',
  standalone: true,
  imports: [FormsModule, SwitchComponent],
  template: \`
    <lib-switch 
      [(checked)]="checked"
      [size]="'small'">
    </lib-switch>
  \`,
})
export class SwitchComponent {
  checked = false;
}`;

  ngOnInit(): void {
    // 初始化逻辑（如果需要）
  }

  // 模拟异步切换加载状态的开关
  toggleLoadingSwitch(): void {
    const loading = true;
    setTimeout(() => {
      this.loadingSwitchChecked = !this.loadingSwitchChecked;
    }, 1500);
  }

  // API 数据定义
  apiSections: ApiData[] = [
    {
      title: '属性',
      items: [
        {
          name: 'checked',
          description: '指定当前是否选中',
          type: 'boolean',
          default: 'false'
        },
        {
          name: 'disabled',
          description: '是否禁用',
          type: 'boolean',
          default: 'false'
        },
        {
          name: 'loading',
          description: '是否加载中',
          type: 'boolean',
          default: 'false'
        },
        {
          name: 'checkedChildren',
          description: '选中时的内容',
          type: 'string | TemplateRef<any>',
          default: '-'
        },
        {
          name: 'unCheckedChildren',
          description: '非选中时的内容',
          type: 'string | TemplateRef<any>',
          default: '-'
        },
        {
          name: 'size',
          description: '开关大小',
          type: "'default' | 'small'",
          default: "'default'"
        }
      ]
    },
    {
      title: '事件',
      items: [
        {
          name: 'checkedChange',
          description: '开关状态改变时的回调函数',
          type: 'EventEmitter<boolean>',
          params: 'checked: boolean'
        }
      ]
    }
  ];
}
