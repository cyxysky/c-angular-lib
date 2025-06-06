import { Component, TemplateRef, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { ApiData, DocApiTableComponent } from '../doc-api-table/doc-api-table.component';
import { ProjectModule } from '@project';
import { DrawerService } from '@project';

@Component({
  selector: 'app-doc-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DocBoxComponent,
    DocApiTableComponent,
    ProjectModule
  ],
  templateUrl: './doc-drawer.component.html',
  styleUrl: './doc-drawer.component.less'
})
export class DocDrawerComponent {
  // 模板引用
  @ViewChild('drawerTemplate') drawerTemplate!: TemplateRef<any>;
  
  // 当前表单数据
  formData = {
    name: '',
    email: '',
    description: ''
  };
  
  // 事件日志
  eventLog: string[] = [];
  
  // 保存抽屉引用
  templateDrawerRef: any;
  
  constructor(private drawerService: DrawerService) {}
  
  /**
   * 打开基本抽屉
   */
  openBasicDrawer(): void {
    this.drawerService.open({
      title: '基本抽屉',
      content: '这是一个基本的抽屉示例，从右侧弹出。',
    });
  }
  
  /**
   * 打开不同位置的抽屉
   */
  openDrawer(placement: 'top' | 'right' | 'bottom' | 'left'): void {
    this.drawerService.open({
      title: `${this.getPlacementText(placement)}抽屉`,
      content: `这是一个从${this.getPlacementText(placement)}弹出的抽屉示例。`,
      placement: placement
    });
  }
  
  /**
   * 获取位置中文文本
   */
  getPlacementText(placement: string): string {
    const map: {[key: string]: string} = {
      'top': '上方',
      'right': '右侧',
      'bottom': '下方',
      'left': '左侧'
    };
    return map[placement] || '';
  }
  
  /**
   * 打开自定义尺寸抽屉
   */
  openSizeDrawer(width: string): void {
    this.drawerService.open({
      title: '自定义尺寸抽屉',
      content: `这是一个宽度为 ${width} 的抽屉示例。`,
      width: width
    });
  }
  
  /**
   * 打开模板内容抽屉
   */
  openTemplateDrawer(): void {
    this.templateDrawerRef = this.drawerService.open({
      title: '自定义模板内容',
      content: this.drawerTemplate,
      width: '400px'
    });
  }
  
  /**
   * 关闭模板内容抽屉
   */
  closeTemplateDrawer(): void {
    if (this.templateDrawerRef) {
      this.drawerService.close(this.templateDrawerRef);
    }
  }
  
  /**
   * 提交表单
   */
  submitForm(): void {
    alert(`表单已提交:\n姓名: ${this.formData.name}\n邮箱: ${this.formData.email}\n说明: ${this.formData.description}`);
    this.closeTemplateDrawer();
    // 重置表单
    this.formData = {
      name: '',
      email: '',
      description: ''
    };
  }
  
  /**
   * 打开无遮罩抽屉
   */
  openNoMaskDrawer(): void {
    this.drawerService.open({
      title: '无遮罩抽屉',
      content: '这是一个没有遮罩层的抽屉示例，您可以继续与页面其他部分进行交互。',
      mask: false
    });
  }
  
  /**
   * 打开事件抽屉
   */
  openEventDrawer(): void {
    this.eventLog = [];
    this.addLog('点击按钮，准备打开抽屉');
    
    this.drawerService.open({
      title: '事件处理示例',
      content: '这个抽屉会在打开和关闭时触发回调事件',
      afterOpen: () => {
        this.addLog('抽屉已打开');
      },
      onClose: () => {
        this.addLog('抽屉开始关闭');
      },
      afterClose: () => {
        this.addLog('抽屉已完全关闭');
      }
    });
  }
  
  /**
   * 添加日志
   */
  addLog(message: string): void {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    this.eventLog.unshift(`[${timeString}] ${message}`);
  }
  
  // API 文档
  apiSections: ApiData[] = [
    {
      title: 'DrawerComponent 属性',
      items: [
        { name: 'visible', description: '抽屉是否可见', type: 'boolean', default: 'false' },
        { name: 'title', description: '抽屉标题', type: 'string | TemplateRef<{ $implicit: any }>', default: "''" },
        { name: 'content', description: '抽屉内容', type: 'string | TemplateRef<{ $implicit: any }>', default: "''" },
        { name: 'data', description: '传递给内容模板的数据', type: 'any', default: 'null' },
        { name: 'width', description: '抽屉宽度', type: 'string | number', default: '256' },
        { name: 'height', description: '抽屉高度', type: 'string | number', default: "'100%'" },
        { name: 'placement', description: '抽屉方向', type: "'left' | 'right' | 'top' | 'bottom'", default: "'right'" },
        { name: 'mask', description: '是否显示遮罩', type: 'boolean', default: 'true' },
        { name: 'maskClosable', description: '点击遮罩是否关闭', type: 'boolean', default: 'true' },
        { name: 'closable', description: '是否显示关闭按钮', type: 'boolean', default: 'true' },
        { name: 'zIndex', description: '抽屉层级', type: 'number', default: '1000' }
      ]
    },
    {
      title: 'DrawerComponent 事件',
      items: [
        { name: 'visibleChange', description: '可见状态变化事件', type: 'EventEmitter<boolean>' },
        { name: 'afterOpen', description: '抽屉打开后触发', type: 'EventEmitter<void>' },
        { name: 'afterClose', description: '抽屉关闭后触发', type: 'EventEmitter<void>' }
      ]
    },
    {
      title: 'DrawerService 方法',
      items: [
        { name: 'open(options)', description: '打开抽屉', type: 'DrawerComponent' },
        { name: 'close(drawerInstance)', description: '关闭指定抽屉', type: 'void' },
        { name: 'closeAll()', description: '关闭所有抽屉', type: 'void' }
      ]
    },
    {
      title: 'DrawerOptions 配置选项',
      items: [
        { name: 'title', description: '抽屉标题', type: 'string | TemplateRef<{ $implicit: any }>', default: 'undefined' },
        { name: 'content', description: '抽屉内容', type: 'string | TemplateRef<{ $implicit: any }>', default: 'undefined' },
        { name: 'data', description: '传递给内容模板的数据', type: 'any', default: 'undefined' },
        { name: 'width', description: '抽屉宽度', type: 'string | number', default: 'undefined' },
        { name: 'height', description: '抽屉高度', type: 'string | number', default: 'undefined' },
        { name: 'placement', description: '抽屉方向', type: "'left' | 'right' | 'top' | 'bottom'", default: 'undefined' },
        { name: 'mask', description: '是否显示遮罩', type: 'boolean', default: 'undefined' },
        { name: 'maskClosable', description: '点击遮罩是否关闭', type: 'boolean', default: 'undefined' },
        { name: 'closable', description: '是否显示关闭按钮', type: 'boolean', default: 'undefined' },
        { name: 'zIndex', description: '抽屉层级', type: 'number', default: 'undefined' },
        { name: 'onClose', description: '关闭时的回调', type: '() => void', default: 'undefined' },
        { name: 'afterOpen', description: '打开后的回调', type: '() => void', default: 'undefined' },
        { name: 'afterClose', description: '关闭后的回调', type: '() => void', default: 'undefined' }
      ]
    }
  ];

  // 示例代码
  // 基本用法
  basicSource = `
import { Component } from '@angular/core';
import { DrawerService } from '@project';

@Component({
  selector: 'app-drawer-demo',
  template: \`
    <button (click)="openDrawer()">打开抽屉</button>
  \`
})
export class DrawerDemoComponent {
  constructor(private drawerService: DrawerService) {}
  
  openDrawer(): void {
    this.drawerService.open({
      title: '基本抽屉',
      content: '这是一个基本的抽屉示例，从右侧弹出。'
    });
  }
}`;

  // 自定义位置
  placementSource = `
import { Component } from '@angular/core';
import { DrawerService } from '@project';

@Component({
  selector: 'app-drawer-demo',
  template: \`
    <button (click)="openDrawer('top')">上方</button>
    <button (click)="openDrawer('right')">右侧</button>
    <button (click)="openDrawer('bottom')">下方</button>
    <button (click)="openDrawer('left')">左侧</button>
  \`
})
export class DrawerDemoComponent {
  constructor(private drawerService: DrawerService) {}
  
  openDrawer(placement: 'top' | 'right' | 'bottom' | 'left'): void {
    this.drawerService.open({
      title: \`\${this.getPlacementText(placement)}抽屉\`,
      content: \`这是一个从\${this.getPlacementText(placement)}弹出的抽屉示例。\`,
      placement: placement
    });
  }
  
  getPlacementText(placement: string): string {
    const map: {[key: string]: string} = {
      'top': '上方',
      'right': '右侧',
      'bottom': '下方',
      'left': '左侧'
    };
    return map[placement] || '';
  }
}`;

  // 自定义尺寸
  sizeSource = `
import { Component } from '@angular/core';
import { DrawerService } from '@project';

@Component({
  selector: 'app-drawer-demo',
  template: \`
    <button (click)="openSizeDrawer('300px')">宽度: 300px</button>
    <button (click)="openSizeDrawer('500px')">宽度: 500px</button>
    <button (click)="openSizeDrawer('50%')">宽度: 50%</button>
  \`
})
export class DrawerDemoComponent {
  constructor(private drawerService: DrawerService) {}
  
  openSizeDrawer(width: string): void {
    this.drawerService.open({
      title: '自定义尺寸抽屉',
      content: \`这是一个宽度为 \${width} 的抽屉示例。\`,
      width: width
    });
  }
}`;

  // 自定义内容
  templateSource = `
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { DrawerService } from '@project';

@Component({
  selector: 'app-drawer-demo',
  template: \`
    <button (click)="openTemplateDrawer()">自定义内容模板</button>
    
    <ng-template #drawerTemplate let-data>
      <h3>表单内容示例</h3>
      <div class="form-item">
        <label>姓名</label>
        <input type="text" [(ngModel)]="formData.name" placeholder="请输入姓名">
      </div>
      <div class="form-item">
        <label>邮箱</label>
        <input type="email" [(ngModel)]="formData.email" placeholder="请输入邮箱">
      </div>
      <div class="form-item">
        <label>说明</label>
        <textarea [(ngModel)]="formData.description" placeholder="请输入说明"></textarea>
      </div>
      <div class="form-actions">
        <button (click)="submitForm()">提交</button>
        <button (click)="closeTemplateDrawer()">取消</button>
      </div>
    </ng-template>
  \`
})
export class DrawerDemoComponent {
  @ViewChild('drawerTemplate') drawerTemplate!: TemplateRef<any>;
  
  formData = {
    name: '',
    email: '',
    description: ''
  };
  
  templateDrawerRef: any;
  
  constructor(private drawerService: DrawerService) {}
  
  openTemplateDrawer(): void {
    this.templateDrawerRef = this.drawerService.open({
      title: '自定义模板内容',
      content: this.drawerTemplate,
      width: '400px'
    });
  }
  
  closeTemplateDrawer(): void {
    if (this.templateDrawerRef) {
      this.drawerService.close(this.templateDrawerRef);
    }
  }
  
  submitForm(): void {
    alert(\`表单已提交:\\n姓名: \${this.formData.name}\\n邮箱: \${this.formData.email}\\n说明: \${this.formData.description}\`);
    this.closeTemplateDrawer();
    // 重置表单
    this.formData = {
      name: '',
      email: '',
      description: ''
    };
  }
}`;

  // 无遮罩层
  maskSource = `
import { Component } from '@angular/core';
import { DrawerService } from '@project';

@Component({
  selector: 'app-drawer-demo',
  template: \`
    <button (click)="openNoMaskDrawer()">无遮罩抽屉</button>
  \`
})
export class DrawerDemoComponent {
  constructor(private drawerService: DrawerService) {}
  
  openNoMaskDrawer(): void {
    this.drawerService.open({
      title: '无遮罩抽屉',
      content: '这是一个没有遮罩层的抽屉示例，您可以继续与页面其他部分进行交互。',
      mask: false
    });
  }
}`;

  // 事件处理
  eventSource = `
import { Component } from '@angular/core';
import { DrawerService } from '@project';

@Component({
  selector: 'app-drawer-demo',
  template: \`
    <button (click)="openEventDrawer()">打开事件抽屉</button>
    <div *ngIf="eventLog.length > 0" class="event-log">
      <h4>事件日志：</h4>
      <div *ngFor="let log of eventLog" class="log-item">
        {{log}}
      </div>
    </div>
  \`
})
export class DrawerDemoComponent {
  eventLog: string[] = [];
  
  constructor(private drawerService: DrawerService) {}
  
  openEventDrawer(): void {
    this.eventLog = [];
    this.addLog('点击按钮，准备打开抽屉');
    
    this.drawerService.open({
      title: '事件处理示例',
      content: '这个抽屉会在打开和关闭时触发回调事件',
      afterOpen: () => {
        this.addLog('抽屉已打开');
      },
      onClose: () => {
        this.addLog('抽屉开始关闭');
      },
      afterClose: () => {
        this.addLog('抽屉已完全关闭');
      }
    });
  }
  
  addLog(message: string): void {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    this.eventLog.unshift(\`[\${timeString}] \${message}\`);
  }
}`;

  // 关闭所有抽屉
  closeAllSource = `
import { Component } from '@angular/core';
import { DrawerService } from '@project';

@Component({
  selector: 'app-drawer-demo',
  template: \`
    <div class="close-all-demo">
      <button (click)="openMultipleDrawers()">打开多个抽屉</button>
      <button (click)="closeAllDrawers()">关闭所有抽屉</button>
    </div>
  \`
})
export class DrawerDemoComponent {
  constructor(private drawerService: DrawerService) {}
  
  openMultipleDrawers(): void {
    // 打开第一个抽屉
    this.drawerService.open({
      title: '抽屉 1',
      content: '这是第一个抽屉',
      width: '300px',
      placement: 'right'
    });
    
    // 打开第二个抽屉
    setTimeout(() => {
      this.drawerService.open({
        title: '抽屉 2',
        content: '这是第二个抽屉',
        width: '300px',
        placement: 'left'
      });
    }, 300);
    
    // 打开第三个抽屉
    setTimeout(() => {
      this.drawerService.open({
        title: '抽屉 3',
        content: '这是第三个抽屉',
        width: '300px',
        placement: 'bottom',
        height: '200px'
      });
    }, 600);
  }
  
  closeAllDrawers(): void {
    this.drawerService.closeAll();
  }
}`;

  /**
   * 打开多个抽屉
   */
  openMultipleDrawers(): void {
    // 打开第一个抽屉
    this.drawerService.open({
      title: '抽屉 1',
      content: '这是第一个抽屉',
      width: '300px',
      placement: 'right'
    });
    
    // 打开第二个抽屉
    setTimeout(() => {
      this.drawerService.open({
        title: '抽屉 2',
        content: '这是第二个抽屉',
        width: '300px',
        placement: 'left'
      });
    }, 300);
    
    // 打开第三个抽屉
    setTimeout(() => {
      this.drawerService.open({
        title: '抽屉 3',
        content: '这是第三个抽屉',
        width: '300px',
        placement: 'bottom',
      });
    }, 600);
  }
  
  /**
   * 关闭所有抽屉
   */
  closeAllDrawers(): void {
    this.drawerService.closeAll();
  }
}
