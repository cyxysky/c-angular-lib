import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// 服务
export * from './modal/modal.service';
export * from './overlay/overlay.service';
export * from './utils/utils.service';
// 指令
import { WidgetDirective } from './directive/widget.directive';
import { WaterMarkDirectiveDirective } from './water-mark/water-mark-directive.directive';
import { PopoverDirective } from './popover/popover.directive';
import { PopconfirmDirective } from './popconfirm/popconfirm.directive';
import { TooltipDirective } from './tooltip/tooltip.directive';
export * from './directive/widget.directive';
export * from './water-mark/water-mark-directive.directive';
export * from './tooltip/tooltip.directive';
export * from './popover/popover.directive';
export * from './popconfirm/popconfirm.directive';
// 业务组件
import { DynamicTableComponent } from './business/dynamic-table/dynamic-table.component';
import { GeneratePngComponent } from './business/generate-png/generate-png.component';
import { MultiDimensionalFlowchartComponent } from './business/multi-dimensional-flowchart/multi-dimensional-flowchart.component';
import { UserSelectComponent } from './business/user-select/user-select.component';
import { CustomerFormComponent } from './business/customer-form/customer-form.component';
import { CustomerFormModalComponent } from './business/customer-form/customer-form-modal/customer-form-modal.component';
import { ProcessTreeComponent } from './business/process-tree/process-tree.component';
import { ProcessTreeNodeComponent } from './business/process-tree/process-tree-node/process-tree-node.component';
import { StructureTreeComponent } from './business/structure-tree/structure-tree.component';
export * from './business/customer-form/customer-form.component';
export * from './business/dynamic-table/dynamic-table.component';
export * from './business/generate-png/generate-png.component';
export * from './business/process-tree/process-tree.component';
export * from './business/customer-form/customer-form-modal/customer-form-modal.component';
export * from './business/multi-dimensional-flowchart/multi-dimensional-flowchart.component';
export * from './business/process-tree/process-tree-node/process-tree-node.component';
export * from './business/user-select/user-select.component';
export * from './business/structure-tree/structure-tree.component';
// 组件
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
import { CascaderComponent } from './cascader/cascader.component';
import { ModalComponent } from './modal/modal.component';
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
export * from './cascader/cascader.component';
export * from './modal/modal.component';
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
    CascaderComponent,
    StructureTreeComponent,
    ModalComponent
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
    CascaderComponent,
    StructureTreeComponent,
    ModalComponent
  ]
})
export class ProjectModule { }
