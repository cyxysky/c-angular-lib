import { Injectable, NgZone } from '@angular/core';
import { ChartData, ChartOptions, ChartDataWithAngles, TooltipUpdate, PieSpecificOptions, LineSpecificOptions } from './chart.interface';
import { ChartService } from './chart.service';

@Injectable()
export class LineService {
    constructor(private chartService: ChartService) { }
    private ctx!: CanvasRenderingContext2D;
    public processedData: ChartData[] = [];
    private seriesVisibility: boolean[] = [];
    public mergedOptions!: ChartOptions;
    private defaultOptions: ChartOptions = {
        chartType: 'line',
        colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8341f4', '#3acfb4', '#fa7e1e', '#dc3545'],
        backgroundColor: '#ffffff',
        showLegend: true,
        animate: true,
        legend: { position: 'top', align: 'center' },
        hoverEffect: { enabled: true, showTooltip: true, showGuideLine: true, guideLineStyle: 'dashed', guideLineColor: '#666', guideLineWidth: 1, tooltipHoverable: false },
        line: {
            showGuideLine: true,
            guideLineStyle: 'dashed',
            guideLineColor: '#666',
        }
    };
    private animationFrameId: number | null = null;
    private currentAnimationValue = 0;
    public hoveredBarIndex: number = -1;
    public hoveredSeriesIndex: number = -1;
    public barPositions: Array<{ x: number, y: number, width: number, height: number, data: ChartData, seriesIndex: number }> = [];
    private displayWidth!: number; // 逻辑宽度
    private displayHeight!: number; // 逻辑高度

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
        this.mergedOptions = { ...this.defaultOptions, ...options };
    }

    private initChartData(data: ChartData[]): void {
        this.processedData = [];
        
    }
}
