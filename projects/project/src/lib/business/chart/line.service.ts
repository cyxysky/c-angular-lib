import { Injectable, NgZone } from '@angular/core';
import { ChartData, ChartOptions, ChartDataWithAngles, TooltipUpdate, PieSpecificOptions, LineSpecificOptions } from './chart.interface';
import { ChartService } from './chart.service';

@Injectable()
export class LineService {
	constructor(private chartService: ChartService) { }
	private ctx!: CanvasRenderingContext2D;
	public processedData: ChartData[] = [];
	public hasGroupData: boolean = false;
	public mergedOptions!: ChartOptions;
	private defaultOptions: ChartOptions = {
		chartType: 'line',
		colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8341f4', '#3acfb4', '#fa7e1e', '#dc3545'],
		backgroundColor: '#ffffff',
		showLegend: true,
		animate: true,
		legend: { position: 'top', align: 'center' },
		hoverEffect: {
			enabled: true,
			showTooltip: true,
			tooltipHoverable: false
		},
		line: {
			showGuideLine: true,
			guideLineStyle: 'dashed',
			guideLineColor: '#666',
			guideLineWidth: 1,
			margin: { top: 40, right: 20, bottom: 50, left: 50 },
		}
	};
	private animationFrameId: number | null = null;
	private currentAnimationValue = 0;
	private displayWidth!: number; // 逻辑宽度
	private displayHeight!: number; // 逻辑高度
	private dataMap: Map<string, any> = new Map();


	// =================================================================================
	// 1. 初始化方法 (Initialization Methods)
	// =================================================================================

	public init(
		ctx: CanvasRenderingContext2D,
		displayWidth: number,
		displayHeight: number,
		data: ChartData[],
		options: ChartOptions
	) {
		this.ctx = ctx;
		this.displayWidth = displayWidth;
		this.displayHeight = displayHeight;
		this.mergedOptions = {
			...this.defaultOptions,
			...options
		};
		this.initChartData(data);
	}

	/**
	 * 初始化图表数据,包括数据以及比例
	 * @param data 原始数据
	 */
	private initChartData(data: ChartData[]): void {
		this.processedData = [];
		// 存在分组数据
		this.hasGroupData = data.some(item => item.children && item.children.length > 0);
		if (this.hasGroupData) {
			const totalValue = data.reduce((sum, current) => sum + (current.children?.reduce((sum, child) => sum + (child.data || 0), 0) || 0), 0);
			data.forEach(item => {
				this.dataMap.set(item.name, new Map());
				if (item.children) {
					item.children.forEach(child => {
						this.dataMap.get(item.name)?.set(child.name, { value: child.data, percentage: this.chartService.calculatePercentage(child.data, totalValue) });
					})
				}
			})
		} else {
			data.forEach(item => {
				const total = data.reduce((sum, current) => sum + (current.data || 0), 0);
				this.dataMap.set(item.name, { value: item.data, percentage: this.chartService.calculatePercentage(item.data, total) });
			})
		}
	}


	// =================================================================================
	// 2. 绘制方法 (Drawing Methods)
	// =================================================================================

	/**
	 * 绘制网格线
	 */
	public drawGrid(): void {
		const ctx = this.ctx;
		const margin = this.getMargin();
		const chartHeight = this.displayHeight - margin.top - margin.bottom;
		const chartWidth = this.displayWidth - margin.left - margin.right;
		const maxValue = this.processedData.reduce((max, item) => Math.max(max, item.data || 0), 0);
		// 绘制网格线
		ctx.strokeStyle = '#e0e0e0';
		ctx.lineWidth = 0.5;
		for (let i = 0; i <= 5; i++) {
			// 计算y轴位置
			const yPos = margin.top + chartHeight - (i / 5) * chartHeight;
			// 绘制网格线
			ctx.beginPath();
			ctx.moveTo(margin.left, yPos);
			ctx.lineTo(margin.left + chartWidth, yPos);
			ctx.stroke();
			// 绘制数值文字
			ctx.fillStyle = '#666666';
			ctx.font = '12px Arial';
			ctx.textAlign = 'right';
			ctx.fillText(this.chartService.formatNumber(maxValue * i / 5), margin.left - 10, yPos + 4);
		}
	}

	/**
	 * 绘制坐标轴和标题
	 */
	private drawCoordinateAxisAndTitle(): void {
		// 绘制坐标轴
		const ctx = this.ctx;
		const margin = this.getMargin();
		ctx.strokeStyle = '#e0e0e0';
		ctx.beginPath();
		ctx.moveTo(margin.left, margin.top);
		ctx.lineTo(margin.left, margin.top + this.displayHeight);
		ctx.lineTo(margin.left + this.displayWidth, margin.top + this.displayHeight);
		ctx.stroke();
		// 绘制标题
		this.chartService.drawTitle(ctx, this.mergedOptions.title, margin, this.displayWidth);
	}

	/**
	 * 绘制折线图
	 */
	public drawLine(): void {
		const ctx = this.ctx;
		const margin = this.getMargin();
		const chartHeight = this.displayHeight - margin.top - margin.bottom;
		const chartWidth = this.displayWidth - margin.left - margin.right;
		// 绘制折线图
		ctx.strokeStyle = '#4285F4';
		ctx.lineWidth = 2;
	}

	// =================================================================================
	// 4. 功能方法
	// =================================================================================

	/**
	 * 获取指定分组的数据
	 * @param groupName 分组名称
	 * @returns 分组数据
	 */
	public getGroupData(groupName: string, childName?: string): { value: number, percentage: string } {
		if (this.hasGroupData) {
			return this.dataMap.get(groupName)?.get(childName) || { value: 0, percentage: '0%' };
		} else {
			return this.dataMap.get(groupName) || { value: 0, percentage: '0%' };
		}
	}

	public getMargin(): any {
		return this.mergedOptions?.line?.margin! || { top: 40, right: 20, bottom: 50, left: 50 };
	}





}
