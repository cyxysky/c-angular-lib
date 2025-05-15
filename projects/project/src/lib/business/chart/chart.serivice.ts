import { Injectable } from '@angular/core';
import { BarChartData, PieChartData } from './chart.interface';
import { BarChartOptions, PieChartOptions } from './chart.interface';

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
   * 将柱状图数据转换为饼图数据，保持颜色一致性
   * @param barData 柱状图数据
   * @param options 柱状图选项
   * @returns {data: PieChartData[], options: PieChartOptions} 饼图数据和选项
   */
  convertBarChartToPieChart(barData: BarChartData[], barOptions: BarChartOptions): {
    data: PieChartData[],
    options: PieChartOptions
  } {
    if (!barData || barData.length === 0) {
      return { data: [], options: {} };
    }
    
    // 1. 首先提取颜色映射，确保保持颜色一致性
    const colorMap = new Map<string, string>();
    
    // 从原始数据中提取颜色
    barData.forEach(item => {
      if (item.name && item.color) {
        colorMap.set(item.name, item.color);
      }
      
      if (item.children) {
        item.children.forEach(child => {
          if (child.name && child.color) {
            colorMap.set(child.name, child.color);
          }
        });
      }
    });
    
    // 2. 转换数据
    const pieData: PieChartData[] = [];
    let totalValue = 0;
    
    barData.forEach(item => {
      if (item.data !== undefined) {
        totalValue += item.data;
        pieData.push({
          name: item.name,
          value: item.data,
          color: item.color || colorMap.get(item.name) || this.getDefaultColor(pieData.length, barOptions.barColors),
          _id: `pie-item-${item.name}`
        });
      } else if (item.children && item.children.length > 0) {
        // 处理子数据
        item.children.forEach(child => {
          if (child.data !== undefined) {
            totalValue += child.data;
            pieData.push({
              name: child.name,
              value: child.data,
              color: child.color || colorMap.get(child.name) || item.color || this.getDefaultColor(pieData.length, barOptions.barColors),
              _id: `pie-item-${child.name}`
            });
          }
        });
      }
    });
    
    // 3. 计算百分比
    pieData.forEach(item => {
      item.percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    });
    
    // 4. 创建饼图选项
    const pieOptions: PieChartOptions = {
      title: barOptions.title,
      colors: barOptions.barColors,
      backgroundColor: barOptions.backgroundColor,
      animate: barOptions.animate,
      dynamicSlices: true,
      showLabels: true,
      showPercentage: true,
      legend: {
        position: barOptions.legend?.position || 'top',
        align: barOptions.legend?.align
      },
      hoverEffect: {
        enabled: barOptions.hoverEffect?.enabled,
        showTooltip: barOptions.hoverEffect?.showTooltip,
        expandSlice: true,
        tooltipHoverable: barOptions.hoverEffect?.tooltipHoverable
      }
    };
    
    return { data: pieData, options: pieOptions };
  }
  
  /**
   * 将饼图数据转换为柱状图数据，保持颜色一致性
   * @param pieData 饼图数据
   * @param pieOptions 饼图选项
   * @returns {data: BarChartData[], options: BarChartOptions} 柱状图数据和选项
   */
  convertPieChartToBarChart(pieData: PieChartData[], pieOptions: PieChartOptions): {
    data: BarChartData[],
    options: BarChartOptions
  } {
    if (!pieData || pieData.length === 0) {
      return { data: [], options: {} };
    }
    
    // 1. 提取颜色映射
    const colorMap = new Map<string, string>();
    pieData.forEach(item => {
      if (item.name && item.color) {
        colorMap.set(item.name, item.color);
      }
    });
    
    // 2. 转换数据
    const barData: BarChartData[] = pieData.map(item => ({
      name: item.name,
      data: item.value,
      color: item.color || colorMap.get(item.name) || this.getDefaultColor(barData.length, pieOptions.colors)
    }));
    
    // 3. 创建柱状图选项
    const barOptions: BarChartOptions = {
      title: pieOptions.title,
      barColors: pieOptions.colors,
      backgroundColor: pieOptions.backgroundColor,
      animate: pieOptions.animate,
      showValues: true,
      legend: {
        position: pieOptions.legend?.position || 'top',
        align: pieOptions.legend?.align
      },
      hoverEffect: {
        enabled: pieOptions.hoverEffect?.enabled,
        showTooltip: pieOptions.hoverEffect?.showTooltip,
        tooltipHoverable: pieOptions.hoverEffect?.tooltipHoverable
      }
    };
    
    return { data: barData, options: barOptions };
  }
  
  /**
   * 获取默认颜色，根据索引从颜色数组中选择
   */
  private getDefaultColor(index: number, colors?: string[]): string {
    if (!colors || colors.length === 0) {
      return this.generateRandomColor();
    }
    return colors[index % colors.length];
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
