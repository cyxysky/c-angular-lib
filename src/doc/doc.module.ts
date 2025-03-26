import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocButtonComponent } from './doc-button/doc-button.component';
import { DocSwitchComponent } from './doc-switch/doc-switch.component';
import { DocTagComponent } from './doc-tag/doc-tag.component';
import { DocNumberInputComponent } from './doc-number-input/doc-number-input.component';
import { DocSegmentedComponent } from './doc-segmented/doc-segmented.component';
import { DocWaterMarkComponent } from './doc-water-mark/doc-water-mark.component';
import { DocFlowchartComponent } from './doc-flowchart/doc-flowchart.component';
import { DocInputComponent } from './doc-input/doc-input.component';
import { DocTooltipComponent } from './doc-tooltip/doc-tooltip.component';
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DocButtonComponent,
    DocSwitchComponent,
    DocTagComponent,
    DocNumberInputComponent,
    DocSegmentedComponent,
    DocWaterMarkComponent,
    DocFlowchartComponent,
    DocInputComponent,
    DocTooltipComponent
  ],
  exports: [
    DocButtonComponent,
    DocSwitchComponent,
    DocTagComponent,
    DocNumberInputComponent,
    DocSegmentedComponent,
    DocWaterMarkComponent,
    DocFlowchartComponent,
    DocInputComponent,
    DocTooltipComponent
  ]
})
export class DocModule { }
