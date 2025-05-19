/** 文本颜色 */
export const DEFAULT_TEXT_COLOR = '#333333';
/** 次要文本颜色 */
export const DEFAULT_MUTED_TEXT_COLOR = '#666666';
/** 背景文本颜色 */
export const DEFAULT_BACKGROUND_TEXT_COLOR = '#ffffff';
/** 标题字体 */
export const DEFAULT_TITLE_FONT = 'bold 16px Arial';
/** 标签字体 */
export const DEFAULT_LABEL_FONT = '12px Arial';
/** 饼图标签字体 */
export const DEFAULT_PIE_LABEL_FONT = 'bold 13px Arial, sans-serif';
/** 饼图标签颜色 */
export const DEFAULT_PIE_LABEL_COLOR = '#fff';
/** 网格线颜色 */
export const DEFAULT_GRID_LINE_COLOR = '#e0e0e0';
/** 网格线宽度 */
export const DEFAULT_GRID_LINE_WIDTH = 0.5;
/** 轴线颜色 */
export const DEFAULT_AXIS_LINE_COLOR = '#333333';
/** 轴线宽度 */
export const DEFAULT_AXIS_LINE_WIDTH = 1;
/** 饼图扇区边框颜色 */
export const DEFAULT_PIE_SLICE_BORDER_COLOR = 'rgba(255, 255, 255, 0.7)';
/** 饼图扇区边框宽度 */
export const DEFAULT_PIE_SLICE_BORDER_WIDTH = 1;
/** 悬停时饼图扇区边框颜色 */
export const HOVER_PIE_SLICE_BORDER_COLOR = '#fff';
/** 悬停时饼图扇区边框宽度 */
export const HOVER_PIE_SLICE_BORDER_WIDTH = 2;
/** 悬停时饼图扇区阴影颜色 */
export const HOVER_PIE_SHADOW_COLOR = 'rgba(0, 0, 0, 0.3)';
/** 悬停时饼图扇区阴影模糊 */
export const HOVER_PIE_SHADOW_BLUR = 8;
/** 饼图环形文本阴影颜色 */
export const DEFAULT_DONUT_TEXT_SHADOW_COLOR = 'rgba(0, 0, 0, 0.1)';
/** 饼图环形文本阴影模糊 */
export const DEFAULT_DONUT_TEXT_SHADOW_BLUR = 4;
/** 饼图扇区标签阴影颜色 */
export const DEFAULT_SLICE_LABEL_SHADOW_COLOR = 'rgba(0, 0, 0, 0.4)';
/** 饼图扇区标签阴影模糊 */
export const DEFAULT_SLICE_LABEL_SHADOW_BLUR = 3;
/** 饼图扇区标签对比色边框颜色 */
export const DEFAULT_SLICE_LABEL_CONTRAST_STROKE_COLOR = 'rgba(0, 0, 0, 0.7)';
/** 饼图扇区标签对比色边框宽度 */
export const DEFAULT_SLICE_LABEL_CONTRAST_STROKE_WIDTH = 3;
/** 图表边距 */
export const DEFAULT_MARGIN = { top: 40, right: 40, bottom: 40, left: 40 };

/** 图表数据 */
export interface ChartData {
  /** 名称 */
  name: string;
  /** 数据 */
  data?: number;
  /** 颜色 */
  color?: string;
  /** 子数据 */
  children?: ChartData[];
}

/** 处理后的带角度信息的图表数据 (主要用于饼图内部) */
export type ChartDataWithAngles = ChartData & {
  startAngle: number;
  endAngle: number;
  percentage: number; // 用于绘制扇区的调整后百分比
  originalPercentage: number; // 原始数据计算出的真实百分比，用于显示
};

/** 处理后的饼图数据（向后兼容） */
export type ProcessedPieData = ChartData & {
  startAngle: number;
  endAngle: number;
};

/** 处理后的折线图数据 */
export type ProcessedLineData = ChartData & {
  x: number;
  y: number;
};

/** 折线图特有配置 */
export interface LineSpecificOptions {
  /** 边距 */
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** 是否在折线图顶部显示数值 (通常指数据点上的标签) */
  showValues?: boolean;
  /** 是否显示辅助线 (通常指Y轴网格线) */
  showGuideLine?: boolean;
  /** 辅助线样式 */
  guideLineStyle?: 'solid' | 'dashed';
  /** 辅助线颜色 */
  guideLineColor?: string;
  /** 辅助线宽度 */
  guideLineWidth?: number;
  /** 线条宽度 */
  lineWidth?: number;
  /** 线条样式 */
  lineStyle?: 'solid' | 'dashed';
  /** 是否显示数据点 */
  showPoints?: boolean;
  /** 数据点样式 */
  pointStyle?: 'circle' | 'square' | 'triangle';
  /** 数据点大小 */
  pointSize?: number;
  /** 数据点颜色 (如果未指定，通常跟随线条颜色) */
  pointColor?: string;
  /** 数据点边框颜色 */
  pointBorderColor?: string;
  /** 数据点边框宽度 */
  pointBorderWidth?: number;
  /** 是否平滑曲线 (例如使用贝塞尔曲线) */
  smoothLine?: boolean;
  /** 是否填充线下区域 */
  areaFill?: boolean;
  /** 填充区域颜色 (如果未指定，通常基于线条颜色并带有透明度) */
  areaFillColor?: string;
  /** 填充区域透明度 */
  areaFillOpacity?: number;
  /** X轴标签旋转角度 */
  xAxisLabelRotation?: number;
  /** 是否显示X轴刻度线 */
  showXAxisTicks?: boolean;
  /** 是否显示Y轴刻度线 */
  showYAxisTicks?: boolean;
}

/** 柱状图特有配置 */
export interface BarSpecificOptions {
  /** 柱形圆角 */
  borderRadius?: number;
  /** 是否显示网格 */
  showGrid?: boolean;
  /** 边距 */
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** 是否在柱状图顶部显示数值 */
  showValues?: boolean;
  /** 是否显示辅助线 */
  showGuideLine?: boolean;
  /** 辅助线样式 */
  guideLineStyle?: 'solid' | 'dashed';
  /** 辅助线颜色 */
  guideLineColor?: string;
  /** 辅助线宽度 */
  guideLineWidth?: number;

}

/** 饼图特有配置 */
export interface PieSpecificOptions {
  /** 内圆半径（用于环形图） */
  innerRadius?: number;
  /** 外圆半径 */
  outerRadius?: number;
  /** 是否在饼图扇区显示标签 */
  showLabels?: boolean;
  /** 是否在饼图标签或图例中显示百分比 */
  showPercentage?: boolean;
  /** 环形图中心文本 */
  donutText?: string;
  /** 切换图例时饼图扇区是否动态调整大小 */
  dynamicSlices?: boolean;
  /** 最小扇形大小 */
  minSliceSize?: number;
  /** 切片悬浮效果 */
  sliceHoverEffect?: {
    shadowColor?: string;
    shadowBlur?: number;
  };
  /** 是否展开扇区 */
  expandSlice?: boolean;
  /** 展开半径 */
  expandRadius?: number;
}

/** 统一的图表选项接口 */
export interface ChartOptions {
  /** 图表类型 */
  chartType: 'bar' | 'pie' | 'line';
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
  /** 颜色数组 */
  colors?: string[];
  /** 背景色 */
  backgroundColor?: string;
  /** 标题 */
  title?: string;
  /** 是否动画 */
  animate?: boolean;
  /** 图例配置 */
  showLegend?: boolean;
  /** 图例位置 */
  legend?: {
    position?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  };
  /** 悬停效果 */
  hoverEffect?: {
    /** 是否启用悬停效果 */
    enabled?: boolean;
    /** 是否显示悬浮框 */
    showTooltip?: boolean;
    /** 悬浮框是否可悬停 */
    tooltipHoverable?: boolean;
  };
  /** 柱状图特有配置 */
  bar?: BarSpecificOptions;
  /** 饼图特有配置 */
  pie?: PieSpecificOptions;
  /** 折线图特有配置 */
  line?: LineSpecificOptions;
  /** 点击回调 */
  onClick?: (info: {
    /** 点击的数据项 */
    item: ChartData;
    /** 数据项在其集合中的索引 */
    index: number;
    /** 系列索引 (多系列图表如图柱状图) */
    groupIndex?: number;
    /** 完整数据集 */
    data: ChartData[];
    /** 当前图表选项 */
    options: ChartOptions;
    /** 原始鼠标事件 */
    event: MouseEvent;
    /** 柱状图的点击位置和尺寸信息 */
    position?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }) => void;
}

// 新增：用于服务向组件传递悬浮框更新信息的接口
export interface TooltipUpdate {
  isVisible: boolean;
  data?: any; // 传递给模板的上下文数据
  position?: { x: number; y: number }; // 悬浮框左上角的目标位置
  borderColor?: string; // 悬浮框顶部边框颜色
  mouseEvent?: MouseEvent; // 悬浮框的鼠标事件
}

/** 图例项 */
export interface LegendItem {
  name: string;
  color: string;
  visible: boolean;
  active: boolean;
  percentageText?: string;
  numberText?: string;
}

/** 坐标轴刻度 */
export interface Scale {
	minPoint: number;
	maxPoint: number;
	tickSpacing: number;
	niceMin: number;
	niceMax: number;
	range: number;
}