import { Injectable, NgZone } from '@angular/core';
import {
	ChartData,
	ChartOptions,
	LineSpecificOptions,
	DEFAULT_GRID_LINE_COLOR,
	DEFAULT_GRID_LINE_WIDTH,
	DEFAULT_LABEL_FONT,
	DEFAULT_MUTED_TEXT_COLOR,
	DEFAULT_AXIS_LINE_COLOR,
	DEFAULT_AXIS_LINE_WIDTH,
	DEFAULT_TEXT_COLOR,
	Scale,
	DEFAULT_MARGIN
} from './chart.interface';
import { ChartService } from './chart.service';

@Injectable()
export class LineService {
	// ==================== 初始化相关属性 ====================
	private ctx!: CanvasRenderingContext2D;
	private ngZone!: NgZone;
	public processedData: ChartData[] = [];
	private groupVisibility: boolean[] = [];
	public mergedOptions!: ChartOptions & { line: Required<LineSpecificOptions> };
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
			margin: { top: 40, right: 40, bottom: 40, left: 40 },
			showValues: true,
			showGuideLine: true,
			guideLineStyle: 'dashed',
			guideLineColor: DEFAULT_GRID_LINE_COLOR,
			guideLineWidth: DEFAULT_GRID_LINE_WIDTH,
			lineWidth: 2,
			lineStyle: 'solid',
			showPoints: true,
			pointStyle: 'circle',
			pointSize: 5,
			pointColor: '',
			pointBorderColor: '#ffffff',
			pointBorderWidth: 1,
			smoothLine: false,
			areaFill: false,
			areaFillColor: '',
			areaFillOpacity: 0.2,
			xAxisLabelRotation: 0,
			showXAxisTicks: true,
			showYAxisTicks: true,
		}
	};
	private animationFrameId: number | null = null;
	private currentAnimationValue = 0;
	public hoveredPointInfo: { groupIndex: number, dataIndex: number } = { groupIndex: -1, dataIndex: -1 };
	public pointPositions: Array<{ x: number, y: number, data: ChartData, groupIndex: number, dataIndex: number }> = [];
	private displayWidth!: number;
	private displayHeight!: number;
	private skipInitialAnimation: boolean = false;

	constructor(private chartService: ChartService, ngZone: NgZone) {
		this.ngZone = ngZone;
	}

	// ==================== 初始化方法 ====================
	/**
	 * 初始化图表
	 * @param ctx Canvas上下文
	 * @param displayWidth 显示宽度
	 * @param displayHeight 显示高度
	 * @param data 图表数据
	 * @param options 图表配置
	 * @param skipInitialAnimation 是否跳过初始动画
	 */
	public init(
		ctx: CanvasRenderingContext2D,
		displayWidth: number,
		displayHeight: number,
		data: ChartData[],
		options: ChartOptions,
		skipInitialAnimation: boolean = false
	): void {
		this.ctx = ctx;
		this.displayWidth = displayWidth;
		this.displayHeight = displayHeight;
		this.skipInitialAnimation = skipInitialAnimation;
		this.mergedOptions = {
			...this.defaultOptions,
			...options,
			line: {
				...(this.defaultOptions.line as Required<LineSpecificOptions>),
				...(options.line || {}),
			},
			chartType: 'line',
		} as ChartOptions & { line: Required<LineSpecificOptions> };
		this.data = data;
		this.drawChart(this.skipInitialAnimation);
	}

	/**
	 * 处理输入数据
	 * @param inputData 输入的数据
	 */
	private processDataInput(inputData: ChartData[]): void {
		this.processedData = [];
		if (!inputData || inputData.length === 0) return;
		try {
			const hasChildren = inputData.some(item => item.children && item.children.length > 0);
			if (hasChildren) {
				this.processedData = inputData.map(group => ({
					...group,
					children: group.children?.filter(child => child && typeof child.data === 'number') || []
				}));
			} else {
				this.processedData = [{
					name: this.mergedOptions.title || '数据系列',
					children: inputData.filter(item => typeof item.data === 'number')
				}];
			}
			this.groupVisibility = this.chartService.getGroupNames(this.processedData).map(() => true);
		} catch (e) {
			console.error('Error processing line chart data:', e);
			this.processedData = [];
			this.groupVisibility = [];
		}
	}

	private set data(newData: ChartData[]) {
		this.processDataInput(newData);
	}

	// ==================== 绘制相关方法 ====================
	/**
	 * 绘制图表
	 * @param forceNoAnimation 是否强制不使用动画
	 */
	private drawChart(forceNoAnimation: boolean = false): void {
		if (!this.processedData || this.processedData.length === 0 || !this.ctx) return;
		if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
		if (this.mergedOptions.animate && !forceNoAnimation) {
			this.currentAnimationValue = 0;
			this.animateChart();
		} else {
			this.drawChartFrame(1.0);
		}
	}

	/**
	 * 动画绘制图表
	 */
	private animateChart(): void {
		this.ngZone.runOutsideAngular(() => {
			const animate = () => {
				this.currentAnimationValue += 0.02;
				const easedValue = this.chartService.easeOutQuad(Math.min(this.currentAnimationValue, 1));
				this.drawChartFrame(easedValue);
				if (this.currentAnimationValue < 1) {
					this.animationFrameId = requestAnimationFrame(animate);
				} else {
					this.animationFrameId = null;
				}
			};
			this.animationFrameId = requestAnimationFrame(animate);
		});
	}

	/**
	 * 绘制图表帧
	 * @param animationProgress 动画进度
	 */
	public drawChartFrame(animationProgress: number): void {
		const ctx = this.ctx;
		// 清空画布并设置背景色
		ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
		ctx.fillStyle = this.mergedOptions.backgroundColor!;
		ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

		// 计算图表区域
		const margin: Required<LineSpecificOptions>['margin'] = this.mergedOptions?.line?.margin! || DEFAULT_MARGIN;
		const chartAreaWidth = this.displayWidth - margin.left - margin.right;
		const chartAreaHeight = this.displayHeight - margin.top - margin.bottom;

		// 绘制标题
		this.chartService.drawTitle(ctx, this.mergedOptions.title, margin, chartAreaWidth);

		// 计算数据范围
		let actualMinDataValue = Infinity;
		let actualMaxDataValue = -Infinity;
		this.processedData.forEach(group => {
			group.children?.forEach(item => {
				if (typeof item.data === 'number') {
					if (item.data < actualMinDataValue) actualMinDataValue = item.data;
					if (item.data > actualMaxDataValue) actualMaxDataValue = item.data;
				}
			});
		});
		if (actualMinDataValue === Infinity) actualMinDataValue = 0;
		if (actualMaxDataValue === -Infinity) actualMaxDataValue = 10;
		if (actualMinDataValue > 0 && actualMaxDataValue >= actualMinDataValue) actualMinDataValue = 0;

		// 计算Y轴刻度
		const yAxisScale = this.calculateNiceScale(actualMinDataValue, actualMaxDataValue, 6);
		const niceMinValue = yAxisScale.niceMin;
		const niceMaxValue = yAxisScale.niceMax;
		const tickSpacing = yAxisScale.tickSpacing;

		// 获取所有类别
		const allCategories = this.getCategories(this.processedData);

		// 绘制网格
		this.drawGrid(margin, chartAreaWidth, chartAreaHeight, niceMinValue, niceMaxValue, tickSpacing);

		// 绘制坐标轴和标签
		this.drawAxesAndLabels(margin, chartAreaWidth, chartAreaHeight, allCategories, niceMinValue, niceMaxValue, tickSpacing);

		// 获取可见数据
		const visibleData = this.getVisibleData();
		if (visibleData.length === 0 || chartAreaWidth <= 0 || chartAreaHeight <= 0) {
			this.pointPositions = [];
			return;
		}

		// 获取用于绘制线条的类别
		const categoriesForLines = this.getCategories(visibleData);
		if (categoriesForLines.length === 0 && !visibleData.some(group => group.children && group.children.length > 0 && group.children.some(child => child.name === undefined))) {
			this.pointPositions = [];
			return;
		}

		// 绘制线条和点
		this.pointPositions = [];
		this.drawLinesAndPoints(visibleData, categoriesForLines, margin, chartAreaWidth, chartAreaHeight, niceMinValue, niceMaxValue, animationProgress);
	}

	/**
	 * 绘制网格
	 */
	private drawGrid(margin: Required<LineSpecificOptions>['margin'], chartAreaWidth: number, chartAreaHeight: number, niceMinValue: number, niceMaxValue: number, tickSpacing: number): void {
		if (!this.mergedOptions.line.showGuideLine || tickSpacing <= 0) return;
		const ctx = this.ctx;
		ctx.strokeStyle = this.mergedOptions.line.guideLineColor!;
		ctx.lineWidth = this.mergedOptions.line.guideLineWidth!;
		ctx.setLineDash(this.mergedOptions.line.guideLineStyle === 'dashed' ? [4, 4] : []);
		const valueRange = niceMaxValue - niceMinValue;
		if (valueRange <= 0) return;

		for (let val = niceMinValue + tickSpacing; val < niceMaxValue; val += tickSpacing) {
			const yPos = margin.top + chartAreaHeight - ((val - niceMinValue) / valueRange) * chartAreaHeight;
			ctx.beginPath();
			ctx.moveTo(margin.left, yPos);
			ctx.lineTo(margin.left + chartAreaWidth, yPos);
			ctx.stroke();
		}
		ctx.setLineDash([]);
	}

	/**
	 * 绘制坐标轴和标签
	 */
	private drawAxesAndLabels(
		margin: Required<LineSpecificOptions>['margin'],
		chartAreaWidth: number, chartAreaHeight: number,
		categories: string[],
		niceMinValue: number, niceMaxValue: number, tickSpacing: number
	): void {
		const ctx = this.ctx;
		// 绘制Y轴
		ctx.strokeStyle = DEFAULT_AXIS_LINE_COLOR;
		ctx.lineWidth = DEFAULT_AXIS_LINE_WIDTH;
		ctx.beginPath();
		ctx.moveTo(margin.left, margin.top);
		ctx.lineTo(margin.left, margin.top + chartAreaHeight);
		ctx.stroke();

		// 绘制X轴
		ctx.beginPath();
		ctx.moveTo(margin.left, margin.top + chartAreaHeight);
		ctx.lineTo(margin.left + chartAreaWidth, margin.top + chartAreaHeight);
		ctx.stroke();

		// 绘制Y轴标签
		ctx.fillStyle = DEFAULT_MUTED_TEXT_COLOR;
		ctx.font = DEFAULT_LABEL_FONT;
		ctx.textAlign = 'right';
		ctx.textBaseline = 'middle';

		const valueRange = niceMaxValue - niceMinValue;
		if (valueRange <= 0 || tickSpacing <= 0) {
			let yPosMin = margin.top + chartAreaHeight;
			let yPosMax = margin.top;
			if (valueRange === 0) {
				yPosMin = margin.top + chartAreaHeight / 2;
				yPosMax = yPosMin;
				ctx.fillText(this.chartService.formatNumber(niceMinValue), margin.left - 10, yPosMin);
			} else {
				ctx.fillText(this.chartService.formatNumber(niceMinValue), margin.left - 10, yPosMin);
				ctx.fillText(this.chartService.formatNumber(niceMaxValue), margin.left - 10, yPosMax);
			}
		} else {
			for (let val = niceMinValue; val <= niceMaxValue; val += tickSpacing) {
				if (val > niceMaxValue && (val - niceMaxValue < tickSpacing * 0.001)) val = niceMaxValue;
				const yPos = margin.top + chartAreaHeight - ((val - niceMinValue) / valueRange) * chartAreaHeight;
				ctx.fillText(this.chartService.formatNumber(val), margin.left - 10, yPos);
				if (this.mergedOptions.line.showYAxisTicks) {
					ctx.beginPath();
					ctx.moveTo(margin.left - 5, yPos);
					ctx.lineTo(margin.left, yPos);
					ctx.stroke();
				}
			}
		}

		// 绘制X轴标签
		if (categories.length === 0) return;
		ctx.textAlign = 'center';
		const categorySlotWidth = chartAreaWidth / Math.max(1, categories.length);
		categories.forEach((category, index) => {
			const xPos = margin.left + categorySlotWidth * (index + 0.5);
			const yPos = margin.top + chartAreaHeight + 20;
			if (this.mergedOptions.line.xAxisLabelRotation && this.mergedOptions.line.xAxisLabelRotation !== 0) {
				ctx.save();
				ctx.translate(xPos, yPos);
				ctx.rotate(this.mergedOptions.line.xAxisLabelRotation! * Math.PI / 180);
				ctx.textAlign = this.mergedOptions.line.xAxisLabelRotation! > 0 ? 'right' : 'left';
				ctx.textBaseline = 'middle';
				ctx.fillText(category, 0, 0);
				ctx.restore();
			} else {
				ctx.textBaseline = 'top';
				ctx.fillText(category, xPos, yPos);
			}
			if (this.mergedOptions.line.showXAxisTicks) {
				ctx.beginPath();
				ctx.moveTo(xPos, margin.top + chartAreaHeight);
				ctx.lineTo(xPos, margin.top + chartAreaHeight + 5);
				ctx.stroke();
			}
		});
	}

	/**
	 * 绘制线条和点
	 */
	private drawLinesAndPoints(
		visibleData: ChartData[], categories: string[],
		margin: Required<LineSpecificOptions>['margin'],
		chartAreaWidth: number, chartAreaHeight: number,
		niceMinValue: number, niceMaxValue: number,
		animationProgress: number
	): void {
		const ctx = this.ctx;
		const categoryMap = new Map(categories.map((cat, idx) => [cat, idx]));
		const yValueRange = niceMaxValue - niceMinValue;
		this.pointPositions = [];

		visibleData.forEach((group, groupIndex) => {
			if (!group.children || group.children.length === 0) return;
			const originalGroupIndex = this.processedData.findIndex(pGroup => pGroup.name === group.name);
			const lineColor = group.color || this.mergedOptions.colors![originalGroupIndex % this.mergedOptions.colors!.length];

			// 收集所有点
			const allOriginalPoints: Array<{ x: number, y: number, data: ChartData }> = [];
			group.children.forEach((item, dataIdx) => {
				const categoryIndex = categoryMap.get(item.name);
				const currentCatIndex = categories.length > 0 ? categoryIndex : dataIdx;
				const numCatsForCalc = categories.length > 0 ? categories.length : group.children!.length;
				const slotWidthForCalc = chartAreaWidth / Math.max(1, numCatsForCalc);

				if (currentCatIndex === undefined && categories.length > 0) return;
				if (typeof item.data !== 'number') return;

				const x = margin.left + slotWidthForCalc * ((currentCatIndex ?? 0) + 0.5);
				const yValue = Math.max(niceMinValue, Math.min(niceMaxValue, item.data || 0));
				const y = margin.top + chartAreaHeight - ((yValue - niceMinValue) / (yValueRange > 0 ? yValueRange : 1)) * chartAreaHeight;
				allOriginalPoints.push({ x, y, data: item });
				this.pointPositions.push({ x, y, data: item, groupIndex: originalGroupIndex, dataIndex: dataIdx });
			});

			if (allOriginalPoints.length === 0) return;

			// 设置线条样式
			ctx.strokeStyle = lineColor;
			ctx.lineWidth = this.mergedOptions.line.lineWidth!;
			ctx.setLineDash(this.mergedOptions.line.lineStyle === 'dashed' ? [4, 4] : []);

			// 计算动画点
			const pointsToDrawThisFrame: Array<{ x: number, y: number, data?: ChartData }> = [];
			const totalSegments = allOriginalPoints.length - 1;

			if (totalSegments < 0) {
				if (animationProgress === 1.0 && this.mergedOptions.line.showPoints) {
					this.drawDataPoint(ctx, allOriginalPoints[0].x, allOriginalPoints[0].y, lineColor, originalGroupIndex, 0);
				}
				return;
			}

			const animatedSegmentCount = totalSegments * animationProgress;
			const numFullSegments = Math.floor(animatedSegmentCount);
			const partialSegmentFraction = animatedSegmentCount - numFullSegments;

			if (allOriginalPoints.length > 0) {
				pointsToDrawThisFrame.push(allOriginalPoints[0]);
			}

			for (let i = 0; i < numFullSegments; i++) {
				pointsToDrawThisFrame.push(allOriginalPoints[i + 1]);
			}

			if (partialSegmentFraction > 0 && numFullSegments < totalSegments && allOriginalPoints[numFullSegments + 1]) {
				const startPt = allOriginalPoints[numFullSegments];
				const endPt = allOriginalPoints[numFullSegments + 1];
				const interpolatedX = startPt.x + (endPt.x - startPt.x) * partialSegmentFraction;
				const interpolatedY = startPt.y + (endPt.y - startPt.y) * partialSegmentFraction;
				pointsToDrawThisFrame.push({ x: interpolatedX, y: interpolatedY, data: endPt.data });
			}

			// 绘制线条
			if (pointsToDrawThisFrame.length >= 1) {
				ctx.beginPath();
				ctx.moveTo(pointsToDrawThisFrame[0].x, pointsToDrawThisFrame[0].y);
				if (this.mergedOptions.line.smoothLine && pointsToDrawThisFrame.length > 1) {
					for (let i = 0; i < pointsToDrawThisFrame.length - 1; i++) {
						const p0 = (i === 0) ? pointsToDrawThisFrame[i] : pointsToDrawThisFrame[i - 1];
						const p1 = pointsToDrawThisFrame[i];
						const p2 = pointsToDrawThisFrame[i + 1];
						const p3 = (i === pointsToDrawThisFrame.length - 2) ? pointsToDrawThisFrame[i + 1] : pointsToDrawThisFrame[i + 2];
						const cp1x = p1.x + (p2.x - p0.x) / 6;
						const cp1y = p1.y + (p2.y - p0.y) / 6;
						const cp2x = p2.x - (p3.x - p1.x) / 6;
						const cp2y = p2.y - (p3.y - p1.y) / 6;
						ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
					}
				} else {
					for (let i = 1; i < pointsToDrawThisFrame.length; i++) {
						ctx.lineTo(pointsToDrawThisFrame[i].x, pointsToDrawThisFrame[i].y);
					}
				}
				ctx.stroke();

				// 绘制区域填充
				if (this.mergedOptions.line.areaFill && pointsToDrawThisFrame.length > 1) {
					const fillStyle = this.mergedOptions.line.areaFillColor || lineColor;
					ctx.fillStyle = this.chartService.colorWithOpacity(fillStyle, this.mergedOptions.line.areaFillOpacity!);
					ctx.beginPath();
					ctx.moveTo(pointsToDrawThisFrame[0].x, margin.top + chartAreaHeight);
					ctx.lineTo(pointsToDrawThisFrame[0].x, pointsToDrawThisFrame[0].y);
					if (this.mergedOptions.line.smoothLine) {
						for (let i = 0; i < pointsToDrawThisFrame.length - 1; i++) {
							const p0 = (i === 0) ? pointsToDrawThisFrame[i] : pointsToDrawThisFrame[i - 1];
							const p1 = pointsToDrawThisFrame[i];
							const p2 = pointsToDrawThisFrame[i + 1];
							const p3 = (i === pointsToDrawThisFrame.length - 2) ? pointsToDrawThisFrame[i + 1] : pointsToDrawThisFrame[i + 2];
							const cp1x = p1.x + (p2.x - p0.x) / 6;
							const cp1y = p1.y + (p2.y - p0.y) / 6;
							const cp2x = p2.x - (p3.x - p1.x) / 6;
							const cp2y = p2.y - (p3.y - p1.y) / 6;
							ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
						}
					} else {
						for (let i = 1; i < pointsToDrawThisFrame.length; i++) {
							ctx.lineTo(pointsToDrawThisFrame[i].x, pointsToDrawThisFrame[i].y);
						}
					}
					ctx.lineTo(pointsToDrawThisFrame[pointsToDrawThisFrame.length - 1].x, margin.top + chartAreaHeight);
					ctx.closePath();
					ctx.fill();
				}
			}

			// 绘制数据点
			if (this.mergedOptions.line.showPoints) {
				for (let i = 0; i <= numFullSegments; i++) {
					if (allOriginalPoints[i]) {
						const originalDataIndex = group.children.findIndex(child => child === allOriginalPoints[i].data);
						this.drawDataPoint(ctx, allOriginalPoints[i].x, allOriginalPoints[i].y, lineColor, originalGroupIndex, originalDataIndex !== -1 ? originalDataIndex : i);
					}
				}
			}
			ctx.setLineDash([]);
		});
	}

	/**
	 * 绘制数据点
	 */
	private drawDataPoint(ctx: CanvasRenderingContext2D, x: number, y: number, defaultColor: string, groupIndex: number, dataIndex: number): void {
		const pointColor = this.mergedOptions.line.pointColor || defaultColor;
		const pointSize = this.mergedOptions.line.pointSize!;
		const pointStyle = this.mergedOptions.line.pointStyle!;
		ctx.fillStyle = pointColor;
		ctx.strokeStyle = this.mergedOptions.line.pointBorderColor!;
		ctx.lineWidth = this.mergedOptions.line.pointBorderWidth!;
		ctx.beginPath();
		if (pointStyle === 'square') {
			ctx.rect(x - pointSize / 2, y - pointSize / 2, pointSize, pointSize);
		} else if (pointStyle === 'triangle') {
			ctx.moveTo(x, y - pointSize / 2);
			ctx.lineTo(x + pointSize / 2, y + pointSize / 2);
			ctx.lineTo(x - pointSize / 2, y + pointSize / 2);
			ctx.closePath();
		} else {
			ctx.arc(x, y, pointSize / 2, 0, Math.PI * 2);
		}
		ctx.fill();
		if (this.mergedOptions.line.pointBorderWidth! > 0) {
			ctx.stroke();
		}
		if (this.mergedOptions.line.showValues) {
			const groupData = this.processedData[groupIndex];
			const pointData = groupData?.children?.[dataIndex];
			if (pointData && typeof pointData.data === 'number') {
				ctx.fillStyle = DEFAULT_TEXT_COLOR;
				ctx.font = DEFAULT_LABEL_FONT;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'bottom';
				ctx.fillText(this.chartService.formatNumber(pointData.data), x, y - pointSize / 2 - 5);
			}
		}
	}

	// ==================== 其他方法 ====================
	/**
	 * 计算合适的刻度范围
	 */
	private calculateNiceScale(minVal: number, maxVal: number, maxTicks: number = 5): Scale {
		let range = this.calculateScaleGap(maxVal - minVal, false);
		let tickSpacing = this.calculateScaleGap(range / (maxTicks - 1), true);
		let niceMin = Math.floor(minVal / tickSpacing) * tickSpacing;
		let niceMax = Math.ceil(maxVal / tickSpacing) * tickSpacing;

		if (minVal === maxVal) {
			if (minVal === 0) {
				niceMin = 0;
				niceMax = maxTicks > 1 ? maxTicks - 1 : 10;
				tickSpacing = niceMax / (maxTicks > 1 ? maxTicks - 1 : 1) || 1;
				range = niceMax - niceMin;
			} else {
				const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(minVal))));
				tickSpacing = this.calculateScaleGap(magnitude / (maxTicks > 1 ? 2 : 1), true);
				niceMin = Math.floor(minVal / tickSpacing) * tickSpacing - tickSpacing;
				niceMax = Math.ceil(maxVal / tickSpacing) * tickSpacing + tickSpacing;
				if (niceMin >= minVal) niceMin -= tickSpacing;
				if (niceMax <= maxVal) niceMax += tickSpacing;
				if (niceMin === niceMax) {
					niceMax += tickSpacing > 0 ? tickSpacing : 1;
					niceMin -= tickSpacing > 0 ? tickSpacing : 1;
					if (niceMin < 0 && minVal >= 0) niceMin = 0;
				}
				range = niceMax - niceMin;
				if (range <= 0 || tickSpacing <= 0) {
					tickSpacing = 1;
					niceMax = niceMin + (maxTicks - 1) * tickSpacing;
					range = niceMax - niceMin;
				}
			}
		} else if (range === 0 && tickSpacing === 0) {
			tickSpacing = 1;
			niceMax = niceMin + (maxTicks - 1) * tickSpacing;
			range = niceMax - niceMin;
		}

		return {
			minPoint: minVal,
			maxPoint: maxVal,
			tickSpacing: tickSpacing,
			niceMin: niceMin,
			niceMax: niceMax,
			range: range
		};
	}

	/**
	 * 计算合适的刻度间隔
	 */
	private calculateScaleGap(localRange: number, round: boolean): number {
		if (localRange === 0) return 0;
		const exponent = Math.floor(Math.log10(localRange));
		const fraction = localRange / Math.pow(10, exponent);
		let niceFraction;
		if (round) {
			if (fraction < 1.5) niceFraction = 1;
			else if (fraction < 3) niceFraction = 2;
			else if (fraction < 7) niceFraction = 5;
			else niceFraction = 10;
		} else {
			if (fraction <= 1) niceFraction = 1;
			else if (fraction <= 2) niceFraction = 2;
			else if (fraction <= 5) niceFraction = 5;
			else niceFraction = 10;
		}
		return niceFraction * Math.pow(10, exponent);
	}

	/**
	 * 获取类别
	 */
	public getCategories(data: ChartData[]): string[] {
		const categories = new Set<string>();
		let hasExplicitCategories = false;
		data.forEach(group => {
			group.children?.forEach(item => {
				if (item.name !== undefined) {
					categories.add(item.name);
					hasExplicitCategories = true;
				}
			});
		});
		if (!hasExplicitCategories && data.length === 1 && data[0].children && data[0].children.length > 0) {
			return data[0].children.map((_, index) => `Category ${index + 1}`);
		}
		return Array.from(categories);
	}

	/**
	 * 获取可见数据
	 */
	public getVisibleData(): ChartData[] {
		return this.processedData.filter((_, i) => this.groupVisibility[i]);
	}

	/**
	 * 获取线条颜色
	 */
	public getLineColor(groupIndex: number): string {
		const group = this.processedData[groupIndex];
		if (group?.color) return group.color;
		return this.mergedOptions.colors![groupIndex % this.mergedOptions.colors!.length];
	}

	/**
	 * 更新图表
	 */
	public update(data: ChartData[], options: ChartOptions, newDisplayWidth?: number, newDisplayHeight?: number): void {
		this.mergedOptions = {
			...this.defaultOptions,
			...options,
			line: {
				...(this.defaultOptions.line as Required<LineSpecificOptions>),
				...(options.line || {}),
			},
			chartType: 'line'
		} as ChartOptions & { line: Required<LineSpecificOptions> };
		if (newDisplayWidth !== undefined) this.displayWidth = newDisplayWidth;
		if (newDisplayHeight !== undefined) this.displayHeight = newDisplayHeight;
		this.data = data;
		this.drawChart(false);
	}

	/**
	 * 销毁图表
	 */
	public destroy(): void {
		this.animationFrameId = this.chartService.cancelAnimationFrameHelper(this.animationFrameId);
	}

	/**
	 * 获取图例项
	 */
	public getLegendItems(): Array<{ name: string; color: string; visible: boolean; active: boolean }> {
		return this.chartService.getGroupNames(this.processedData).map((name, i) => ({
			name,
			color: this.getLineColor(i),
			visible: this.groupVisibility[i],
			active: this.hoveredPointInfo.groupIndex === i,
		}));
	}

	/**
	 * 切换组可见性
	 */
	public toggleGroupVisibility(index: number): void {
		this.groupVisibility[index] = !this.groupVisibility[index];
		this.drawChart(false);
	}

	/**
	 * 查找悬停点
	 */
	public findHoveredPoint(canvasX: number, canvasY: number): { groupIndex: number, dataIndex: number, point?: any } {
		const hoverRadius = (this.mergedOptions.line.pointSize || 5) + 5;
		let closestPoint: { groupIndex: number, dataIndex: number, point?: any, distance: number } = { groupIndex: -1, dataIndex: -1, distance: Infinity };

		for (const p of this.pointPositions) {
			const dist = Math.sqrt(Math.pow(canvasX - p.x, 2) + Math.pow(canvasY - p.y, 2));
			if (dist <= hoverRadius && dist < closestPoint.distance) {
				closestPoint = { groupIndex: p.groupIndex, dataIndex: p.dataIndex, point: p, distance: dist };
			}
		}
		if (closestPoint.groupIndex !== -1) {
			return { groupIndex: closestPoint.groupIndex, dataIndex: closestPoint.dataIndex, point: closestPoint.point };
		}
		return { groupIndex: -1, dataIndex: -1 };
	}

	/**
	 * 设置悬停点信息
	 */
	public setHoveredPointInfo(groupIndex: number, dataIndex: number): void {
		if (this.hoveredPointInfo.groupIndex !== groupIndex || this.hoveredPointInfo.dataIndex !== dataIndex) {
			this.hoveredPointInfo = { groupIndex, dataIndex };
		}
	}

	/**
	 * 处理画布点击
	 */
	public processCanvasClick(canvasX: number, canvasY: number, event: MouseEvent): void {
		if (!this.mergedOptions.onClick) return;
		const { groupIndex, dataIndex, point } = this.findHoveredPoint(canvasX, canvasY);
		if (groupIndex !== -1 && dataIndex !== -1 && point && this.processedData[groupIndex]?.children?.[dataIndex]) {
			const clickedItem = this.processedData[groupIndex]!.children![dataIndex];
			this.ngZone.run(() => {
				this.mergedOptions.onClick!({
					item: clickedItem,
					index: dataIndex,
					groupIndex: groupIndex,
					data: this.processedData,
					options: this.mergedOptions,
					event: event,
					position: { x: point.x, y: point.y, width: 0, height: 0 }
				});
			});
		}
	}

	/**
	 * 隐藏所有提示并重绘
	 */
	public hideAllTooltipsAndRedraw(): void {
		const needsRedraw = this.hoveredPointInfo.groupIndex !== -1 || this.hoveredPointInfo.dataIndex !== -1;
		this.setHoveredPointInfo(-1, -1);
		if (needsRedraw) {
			this.drawChartFrame(1.0);
		}
	}
}
