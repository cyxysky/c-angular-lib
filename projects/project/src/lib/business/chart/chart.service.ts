import { Injectable, TemplateRef, ElementRef, NgZone, Renderer2 } from '@angular/core';
import { BarChartData, PieChartData, ChartData, ChartOptions, ChartDataWithAngles } from './chart.interface';
import { BarChartOptions, PieChartOptions } from './chart.interface';

@Injectable({
  providedIn: 'root'
})
export class ChartService {
  constructor() { }

  /**
   * 将统一数据接口转换为柱状图数据
   */
  convertToBarData(data: ChartData[]): BarChartData[] {
    return data.map(item => ({
      name: item.name,
      data: item.data,
      color: item.color,
      series: item.series,
      children: item.children?.map(child => ({
        name: child.name,
        data: child.data,
        color: child.color,
        series: child.series
      }))
    }));
  }
  
  /**
   * 将统一数据接口转换为饼图数据
   */
  convertToPieData(data: ChartData[]): PieChartData[] {
    return data.map(item => ({
      name: item.name,
      value: item.value !== undefined ? item.value : (item.data || 0),
      color: item.color,
      percentage: item.percentage,
      _id: item._id
    }));
  }
  
  /**
   * 将统一选项接口转换为柱状图选项
   */
  convertToBarOptions(options: ChartOptions): BarChartOptions {
    return {
      width: options.width,
      height: options.height,
      barColors: options.colors,
      backgroundColor: options.backgroundColor,
      title: options.title,
      animate: options.animate,
      showValues: options.showValues,
      showLegend: options.showLegend,
      showGrid: options.showGrid,
      borderRadius: options.borderRadius,
      margin: options.margin,
      legend: options.legend,
      hoverEffect: {
        enabled: options.hoverEffect?.enabled,
        showTooltip: options.hoverEffect?.showTooltip,
        tooltipHoverable: options.hoverEffect?.tooltipHoverable,
        showGuideLine: options.hoverEffect?.showGuideLine,
        guideLineStyle: options.hoverEffect?.guideLineStyle,
        guideLineColor: options.hoverEffect?.guideLineColor,
        guideLineWidth: options.hoverEffect?.guideLineWidth
      },
      onClick: options.onClick ? (info) => {
        if (options.onClick) {
          options.onClick({
            item: info.item as unknown as ChartData,
            index: info.index,
            seriesIndex: info.seriesIndex,
            data: info.data as unknown as ChartData[],
            options: options,
            event: info.event,
            position: info.position
          });
        }
      } : undefined
    };
  }
  
  /**
   * 将统一选项接口转换为饼图选项
   */
  convertToPieOptions(options: ChartOptions): PieChartOptions {
    return {
      width: options.width,
      height: options.height,
      colors: options.colors,
      backgroundColor: options.backgroundColor,
      title: options.title,
      animate: options.animate,
      showLegend: options.showLegend,
      showLabels: options.showLabels,
      showPercentage: options.showPercentage,
      innerRadius: options.innerRadius,
      outerRadius: options.outerRadius,
      startAngle: options.startAngle,
      endAngle: options.endAngle,
      donutText: options.donutText,
      dynamicSlices: options.dynamicSlices,
      legend: options.legend,
      hoverEffect: {
        enabled: options.hoverEffect?.enabled,
        showTooltip: options.hoverEffect?.showTooltip,
        tooltipHoverable: options.hoverEffect?.tooltipHoverable,
        expandSlice: options.hoverEffect?.expandSlice,
        expandRadius: options.hoverEffect?.expandRadius
      },
      onClick: options.onClick ? (info) => {
        if (options.onClick) {
          options.onClick({
            item: info.item as unknown as ChartData,
            index: info.index,
            data: info.data as unknown as ChartData[],
            options: options,
            event: info.event
          });
        }
      } : undefined
    };
  }
  
  /**
   * 将柱状图数据转换为统一数据接口
   */
  convertBarDataToUnified(barData: BarChartData[]): ChartData[] {
    return barData.map(item => ({
      name: item.name,
      data: item.data,
      color: item.color,
      series: item.series,
      children: item.children?.map(child => ({
        name: child.name,
        data: child.data,
        color: child.color,
        series: child.series
      }))
    }));
  }
  
  /**
   * 将饼图数据转换为统一数据接口
   */
  convertPieDataToUnified(pieData: PieChartData[]): ChartData[] {
    return pieData.map(item => ({
      name: item.name,
      value: item.value,
      color: item.color,
      percentage: item.percentage,
      _id: item._id
    }));
  }

  /**
   * 初始化Canvas
   */
  initCanvas(
    canvasRef: ElementRef<HTMLCanvasElement>,
    setCtx: (ctx: CanvasRenderingContext2D) => void,
    setCanvasWidth: (width: number) => void,
    setCanvasHeight: (height: number) => void,
    setCanvasScale: (scale: number) => void,
    setPieCenterX?: (x: number) => void,
    setPieCenterY?: (y: number) => void,
    setPieInnerRadius?: (radius: number) => void,
    setPieOuterRadius?: (radius: number) => void,
    options?: ChartOptions
  ): boolean {
    if (!canvasRef || !canvasRef.nativeElement) {
      return false;
    }
    
    const canvas = canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('无法获取Canvas的2D上下文');
      return false;
    }
    
    // 获取DPR以支持高分辨率显示
    const dpr = window.devicePixelRatio || 1;
    setCanvasScale(dpr);
    
    // 获取Canvas容器的尺寸
    const parent = canvas.parentElement;
    if (!parent) {
      console.error('Canvas没有父元素');
      return false;
    }
    
    const containerWidth = parent.clientWidth;
    const containerHeight = parent.clientHeight;
    
    // 设置Canvas尺寸
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    
    // 设置Canvas样式尺寸
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    
    // 根据DPR缩放上下文
    ctx.scale(dpr, dpr);
    
    // 保存尺寸信息
    setCanvasWidth(containerWidth);
    setCanvasHeight(containerHeight);
    
    // 保存上下文
    setCtx(ctx);
    
    // 如果是饼图，计算饼图尺寸
    if (setPieCenterX && setPieCenterY && setPieInnerRadius && setPieOuterRadius) {
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;
      
      // 饼图的半径，考虑到图例和标签
      const minDimension = Math.min(containerWidth, containerHeight);
      const outerRadius = minDimension * 0.35;
      
      // 设置内径，支持环形图
      const innerRadius = options && options.innerRadius ? outerRadius * options.innerRadius : 0;
      
      setPieCenterX(centerX);
      setPieCenterY(centerY);
      setPieInnerRadius(innerRadius);
      setPieOuterRadius(outerRadius);
    }
    
    return true;
  }
  
  /**
   * 处理图表数据
   */
  processChartData(
    chartType: 'bar' | 'pie',
    barData: BarChartData[] | ChartData[],
    pieData: PieChartData[] | ChartData[],
    setProcessedBarData: (data: BarChartData[]) => void,
    setBarSeriesVisibility: (visibility: boolean[]) => void,
    setProcessedPieData: (data: Array<PieChartData & { startAngle: number; endAngle: number }>) => void,
    setPieSliceVisibility: (visibility: boolean[]) => void,
    pieOptions?: PieChartOptions | ChartOptions
  ): void {
    if (chartType === 'bar') {
      // 处理柱状图数据
      if (barData && barData.length > 0) {
        // 统一数据处理
        if (barData.length > 0 && 'value' in barData[0]) {
          // 转换统一接口为特定接口
          const convertedData = this.convertToBarData(barData as ChartData[]);
          setProcessedBarData([...convertedData]);
        } else {
          setProcessedBarData([...barData as BarChartData[]]);
        }
        
        // 初始化系列可见性
        const seriesNames = this.getSeriesNames(barData as ChartData[]);
        setBarSeriesVisibility(Array(seriesNames.length).fill(true));
      }
    } else if (chartType === 'pie') {
      // 处理饼图数据
      if (pieData && pieData.length > 0) {
        // 统一数据处理
        if (pieData.length > 0 && !('value' in pieData[0]) && 'data' in pieData[0]) {
          // 转换统一接口为特定接口
          const convertedData = this.convertToPieData(pieData as ChartData[]);
          // 计算角度
          const dataWithAngles = this.calculatePieAngles(convertedData);
          // 强制类型转换以解决兼容性问题
          setProcessedPieData(dataWithAngles as Array<PieChartData & { startAngle: number; endAngle: number }>);
        } else {
          // 计算角度
          const dataWithAngles = this.calculatePieAngles(pieData as ChartData[]);
          // 强制类型转换以解决兼容性问题
          setProcessedPieData(dataWithAngles as Array<PieChartData & { startAngle: number; endAngle: number }>);
        }
        
        // 初始化扇区可见性
        setPieSliceVisibility(Array(pieData.length).fill(true));
      }
    }
  }

  /**
   * 计算饼图扇区角度
   */
  calculatePieAngles(data: ChartData[]): ChartDataWithAngles[] {
    if (!data || data.length === 0) return [];
    
    const totalValue = data.reduce((sum, item) => {
      const value = item.value !== undefined ? item.value : (item.data || 0);
      return sum + value;
    }, 0);
    
    const result: ChartDataWithAngles[] = [];
    
    let currentAngle = 0;
    data.forEach((item, index) => {
      const value = item.value !== undefined ? item.value : (item.data || 0);
      const portion = totalValue > 0 ? value / totalValue : 0;
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
  getSeriesNames(data: ChartData[]): string[] {
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
  
  /**
   * 创建柱状图数据
   * @param categories 类别数组
   * @param seriesNames 系列名称数组
   * @param values 数值二维数组，每行对应一个系列，每列对应一个类别
   * @param colors 可选的颜色数组，用于系列
   * @returns {data: BarChartData[]} 柱状图数据
   */
  createBarChartData(
    categories: string[],
    seriesNames: string[],
    values: number[][],
    colors?: string[]
  ): BarChartData[] {
    const barData: BarChartData[] = [];
    
    // 验证输入数据
    if (!categories || !seriesNames || !values || categories.length === 0 || seriesNames.length === 0 || values.length === 0) {
      return barData;
    }
    
    // 如果没有提供颜色或颜色不足，生成随机颜色
    const assignedColors = colors && colors.length >= seriesNames.length 
      ? colors
      : Array(seriesNames.length).fill(0).map(() => this.generateRandomColor());
    
    // 为每个系列创建数据
    seriesNames.forEach((seriesName, seriesIndex) => {
      const seriesValues = values[seriesIndex] || [];
      const seriesData: BarChartData = {
        name: seriesName,
        series: seriesName,
        color: assignedColors[seriesIndex % assignedColors.length],
        children: []
      };
      
      // 为每个类别创建数据
      categories.forEach((category, categoryIndex) => {
        if (seriesValues.length > categoryIndex) {
          seriesData.children!.push({
            name: category,
            data: seriesValues[categoryIndex],
            series: seriesName
          });
        }
      });
      
      barData.push(seriesData);
    });
    
    return barData;
  }
  
  /**
   * 创建饼图数据
   * @param labels 标签数组
   * @param values 数值数组
   * @param colors 可选的颜色数组
   * @returns {data: PieChartData[]} 饼图数据
   */
  createPieChartData(
    labels: string[],
    values: number[],
    colors?: string[]
  ): PieChartData[] {
    const pieData: PieChartData[] = [];
    
    // 验证输入数据
    if (!labels || !values || labels.length === 0 || values.length === 0) {
      return pieData;
    }
    
    // 如果没有提供颜色或颜色不足，生成随机颜色
    const assignedColors = colors && colors.length >= labels.length 
      ? colors
      : Array(labels.length).fill(0).map(() => this.generateRandomColor());
    
    // 计算总和，用于百分比
    const totalValue = values.reduce((sum, value) => sum + value, 0);
    
    // 创建饼图数据
    labels.forEach((label, index) => {
      if (index < values.length) {
        const value = values[index];
        pieData.push({
          name: label,
          value: value,
          color: assignedColors[index % assignedColors.length],
          percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
        });
      }
    });
    
    return pieData;
  }
  
  /**
   * 根据对象数组中的特定属性创建柱状图数据
   * @param data 对象数组
   * @param categoryField 类别字段名
   * @param valueField 数值字段名
   * @param seriesField 可选的系列字段名
   * @param colors 可选的颜色数组
   * @returns {data: BarChartData[]} 柱状图数据
   */
  createBarChartFromObjects<T>(
    data: T[],
    categoryField: keyof T,
    valueField: keyof T,
    seriesField?: keyof T,
    colors?: string[]
  ): BarChartData[] {
    const barData: BarChartData[] = [];
    
    // 验证输入数据
    if (!data || data.length === 0) {
      return barData;
    }
    
    if (seriesField) {
      // 使用系列分组数据
      const seriesMap = new Map<string, { category: string, value: number }[]>();
      const categorySet = new Set<string>();
      
      // 分组数据
      data.forEach(item => {
        const seriesName = String(item[seriesField] || 'Default');
        const category = String(item[categoryField] || 'Unknown');
        const value = Number(item[valueField] || 0);
        
        categorySet.add(category);
        
        if (!seriesMap.has(seriesName)) {
          seriesMap.set(seriesName, []);
        }
        
        seriesMap.get(seriesName)!.push({ category, value });
      });
      
      // 如果没有提供颜色或颜色不足，生成随机颜色
      const seriesNames = Array.from(seriesMap.keys());
      const assignedColors = colors && colors.length >= seriesNames.length 
        ? colors
        : Array(seriesNames.length).fill(0).map(() => this.generateRandomColor());
      
      // 创建系列数据
      seriesNames.forEach((seriesName, index) => {
        const seriesItems = seriesMap.get(seriesName) || [];
        const seriesData: BarChartData = {
          name: seriesName,
          series: seriesName,
          color: assignedColors[index % assignedColors.length],
          children: []
        };
        
        // 创建类别数据
        seriesItems.forEach(item => {
          seriesData.children!.push({
            name: item.category,
            data: item.value,
            series: seriesName
          });
        });
        
        barData.push(seriesData);
      });
    } else {
      // 不使用系列，直接创建单个系列
      const seriesName = 'Default';
      const seriesData: BarChartData = {
        name: seriesName,
        series: seriesName,
        color: colors && colors.length > 0 ? colors[0] : this.generateRandomColor(),
        children: []
      };
      
      // 创建类别数据
      data.forEach(item => {
        const category = String(item[categoryField] || 'Unknown');
        const value = Number(item[valueField] || 0);
        
        seriesData.children!.push({
          name: category,
          data: value,
          series: seriesName
        });
      });
      
      barData.push(seriesData);
    }
    
    return barData;
  }
  
  /**
   * 根据对象数组中的特定属性创建饼图数据
   * @param data 对象数组
   * @param labelField 标签字段名
   * @param valueField 数值字段名
   * @param colorField 可选的颜色字段名
   * @param colors 可选的颜色数组
   * @returns {data: PieChartData[]} 饼图数据
   */
  createPieChartFromObjects<T>(
    data: T[],
    labelField: keyof T,
    valueField: keyof T,
    colorField?: keyof T,
    colors?: string[]
  ): PieChartData[] {
    const pieData: PieChartData[] = [];
    
    // 验证输入数据
    if (!data || data.length === 0) {
      return pieData;
    }
    
    // 如果没有提供颜色或颜色不足，生成随机颜色
    const assignedColors = colors && colors.length >= data.length 
      ? colors
      : Array(data.length).fill(0).map(() => this.generateRandomColor());
    
    // 计算总和，用于百分比
    const totalValue = data.reduce((sum, item) => sum + Number(item[valueField] || 0), 0);
    
    // 创建饼图数据
    data.forEach((item, index) => {
      const label = String(item[labelField] || 'Unknown');
      const value = Number(item[valueField] || 0);
      const customColor = colorField ? String(item[colorField]) : null;
      
      pieData.push({
        name: label,
        value: value,
        color: customColor || assignedColors[index % assignedColors.length],
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
      });
    });
    
    return pieData;
  }
}
