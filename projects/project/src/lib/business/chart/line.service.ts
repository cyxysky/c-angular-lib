import { Injectable, NgZone } from '@angular/core';
import { ChartData, ChartOptions, ChartDataWithAngles, TooltipUpdate, PieSpecificOptions } from './chart.interface';
import { ChartService } from './chart.service';

@Injectable()
export class LineService {
    constructor(private chartService: ChartService, private ngZone: NgZone) { }
}
