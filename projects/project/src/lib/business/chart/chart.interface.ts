export interface ChartData {
  name: string;
  value: number;
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
    data: ChartData[];          // 完整数据集
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



