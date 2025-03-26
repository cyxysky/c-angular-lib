import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { ApiData, DocApiTableComponent } from '../doc-api-table/doc-api-table.component';
import { InputComponent } from '@project';
import { ProjectModule } from "../../../projects/project/src/lib/project.module";

@Component({
  selector: 'app-doc-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DocBoxComponent,
    DocApiTableComponent,
    InputComponent,
    ProjectModule
  ],
  templateUrl: './doc-input.component.html',
  styleUrl: './doc-input.component.less'
})
export class DocInputComponent {
  // 基本用法示例
  basicValue: string = '';

  // 尺寸示例
  largeValue: string = '';
  defaultValue: string = '';
  smallValue: string = '';

  // 前缀和后缀示例
  prefixValue: string = '';
  suffixValue: string = '';
  prefixIconValue: string = '';
  suffixIconValue: string = '';

  // 允许清除示例
  clearValue: string = '';

  // 禁用和只读示例
  disabledValue: string = '禁用状态示例值';
  readonlyValue: string = '只读状态示例值';

  // 状态示例
  errorValue: string = '';
  warningValue: string = '';

  // 字数限制示例
  countValue: string = '';

  // 无边框示例
  borderlessValue: string = '';

  // API 文档
  apiSections: ApiData[] = [
    {
      title: '属性',
      items: [
        { name: 'placeholder', description: '输入框提示文本', type: 'string', default: "''" },
        { name: 'disabled', description: '是否禁用', type: 'boolean', default: 'false' },
        { name: 'readonly', description: '是否只读', type: 'boolean', default: 'false' },
        { name: 'size', description: '输入框大小', type: "'large' | 'default' | 'small'", default: "'default'" },
        { name: 'prefix', description: '输入框前缀文本', type: 'string', default: "''" },
        { name: 'suffix', description: '输入框后缀文本', type: 'string', default: "''" },
        { name: 'prefixIcon', description: '输入框前缀图标', type: 'string', default: "''" },
        { name: 'suffixIcon', description: '输入框后缀图标', type: 'string', default: "''" },
        { name: 'allowClear', description: '是否允许清除', type: 'boolean', default: 'true' },
        { name: 'maxlength', description: '最大字符数', type: 'number | null', default: 'null' },
        { name: 'minlength', description: '最小字符数', type: 'number | null', default: 'null' },
        { name: 'type', description: '输入框类型', type: 'string', default: "'text'" },
        { name: 'status', description: '输入框状态', type: "'error' | 'warning' | ''", default: "''" },
        { name: 'bordered', description: '是否有边框', type: 'boolean', default: 'true' },
        { name: 'showCount', description: '是否显示字数统计', type: 'boolean', default: 'false' },
        { name: 'autofocus', description: '是否自动获取焦点', type: 'boolean', default: 'false' },
        { name: 'id', description: '输入框ID', type: 'string', default: "''" },
        { name: 'pattern', description: '输入框校验规则', type: '((value: string) => boolean) | RegExp | null', default: 'null' },
        { name: 'autocomplete', description: '浏览器自动完成', type: 'string', default: "'off'" }
      ]
    },
    {
      title: '事件',
      items: [
        { name: 'valueChange', description: '值变化时的回调', type: 'EventEmitter<any>' },
        { name: 'focus', description: '获取焦点时的回调', type: 'EventEmitter<FocusEvent>' },
        { name: 'blur', description: '失去焦点时的回调', type: 'EventEmitter<FocusEvent>' },
        { name: 'keydown', description: '键盘按下时的回调', type: 'EventEmitter<KeyboardEvent>' },
        { name: 'keyup', description: '键盘弹起时的回调', type: 'EventEmitter<KeyboardEvent>' },
        { name: 'keypress', description: '键盘按下时的回调', type: 'EventEmitter<KeyboardEvent>' },
        { name: 'click', description: '鼠标点击时的回调', type: 'EventEmitter<MouseEvent>' }
      ]
    }
  ];

  // 示例代码
  // 基本用法
  basicSource = `
import { Component } from '@angular/core';
import { InputComponent } from '@project';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'lib-input',
  standalone: true,
  imports: [InputComponent, FormsModule],
  template: \`
    <lib-input 
      placeholder="请输入内容" 
      [(ngModel)]="value">
    </lib-input>
    <p>当前值: {{ value }}</p>
  \`
})
export class InputComponent {
  value: string = '';
}`;

  // 尺寸
  sizeSource = `
import { Component } from '@angular/core';
import { InputComponent } from '@project';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'lib-input',
  standalone: true,
  imports: [InputComponent, FormsModule],
  template: \`
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <lib-input 
        placeholder="大尺寸" 
        size="large"
        [(ngModel)]="largeValue">
      </lib-input>
      <lib-input 
        placeholder="默认尺寸" 
        [(ngModel)]="defaultValue">
      </lib-input>
      <lib-input 
        placeholder="小尺寸" 
        size="small"
        [(ngModel)]="smallValue">
      </lib-input>
    </div>
  \`,
})
export class InputComponent {
  largeValue: string = '';
  defaultValue: string = '';
  smallValue: string = '';
}`;

  // 前缀和后缀
  affixSource = `
import { Component } from '@angular/core';
import { InputComponent } from '@project';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'lib-input',
  standalone: true,
  imports: [InputComponent, FormsModule],
  template: \`
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <lib-input 
        placeholder="前缀" 
        prefix="￥"
        [(ngModel)]="prefixValue">
      </lib-input>
      <lib-input 
        placeholder="后缀" 
        suffix="RMB"
        [(ngModel)]="suffixValue">
      </lib-input>
      <lib-input 
        placeholder="前缀图标" 
        prefixIcon="icon-user"
        [(ngModel)]="prefixIconValue">
      </lib-input>
      <lib-input 
        placeholder="后缀图标" 
        suffixIcon="icon-search"
        [(ngModel)]="suffixIconValue">
      </lib-input>
    </div>
  \`,
})
export class InputComponent {
  prefixValue: string = '';
  suffixValue: string = '';
  prefixIconValue: string = '';
  suffixIconValue: string = '';
}`;

  // 允许清除
  clearSource = `
import { Component } from '@angular/core';
import { InputComponent } from '@project';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'lib-input',
  standalone: true,
  imports: [InputComponent, FormsModule],
  template: \`
    <lib-input 
      placeholder="输入后显示清除按钮" 
      [allowClear]="true"
      [(ngModel)]="value">
    </lib-input>
  \`,
})
export class InputComponent {
  value: string = '';
}`;

  // 禁用和只读
  disabledSource = `
import { Component } from '@angular/core';
import { InputComponent } from '@project';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'lib-input',
  standalone: true,
  imports: [InputComponent, FormsModule],
  template: \`
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <lib-input 
        placeholder="禁用状态" 
        [disabled]="true"
        [(ngModel)]="disabledValue">
      </lib-input>
      <lib-input 
        placeholder="只读状态" 
        [readonly]="true"
        [(ngModel)]="readonlyValue">
      </lib-input>
    </div>
  \`,
})
export class InputComponent {
  disabledValue: string = '禁用状态示例值';
  readonlyValue: string = '只读状态示例值';
}`;

  // 状态
  statusSource = `
import { Component } from '@angular/core';
import { InputComponent } from '@project';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'lib-input',
  standalone: true,
  imports: [InputComponent, FormsModule],
  template: \`
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <lib-input 
        placeholder="错误状态" 
        status="error"
        [(ngModel)]="errorValue">
      </lib-input>
      <lib-input 
        placeholder="警告状态" 
        status="warning"
        [(ngModel)]="warningValue">
      </lib-input>
    </div>
  \`,
})
export class InputComponent {
  errorValue: string = '';
  warningValue: string = '';
}`;

  // 字数限制
  countSource = `
import { Component } from '@angular/core';
import { InputComponent } from '@project';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'lib-input',
  standalone: true,
  imports: [InputComponent, FormsModule],
  template: \`
    <lib-input 
      placeholder="最多输入10个字符" 
      [maxlength]="10"
      [showCount]="true"
      [(ngModel)]="value">
    </lib-input>
  \`,
})
export class InputComponent {
  value: string = '';
}`;

  // 无边框
  borderlessSource = `
import { Component } from '@angular/core';
import { InputComponent } from '@project';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'lib-input',
  standalone: true,
  imports: [InputComponent, FormsModule],
  template: \`
    <div style="background-color: #f5f5f5; padding: 16px; border-radius: 4px;">
      <lib-input 
        placeholder="无边框输入框" 
        [bordered]="false"
        [(ngModel)]="value">
      </lib-input>
    </div>
  \`,
})
export class InputComponent {
  value: string = '';
}`;
}
