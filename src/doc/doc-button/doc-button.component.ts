import { Component } from '@angular/core';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { ProjectModule } from '@project';
import { ApiData, DocApiTableComponent } from '../doc-api-table/doc-api-table.component';

@Component({
  selector: 'app-doc-button',
  imports: [DocBoxComponent, ProjectModule, DocApiTableComponent],
  templateUrl: './doc-button.component.html',
  styleUrl: './doc-button.component.less'
})
export class DocButtonComponent {
  // API 数据定义
  apiSections: ApiData[] = [
    {
      title: '属性',
      items: [
        {
          name: 'size',
          description: '按钮大小',
          type: "'small' | 'middle' | 'large'",
          default: "'middle'"
        },
        {
          name: 'type',
          description: '按钮类型',
          type: "'default' | 'dashed' | 'link' | 'text'",
          default: "'default'"
        },
        {
          name: 'shape',
          description: '按钮形状',
          type: "'circle' | 'round' | 'default'",
          default: "'default'"
        },
        {
          name: 'disabled',
          description: '是否禁用按钮',
          type: 'boolean',
          default: 'false'
        },
        {
          name: 'color',
          description: '按钮颜色，可选值包括主要色、成功色、警告色、危险色等',
          type: "'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'tertiary' | 'light' | 'dark' | 'medium' | 'ghost'",
          default: "'primary'"
        },
        {
          name: 'content',
          description: '按钮文本内容',
          type: 'string',
          default: '-'
        },
        {
          name: 'block',
          description: '是否将按钮宽度调整为其父容器的宽度',
          type: 'boolean',
          default: 'false'
        }
      ]
    },
    {
      title: '事件',
      items: [
        {
          name: 'click',
          description: '点击按钮时触发的事件',
          type: 'EventEmitter<MouseEvent>',
          params: 'MouseEvent'
        }
      ]
    }
  ];
  
  colorButtonCode = `
import { Component } from '@angular/core';
@Component({
  selector: 'lib-button',
  template: \`
    <lib-button [color]="'primary'">主要颜色</lib-button>
    <lib-button [color]="'success'">成功颜色</lib-button>
    <lib-button [color]="'warning'">警告颜色</lib-button>
    <lib-button [color]="'danger'">危险颜色</lib-button>
    <lib-button [color]="'tertiary'">次要颜色</lib-button>
    <lib-button [color]="'light'">浅色颜色</lib-button>
    <lib-button [color]="'dark'">深色颜色</lib-button>
    <lib-button [color]="'medium'">灰色颜色</lib-button>
    <lib-button [color]="'ghost'">幽灵颜色</lib-button>
  \`
})
export class ButtonComponent { }`;

  typeButtonCode = `
import { Component } from '@angular/core';
@Component({
  selector: 'lib-button',
  template: \`
    <lib-button>默认按钮</lib-button>
    <lib-button [type]="'dashed'" [color]="'ghost'">虚线按钮</lib-button>
    <lib-button [type]="'text'">文字按钮</lib-button>
    <lib-button [type]="'link'">链接按钮</lib-button>
  \`
})
export class ButtonComponent { }`;

  shapeButtonCode = `
import { Component } from '@angular/core';
@Component({
  selector: 'lib-button',
  template: \`
    <lib-button>默认形状</lib-button>
    <lib-button [shape]="'circle'">圆形</lib-button>
  \`
})
export class ButtonComponent { }`;

  sizeButtonCode = `
import { Component } from '@angular/core';
@Component({
  selector: 'lib-button',
  template: \`
    <lib-button [size]="'small'">小按钮</lib-button>
    <lib-button>默认尺寸</lib-button>
    <lib-button [size]="'large'">大按钮</lib-button>
  \`
})
export class ButtonComponent { }`;

  stateButtonCode = `
import { Component } from '@angular/core';
@Component({
  selector: 'lib-button',
  template: \`
    <lib-button>正常状态</lib-button>
    <lib-button disabled>禁用状态</lib-button>
  \`
})
export class ButtonComponent { }`;

  blockButtonCode = `
import { Component } from '@angular/core';
@Component({
  selector: 'lib-button',
  template: \`
    <lib-button block>撑满父元素</lib-button>
    <div style="margin-top: 16px;">
      <lib-button block [shape]="'circle'">撑满父元素圆形</lib-button>
    </div>
  \`
})
export class ButtonComponent { }`;
}
