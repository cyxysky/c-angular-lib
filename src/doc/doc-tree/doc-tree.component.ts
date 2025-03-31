import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { ApiData, DocApiTableComponent } from '../doc-api-table/doc-api-table.component';
import { TreeComponent, TreeNodeOptions } from '../../../projects/project/src/lib/tree/tree.component';
import { ProjectModule } from "../../../projects/project/src/lib/project.module";

@Component({
  selector: 'app-doc-tree',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DocBoxComponent,
    DocApiTableComponent,
    TreeComponent,
    ProjectModule
  ],
  templateUrl: './doc-tree.component.html',
  styleUrl: './doc-tree.component.less'
})
export class DocTreeComponent {
  // 搜索值
  searchValue = '';
  
  // 基本树数据
  basicTreeData: TreeNodeOptions[] = [
    {
      key: '0',
      title: '父节点1',
      children: [
        {
          key: '0-0',
          title: '子节点1-1',
          children: [
            { key: '0-0-0', title: '子节点1-1-1' },
            { key: '0-0-1', title: '子节点1-1-2', disabled: true }
          ]
        },
        {
          key: '0-1',
          title: '子节点1-2',
          children: [
            { key: '0-1-0', title: '子节点1-2-1' },
            { 
              key: '0-1-1', 
              title: '子节点1-2-2',
              disableCheckbox: true,
              children: [
                { key: '0-1-1-0', title: '子节点1-2-2-1' },
                { key: '0-1-1-1', title: '子节点1-2-2-2' },
                { key: '0-1-1-2', title: '子节点1-2-2-3' },
              ]
            }
          ]
        }
      ]
    },
    {
      key: '1',
      title: '父节点2',
      children: [
        {
          key: '1-0',
          title: '子节点2-1',
          children: [
            { key: '1-0-0', title: '子节点2-1-1' }
          ]
        },
        { key: '1-1', title: '子节点2-2' }
      ]
    }
  ];
  
  // 自定义树数据
  customTreeData: TreeNodeOptions[] = [
    {
      key: '0',
      title: '项目结构',
      type: '目录',
      description: '项目根目录',
      children: [
        {
          key: '0-0',
          title: 'src',
          type: '目录',
          description: '源代码目录',
          children: [
            { 
              key: '0-0-0', 
              title: 'app', 
              type: '目录',
              description: '应用代码'
            },
            { 
              key: '0-0-1', 
              title: 'assets', 
              type: '目录',
              description: '静态资源'
            }
          ]
        },
        {
          key: '0-1',
          title: 'package.json',
          type: '文件',
          description: '依赖配置'
        }
      ]
    }
  ];
  
  // 带图标的树数据
  iconTreeData: TreeNodeOptions[] = [
    {
      key: '0',
      title: '文档',
      icon: 'bi-folder',
      children: [
        {
          key: '0-0',
          title: '图片',
          icon: 'bi-image',
          children: [
            { key: '0-0-0', title: 'logo.png', icon: 'bi-file-earmark-image' },
            { key: '0-0-1', title: 'banner.jpg', icon: 'bi-file-earmark-image' }
          ]
        },
        {
          key: '0-1',
          title: '文本',
          icon: 'bi-file-earmark',
          children: [
            { key: '0-1-0', title: 'README.md', icon: 'bi-file-earmark-text' },
            { key: '0-1-1', title: 'note.txt', icon: 'bi-file-earmark-text' }
          ]
        }
      ]
    },
    {
      key: '1',
      title: '代码',
      icon: 'bi-code-slash',
      children: [
        { key: '1-0', title: 'index.ts', icon: 'bi-file-earmark-code' },
        { key: '1-1', title: 'styles.css', icon: 'bi-file-earmark-code' }
      ]
    }
  ];
  
  // 用于虚拟滚动的大数据集
  largeTreeData: TreeNodeOptions[] = [];
  
  constructor() {
    // 生成大量数据用于虚拟滚动演示
    this.generateLargeTreeData();
  }
  
  // 生成大量数据用于虚拟滚动
  private generateLargeTreeData(): void {
    for (let i = 0; i < 100; i++) {
      const parentNode: TreeNodeOptions = {
        key: `${i}`,
        title: `父节点 ${i}`,
        children: []
      };
      
      for (let j = 0; j < 10; j++) {
        const childNode: TreeNodeOptions = {
          key: `${i}-${j}`,
          title: `子节点 ${i}-${j}`,
          children: []
        };
        
        for (let k = 0; k < 5; k++) {
          childNode.children!.push({
            key: `${i}-${j}-${k}`,
            title: `子节点 ${i}-${j}-${k}`,
            isLeaf: true
          });
        }
        
        parentNode.children!.push(childNode);
      }
      
      this.largeTreeData.push(parentNode);
    }
  }
  
  // 事件处理
  onNodeSelected(event: { selected: boolean, node: TreeNodeOptions }): void {
    console.log('选中节点:', event);
  }
  
  onNodeChecked(event: { checked: boolean, node: TreeNodeOptions }): void {
    console.log('勾选节点:', event);
  }
  
  onNodeExpanded(event: { expanded: boolean, node: TreeNodeOptions }): void {
    console.log('展开/折叠节点:', event);
  }

  // API 文档
  apiSections: ApiData[] = [
    {
      title: '属性',
      items: [
        { name: 'treeData', description: '树形数据', type: 'TreeNodeOptions[]', default: '[]' },
        { name: 'showIcon', description: '是否显示图标', type: 'boolean', default: 'false' },
        { name: 'showLine', description: '是否显示连接线', type: 'boolean', default: 'false' },
        { name: 'checkable', description: '是否可勾选', type: 'boolean', default: 'false' },
        { name: 'multiple', description: '是否支持多选', type: 'boolean', default: 'false' },
        { name: 'draggable', description: '是否可拖拽', type: 'boolean', default: 'false' },
        { name: 'virtualHeight', description: '虚拟滚动高度', type: 'string', default: "''(禁用虚拟滚动)" },
        { name: 'defaultExpandAll', description: '默认展开所有节点', type: 'boolean', default: 'false' },
        { name: 'searchValue', description: '搜索值', type: 'string', default: "''"},
        { name: 'asyncData', description: '是否异步加载数据', type: 'boolean', default: 'false' }
      ]
    },
    {
      title: '事件',
      items: [
        { name: 'checkBoxChange', description: '复选框状态变更回调', type: 'EventEmitter<{checked: boolean, node: TreeNodeOptions}>' },
        { name: 'expandChange', description: '展开/折叠状态变更回调', type: 'EventEmitter<{expanded: boolean, node: TreeNodeOptions}>' },
        { name: 'selectedChange', description: '选中状态变更回调', type: 'EventEmitter<{selected: boolean, node: TreeNodeOptions}>' },
        { name: 'searchChange', description: '搜索值变更回调', type: 'EventEmitter<string>' },
        { name: 'loadData', description: '异步加载数据回调', type: 'EventEmitter<TreeNodeOptions>' }
      ]
    },
    {
      title: '模板',
      items: [
        { name: 'treeTemplate', description: '自定义节点模板', type: 'TemplateRef<{$implicit: TreeNodeOptions, origin: any, node: TreeNodeOptions}>' },
        { name: 'iconTemplate', description: '自定义图标模板', type: 'TemplateRef<{$implicit: TreeNodeOptions, origin: any}>' }
      ]
    },
    {
      title: 'TreeNodeOptions接口',
      items: [
        { name: 'key', description: '节点唯一键', type: 'string', default: '-' },
        { name: 'title', description: '节点标题', type: 'string', default: '-' },
        { name: 'icon', description: '节点图标', type: 'string', default: '-' },
        { name: 'isLeaf', description: '是否为叶子节点', type: 'boolean', default: 'false' },
        { name: 'expanded', description: '是否展开', type: 'boolean', default: 'false' },
        { name: 'selected', description: '是否选中', type: 'boolean', default: 'false' },
        { name: 'checked', description: '是否勾选', type: 'boolean', default: 'false' },
        { name: 'selectable', description: '是否可选中', type: 'boolean', default: 'true' },
        { name: 'disabled', description: '是否禁用', type: 'boolean', default: 'false' },
        { name: 'disableCheckbox', description: '是否禁用复选框', type: 'boolean', default: 'false' },
        { name: 'children', description: '子节点数据', type: 'TreeNodeOptions[]', default: '[]' }
      ]
    }
  ];

  // 演示代码
  // 基本用法
  basicSource = `
import { Component } from '@angular/core';
import { TreeComponent, TreeNodeOptions } from 'your-lib';

@Component({
  selector: 'app-basic-demo',
  standalone: true,
  imports: [TreeComponent],
  template: \`
    <lib-tree
      [treeData]="treeData"
      [checkable]="true"
      [defaultExpandAll]="true"
      (selectedChange)="onNodeSelected($event)"
      (checkBoxChange)="onNodeChecked($event)"
      (expandChange)="onNodeExpanded($event)"
    ></lib-tree>
  \`,
})
export class BasicTreeDemoComponent {
  treeData: TreeNodeOptions[] = [
    {
      key: '0',
      title: '父节点1',
      children: [
        {
          key: '0-0',
          title: '子节点1-1',
          children: [
            { key: '0-0-0', title: '子节点1-1-1' },
            { key: '0-0-1', title: '子节点1-1-2', disabled: true }
          ]
        }
      ]
    }
  ];

  onNodeSelected(event: { selected: boolean, node: TreeNodeOptions }): void {
    console.log('选中节点:', event);
  }
  
  onNodeChecked(event: { checked: boolean, node: TreeNodeOptions }): void {
    console.log('勾选节点:', event);
  }
  
  onNodeExpanded(event: { expanded: boolean, node: TreeNodeOptions }): void {
    console.log('展开/折叠节点:', event);
  }
}`;

  // 带连接线的树
  lineSource = `
import { Component } from '@angular/core';
import { TreeComponent, TreeNodeOptions } from 'your-lib';

@Component({
  selector: 'app-line-demo',
  standalone: true,
  imports: [TreeComponent],
  template: \`
    <lib-tree 
      [treeData]="treeData" 
      [showLine]="true"
      [defaultExpandAll]="true"
    ></lib-tree>
  \`,
})
export class LineTreeDemoComponent {
  treeData: TreeNodeOptions[] = [
    {
      key: '0',
      title: '父节点1',
      children: [
        {
          key: '0-0',
          title: '子节点1-1',
          children: [
            { key: '0-0-0', title: '子节点1-1-1' },
            { key: '0-0-1', title: '子节点1-1-2' }
          ]
        }
      ]
    }
  ];
}`;

  // 自定义节点
  customSource = `
import { Component } from '@angular/core';
import { TreeComponent, TreeNodeOptions } from 'your-lib';

@Component({
  selector: 'app-custom-demo',
  standalone: true,
  imports: [TreeComponent],
  template: \`
    <lib-tree 
      [treeData]="treeData" 
      [defaultExpandAll]="true"
    >
      <ng-template #treeTemplate let-node let-origin="origin">
        <div class="custom-node">
          <span>{{ node.title }}</span>
          <span *ngIf="origin.type" class="node-type">{{ origin.type }}</span>
          <span *ngIf="origin.description" class="node-desc">{{ origin.description }}</span>
        </div>
      </ng-template>
    </lib-tree>

    <style>
      .custom-node {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .node-type {
        color: #1890ff;
        font-size: 12px;
        background-color: #e6f7ff;
        padding: 0 4px;
        border-radius: 2px;
      }
      .node-desc {
        color: rgba(0, 0, 0, 0.45);
        font-size: 12px;
      }
    </style>
  \`,
})
export class CustomTreeDemoComponent {
  treeData: TreeNodeOptions[] = [
    {
      key: '0',
      title: '项目结构',
      type: '目录',
      description: '项目根目录',
      children: [
        {
          key: '0-0',
          title: 'src',
          type: '目录',
          description: '源代码目录'
        }
      ]
    }
  ];
}`;

  // 虚拟滚动
  virtualSource = `
import { Component } from '@angular/core';
import { TreeComponent, TreeNodeOptions } from 'your-lib';

@Component({
  selector: 'app-virtual-demo',
  standalone: true,
  imports: [TreeComponent],
  template: \`
    <lib-tree 
      [treeData]="treeData" 
      [virtualHeight]="'300px'"
    ></lib-tree>
  \`,
})
export class VirtualTreeDemoComponent {
  treeData: TreeNodeOptions[] = [];
  
  constructor() {
    // 生成大量数据用于虚拟滚动演示
    this.generateLargeTreeData();
  }
  
  private generateLargeTreeData(): void {
    for (let i = 0; i < 100; i++) {
      const parentNode: TreeNodeOptions = {
        key: \`\${i}\`,
        title: \`父节点 \${i}\`,
        children: []
      };
      
      for (let j = 0; j < 10; j++) {
        const childNode: TreeNodeOptions = {
          key: \`\${i}-\${j}\`,
          title: \`子节点 \${i}-\${j}\`,
          children: []
        };
        
        for (let k = 0; k < 5; k++) {
          childNode.children!.push({
            key: \`\${i}-\${j}-\${k}\`,
            title: \`子节点 \${i}-\${j}-\${k}\`,
            isLeaf: true
          });
        }
        
        parentNode.children!.push(childNode);
      }
      
      this.treeData.push(parentNode);
    }
  }
}`;

  // 自定义图标
  iconSource = `
import { Component } from '@angular/core';
import { TreeComponent, TreeNodeOptions } from 'your-lib';

@Component({
  selector: 'app-icon-demo',
  standalone: true,
  imports: [TreeComponent],
  template: \`
    <lib-tree 
      [treeData]="treeData" 
      [showIcon]="true"
      [defaultExpandAll]="true"
    >
      <ng-template #iconTemplate let-node>
        <i class="tree-icon" [ngClass]="node.icon"></i>
      </ng-template>
    </lib-tree>
  \`,
})
export class IconTreeDemoComponent {
  treeData: TreeNodeOptions[] = [
    {
      key: '0',
      title: '文档',
      icon: 'folder-icon',
      children: [
        {
          key: '0-0',
          title: '图片',
          icon: 'image-icon',
          children: [
            { key: '0-0-0', title: 'logo.png', icon: 'image-file-icon' }
          ]
        }
      ]
    }
  ];
}`;

  // 可搜索的树
  searchSource = `
import { Component } from '@angular/core';
import { TreeComponent, TreeNodeOptions } from 'your-lib';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-demo',
  standalone: true,
  imports: [TreeComponent, FormsModule],
  template: \`
    <lib-tree 
      [treeData]="treeData" 
      [searchValue]="searchValue"
      (searchChange)="searchValue = $event"
    ></lib-tree>
  \`,
})
export class SearchTreeDemoComponent {
  searchValue = '';
  
  treeData: TreeNodeOptions[] = [
    {
      key: '0',
      title: '父节点1',
      children: [
        {
          key: '0-0',
          title: '子节点1-1',
          children: [
            { key: '0-0-0', title: '子节点1-1-1' }
          ]
        }
      ]
    }
  ];
}`;
}
