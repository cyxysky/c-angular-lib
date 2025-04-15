import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { ApiData, DocApiTableComponent } from '../doc-api-table/doc-api-table.component';
import { ProjectModule, DropMenu, DropMenuDirective, OverlayBasicPosition } from '@project';

@Component({
  selector: 'app-doc-drop-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DocBoxComponent,
    DocApiTableComponent,
    ProjectModule,
    DropMenuDirective
  ],
  templateUrl: './doc-drop-menu.component.html',
  styleUrl: './doc-drop-menu.component.less'
})
export class DocDropMenuComponent {
  // 基本菜单项
  basicItems: DropMenu[] = [
    { label: '菜单项 1', icon: 'icon-user', children: [] },
    { label: '菜单项 2', icon: 'icon-setting', children: [], disabled: true },
    { label: '菜单项 3', icon: 'icon-folder', children: [] },
    { label: '菜单项 4', icon: 'icon-file', children: [] }
  ];

  // 嵌套菜单项
  nestedItems: DropMenu[] = [
    { 
      label: '一级菜单 1', 
      icon: 'icon-folder', 
      children: [
        { label: '二级菜单 1-1', icon: 'icon-file', children: [] },
        { label: '二级菜单 1-2', icon: 'icon-file', children: [] }
      ] 
    },
    { 
      label: '一级菜单 2', 
      icon: 'icon-folder', 
      children: [
        { label: '二级菜单 2-1', icon: 'icon-file', children: [] },
        { 
          label: '二级菜单 2-2', 
          icon: 'icon-folder', 
          children: [
            { label: '三级菜单 2-2-1', icon: 'icon-file', children: [] },
            { label: '三级菜单 2-2-2', icon: 'icon-file', children: [] }
          ] 
        }
      ] 
    },
    { label: '一级菜单 3', icon: 'icon-setting', children: [] }
  ];

  // 自定义菜单项
  customItems: DropMenu[] = [
    { label: '自定义菜单项 1', icon: 'icon-star', children: [] },
    { label: '自定义菜单项 2', icon: 'icon-heart', children: [] },
    { label: '自定义菜单项 3', icon: 'icon-bell', children: [] }
  ];

  // 所有位置选项
  placements: Array<OverlayBasicPosition> = ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];

  // 受控模式的可见性
  controlledVisible = false;

  // 用户选择的菜单项
  selectedItem: DropMenu | null = null;

  // 菜单可见性变化处理
  onVisibleChange(visible: boolean): void {
    console.log('菜单可见性变化:', visible);
    this.controlledVisible = visible;
  }

  // 菜单项点击处理
  onMenuItemClick(item: DropMenu): void {
    console.log('点击菜单项:', item);
    this.selectedItem = item;
  }

  // 通用菜单项点击处理
  onItemClick(item: DropMenu): void {
    console.log('自定义模板中点击菜单项:', item);
  }

  // API 文档
  apiSections: ApiData[] = [
    {
      title: 'DropMenu指令属性',
      items: [
        { name: 'dropMenuItems', description: '菜单项列表', type: 'DropMenu[]', default: '[]' },
        { name: 'dropMenuPlacement', description: '菜单位置', type: 'OverlayBasicPosition', default: '\'bottom\'' },
        { name: 'dropMenuTrigger', description: '触发方式', type: '\'click\' | \'hover\'', default: '\'click\'' },
        { name: 'dropMenuVisible', description: '菜单是否可见', type: 'boolean', default: 'false' },
        { name: 'dropMenuStrictVisible', description: '是否严格由编程控制显示', type: 'boolean', default: 'false' },
        { name: 'dropMenuWidth', description: '菜单宽度', type: 'number | string', default: '\'auto\'' },
        { name: 'dropMenuItemTemplate', description: '自定义菜单项模板', type: 'TemplateRef<{ $implicit: DropMenu, index: number }>', default: 'null' },
        { name: 'dropMenuMouseEnterDelay', description: '鼠标进入延迟时间', type: 'number', default: '50' },
        { name: 'dropMenuMouseLeaveDelay', description: '鼠标离开延迟时间', type: 'number', default: '200' },
        { name: 'dropMenuAutoClose', description: '点击菜单项后是否自动关闭菜单', type: 'boolean', default: 'true' }
      ]
    },
    {
      title: 'DropMenu指令事件',
      items: [
        { name: 'dropMenuVisibleChange', description: '菜单显示状态改变事件', type: 'EventEmitter<boolean>' },
        { name: 'dropMenuItemClick', description: '菜单项点击事件', type: 'EventEmitter<DropMenu>' }
      ]
    },
    {
      title: 'DropMenu组件属性',
      items: [
        { name: 'items', description: '菜单项列表', type: 'DropMenu[]', default: '[]' },
        { name: 'isVisible', description: '菜单是否可见', type: 'boolean', default: 'false' },
        { name: 'placement', description: '菜单位置', type: '\'top\' | \'bottom\' | \'left\' | \'right\'', default: '\'bottom\'' },
        { name: 'width', description: '菜单宽度', type: 'number | string', default: '\'auto\'' },
        { name: 'itemTemplate', description: '自定义菜单项模板', type: 'TemplateRef<{ $implicit: DropMenu, index: number }>', default: 'null' },
        { name: 'autoClose', description: '点击菜单项后是否自动关闭菜单', type: 'boolean', default: 'true' },
        { name: 'isSubMenu', description: '是否为子菜单', type: 'boolean', default: 'false' }
      ]
    },
    {
      title: 'DropMenu接口',
      items: [
        { name: 'label', description: '菜单项文本', type: 'string', default: '-' },
        { name: 'icon', description: '菜单项图标', type: 'string', default: '-' },
        { name: 'children', description: '子菜单项列表', type: 'DropMenu[]', default: '[]' }
      ]
    }
  ];

  // 演示代码
  // 基本用法
  basicSource = `
import { Component } from '@angular/core';
import { DropMenu } from 'your-lib';

@Component({
  selector: 'app-demo',
  template: \`
    <button libDropMenu [dropMenuItems]="menuItems">
      点击显示菜单
    </button>
  \`
})
export class DemoComponent {
  menuItems: DropMenu[] = [
    { label: '菜单项 1', icon: 'icon-user', children: [] },
    { label: '菜单项 2', icon: 'icon-setting', children: [] },
    { label: '菜单项 3', icon: 'icon-folder', children: [] }
  ];
}`;

  // 触发方式
  triggerSource = `
import { Component } from '@angular/core';
import { DropMenu } from 'your-lib';

@Component({
  selector: 'app-demo',
  template: \`
    <button libDropMenu [dropMenuItems]="menuItems" [dropMenuTrigger]="'click'">
      点击触发
    </button>
    <button libDropMenu [dropMenuItems]="menuItems" [dropMenuTrigger]="'hover'">
      悬停触发
    </button>
  \`
})
export class DemoComponent {
  menuItems: DropMenu[] = [
    { label: '菜单项 1', icon: 'icon-user', children: [] },
    { label: '菜单项 2', icon: 'icon-setting', children: [] }
  ];
}`;

  // 菜单位置
  placementSource = `
import { Component } from '@angular/core';
import { DropMenu } from 'your-lib';

@Component({
  selector: 'app-demo',
  template: \`
    <button *ngFor="let pos of placements" 
      libDropMenu 
      [dropMenuItems]="menuItems" 
      [dropMenuPlacement]="pos">
      {{pos}}
    </button>
  \`
})
export class DemoComponent {
  menuItems: DropMenu[] = [...];
  placements: string[] = ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
}`;

  // 自定义宽度
  widthSource = `
import { Component } from '@angular/core';
import { DropMenu } from 'your-lib';

@Component({
  selector: 'app-demo',
  template: \`
    <button libDropMenu [dropMenuItems]="menuItems" [dropMenuWidth]="200">
      宽度: 200px
    </button>
    <button libDropMenu [dropMenuItems]="menuItems" [dropMenuWidth]="'300px'">
      宽度: 300px
    </button>
  \`
})
export class DemoComponent {
  menuItems: DropMenu[] = [...];
}`;

  // 嵌套菜单
  nestedSource = `
import { Component } from '@angular/core';
import { DropMenu } from 'your-lib';

@Component({
  selector: 'app-demo',
  template: \`
    <button libDropMenu [dropMenuItems]="nestedItems">
      嵌套菜单
    </button>
  \`
})
export class DemoComponent {
  nestedItems: DropMenu[] = [
    { 
      label: '一级菜单 1', 
      icon: 'icon-folder', 
      children: [
        { label: '二级菜单 1-1', icon: 'icon-file', children: [] },
        { label: '二级菜单 1-2', icon: 'icon-file', children: [] }
      ] 
    },
    { 
      label: '一级菜单 2', 
      icon: 'icon-folder', 
      children: [
        { label: '二级菜单 2-1', icon: 'icon-file', children: [] },
        { 
          label: '二级菜单 2-2', 
          icon: 'icon-folder', 
          children: [
            { label: '三级菜单 2-2-1', icon: 'icon-file', children: [] },
            { label: '三级菜单 2-2-2', icon: 'icon-file', children: [] }
          ] 
        }
      ] 
    }
  ];
}`;

  // 自定义模板
  customTemplateSource = `
import { Component } from '@angular/core';
import { DropMenu } from 'your-lib';

@Component({
  selector: 'app-demo',
  template: \`
    <button libDropMenu [dropMenuItems]="customItems" [dropMenuItemTemplate]="customItemTpl">
      自定义菜单项
    </button>
    
    <ng-template #customItemTpl let-item let-index="index">
      <li class="custom-menu-item" (click)="onItemClick(item)">
        <span class="custom-menu-item-icon" *ngIf="item.icon">
          <i [class]="item.icon"></i>
        </span>
        <span class="custom-menu-item-label">
          {{ index + 1 }}. {{ item.label }}
        </span>
      </li>
    </ng-template>
  \`
})
export class DemoComponent {
  customItems: DropMenu[] = [
    { label: '自定义菜单项 1', icon: 'icon-star', children: [] },
    { label: '自定义菜单项 2', icon: 'icon-heart', children: [] },
    { label: '自定义菜单项 3', icon: 'icon-bell', children: [] }
  ];
  
  onItemClick(item: DropMenu): void {
    console.log('点击菜单项:', item);
  }
}`;

  // 受控模式
  controlledSource = `
import { Component } from '@angular/core';
import { DropMenu } from 'your-lib';

@Component({
  selector: 'app-demo',
  template: \`
    <button (click)="visible = !visible">
      {{ visible ? '隐藏菜单' : '显示菜单' }}
    </button>
    
    <button libDropMenu 
      [dropMenuItems]="menuItems" 
      [dropMenuVisible]="visible"
      [dropMenuStrictVisible]="true"
      (dropMenuVisibleChange)="onVisibleChange($event)">
      受控的菜单
    </button>
  \`
})
export class DemoComponent {
  menuItems: DropMenu[] = [...];
  visible = false;
  
  onVisibleChange(visible: boolean): void {
    this.visible = visible;
  }
}`;

  // 监听菜单项点击
  eventSource = `
import { Component } from '@angular/core';
import { DropMenu } from 'your-lib';

@Component({
  selector: 'app-demo',
  template: \`
    <button libDropMenu 
      [dropMenuItems]="menuItems" 
      (dropMenuItemClick)="onMenuItemClick($event)">
      点击菜单项
    </button>
    
    <div *ngIf="selectedItem" class="example-value">
      已选择: {{ selectedItem.label }}
    </div>
  \`
})
export class DemoComponent {
  menuItems: DropMenu[] = [...];
  selectedItem: DropMenu | null = null;
  
  onMenuItemClick(item: DropMenu): void {
    this.selectedItem = item;
  }
}`;

  // 更新自动关闭模式示例
  autoCloseSource = `
import { Component } from '@angular/core';
import { DropMenu } from 'your-lib';

@Component({
  selector: 'app-demo',
  template: \`
    <div style="display: flex; gap: 16px;">
      <button libDropMenu [dropMenuItems]="menuItems" [dropMenuAutoClose]="true">
        自动关闭模式
        <small>（点击菜单项后自动关闭）</small>
      </button>
      
      <button libDropMenu [dropMenuItems]="menuItems" [dropMenuAutoClose]="false">
        手动关闭模式
        <small>（点击菜单项不会自动关闭）</small>
      </button>
    </div>
  \`
})
export class DemoComponent {
  menuItems: DropMenu[] = [
    { label: '菜单项 1', icon: 'icon-user', children: [] },
    { label: '菜单项 2', icon: 'icon-setting', children: [] },
    { 
      label: '多级菜单', 
      icon: 'icon-folder', 
      children: [
        { label: '子菜单项 1', icon: 'icon-file', children: [] },
        { label: '子菜单项 2', icon: 'icon-file', children: [] }
      ] 
    }
  ];
}`;
}
