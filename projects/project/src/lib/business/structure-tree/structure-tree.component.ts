import { Component, Input, Output, EventEmitter, ViewEncapsulation, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// 组织结构节点接口
export interface StructureNode {
  id: string;       // 节点唯一标识
  name: string;     // 姓名
  title?: string;   // 职位
  avatar?: string;  // 头像路径
  value?: number;   // 数值
  editable?: boolean; // 是否可编辑
  children?: StructureNode[]; // 子节点
}

@Component({
  selector: 'lib-structure-tree',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './structure-tree.component.html',
  styleUrl: './structure-tree.component.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StructureTreeComponent implements OnInit {
  // 输入属性
  @Input() data: StructureNode[] = [];
  @Input() showLine: boolean = true;

  // 输出事件
  @Output() nodeClick = new EventEmitter<StructureNode>();
  @Output() nodeEdit = new EventEmitter<StructureNode>();

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    console.log(this.getLengthToParentNode(5,0))
    console.log(this.getLengthToParentNode(5,1))
    console.log(this.getLengthToParentNode(5,2))
    console.log(this.getLengthToParentNode(5,3))
    console.log(this.getLengthToParentNode(5,4))
    // 初始化逻辑
  }

  // 节点点击事件
  onNodeClick(node: StructureNode): void {
    this.nodeClick.emit(node);
  }

  // 编辑按钮点击事件
  onEditClick(event: Event, node: StructureNode): void {
    event.stopPropagation();
    this.nodeEdit.emit(node);
  }

  /**
   * 获取节点到父节点的绝对距离
   * @param parentNodeChildLength 父节点子节点数量
   * @param nowNodeIndex 当前节点索引
   * @returns 距离
   */
  getLengthToParentNode(parentNodeChildLength: number, nowNodeIndex: number) {
    if (!parentNodeChildLength) return {number: 0, absNumber: 0};
    const cardHeight = 80;
    const cardWidth = 157 / 2;
    let number = (parentNodeChildLength / 2 - 0.5) - nowNodeIndex;
    return {number, absNumber: Math.abs(number)};
  }

  getPosition(parentNodeChildLength: number, nowNodeIndex: number) {
    if (!parentNodeChildLength) return false;
    return (parentNodeChildLength / 2 - 0.5) - nowNodeIndex < 0;
  }

  getLeft(parentNodeChildLength: number, nowNodeIndex: number) {
    if (!parentNodeChildLength) return 0;
    return (parentNodeChildLength / 2 - 0.5) - nowNodeIndex < 0 ? (76 - 161 * Math.abs((parentNodeChildLength / 2 - 0.5) - nowNodeIndex) + 'px') : '76px';
  }
}
