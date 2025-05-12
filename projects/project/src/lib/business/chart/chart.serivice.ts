import { Injectable } from '@angular/core';
import { ChartData } from './chart.interface';

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
  getMaxValue(data: ChartData[]): number {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map(item => item.value));
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
}
