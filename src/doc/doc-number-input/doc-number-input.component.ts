import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { ApiData, DocApiTableComponent } from '../doc-api-table/doc-api-table.component';
import { ProjectModule } from '@project';

@Component({
  selector: 'app-doc-number-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DocBoxComponent,
    DocApiTableComponent,
    ProjectModule
  ],
  templateUrl: './doc-number-input.component.html',
  styleUrl: './doc-number-input.component.less'
})
export class DocNumberInputComponent {
  // 基本用法示例
  basicValue: number | null = 3;
  
  // 前缀后缀示例
  prefixSuffixValue: number | null = 100;
  
  // 精度示例
  precisionValue: number | null = 1.234;
  
  // 禁用示例
  disabledValue: number = 99;
  disabledControl = new FormControl(this.disabledValue);
  
  // 只读示例
  readonlyValue: number = 88;
  
  // 步进示例
  stepValue: number | null = 5;
  
  // 最大最小值示例
  boundedValue: number | null = 5;
  
  // 格式化示例
  formattedValue: number | null = 1000;
  currencyFormatter = (value: number) => `${value}`.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  currencyParser = (value: string) => parseFloat(value.replace(/\$\s?|(,*)/g, ''));
  
  // API 文档 - 修改为与tag组件一致的格式
  apiSections: ApiData[] = [
    {
      title: '属性',
      items: [
        { name: 'min', description: '最小值', type: 'number | null', default: 'null' },
        { name: 'max', description: '最大值', type: 'number | null', default: 'null' },
        { name: 'step', description: '每次改变步数，可以为小数', type: 'number', default: '1' },
        { name: 'precision', description: '数值精度，即小数位数', type: 'number', default: '0' },
        { name: 'placeholder', description: '占位提示文字', type: 'string', default: '""' },
        { name: 'disabled', description: '是否禁用', type: 'boolean', default: 'false' },
        { name: 'readonly', description: '是否只读', type: 'boolean', default: 'false' },
        { name: 'prefix', description: '带有前缀图标的输入框', type: 'string', default: '""' },
        { name: 'suffix', description: '带有后缀图标的输入框', type: 'string', default: '""' },
        { name: 'formatter', description: '指定输入框展示值的格式', type: '(value: number) => string | number', default: 'value => value' },
        { name: 'color', description: '输入框字体颜色', type: 'string', default: 'black' },
        { name: 'status', description: '输入框状态', type: '\'normal\' | \'error\' | \'warning\'', default: '\'normal\'' }
      ]
    },
    {
      title: '事件',
      items: [
        { name: 'valueChange', description: '值变化时的回调', type: 'EventEmitter<number | null>' }
      ]
    }
  ];
  
  // 演示代码 - 使用单独的source、HTML和CSS属性
  // 基本用法
  basicSource = `
import { Component } from '@angular/core';
import { NumberInputComponent } from 'your-lib';

@Component({
  selector: 'app-basic-demo',
  standalone: true,
  imports: [NumberInputComponent],
  template: \`
    <lib-number-input [(value)]="value"></lib-number-input>
    <p>当前值: {{ value }}</p>
  \`,
})
export class BasicDemoComponent {
  value: number | null = 3;
}`;
  basicHTML = `<lib-number-input [(value)]="value"></lib-number-input>
<p>当前值: {{ value }}</p>`;
  basicCSS = ``; // 如果没有特定的CSS，可以保留为空字符串
  
  // 前缀后缀
  prefixSuffixSource = `
import { Component } from '@angular/core';
import { NumberInputComponent } from 'your-lib';

@Component({
  selector: 'app-prefix-suffix-demo',
  standalone: true,
  imports: [NumberInputComponent],
  template: \`
    <lib-number-input
      [prefix]="'¥'"
      [suffix]="'元'"
      [(value)]="value">
    </lib-number-input>
    <p>当前值: {{ value }}</p>
  \`,
})
export class PrefixSuffixDemoComponent {
  value: number | null = 100;
}`;
  prefixSuffixHTML = `<lib-number-input
  [prefix]="'¥'"
  [suffix]="'元'"
  [(value)]="value">
</lib-number-input>
<p>当前值: {{ value }}</p>`;
  prefixSuffixCSS = ``;
  
  // 精度
  precisionSource = `
import { Component } from '@angular/core';
import { NumberInputComponent } from 'your-lib';

@Component({
  selector: 'app-precision-demo',
  standalone: true,
  imports: [NumberInputComponent],
  template: \`
    <lib-number-input
      [precision]="2"
      [(value)]="value">
    </lib-number-input>
    <p>当前值: {{ value }}</p>
  \`,
})
export class PrecisionDemoComponent {
  value: number | null = 1.234;
}`;
  precisionHTML = `<lib-number-input
  [precision]="2"
  [(value)]="value">
</lib-number-input>
<p>当前值: {{ value }}</p>`;
  precisionCSS = ``;
  
  // 禁用
  disabledSource = `
import { Component } from '@angular/core';
import { NumberInputComponent } from 'your-lib';

@Component({
  selector: 'app-disabled-demo',
  standalone: true,
  imports: [NumberInputComponent],
  template: \`
    <lib-number-input
      [disabled]="true"
      [(value)]="value">
    </lib-number-input>
    <p>当前值: {{ value }}</p>
  \`,
})
export class DisabledDemoComponent {
  value: number = 99;
}`;
  disabledHTML = `<lib-number-input
  [disabled]="true"
  [(value)]="value">
</lib-number-input>
<p>当前值: {{ value }}</p>`;
  disabledCSS = ``;
  
  // 只读
  readonlySource = `
import { Component } from '@angular/core';
import { NumberInputComponent } from 'your-lib';

@Component({
  selector: 'app-readonly-demo',
  standalone: true,
  imports: [NumberInputComponent],
  template: \`
    <lib-number-input
      [readonly]="true"
      [(value)]="value">
    </lib-number-input>
    <p>当前值: {{ value }}</p>
  \`,
})
export class ReadonlyDemoComponent {
  value: number = 88;
}`;
  readonlyHTML = `<lib-number-input
  [readonly]="true"
  [(value)]="value">
</lib-number-input>
<p>当前值: {{ value }}</p>`;
  readonlyCSS = ``;
  
  // 步进
  stepSource = `
import { Component } from '@angular/core';
import { NumberInputComponent } from 'your-lib';

@Component({
  selector: 'app-step-demo',
  standalone: true,
  imports: [NumberInputComponent],
  template: \`
    <lib-number-input
      [step]="0.1"
      [(value)]="value">
    </lib-number-input>
    <p>当前值: {{ value }}</p>
  \`,
})
export class StepDemoComponent {
  value: number | null = 5;
}`;
  stepHTML = `<lib-number-input
  [step]="0.1"
  [(value)]="value">
</lib-number-input>
<p>当前值: {{ value }}</p>`;
  stepCSS = ``;
  
  // 范围限制
  boundedSource = `
import { Component } from '@angular/core';
import { NumberInputComponent } from 'your-lib';

@Component({
  selector: 'app-bounded-demo',
  standalone: true,
  imports: [NumberInputComponent],
  template: \`
    <lib-number-input
      [min]="1"
      [max]="10"
      [(value)]="value">
    </lib-number-input>
    <p>当前值: {{ value }}</p>
  \`,
})
export class BoundedDemoComponent {
  value: number | null = 5;
}`;
  boundedHTML = `<lib-number-input
  [min]="1"
  [max]="10"
  [(value)]="value">
</lib-number-input>
<p>当前值: {{ value }}</p>`;
  boundedCSS = ``;
  
  // 格式化
  formattedSource = `
import { Component } from '@angular/core';
import { NumberInputComponent } from 'your-lib';

@Component({
  selector: 'app-formatted-demo',
  standalone: true,
  imports: [NumberInputComponent],
  template: \`
    <lib-number-input
      [formatter]="currencyFormatter"
      [parser]="currencyParser"
      [(value)]="value">
    </lib-number-input>
    <p>当前值: {{ value }}</p>
  \`,
})
export class FormattedDemoComponent {
  value: number | null = 1000;
  
  currencyFormatter = (value: number) => \`\${value}\`.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
  currencyParser = (value: string) => parseFloat(value.replace(/\\$\\s?|(,*)/g, ''));
}`;
  formattedHTML = `<lib-number-input
  [formatter]="currencyFormatter"
  [parser]="currencyParser"
  [(value)]="value">
</lib-number-input>
<p>当前值: {{ value }}</p>`;
  formattedCSS = ``;
}
