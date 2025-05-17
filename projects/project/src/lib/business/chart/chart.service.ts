import { Injectable, TemplateRef, ElementRef, NgZone, Renderer2 } from '@angular/core';
import { ChartData, ChartOptions, ChartDataWithAngles } from './chart.interface';

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
  public drawTitle(ctx: CanvasRenderingContext2D, title: string | undefined, margin: any, displayWidth: number): void {
    if (!title) return;
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, margin.left + displayWidth / 2, margin.top / 2);
  }



}
