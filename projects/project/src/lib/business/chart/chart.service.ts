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
  calculatePieAngles(data: ChartData[], minSliceSize?: number): ChartDataWithAngles[] {
    if (!data || data.length === 0) return [];

    const totalValue = data.reduce((sum, item) => {
      const value = item.data || 0;
      return sum + value;
    }, 0);

    const result: ChartDataWithAngles[] = [];

    let currentAngle = 0;
    data.sort((a: any, b: any) => b.data - a.data).forEach((item, index) => {
      const value = item.data || 0;
      const portion = totalValue > 0 ? value / totalValue : 0;
      // minSliceSize ? Math.max(minSliceSize / 100 * Math.PI * 2, portion * Math.PI * 2) :
      const angleSize = portion * Math.PI * 2; // 计算弧度大小

      // 创建新对象以避免类型问题
      const newItem: ChartDataWithAngles = {
        ...item,
        startAngle: currentAngle,
        endAngle: currentAngle + angleSize,
        percentage: portion * 100
      };

      result.push(newItem);

      currentAngle += angleSize;
    });

    return result;
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
            if (parsedColor.length === 7){
                r = parseInt(parsedColor.slice(1,3), 16);
                g = parseInt(parsedColor.slice(3,5), 16);
                b = parseInt(parsedColor.slice(5,7), 16);
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
