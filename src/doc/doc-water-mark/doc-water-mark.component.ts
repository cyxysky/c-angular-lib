import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { ApiData, DocApiTableComponent } from '../doc-api-table/doc-api-table.component';
import { WaterMarkComponent, WaterMarkDirectiveDirective, InputComponent, NumberInputComponent, ButtonComponent } from '@project';

@Component({
  selector: 'app-doc-water-mark',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DocBoxComponent,
    DocApiTableComponent,
    WaterMarkComponent,
    WaterMarkDirectiveDirective,
    InputComponent,
    NumberInputComponent,
    ButtonComponent
  ],
  templateUrl: './doc-water-mark.component.html',
  styleUrl: './doc-water-mark.component.less'
})
export class DocWaterMarkComponent {

  conss(a: any){
    console.log(a)
  }
  // 自定义样式示例
  customText: string = '自定义水印文本';
  customColor: string = 'rgba(0, 0, 0, 0.15)';
  fontSize: number = 16;
  rotation: number = -22;

  // 图片水印示例
  logoUrl: string = 'https://img.alicdn.com/imgextra/i3/O1CN01UR3Zkq1va9fnZsZcr_!!6000000006188-55-tps-424-64.svg';

  // 防篡改示例
  tamperMessage: string = '';

  // API 文档
  apiSections: ApiData[] = [
    {
      title: '水印组件属性',
      items: [
        { name: 'text', description: '水印文本内容', type: 'string', default: '\'水印文字\'' },
        { name: 'fontColor', description: '水印文字颜色', type: 'string', default: '\'rgba(0, 0, 0, 0.15)\'' },
        { name: 'fontSize', description: '水印文字大小', type: 'number', default: '16' },
        { name: 'fontFamily', description: '水印文字字体', type: 'string', default: '\'Microsoft YaHei, PingFang SC, Arial, sans-serif\'' },
        { name: 'fontWeight', description: '水印文字粗细', type: 'string', default: '\'200\'' },
        { name: 'gap', description: '水印之间的间距', type: 'number', default: '60' },
        { name: 'zIndex', description: '水印层级', type: 'number', default: '9999' },
        { name: 'rotate', description: '水印旋转角度', type: 'number', default: '-22' },
        { name: 'width', description: '单个水印宽度', type: 'number', default: '350' },
        { name: 'height', description: '单个水印高度', type: 'number', default: '180' },
        { name: 'offsetLeft', description: '水印横向偏移', type: 'number', default: '0' },
        { name: 'offsetTop', description: '水印纵向偏移', type: 'number', default: '0' },
        { name: 'imageBase64', description: '图片水印的Base64字符串或URL', type: 'string | null', default: 'null' }
      ]
    },
    {
      title: '水印指令属性',
      items: [
        { name: 'libWaterMarkDirective', description: '水印指令选择器', type: 'directive', default: '-' },
        { name: '[text]', description: '水印文本内容', type: 'string', default: '\'水印文字\'' },
        { name: '[fontColor]', description: '水印文字颜色', type: 'string', default: '\'rgba(0, 0, 0, 0.15)\'' },
        { name: '[fontSize]', description: '水印文字大小', type: 'number', default: '16' },
        { name: '[imageBase64]', description: '图片水印的Base64字符串或URL', type: 'string | null', default: 'null' }
      ]
    }
  ];

  // 演示代码
  // 基本用法
  basicSource = `
import { Component } from '@angular/core';
import { WaterMarkComponent } from '@project/water-mark';

@Component({
  selector: 'lib-water-mark',
  standalone: true,
  imports: [WaterMarkComponent],
  template: \`
    <lib-water-mark [text]="'公司内部文件'">
      <div style="height: 300px;width: 100%;padding: 20px;">
        <h3>水印组件基本使用</h3>
        <p>水印将显示在这个区域内部</p>
      </div>
    </lib-water-mark>
  \`
})
export class WaterMarkComponent {}
  `;

  // 自定义样式
  customSource = `
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WaterMarkComponent, InputComponent, SelectComponent, OptionComponent, NumberInputComponent } from '@project/water-mark';

@Component({
  selector: 'lib-water-mark',
  standalone: true,
  imports: [FormsModule, WaterMarkComponent, InputComponent, SelectComponent, OptionComponent, NumberInputComponent],
  template: \`
    <lib-water-mark 
      [text]="customText" 
      [fontColor]="customColor"
      [fontSize]="fontSize"
      [rotate]="rotation">
      <div style="height: 300px;width: 100%;padding: 20px;">
        <h3>自定义水印样式</h3>
        <p>可以调整下方参数查看效果</p>
        <div class="control-row">
          <label>文字内容：</label>
          <lib-input [(ngModel)]="customText"></lib-input>
        </div>
        <div class="control-row">
          <label>字体颜色：</label>
          <lib-select [(ngModel)]="customColor">
            <lib-option [value]="'rgba(0, 0, 0, 0.15)'">默认颜色</lib-option>
            <lib-option [value]="'rgba(255, 0, 0, 0.15)'">红色</lib-option>
            <lib-option [value]="'rgba(0, 0, 255, 0.15)'">蓝色</lib-option>
          </lib-select>
        </div>
        <div class="control-row">
          <label>字体大小：</label>
          <lib-number-input [(ngModel)]="fontSize" [min]="8" [max]="32"></lib-number-input>
        </div>
        <div class="control-row">
          <label>旋转角度：</label>
          <lib-number-input [(ngModel)]="rotation" [min]="-90" [max]="90"></lib-number-input>
        </div>
      </div>
    </lib-water-mark>
  \`,
  styles: \`
    .control-row {
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }
    
    .control-row label {
      width: 80px;
      margin-right: 8px;
    }
  \`
})
export class WaterMarkComponent {
  customText: string = '自定义水印文本';
  customColor: string = 'rgba(0, 0, 0, 0.15)';
  fontSize: number = 16;
  rotation: number = -22;
}
  `;

  // 图片水印
  imageSource = `
import { Component } from '@angular/core';
import { WaterMarkComponent } from '@project/water-mark';

@Component({
  selector: 'lib-water-mark',
  standalone: true,
  imports: [WaterMarkComponent],
  template: \`
    <lib-water-mark 
      [text]="'公司内部文件'" 
      [imageBase64]="logoUrl">
      <div style="height: 300px;width: 100%;padding: 20px;">
        <h3>图片水印</h3>
        <p>结合图片和文字实现品牌水印</p>
      </div>
    </lib-water-mark>
  \`
})
export class WaterMarkComponent {
  // 此处应设置为你的Logo的Base64字符串
  logoUrl: string = 'data:image/svg+xml;base64,...';
}
  `;

  // 指令用法
  directiveSource = `
import { Component } from '@angular/core';
import { WaterMarkDirectiveDirective } from '@project/water-mark';

@Component({
  selector: 'lib-water-mark',
  standalone: true,
  imports: [WaterMarkDirectiveDirective],
  template: \`
    <div style="height: 300px;width: 100%;padding: 20px;" 
         libWaterMarkDirective 
         [text]="'水印指令应用'">
      <h3>水印指令</h3>
      <p>可以直接在任意元素上应用水印指令</p>
    </div>
  \`
})
export class WaterMarkComponent {}
  `;

  // 防篡改
  tamperProofSource = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WaterMarkComponent, ButtonComponent } from '@project/water-mark';

@Component({
  selector: 'lib-water-mark',
  standalone: true,
  imports: [CommonModule, WaterMarkComponent, ButtonComponent],
  template: \`
    <lib-water-mark [text]="'防篡改水印'" [fontColor]="'rgba(233, 66, 66, 0.2)'">
      <div style="height: 300px;width: 100%;padding: 20px;">
        <h3>防篡改功能</h3>
        <p>尝试使用开发者工具删除或修改水印元素，水印将自动恢复</p>
        <lib-button (click)="showTamperMessage()">点击演示防篡改</lib-button>
        <p *ngIf="tamperMessage" class="tamper-message">{{ tamperMessage }}</p>
      </div>
    </lib-water-mark>
  \`,
  styles: \`
    .tamper-message {
      color: #ff4d4f;
      margin-top: 16px;
    }
  \`
})
export class WaterMarkComponent {
  tamperMessage: string = '';

  showTamperMessage() {
    this.tamperMessage = '如果你尝试删除或修改水印元素，水印将自动恢复。这是通过MutationObserver实现的防篡改功能。';
    setTimeout(() => this.tamperMessage = '', 5000);
  }
}
  `;

  // 防篡改功能演示
  showTamperMessage() {
    this.tamperMessage = '如果你尝试删除或修改水印元素，水印将自动恢复。这是通过MutationObserver实现的防篡改功能。';
    setTimeout(() => this.tamperMessage = '', 5000);
  }
}
