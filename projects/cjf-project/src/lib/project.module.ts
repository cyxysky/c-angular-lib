import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerFormComponent } from './customer-form/customer-form.component';
import { ProcessTreeComponent } from './process-tree/process-tree.component';
import { DynamicTableComponent } from './dynamic-table/dynamic-table.component';
import { GeneratePngComponent } from './generate-png/generate-png.component';
import { CustomerFormModalComponent } from './customer-form/customer-form-modal/customer-form-modal.component';
import { MultiDimensionalFlowchartComponent } from './multi-dimensional-flowchart/multi-dimensional-flowchart.component';

export * from './customer-form/customer-form.component';
export * from './dynamic-table/dynamic-table.component';
export * from './generate-png/generate-png.component';
export * from './process-tree/process-tree.component';
export * from './customer-form/customer-form-modal/customer-form-modal.component';
export * from './multi-dimensional-flowchart/multi-dimensional-flowchart.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    CustomerFormComponent,
    ProcessTreeComponent,
    DynamicTableComponent,
    GeneratePngComponent,
    CustomerFormModalComponent,
    MultiDimensionalFlowchartComponent
  ],
  exports: [
    CustomerFormComponent,
    ProcessTreeComponent,
    DynamicTableComponent,
    GeneratePngComponent,
    CustomerFormModalComponent,
    MultiDimensionalFlowchartComponent
  ]
})
export class ProjectModule { }
