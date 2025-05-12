import { Component } from '@angular/core';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { ProjectModule } from '@project';
import { ApiData, DocApiTableComponent } from '../doc-api-table/doc-api-table.component';
import { CommonModule } from '@angular/common';
import { ChartData, BarChartOptions, BarComponent, ButtonComponent, ChartSeries } from '@project';

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
  
  // 多系列数据
  multiSeriesData: ChartSeries[] = [
    {
      name: '2022年',
      data: [
        { name: '一季度', value: 120 },
        { name: '二季度', value: 150 },
        { name: '三季度', value: 180 },
        { name: '四季度', value: 210 }
      ]
    },
    {
      name: '2023年',
      data: [
        { name: '一季度', value: 140 },
        { name: '二季度', value: 170 },
        { name: '三季度', value: 200 },
        { name: '四季度', value: 250 }
      ]
    }
  ];
  
  // 自定义多系列数据
  customMultiSeriesData: ChartSeries[] = [
    {
      name: '北京',
      color: '#FF6384',
      data: [
        { name: '一季度', value: 180 },
        { name: '二季度', value: 200 },
        { name: '三季度', value: 220 },
        { name: '四季度', value: 270 }
      ]
    },
    {
      name: '上海',
      color: '#36A2EB',
      data: [
        { name: '一季度', value: 160 },
        { name: '二季度', value: 190 },
        { name: '三季度', value: 210 },
        { name: '四季度', value: 240 }
      ]
    },
    {
      name: '广州',
      color: '#FFCE56',
      data: [
        { name: '一季度', value: 140 },
        { name: '二季度', value: 170 },
        { name: '三季度', value: 200 },
        { name: '四季度', value: 230 }
      ]
    }
  ];
  
  // 自定义多系列选项
  customMultiSeriesOptions: BarChartOptions = {
    title: '2023年主要城市季度销售额',
    legend: {
      show: true,
      position: 'top',
      align: 'center'
    },
    borderRadius: 6,
    margin: { top: 60, right: 20, bottom: 50, left: 50 }
  };
  
  // 多系列悬浮框选项
  multiSeriesTooltipOptions: BarChartOptions = {
    title: '年度季度对比',
    legend: {
      show: true,
      position: 'top',
      align: 'center'
    },
    borderRadius: 6,
    hoverEffect: {
      enabled: true,
      showTooltip: true,
      showGuideLine: true,
      tooltipHoverable: true
    }
  };

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
    return value + ' 元';
  }
  
  // 格式化数值（通用）
  formatValue(value: number): string {
    return value.toString();
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
        },
        {
          name: 'color',
          description: '数据项颜色（可选）',
          type: 'string',
          default: '-'
        }
      ]
    },
    {
      title: 'ChartSeries 系列接口',
      items: [
        {
          name: 'name',
          description: '系列名称，用于图例显示',
          type: 'string',
          default: '-'
        },
        {
          name: 'data',
          description: '系列中的数据点',
          type: 'ChartData[]',
          default: '-'
        },
        {
          name: 'color',
          description: '系列颜色（可选），如果设置则覆盖默认颜色',
          type: 'string',
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
          name: 'legend',
          description: '图例配置选项',
          type: 'object { show?: boolean; position?: string; align?: string; }',
          default: "{ show: true, position: 'top', align: 'center' }"
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
      title: 'BarChartOptions.legend 图例配置',
      items: [
        {
          name: 'show',
          description: '是否显示图例',
          type: 'boolean',
          default: 'true'
        },
        {
          name: 'position',
          description: '图例位置',
          type: "string ('top' | 'bottom' | 'left' | 'right')",
          default: "'top'"
        },
        {
          name: 'align',
          description: '图例对齐方式',
          type: "string ('start' | 'center' | 'end')",
          default: "'center'"
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
          name: 'seriesIndex',
          description: '点击的系列索引',
          type: 'number',
          default: '-'
        },
        {
          name: 'data',
          description: '完整的数据集合',
          type: 'ChartSeries[]',
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
          description: '图表数据数组，可以是单系列数据ChartData[]或多系列数据ChartSeries[]',
          type: 'ChartData[] | ChartSeries[]',
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
          description: '自定义悬浮框模板，可使用ng-template，数据会作为$implicit参数传入',
          type: 'TemplateRef<{ $implicit: any }>',
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

  // 多系列图表示例代码
  multiSeriesChartCode = `
import { Component } from '@angular/core';
import { ChartSeries } from '@project';

@Component({
  selector: 'app-chart-demo',
  template: \`<lib-bar [data]="multiSeriesData"></lib-bar>\`
})
export class ChartDemoComponent {
  multiSeriesData: ChartSeries[] = [
    {
      name: '2022年',
      data: [
        { name: '一季度', value: 120 },
        { name: '二季度', value: 150 },
        { name: '三季度', value: 180 },
        { name: '四季度', value: 210 }
      ]
    },
    {
      name: '2023年',
      data: [
        { name: '一季度', value: 140 },
        { name: '二季度', value: 170 },
        { name: '三季度', value: 200 },
        { name: '四季度', value: 250 }
      ]
    }
  ];
}`;

  // 自定义多系列图表示例代码
  customMultiSeriesChartCode = `
import { Component } from '@angular/core';
import { ChartSeries, BarChartOptions } from '@project';

@Component({
  selector: 'app-chart-demo',
  template: \`<lib-bar [data]="customMultiSeriesData" [options]="customMultiSeriesOptions"></lib-bar>\`
})
export class ChartDemoComponent {
  customMultiSeriesData: ChartSeries[] = [
    {
      name: '北京',
      color: '#FF6384', // 自定义系列颜色
      data: [
        { name: '一季度', value: 180 },
        { name: '二季度', value: 200 },
        { name: '三季度', value: 220 },
        { name: '四季度', value: 270 }
      ]
    },
    {
      name: '上海',
      color: '#36A2EB',
      data: [
        { name: '一季度', value: 160 },
        { name: '二季度', value: 190 },
        { name: '三季度', value: 210 },
        { name: '四季度', value: 240 }
      ]
    },
    {
      name: '广州',
      color: '#FFCE56',
      data: [
        { name: '一季度', value: 140 },
        { name: '二季度', value: 170 },
        { name: '三季度', value: 200 },
        { name: '四季度', value: 230 }
      ]
    }
  ];
  
  customMultiSeriesOptions: BarChartOptions = {
    title: '2023年主要城市季度销售额',
    legend: {
      show: true,
      position: 'top',
      align: 'center'
    },
    borderRadius: 6,
    margin: { top: 60, right: 20, bottom: 50, left: 50 }
  };
}`;

  // 多系列悬浮框示例代码
  multiSeriesTooltipCode = `
import { Component } from '@angular/core';
import { ChartSeries, BarChartOptions } from '@project';

@Component({
  selector: 'app-chart-demo',
  template: \`
    <lib-bar 
      [data]="multiSeriesData" 
      [options]="multiSeriesTooltipOptions" 
      [tooltipTemplate]="multiSeriesTooltip">
    </lib-bar>
    
    <ng-template #multiSeriesTooltip let-data>
      <div style="display: flex; width: 100%; flex-direction: column;">
        <div style="padding: 12px;">
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: #222; letter-spacing: -0.3px;">
            {{data.series.name}} - {{data.item.name}}
          </div>
          <div style="display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #555; font-size: 13px; font-weight: 500;">数值</span>
              <span style="font-weight: 500; color: #000; font-size: 13px; padding: 4px 10px;min-width: 60px; text-align: center;">{{formatValue(data.item.value)}}</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="color: #555; font-size: 13px; font-weight: 500;">系列索引</span>
              <span style="font-weight: 500; color: #000; font-size: 13px; padding: 4px 10px; min-width: 60px; text-align: center;">{{data.seriesIndex}}</span>
            </div>
          </div>
        </div>
      </div>
    </ng-template>
  \`
})
export class ChartDemoComponent {
  multiSeriesData: ChartSeries[] = [
    {
      name: '2022年',
      data: [
        { name: '一季度', value: 120 },
        { name: '二季度', value: 150 },
        { name: '三季度', value: 180 },
        { name: '四季度', value: 210 }
      ]
    },
    {
      name: '2023年',
      data: [
        { name: '一季度', value: 140 },
        { name: '二季度', value: 170 },
        { name: '三季度', value: 200 },
        { name: '四季度', value: 250 }
      ]
    }
  ];
  
  multiSeriesTooltipOptions: BarChartOptions = {
    title: '年度季度对比',
    legend: {
      show: true,
      position: 'top',
      align: 'center'
    },
    borderRadius: 6,
    hoverEffect: {
      enabled: true,
      showTooltip: true,
      showGuideLine: true,
      tooltipHoverable: true
    }
  };
  
  formatValue(value: number): string {
    return value.toLocaleString('zh-CN');
  }
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
        <div style="padding: 12px;">
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: #222; letter-spacing: -0.3px;">
            {{item.name}}
          </div>
          <div style="display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #555; font-size: 13px; font-weight: 500;">销售额</span>
              <span style="font-weight: 500; color: #000; font-size: 13px; padding: 4px 10px; min-width: 60px; text-align: center;">{{formatSalesValue(item.value)}}</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #555; font-size: 13px; font-weight: 500;">占比</span>
              <span style="font-weight: 500; color: #000; font-size: 13px; padding: 4px 10px; min-width: 60px; text-align: center;">{{((item.value / totalSales) * 100).toFixed(1)}}%</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="color: #555; font-size: 13px; font-weight: 500;">详情</span>
              <span style="font-weight: 500; color: #3498db; font-size: 13px; padding: 4px 10px; min-width: 60px; text-align: center; cursor: pointer;">查看</span>
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
