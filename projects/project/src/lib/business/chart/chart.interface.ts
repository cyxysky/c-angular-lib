// 统一的图表数据接口
export interface ChartData {
  name: string;
  value?: number;                // 数值，通用
  data?: number;                 // 替代 value，用于特定场景如图表数据点 (向下兼容或特定用途)
  color?: string;                // 颜色
  percentage?: number;           // 百分比，由服务计算
  series?: string;               // 系列名称，多系列图表使用
  children?: ChartData[];        // 子数据，用于层级结构如图柱状图的分组
  _id?: string;                  // 唯一标识，用于跟踪
  // 以下为服务内部计算或特定图表使用的字段
  startAngle?: number;           // 饼图使用，扇区起始角度
  endAngle?: number;             // 饼图使用，扇区结束角度
}

// 处理后的带角度信息的图表数据 (主要用于饼图内部)
export type ChartDataWithAngles = ChartData & {
  startAngle: number;
  endAngle: number;
  percentage: number;
};

// 处理后的饼图数据（向后兼容）
export type ProcessedPieData = PieChartData & { 
  startAngle: number; 
  endAngle: number; 
};

// 统一的图表选项接口
export interface ChartOptions {
  // 核心选项
  chartType: 'bar' | 'pie';     // 图表类型，必需
  width?: number;                // 宽度
  height?: number;               // 高度
  colors?: string[];             // 颜色数组 (barColors 将映射到此)
  backgroundColor?: string;      // 背景色
  title?: string;                // 标题
  animate?: boolean;             // 是否动画
  // 图例配置
  showLegend?: boolean;          // 是否显示图例
  legend?: {
    position?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  };
  // 悬停效果
  hoverEffect?: {
    enabled?: boolean;           // 是否启用悬停效果
    showTooltip?: boolean;       // 是否显示悬浮框
    tooltipHoverable?: boolean;  // 悬浮框是否可悬停
    // 柱状图特有
    showGuideLine?: boolean;     // 是否显示辅助线 (柱状图)
    guideLineStyle?: 'solid' | 'dashed'; // (柱状图)
    guideLineColor?: string;     // (柱状图)
    guideLineWidth?: number;     // (柱状图)
    // 饼图特有
    expandSlice?: boolean;       // 是否展开扇区 (饼图)
    expandRadius?: number;       // 展开半径 (饼图)
  };
  // 点击回调
  onClick?: (info: {
    item: ChartData;             // 点击的数据项
    index: number;               // 数据项在其集合中的索引
    seriesIndex?: number;        // 系列索引 (多系列图表如图柱状图)
    data: ChartData[];           // 完整数据集
    options: ChartOptions;       // 当前图表选项
    event: MouseEvent;           // 原始鼠标事件
    position?: {                 // 柱状图的点击位置和尺寸信息
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }) => void;
  // ======== 柱状图特有选项 ========
  barColors?: string[];          // 为保持兼容性，将合并到 `colors`
  borderRadius?: number;         // 柱形圆角
  showGrid?: boolean;            // 是否显示网格
  margin?: {                   // 边距
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showValues?: boolean;          // 是否在柱状图顶部显示数值
  // ======== 饼图特有选项 ========
  innerRadius?: number;          // 内圆半径（用于环形图）
  outerRadius?: number;          // 外圆半径
  startAngle?: number;        // 饼图起始角度 (通常由服务计算)
  endAngle?: number;          // 饼图结束角度 (通常由服务计算)
  showLabels?: boolean;          // 是否在饼图扇区显示标签
  showPercentage?: boolean;      // 是否在饼图标签或图例中显示百分比
  donutText?: string;            // 环形图中心文本
  dynamicSlices?: boolean;       // 切换图例时饼图扇区是否动态调整大小
}

// 保留原接口为向后兼容
export interface BarChartData {
  name: string;
  data?: number;
  color?: string;
  children?: BarChartData[];
  series?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
  _id?: string;
}

export interface PieChartOptions {
  width?: number;
  height?: number;
  colors?: string[];
  backgroundColor?: string;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  showLabels?: boolean;
  showPercentage?: boolean;
  showLegend?: boolean;
  donutText?: string;
  animate?: boolean;
  title?: string;
  dynamicSlices?: boolean;
  onClick?: (info: {
    item: PieChartData;
    index: number;
    data: PieChartData[];
    options: PieChartOptions;
    event: MouseEvent;
  }) => void;
  legend?: {
    position?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  };
  hoverEffect?: {
    enabled?: boolean;
    showTooltip?: boolean;
    expandSlice?: boolean;
    expandRadius?: number;
    tooltipHoverable?: boolean;
  };
}

export interface BarChartOptions {
  width?: number;
  height?: number;
  barColors?: string[];
  backgroundColor?: string;
  borderRadius?: number;
  showValues?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  title?: string;
  animate?: boolean;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  legend?: {
    position?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  };
  hoverEffect?: {
    enabled?: boolean;
    showTooltip?: boolean;
    showGuideLine?: boolean;
    guideLineStyle?: 'solid' | 'dashed';
    guideLineColor?: string;
    guideLineWidth?: number;
    tooltipHoverable?: boolean;
  };
  onClick?: (info: {
    item: BarChartData;
    index: number;
    seriesIndex: number;
    data: BarChartData[];
    options: BarChartOptions;
    event: MouseEvent;
    position: {
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



