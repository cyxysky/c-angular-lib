import { Component } from '@angular/core';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { ProjectModule } from '@project';
import { ApiData, DocApiTableComponent } from '../doc-api-table/doc-api-table.component';
import { CommonModule } from '@angular/common';
import { ChartData, BarChartOptions, BarComponent, ButtonComponent } from '@project';

@Component({
  selector: 'app-doc-chart',
  standalone: true,
  imports: [DocBoxComponent, ProjectModule, DocApiTableComponent, CommonModule, BarComponent, ButtonComponent],
  templateUrl: './doc-chart.component.html',
  styleUrl: './doc-chart.component.less'
})
export class DocChartComponent {
  // 基础数据
  basicData: ChartData[] = [
    { name: '一月', value: 35 },
    { name: '二月', value: 52 },
    { name: '三月', value: 61 },
    { name: '四月', value: 45 },
    { name: '五月', value: 70 },
    { name: '六月', value: 50 },
    { name: '七月', value: 80 },
    { name: '八月', value: 90 },
    { name: '九月', value: 100 },
    { name: '十月', value: 110 },
    { name: '十一月', value: 120 },
    { name: '十二月', value: 130 }
  ];

  // 包含零值的测试数据
  zeroValueData: ChartData[] = [
    { name: '一月', value: 35 },
    { name: '二月', value: 0 },
    { name: '三月', value: 61 },
    { name: '四月', value: 0 },
    { name: '五月', value: 70 },
    { name: '六月', value: 0 }
  ];

  // 零值测试选项
  zeroValueOptions: BarChartOptions = {
    title: '零值测试图表',
    barColors: ['#3498db'],
    borderRadius: 8
  };

  // 销售数据
  salesData: ChartData[] = [
    { name: '一季度', value: 120 },
    { name: '二季度', value: 180 },
    { name: '三季度', value: 240 },
    { name: '四季度', value: 300 }
  ];

  // 自定义颜色选项
  colorOptions: BarChartOptions = {
    barColors: ['#8e44ad', '#3498db', '#2ecc71', '#f1c40f', '#e74c3c'],
    borderRadius: 4
  };

  // 标题选项
  titleOptions: BarChartOptions = {
    title: '季度销售额统计',
    barColors: ['#3498db'],
    borderRadius: 4
  };

  // 无网格线选项
  noGridOptions: BarChartOptions = {
    showGrid: false,
    barColors: ['#3498db'],
    borderRadius: 4
  };

  // 圆角选项
  radiusOptions: BarChartOptions = {
    borderRadius: 12,
    barColors: ['#2ecc71']
  };

  // 无动画选项
  noAnimateOptions: BarChartOptions = {
    animate: false,
    barColors: ['#e74c3c'],
    borderRadius: 4
  };

  // 带悬停效果的选项
  hoverOptions: BarChartOptions = {
    barColors: ['#3498db'],
    borderRadius: 4,
    hoverEffect: {
      enabled: true,
      showTooltip: true,
      showGuideLine: true,
      guideLineStyle: 'dashed',
      guideLineColor: '#666',
      guideLineWidth: 1,
      tooltipHoverable: false
    }
  };

  // 点击事件相关
  clickedItem: any = null;
  
  // 点击事件选项
  clickOptions: BarChartOptions = {
    title: '季度销售额统计',
    barColors: ['#2980b9'],
    borderRadius: 6,
    onClick: (info) => {
      this.clickedItem = info;
      console.log('点击了柱形:', info);
    }
  };

  // 自定义悬浮框模板选项
  customTooltipOptions: BarChartOptions = {
    barColors: ['#9b59b6'],
    borderRadius: 8,
    hoverEffect: {
      enabled: true,
      showTooltip: true,
      showGuideLine: true,
      tooltipHoverable: true
    }
  };

  // 格式化销售额
  formatSalesValue(value: number): string {
    return value.toLocaleString('zh-CN') + ' 元';
  }

  refreshData() {
    this.basicData = this.basicData.map(item => ({
      ...item,
      value: Math.floor(Math.random() * 100)
    }));
  }

  // API 数据定义
  apiSections: ApiData[] = [
    {
      title: 'ChartData 数据接口',
      items: [
        {
          name: 'name',
          description: '数据项名称',
          type: 'string',
          default: '-'
        },
        {
          name: 'value',
          description: '数据项值',
          type: 'number',
          default: '-'
        }
      ]
    },
    {
      title: 'BarChartOptions 配置选项',
      items: [
        {
          name: 'width',
          description: '图表宽度',
          type: 'number',
          default: '600'
        },
        {
          name: 'height',
          description: '图表高度',
          type: 'number',
          default: '400'
        },
        {
          name: 'barColors',
          description: '柱形颜色数组，按顺序循环使用',
          type: 'string[]',
          default: "['#4285F4', '#34A853', '#FBBC05', '#EA4335', ...]"
        },
        {
          name: 'backgroundColor',
          description: '图表背景颜色',
          type: 'string',
          default: "'#ffffff'"
        },
        {
          name: 'borderRadius',
          description: '柱形圆角半径',
          type: 'number',
          default: '4'
        },
        {
          name: 'showValues',
          description: '是否显示数值',
          type: 'boolean',
          default: 'true'
        },
        {
          name: 'showGrid',
          description: '是否显示网格线',
          type: 'boolean',
          default: 'true'
        },
        {
          name: 'title',
          description: '图表标题',
          type: 'string',
          default: '-'
        },
        {
          name: 'animate',
          description: '是否启用动画效果',
          type: 'boolean',
          default: 'true'
        },
        {
          name: 'margin',
          description: '图表边距',
          type: 'object { top: number; right: number; bottom: number; left: number; }',
          default: "{ top: 40, right: 20, bottom: 50, left: 50 }"
        },
        {
          name: 'onClick',
          description: '柱形点击回调函数，接收包含点击详情的对象',
          type: 'function',
          default: '-'
        }
      ]
    },
    {
      title: 'BarChartOptions.hoverEffect 悬停效果配置',
      items: [
        {
          name: 'enabled',
          description: '是否启用悬停效果',
          type: 'boolean',
          default: 'true'
        },
        {
          name: 'showTooltip',
          description: '是否显示悬浮框',
          type: 'boolean',
          default: 'true'
        },
        {
          name: 'showGuideLine',
          description: '是否显示贯穿柱形的辅助线',
          type: 'boolean',
          default: 'true'
        },
        {
          name: 'guideLineStyle',
          description: '辅助线样式',
          type: "string ('dashed' | 'solid')",
          default: "'dashed'"
        },
        {
          name: 'guideLineColor',
          description: '辅助线颜色',
          type: 'string',
          default: "'#666'"
        },
        {
          name: 'guideLineWidth',
          description: '辅助线宽度',
          type: 'number',
          default: '1'
        },
        {
          name: 'tooltipHoverable',
          description: '悬浮框是否可以被悬停（悬停时不消失）',
          type: 'boolean',
          default: 'false'
        }
      ]
    },
    {
      title: 'onClick 回调参数',
      items: [
        {
          name: 'item',
          description: '点击的数据项',
          type: 'ChartData',
          default: '-'
        },
        {
          name: 'index',
          description: '点击的数据项索引',
          type: 'number',
          default: '-'
        },
        {
          name: 'data',
          description: '完整的数据集合',
          type: 'ChartData[]',
          default: '-'
        },
        {
          name: 'options',
          description: '图表的配置选项',
          type: 'BarChartOptions',
          default: '-'
        },
        {
          name: 'event',
          description: '原始的点击事件对象',
          type: 'MouseEvent',
          default: '-'
        },
        {
          name: 'position',
          description: '被点击柱形的位置信息',
          type: '{ x: number; y: number; width: number; height: number; }',
          default: '-'
        }
      ]
    },
    {
      title: 'BarComponent Inputs',
      items: [
        {
          name: 'data',
          description: '图表数据数组',
          type: 'ChartData[]',
          default: '[]'
        },
        {
          name: 'options',
          description: '图表配置选项',
          type: 'BarChartOptions',
          default: '{}'
        },
        {
          name: 'tooltipTemplate',
          description: '自定义悬浮框模板，可使用 ng-template，数据项作为 $implicit 参数传入',
          type: 'TemplateRef<{ $implicit: ChartData }>',
          default: '-'
        }
      ]
    }
  ];
  
  // 代码示例
  basicChartCode = `
import { Component } from '@angular/core';
import { ChartData } from '@project';

@Component({
  selector: 'app-chart-demo',
  template: \`<lib-bar [data]="basicData"></lib-bar>\`
})
export class ChartDemoComponent {
  basicData: ChartData[] = [
    { name: '一月', value: 35 },
    { name: '二月', value: 52 },
    { name: '三月', value: 61 },
    { name: '四月', value: 45 },
    { name: '五月', value: 70 },
    { name: '六月', value: 50 }
  ];
}`;

  colorChartCode = `
import { Component } from '@angular/core';
import { ChartData, BarChartOptions } from '@project';

@Component({
  selector: 'app-chart-demo',
  template: \`<lib-bar [data]="basicData" [options]="colorOptions"></lib-bar>\`
})
export class ChartDemoComponent {
  basicData: ChartData[] = [
    { name: '一月', value: 35 },
    { name: '二月', value: 52 },
    { name: '三月', value: 61 },
    { name: '四月', value: 45 },
    { name: '五月', value: 70 },
    { name: '六月', value: 50 }
  ];

  colorOptions: BarChartOptions = {
    barColors: ['#8e44ad', '#3498db', '#2ecc71', '#f1c40f', '#e74c3c'],
    borderRadius: 4
  };
}`;

  titleChartCode = `
import { Component } from '@angular/core';
import { ChartData, BarChartOptions } from '@project';

@Component({
  selector: 'app-chart-demo',
  template: \`<lib-bar [data]="salesData" [options]="titleOptions"></lib-bar>\`
})
export class ChartDemoComponent {
  salesData: ChartData[] = [
    { name: '一季度', value: 120 },
    { name: '二季度', value: 180 },
    { name: '三季度', value: 240 },
    { name: '四季度', value: 300 }
  ];

  titleOptions: BarChartOptions = {
    title: '季度销售额统计',
    barColors: ['#3498db'],
    borderRadius: 4
  };
}`;

  noGridChartCode = `
import { Component } from '@angular/core';
import { ChartData, BarChartOptions } from '@project';

@Component({
  selector: 'app-chart-demo',
  template: \`<lib-bar [data]="basicData" [options]="noGridOptions"></lib-bar>\`
})
export class ChartDemoComponent {
  basicData: ChartData[] = [
    { name: '一月', value: 35 },
    { name: '二月', value: 52 },
    { name: '三月', value: 61 },
    { name: '四月', value: 45 },
    { name: '五月', value: 70 },
    { name: '六月', value: 50 }
  ];

  noGridOptions: BarChartOptions = {
    showGrid: false,
    barColors: ['#3498db'],
    borderRadius: 4
  };
}`;

  radiusChartCode = `
import { Component } from '@angular/core';
import { ChartData, BarChartOptions } from '@project';

@Component({
  selector: 'app-chart-demo',
  template: \`<lib-bar [data]="basicData" [options]="radiusOptions"></lib-bar>\`
})
export class ChartDemoComponent {
  basicData: ChartData[] = [
    { name: '一月', value: 35 },
    { name: '二月', value: 52 },
    { name: '三月', value: 61 },
    { name: '四月', value: 45 },
    { name: '五月', value: 70 },
    { name: '六月', value: 50 }
  ];

  radiusOptions: BarChartOptions = {
    borderRadius: 12,
    barColors: ['#2ecc71']
  };
}`;

  noAnimateChartCode = `
import { Component } from '@angular/core';
import { ChartData, BarChartOptions } from '@project';

@Component({
  selector: 'app-chart-demo',
  template: \`<lib-bar [data]="basicData" [options]="noAnimateOptions"></lib-bar>\`
})
export class ChartDemoComponent {
  basicData: ChartData[] = [
    { name: '一月', value: 35 },
    { name: '二月', value: 52 },
    { name: '三月', value: 61 },
    { name: '四月', value: 45 },
    { name: '五月', value: 70 },
    { name: '六月', value: 50 }
  ];

  noAnimateOptions: BarChartOptions = {
    animate: false,
    barColors: ['#e74c3c'],
    borderRadius: 4
  };
}`;

  // 悬停效果示例代码
  hoverChartCode = `
import { Component } from '@angular/core';
import { ChartData, BarChartOptions } from '@project';

@Component({
  selector: 'app-chart-demo',
  template: \`<lib-bar [data]="basicData" [options]="hoverOptions"></lib-bar>\`
})
export class ChartDemoComponent {
  basicData: ChartData[] = [
    { name: '一月', value: 35 },
    { name: '二月', value: 52 },
    { name: '三月', value: 61 },
    { name: '四月', value: 45 },
    { name: '五月', value: 70 },
    { name: '六月', value: 50 }
  ];

  hoverOptions: BarChartOptions = {
    barColors: ['#3498db'],
    borderRadius: 4,
    hoverEffect: {
      enabled: true,
      showTooltip: true,
      showGuideLine: true,
      guideLineStyle: 'dashed',
      guideLineColor: '#666',
      guideLineWidth: 1
    }
  };
}`;

  // 点击事件示例代码
  clickChartCode = `
import { Component } from '@angular/core';
import { ChartData, BarChartOptions } from '@project';

@Component({
  selector: 'app-chart-demo',
  template: \`
    <lib-bar [data]="salesData" [options]="clickOptions"></lib-bar>
    
    <div *ngIf="clickedItem" class="click-result">
      <div class="click-result-title">点击结果：</div>
      <div class="click-result-content">
        <div>名称：{{ clickedItem.item.name }}</div>
        <div>数值：{{ clickedItem.item.value }}</div>
        <div>索引：{{ clickedItem.index }}</div>
        <div>图表标题：{{ clickedItem.options.title || '无标题' }}</div>
      </div>
    </div>
  \`
})
export class ChartDemoComponent {
  salesData: ChartData[] = [
    { name: '一季度', value: 120 },
    { name: '二季度', value: 180 },
    { name: '三季度', value: 240 },
    { name: '四季度', value: 300 }
  ];
  
  clickedItem: any = null;

  clickOptions: BarChartOptions = {
    title: '季度销售额统计',
    barColors: ['#2980b9'],
    borderRadius: 6,
    onClick: (info) => {
      this.clickedItem = info;
      console.log('点击了柱形:', info);
      
      // 可以在这里执行其他操作，如导航到详情页
      // this.router.navigate(['/detail', info.item.name]);
    }
  };
}`;

  // 自定义悬浮框代码
  customTooltipCode = `
import { Component } from '@angular/core';
import { ChartData, BarChartOptions } from '@project';

@Component({
  selector: 'app-chart-demo',
  template: \`
    <lib-bar 
      [data]="salesData" 
      [options]="customTooltipOptions"
      [tooltipTemplate]="customTooltip">
    </lib-bar>
    
    <ng-template #customTooltip let-item>
      <!-- 自定义悬浮框内容，右侧彩色边框由组件自动设置 -->
      <div style="display: flex; width: 100%; flex-direction: column;">
        <div style="padding: 16px 18px;">
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 12px; color: #222; letter-spacing: -0.3px;">
            {{item.name}}
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="color: #555; font-size: 13px; font-weight: 500;">销售额</span>
              <span style="font-weight: 500; color: #000; font-size: 13px; background-color: rgba(0, 0, 0, 0.04); padding: 4px 10px; border-radius: 16px; min-width: 60px; text-align: center;">{{formatSalesValue(item.value)}}</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="color: #555; font-size: 13px; font-weight: 500;">占比</span>
              <span style="font-weight: 500; color: #000; font-size: 13px; background-color: rgba(0, 0, 0, 0.04); padding: 4px 10px; border-radius: 16px; min-width: 60px; text-align: center;">{{((item.value / totalSales) * 100).toFixed(1)}}%</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
              <span style="color: #555; font-size: 13px; font-weight: 500;">详情</span>
              <span style="font-weight: 500; color: #3498db; font-size: 13px; background-color: rgba(52, 152, 219, 0.1); padding: 4px 10px; border-radius: 16px; min-width: 60px; text-align: center; cursor: pointer;">查看</span>
            </div>
          </div>
        </div>
      </div>
    </ng-template>
  \`
})
export class ChartDemoComponent {
  salesData: ChartData[] = [
    { name: '一季度', value: 120 },
    { name: '二季度', value: 180 },
    { name: '三季度', value: 240 },
    { name: '四季度', value: 300 }
  ];
  
  // 计算总销售额
  get totalSales(): number {
    return this.salesData.reduce((sum, item) => sum + item.value, 0);
  }

  customTooltipOptions: BarChartOptions = {
    barColors: ['#9b59b6'],
    borderRadius: 8,
    hoverEffect: {
      enabled: true,
      showTooltip: true,
      showGuideLine: true,
      tooltipHoverable: true
    }
  };
  
  formatSalesValue(value: number): string {
    return value.toLocaleString('zh-CN') + ' 元';
  }
}`;
}
