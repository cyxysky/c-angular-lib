import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerFormComponent } from './customer-form/customer-form.component';
import { CustomerFormModalComponent } from './customer-form/customer-form-modal/customer-form-modal.component';
import { ProcessTreeComponent } from './process-tree/process-tree.component';
import { ProcessTreeNodeComponent } from './process-tree/process-tree-node/process-tree-node.component';
import { DynamicTableComponent } from './dynamic-table/dynamic-table.component';
import { GeneratePngComponent } from './generate-png/generate-png.component';
import { MultiDimensionalFlowchartComponent } from './multi-dimensional-flowchart/multi-dimensional-flowchart.component';
import { WidgetDirective } from './directive/widget.directive'; 
export * from './customer-form/customer-form.component';
export * from './dynamic-table/dynamic-table.component';
export * from './generate-png/generate-png.component';
export * from './process-tree/process-tree.component';
export * from './customer-form/customer-form-modal/customer-form-modal.component';
export * from './multi-dimensional-flowchart/multi-dimensional-flowchart.component';
export * from './process-tree/process-tree-node/process-tree-node.component';
export * from './directive/widget.directive'
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    CustomerFormComponent,
    ProcessTreeComponent,
    DynamicTableComponent,
    GeneratePngComponent,
    CustomerFormModalComponent,
    MultiDimensionalFlowchartComponent,
    ProcessTreeNodeComponent,
    WidgetDirective
  ],
  exports: [
    CustomerFormComponent,
    ProcessTreeComponent,
    DynamicTableComponent,
    GeneratePngComponent,
    CustomerFormModalComponent,
    MultiDimensionalFlowchartComponent,
    ProcessTreeNodeComponent,
    WidgetDirective
  ]
})
export class ProjectModule { }
