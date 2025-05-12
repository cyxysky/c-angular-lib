export interface ChartData {
  name: string;
  value: number;
  color?: string; // 可选颜色，用于单独设置数据点颜色
}

export interface ChartSeries {
  name: string; // 系列名称，用于图例显示
  data: ChartData[]; // 系列中的数据点
  color?: string; // 系列颜色，如果设置则覆盖默认颜色
}

export interface BarChartOptions {
  width?: number;
  height?: number;
  barColors?: string[];
  backgroundColor?: string;
  borderRadius?: number; 
  showValues?: boolean;
  showGrid?: boolean;
  title?: string;
  animate?: boolean;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  // 图例配置
  legend?: {
    show?: boolean; // 是否显示图例
    position?: 'top' | 'bottom' | 'left' | 'right'; // 图例位置
    align?: 'start' | 'center' | 'end'; // 图例对齐方式
  };
  // 悬停效果配置
  hoverEffect?: {
    enabled?: boolean;          // 是否启用悬停效果
    showTooltip?: boolean;      // 是否显示悬浮框
    showGuideLine?: boolean;    // 是否显示贯穿柱形的辅助线
    guideLineStyle?: 'solid' | 'dashed';    // 辅助线样式，例如 'dashed' 或 'solid'
    guideLineColor?: string;    // 辅助线颜色
    guideLineWidth?: number;    // 辅助线宽度
    tooltipHoverable?: boolean; // 悬浮框是否可以被悬停（悬停时不消失）
  };
  // 点击回调函数，接收所有相关的柱状图信息
  onClick?: (info: {
    item: ChartData;            // 点击的数据项
    index: number;              // 数据项索引
    seriesIndex: number;        // 系列索引
    data: ChartSeries[];        // 完整数据集
    options: BarChartOptions;   // 图表配置
    event: MouseEvent;          // 原始点击事件
    position: {                 // 被点击柱形的位置信息
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }) => void;
}



