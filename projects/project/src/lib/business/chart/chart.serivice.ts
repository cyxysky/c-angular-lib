import { Injectable } from '@angular/core';
import { BarChartData, PieChartData } from './chart.interface';

@Injectable({
  providedIn: 'root'
})
export class ChartService {
  constructor() { }

  /**
   * 生成随机颜色
   */
  generateRandomColor(): string {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  }

  /**
   * 计算数据集最大值
   */
  getMaxValue(data: BarChartData[]): number {
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
   * 获取所有系列名称
   */
  getSeriesNames(data: BarChartData[]): string[] {
    if (!data || data.length === 0) return [];
    
    const seriesNames: string[] = [];
    data.forEach(item => {
      if (item.series && !seriesNames.includes(item.series)) {
        seriesNames.push(item.series);
      }
      if (item.children) {
        const childSeriesNames = this.getSeriesNames(item.children);
        childSeriesNames.forEach(name => {
          if (!seriesNames.includes(name)) {
            seriesNames.push(name);
          }
        });
      }
    });
    
    return seriesNames;
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
   * 将柱状图数据转换为饼图数据
   * @param barData 柱状图数据
   * @param useColors 是否使用原始颜色
   * @returns 饼图数据
   */
  convertBarToPieData(barData: BarChartData[], useColors: boolean = true): PieChartData[] {
    if (!barData || barData.length === 0) return [];
    
    const pieData: PieChartData[] = [];
    let totalValue = 0;
    
    // 第一步：提取主要数据并计算总和
    barData.forEach(item => {
      if (item.data !== undefined) {
        totalValue += item.data;
        pieData.push({
          name: item.name,
          value: item.data,
          color: useColors ? item.color : undefined
        });
      } else if (item.children && item.children.length > 0) {
        // 处理子数据
        item.children.forEach(child => {
          if (child.data !== undefined) {
            totalValue += child.data;
            pieData.push({
              name: item.name + ' - ' + child.name,
              value: child.data,
              color: useColors ? (child.color || item.color) : undefined
            });
          }
        });
      }
    });
    
    // 第二步：计算百分比
    pieData.forEach(item => {
      item.percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    });
    
    return pieData;
  }

  /**
   * 计算饼图的扇区角度
   * @param data 饼图数据
   * @returns 带有开始角度和结束角度的增强数据
   */
  calculatePieAngles(data: PieChartData[]): Array<PieChartData & { startAngle: number; endAngle: number }> {
    if (!data || data.length === 0) return [];
    
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const result: Array<PieChartData & { startAngle: number; endAngle: number }> = [];
    
    let currentAngle = 0;
    data.forEach(item => {
      const portion = totalValue > 0 ? item.value / totalValue : 0;
      const angleSize = portion * Math.PI * 2; // 计算弧度大小
      
      result.push({
        ...item,
        percentage: portion * 100,
        startAngle: currentAngle,
        endAngle: currentAngle + angleSize
      });
      
      currentAngle += angleSize;
    });
    
    return result;
  }

  /**
   * 为饼图数据分配颜色
   * @param data 饼图数据
   * @param colors 可选的颜色数组
   * @returns 分配了颜色的饼图数据
   */
  assignPieColors(data: PieChartData[], colors?: string[]): PieChartData[] {
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
}
