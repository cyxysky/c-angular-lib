import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocButtonComponent } from './doc-button/doc-button.component';
import { DocSwitchComponent } from './doc-switch/doc-switch.component';
import { DocTagComponent } from './doc-tag/doc-tag.component';
import { DocNumberInputComponent } from './doc-number-input/doc-number-input.component';
import { DocSegmentedComponent } from './doc-segmented/doc-segmented.component';
import { DocWaterMarkComponent } from './doc-water-mark/doc-water-mark.component';
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DocButtonComponent,
    DocSwitchComponent,
    DocTagComponent,
    DocNumberInputComponent,
    DocSegmentedComponent,
    DocWaterMarkComponent
  ],
  exports: [
    DocButtonComponent,
    DocSwitchComponent,
    DocTagComponent,
    DocNumberInputComponent,
    DocSegmentedComponent,
    DocWaterMarkComponent
  ]
})
export class DocModule { }
