import { Component, Input, Output, EventEmitter, ViewEncapsulation, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, SimpleChanges, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtilsService } from '../../service/utils.service';
import * as _ from 'lodash';
// 组织结构节点接口
export interface StructureNode {
  id: string;       // 节点唯一标识
  name: string;     // 姓名
  title?: string;   // 职位
  avatar?: string;  // 头像路径
  value?: number;   // 数值
  editable?: boolean; // 是否可编辑
  showChildren?: boolean; // 是否显示子节点
  children?: StructureNode[]; // 子节点
  __key?: string; // 内置key
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
})
export class StructureTreeComponent implements OnInit {
  // 输入属性
  @Input() data: StructureNode[] = [];
  @Input() showLine: boolean = true;
  @Input() widthLevel: number[] = [157, 157, 157];
  @Input() gapLevel: number[] = [161, 161, 161];
  @Input() lineRadius: string = '15px';
  @Input({ alias: 'nodeTemplate' }) nodeTemplates: TemplateRef<any> | undefined = undefined;

  // 输出事件
  @Output() nodeClick = new EventEmitter<StructureNode>();
  @Output() nodeEdit = new EventEmitter<StructureNode>();

  public lineHeight: number = 80;
  nodeTopPointMap = new Map<string, any>();
  nodeBottomPointMap = new Map<string, any>();
  lineMap = new Map<string, any>();

  constructor(
    private cdr: ChangeDetectorRef,
    private utilsService: UtilsService
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.initData();
    this.initNodePoint();
  }

  ngAfterViewInit() {
    this.initNodePoint();
  }

  initData() {
    this.data && this.data.length && this.data.forEach(item => {
      this.getNodeAllChildrenLength(item);
    });
  }

  initNodePoint() {
    this.data && this.data.length && this.data.forEach(item => {
      this.recursionNode(item);
    });
    console.log(this.lineMap)
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
   * 获取当前节点所有子节点长度
   * @param node 当前节点
   */
  getNodeAllChildrenLength(node: StructureNode) {
    !node.__key && (node.__key = this.utilsService.getUUID());
    if (node.children && node.children.length) {
      node.children.forEach((child: StructureNode) => {
        this.getNodeAllChildrenLength(child);
      });
    }
  }

  /**
   * 递归获取节点顶点位置
   * @param node 当前节点
   */
  recursionNode(node: StructureNode, parentKey?: string) {
    let topPoint = document.getElementById(`${node.__key}top`);
    let bottomPoint = document.getElementById(`${node.__key}bottom`);
    if (topPoint && node.__key) {
      this.nodeTopPointMap.set(node.__key, topPoint.getBoundingClientRect());
    }
    if (bottomPoint && node.__key) {
      this.nodeBottomPointMap.set(node.__key, bottomPoint.getBoundingClientRect());
    }
    if (parentKey && topPoint && node.__key) {
      let parentBottomPoint = this.nodeBottomPointMap.get(parentKey);
      let width = Math.round(Math.abs(parentBottomPoint.x - topPoint.getBoundingClientRect().x)) + 2;
      let height = Math.round(Math.abs(parentBottomPoint.y - topPoint.getBoundingClientRect().y));
      this.lineMap.set(node.__key, {
        width,
        height,
        direction: parentBottomPoint.x - topPoint.getBoundingClientRect().x < 0 ? 'L' : 'R'
      })
    }
    if (node.children && node.children.length) {
      node.children.forEach((child: StructureNode) => {
        this.recursionNode(child, node.__key);
      })
    }
  }

  getHeight(nodeKey: string) {
    if (!this.lineMap.has(nodeKey)) return this.lineHeight;
    let height = this.lineMap.get(nodeKey)?.height;
    return height;
  }

  getWidth(nodeKey: string, level: number) {
    if (!this.lineMap.has(nodeKey)) return this.widthLevel[level] || this.widthLevel[this.widthLevel.length - 1];
    let width = this.lineMap.get(nodeKey)?.width;
    return width;
  }

  getDirection(nodeKey: string) {
    if (!this.lineMap.has(nodeKey)) return 'L';
    return this.lineMap.get(nodeKey)?.direction;
  }
}
