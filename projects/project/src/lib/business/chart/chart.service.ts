import { Injectable, TemplateRef, ElementRef, NgZone, Renderer2 } from '@angular/core';
import { ChartData, ChartOptions, ChartDataWithAngles } from './chart.interface';

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

@Injectable({
  providedIn: 'root'
})
export class ChartService {
  constructor() { }

  /**
   * 计算饼图扇区角度
   */
  calculatePieAngles(data: ChartData[], minSlicePercent?: number): ChartDataWithAngles[] {
    if (!data || data.length === 0) return [];
    const totalValue = data.reduce((sum, item) => {
      const value = Math.max(0, item.data || 0); // 确保值为非负数
      return sum + value;
    }, 0);
    if (totalValue <= 0) {
      // 处理所有数据项都为零或负数的情况：均分角度或所有角度为零
      const numSlices = data.length;
      const anglePerSlice = numSlices > 0 ? (Math.PI * 2) / numSlices : 0;
      let currentAngle = 0;
      return data.map(item => {
        const sliceAngle = numSlices > 0 ? anglePerSlice : 0;
        const result = {
          ...item,
          startAngle: currentAngle,
          endAngle: currentAngle + sliceAngle,
          percentage: numSlices > 0 ? 100 / numSlices : 0, // 调整后的百分比，用于绘制
          originalPercentage: numSlices > 0 ? 100 / numSlices : 0, // 原始百分比，用于显示
          data: item.data || 0 // 保留原始数据值
        };
        currentAngle += sliceAngle;
        return result;
      });
    }
    // 准备包含初始百分比的条目
    let processedItems = data.map(item => ({
      originalItem: item,
      value: Math.max(0, item.data || 0),
      // originalPercentage 用于显示，直接根据原始数据计算
      originalPercentage: (Math.max(0, item.data || 0) / totalValue) * 100,
      // percentage 用于后续可能的调整（基于minSlicePercent），并用于绘制角度
      percentage: (Math.max(0, item.data || 0) / totalValue) * 100,
    }));
    // 按数据值排序有助于确定哪些切片最初较大/较小，但迭代调整会处理最终大小
    processedItems.sort((a, b) => b.value - a.value);
    let adjustedPercentages = processedItems.map(p => p.percentage);
    if (minSlicePercent && minSlicePercent > 0 && data.length > 0) {
      const numSlices = data.length;
      if (numSlices * minSlicePercent > 100.0 + 1e-9) { // 为浮点数比较添加容差
        // 如果所有切片的minSlicePercent总和超过100%，则使所有切片均等
        const equalPercent = 100.0 / numSlices;
        adjustedPercentages = adjustedPercentages.map(() => equalPercent);
      } else {
        const MAX_ITERATIONS = 10; // 最大迭代次数以防止无限循环
        const TOLERANCE = 1e-6; // 收敛的容差
        for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
          let modifiedInIteration = false;
          // 1. 应用最小百分比（下限）
          for (let i = 0; i < numSlices; i++) {
            if (adjustedPercentages[i] < minSlicePercent - TOLERANCE) {
              if (Math.abs(adjustedPercentages[i] - minSlicePercent) > TOLERANCE) {
                modifiedInIteration = true;
              }
              adjustedPercentages[i] = minSlicePercent;
            }
          }
          // 2. 计算当前总和
          const currentSum = adjustedPercentages.reduce((sum, p) => sum + p, 0);
          // 3. 归一化（如果总和不为零且与100有显著差异）
          if (Math.abs(currentSum) > TOLERANCE && Math.abs(currentSum - 100.0) > TOLERANCE) {
            for (let i = 0; i < numSlices; i++) {
              const newPercentage = (adjustedPercentages[i] / currentSum) * 100.0;
              if (Math.abs(adjustedPercentages[i] - newPercentage) > TOLERANCE) {
                modifiedInIteration = true;
              }
              adjustedPercentages[i] = newPercentage;
            }
          } else if (Math.abs(currentSum) < TOLERANCE && numSlices > 0) { // 总和为零，但存在条目
            const equalPercent = 100.0 / numSlices;
            for (let i = 0; i < numSlices; i++) {
              if (Math.abs(adjustedPercentages[i] - equalPercent) > TOLERANCE) modifiedInIteration = true;
              adjustedPercentages[i] = equalPercent;
            }
          }
          if (!modifiedInIteration) {
            break; // 已收敛
          }
        }
      }
    }
    // 最后一步确保总和由于潜在的浮点误差正好是100
    const finalSum = adjustedPercentages.reduce((sum, p) => sum + p, 0);
    if (Math.abs(finalSum - 100.0) > 1e-9 && Math.abs(finalSum) > 1e-9) {
      for (let i = 0; i < adjustedPercentages.length; i++) {
        adjustedPercentages[i] = (adjustedPercentages[i] / finalSum) * 100.0;
      }
    }

    const resultWithAngles: ChartDataWithAngles[] = [];
    let currentAngle = 0;
    processedItems.forEach((item, index) => {
      const visualPercentage = adjustedPercentages[index]; // 用于绘制的百分比
      const angleSize = (visualPercentage / 100) * (Math.PI * 2);
      resultWithAngles.push({
        ...(item.originalItem),
        data: item.value, // 确保data是用于计算的数值
        startAngle: currentAngle,
        endAngle: currentAngle + angleSize,
        percentage: visualPercentage, // 存储调整后的百分比，用于绘制
        originalPercentage: item.originalPercentage, // 存储原始百分比，用于显示
      });
      currentAngle += angleSize;
    });
    // 由于浮点运算，最后一个切片的endAngle可能不完全是2*PI。如果需要，进行调整。
    if (resultWithAngles.length > 0) {
      const lastSlice = resultWithAngles[resultWithAngles.length - 1];
      if (Math.abs(lastSlice.endAngle - Math.PI * 2) > 1e-9 && Math.abs(lastSlice.endAngle) > 1e-9) { // 如果不是已经是2PI
        // 如果currentAngle与2*PI略有偏差，调整最后一个切片
        if (Math.abs(currentAngle - Math.PI * 2) > 1e-9) {
          lastSlice.endAngle = Math.PI * 2;
        }
      }
      // 如果只有一个切片且角度略有偏差，确保第一个切片从0开始
      if (resultWithAngles.length === 1 && Math.abs(resultWithAngles[0].startAngle) > 1e-9) {
        resultWithAngles[0].endAngle = Math.PI * 2 - resultWithAngles[0].startAngle;
        resultWithAngles[0].startAngle = 0;
      }
    }
    return resultWithAngles;
  }

  /**
   * 生成随机颜色
   */
  generateRandomColor(): string {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  }

  /**
   * 计算数据集最大值
   */
  getMaxValue(data: ChartData[]): number {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map(item => {
      if (item.children && item.children.length > 0) {
        return this.getMaxValue(item.children);
      }
      if (item.data === undefined) return 0;
      return item.data;
    }));
  }

  /**
   * 获取所有分组名称
   */
  getGroupNames(data: ChartData[]): string[] {
    if (!data || data.length === 0) return [];
    const groupNames: string[] = [];
    data.forEach(item => {
      if (item.children && item.children.length > 0 && item.name && !groupNames.includes(item.name)) {
        groupNames.push(item.name);
      }
    });
    return groupNames;
  }

  /**
   * 格式化数值，添加千位分隔符
   */
  formatNumber(value: number): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * 创建平滑的动画过渡值
   */
  easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  /**
   * 为饼图数据分配颜色
   * @param data 饼图数据
   * @param colors 可选的颜色数组
   * @returns 分配了颜色的饼图数据
   */
  assignPieColors(data: ChartData[], colors?: string[]): ChartData[] {
    if (!data || data.length === 0) return [];

    // 如果没有提供颜色或颜色不足，生成随机颜色
    const assignedColors = colors && colors.length >= data.length
      ? colors
      : Array(data.length).fill(0).map(() => this.generateRandomColor());

    return data.map((item, index) => ({
      ...item,
      color: item.color || assignedColors[index % assignedColors.length]
    }));
  }

  /**
   * 计算并格式化百分比
   * @param value 当前值
   * @param totalValue 总值
   * @returns 百分比字符串 (例如 "25.0%")
   */
  public calculatePercentage(value: number | undefined, totalValue: number): string {
    const numValue = typeof value === 'number' ? value : 0;
    return (totalValue > 0 ? (numValue / totalValue * 100).toFixed(1) : '0') + '%';
  }

  /** 
   * 格式化百分比
   * @param value 当前值
   * @param totalValue 总值
   * @returns 百分比字符串 (例如 "25.0%")
   */
  public formatPercentage(value: number | undefined): string {
    return value !== undefined ? value.toFixed(1) + '%' : '0%';
  }
  
  /**
   * 绘制标题
   */
  public drawTitle(ctx: CanvasRenderingContext2D, title: string | undefined, margin: { top: number, left: number, right: number, bottom: number }, chartAreaWidth: number): void {
    if (!title) return;
    ctx.fillStyle = DEFAULT_TEXT_COLOR;
    ctx.font = DEFAULT_TITLE_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; // Common for titles
    ctx.fillText(title, margin.left + chartAreaWidth / 2, margin.top / 2);
  }

  /**
   * Converts a color string (hex, rgb) to rgba with specified opacity.
   * @param color The input color string (e.g., '#FF0000', 'rgb(255,0,0)').
   * @param opacity The desired opacity (0 to 1).
   * @returns The color string in rgba format.
   */
  public colorWithOpacity(color: string, opacity: number): string {
    if (color.startsWith('rgba')) {
      // If already rgba, just replace the opacity part
      return color.replace(/[^,]+(?=\))/, opacity.toString());
    }
    if (color.startsWith('rgb')) {
      // If rgb, convert to rgba
      return color.replace('rgb', 'rgba').replace(')', `,${opacity})`);
    }
    if (color.startsWith('#')) {
      let r = 0, g = 0, b = 0;
      if (color.length === 4) { // #RGB format
        r = parseInt(color[1] + color[1], 16);
        g = parseInt(color[2] + color[2], 16);
        b = parseInt(color[3] + color[3], 16);
      } else if (color.length === 7) { // #RRGGBB format
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
      }
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    // Fallback for named colors or other formats (less accurate without a full parsing library)
    console.warn('Unsupported color format for direct opacity adjustment, returning color as is with attempted rgba conversion for common cases or if parsing fails:', color);
    // Attempt to draw the color to a temporary canvas to get its RGBA value (browser environment only)
    try {
      const tempCtx = document.createElement('canvas').getContext('2d');
      if (tempCtx) {
        tempCtx.fillStyle = color;
        const parsedColor = tempCtx.fillStyle; // Browser converts to a standard format, often rgb or rgba hex
        //This is a bit of a hack, if it's a hex (e.g. #RRGGBB) returned by browser, re-evaluate
        if (parsedColor.startsWith('#')) { // if browser returned hex, re-call to convert that hex
          let r = 0, g = 0, b = 0;
          if (parsedColor.length === 7) {
            r = parseInt(parsedColor.slice(1, 3), 16);
            g = parseInt(parsedColor.slice(3, 5), 16);
            b = parseInt(parsedColor.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          }
        } else if (parsedColor.startsWith('rgb(')) { //e.g. rgb(r, g, b)
          return parsedColor.replace('rgb', 'rgba').replace(')', `,${opacity})`);
        } else if (parsedColor.startsWith('rgba(')) { // already rgba
          return parsedColor.replace(/[^,]+(?=\))/, opacity.toString());
        }
      }
    } catch (e) { /* Fall through if canvas trick fails (e.g. non-browser env) */ }
    return `rgba(0, 0, 0, ${opacity})`; // Ultimate fallback to black with opacity
  }
}
