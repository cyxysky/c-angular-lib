import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// 指令
import { WidgetDirective } from './directive/widget.directive';
import { WaterMarkDirectiveDirective } from './water-mark/water-mark-directive.directive';
import { PopoverDirective } from './popover/popover.directive';
import { PopconfirmDirective } from './popconfirm/popconfirm.directive';
import { TooltipDirective } from './tooltip/tooltip.directive';
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
// 组件
import { InputComponent } from './input/input.component';
import { SelectComponent } from './select/select.component';
import { ButtonComponent } from './button/button.component';
import { NumberInputComponent } from './number-input/number-input.component';
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
import { TabComponent } from './tabs/tab.component';
import { TabsComponent } from './tabs/tabs.component';
import { DateTimerComponent } from './date-timer/date-timer.component';
import { MessageComponent } from './message/message.component';
// 服务

export * from './business';
export * from './input';
export * from './select';
export * from './button';
export * from './number-input';
export * from './tag';
export * from './tree-select';
export * from './tree';
export * from './switch';
export * from './segmented';
export * from './water-mark';
export * from './tooltip';
export * from './checkbox';
export * from './radio';
export * from './slider';
export * from './popover';
export * from './cascader';
export * from './modal';
export * from './tabs';
export * from './overlay';
export * from './popconfirm';
export * from './select-basic';
export * from './animation';
export * from './directive';
export * from './date-timer';
export * from './message';


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
    ModalComponent,
    TabComponent,
    TabsComponent,
    DateTimerComponent,
    MessageComponent,
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
    ModalComponent,
    TabComponent,
    TabsComponent,
    DateTimerComponent,
    MessageComponent,
  ],
  providers: [

  ]
})
export class ProjectModule { }
