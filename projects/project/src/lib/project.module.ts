import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// 指令
import { WidgetDirective } from './directive/widget.directive';
import { WaterMarkDirectiveDirective } from './water-mark/water-mark-directive.directive';
import { PopoverDirective } from './popover/popover.directive';
import { PopconfirmDirective } from './popconfirm/popconfirm.directive';
import { TooltipDirective } from './tooltip/tooltip.directive';

// 组件
import { CustomerFormComponent } from './customer-form/customer-form.component';
import { CustomerFormModalComponent } from './customer-form/customer-form-modal/customer-form-modal.component';
import { ProcessTreeComponent } from './process-tree/process-tree.component';
import { ProcessTreeNodeComponent } from './process-tree/process-tree-node/process-tree-node.component';
import { DynamicTableComponent } from './dynamic-table/dynamic-table.component';
import { GeneratePngComponent } from './generate-png/generate-png.component';
import { MultiDimensionalFlowchartComponent } from './multi-dimensional-flowchart/multi-dimensional-flowchart.component';
import { UserSelectComponent } from './user-select/user-select.component';
import { InputComponent } from './input/input.component';
import { SelectComponent } from './select/select.component';
import { ButtonComponent } from './button/button.component';
import { NumberInputComponent } from './number-input/number-input.component';
import { TabsComponent } from './tabs/tabs.component';
import { TagComponent } from './tag/tag.component';
import { TreeSelectComponent } from './tree-select/tree-select.component';
import { TreeComponent } from './tree/tree.component';
import { SwitchComponent } from './switch/switch.component';
import { SegmentedComponent } from './segmented/segmented.component';
import { WaterMarkComponent } from './water-mark/water-mark.component';
import { TooltipComponent } from './tooltip/tooltip.component';
import { CheckboxComponent } from './checkbox/checkbox.component';
import { RadioComponent } from './radio/radio.component';
import { SliderComponent } from './slider/slider.component';
import { PopoverComponent } from './popover/popover.component';
// 组件
export * from './customer-form/customer-form.component';
export * from './dynamic-table/dynamic-table.component';
export * from './generate-png/generate-png.component';
export * from './process-tree/process-tree.component';
export * from './customer-form/customer-form-modal/customer-form-modal.component';
export * from './multi-dimensional-flowchart/multi-dimensional-flowchart.component';
export * from './process-tree/process-tree-node/process-tree-node.component';
export * from './user-select/user-select.component';
export * from './input/input.component';
export * from './select/select.component';
export * from './button/button.component';
export * from './number-input/number-input.component';
export * from './tabs/tabs.component';
export * from './tag/tag.component';
export * from './tree-select/tree-select.component';
export * from './tree/tree.component';
export * from './switch/switch.component';
export * from './segmented/segmented.component';
export * from './water-mark/water-mark.component';
export * from './tooltip/tooltip.component';
export * from './checkbox/checkbox.component';
export * from './radio/radio.component';  
export * from './slider/slider.component';
export * from './popover/popover.component';
// 指令
export * from './directive/widget.directive';
export * from './water-mark/water-mark-directive.directive';
export * from './tooltip/tooltip.directive';
export * from './popover/popover.directive';
export * from './popconfirm/popconfirm.directive';

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
    WidgetDirective,
    UserSelectComponent,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    NumberInputComponent,
    TabsComponent,
    TagComponent,
    TreeSelectComponent,
    TreeComponent,
    SwitchComponent,
    SegmentedComponent,
    WaterMarkComponent,
    WaterMarkDirectiveDirective,
    TooltipDirective,
    TooltipComponent,
    CheckboxComponent,
    RadioComponent,
    SliderComponent,
    PopoverDirective,
    PopoverComponent,
    PopconfirmDirective,
  ],
  exports: [
    CustomerFormComponent,
    ProcessTreeComponent,
    DynamicTableComponent,
    GeneratePngComponent,
    CustomerFormModalComponent,
    MultiDimensionalFlowchartComponent,
    ProcessTreeNodeComponent,
    WidgetDirective,
    UserSelectComponent,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    NumberInputComponent,
    TabsComponent,
    TagComponent,
    TreeSelectComponent,
    TreeComponent,
    SwitchComponent,
    SegmentedComponent,
    WaterMarkComponent,
    WaterMarkDirectiveDirective,
    TooltipDirective,
    TooltipComponent,
    CheckboxComponent,
    RadioComponent,
    SliderComponent,
    PopoverDirective,
    PopoverComponent,
    PopconfirmDirective,
  ]
})
export class ProjectModule { }
