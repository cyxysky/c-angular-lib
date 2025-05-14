export interface BarChartData {
  name: string;
  data?: number; // 单个数值，可选
  color?: string; // 可选颜色，用于设置数据点颜色
  children?: BarChartData[]; // 子数据，用于多系列数据
  series?: string; // 系列名称，用于图例显示
}

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
  selected?: boolean;
}

export interface PieChartOptions {
  width?: number;
  height?: number;
  colors?: string[];
  backgroundColor?: string;
  innerRadius?: number; // 内圆半径，用于创建环形图
  outerRadius?: number; // 外圆半径
  startAngle?: number; // 起始角度，默认为0
  endAngle?: number; // 结束角度，默认为2π
  showLabels?: boolean; // 是否显示标签
  showPercentage?: boolean; // 是否显示百分比
  showLegend?: boolean; // 是否显示图例
  donutText?: string; // 环形图中心显示的文本
  animate?: boolean; // 是否启用动画
  title?: string; // 图表标题
  // 点击回调函数
  onClick?: (info: {
    item: PieChartData;
    index: number;
    data: PieChartData[];
    options: PieChartOptions;
    event: MouseEvent;
  }) => void;
  // 图例配置
  legend?: {
    position?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  };
  // 悬停效果配置
  hoverEffect?: {
    enabled?: boolean;
    showTooltip?: boolean;
    expandSlice?: boolean;
    expandRadius?: number;
  };
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
    item: BarChartData;            // 点击的数据项
    index: number;              // 数据项索引
    seriesIndex: number;        // 系列索引
    data: BarChartData[];          // 完整数据集
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



