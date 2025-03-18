import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocButtonComponent } from './doc-button/doc-button.component';
import { DocSwitchComponent } from './doc-switch/doc-switch.component';
import { DocTagComponent } from './doc-tag/doc-tag.component';
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DocButtonComponent,
    DocSwitchComponent,
    DocTagComponent
  ],
  exports: [
    DocButtonComponent,
    DocSwitchComponent,
    DocTagComponent
  ]
})
export class DocModule { }
