import { Component, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
export enum NodeOperateType {
  ADD ='add',
  DELETE = 'delete',
  SELECT = 'select',
  COPY = 'copy',
  MOVE = 'move',
  ADD_BRANCH = 'addBranch',
  BRANCH_END_ADD = 'branchEndAdd'
}

export enum NodeNumberType {
  CHILDREN = 'children',
  BRANCH = 'branch',
  BRANCHS = 'branchs'
}

export enum NodeType {
  ROOT = 'ROOT',
  END = 'END'
}

@Component({
  selector: 'lib-process-tree-node',
  imports: [FormsModule, CommonModule],
  templateUrl: './process-tree-node.component.html',
  styleUrl: './process-tree-node.component.less'
})
export class ProcessTreeNodeComponent {
  @Input() data: any;
  @Input() branchIndex: any;
  @Input() subject?: Subject<any>;
  @Input() addNodeConfig?: Array<any>;
  @Input() hasEndNode: boolean = false;
  @Input() selectedNodeID?: string;

  public readonly qzIconSize = 16;
  public readonly qzIconColor = 'rgba(19, 28, 40, 0.65)';
  public readonly qzAddNodeIconSize = 13;
  public readonly qzAddNodeIconName = 'icon-Plus-Outline';
  public readonly NodeOperateType = NodeOperateType;
  public readonly NodeNumberType = NodeNumberType;
  public readonly NodeType = NodeType;

  constructor(
  ) {}

  ngOnInit(): void {}
  
  /**
   * 节点增删等方法
   * @param methods 节点方法
   * @param offset 左右位移时-1，+1。分支节点末端时为节点内容
   */
  add(methods: string, offset?: number) {
    let params;
    switch (methods) {
      case NodeOperateType.ADD: //增加时，offser为添加节点的类型
        params = { methods: methods, data: this.data, offset: offset };
        break;
      case NodeOperateType.DELETE: //删除
        params = { methods: methods, data: this.data, offset: offset };
        break;
      case NodeOperateType.SELECT: //选中节点
        params = { methods: methods, data: this.data, offset: offset };
        break;
      case NodeOperateType.COPY: //复制
        params = { methods: methods, data: this.data, offset: offset };
        break;
      case NodeOperateType.MOVE: //移动
        params = { methods: methods, data: this.data, offset: offset };
        break;
      case NodeOperateType.BRANCH_END_ADD: //多分支末端节点增加
        params = { methods: 'add', data: this.data, offset: offset };
        break;
      case NodeOperateType.ADD_BRANCH: //增加分支节点子节点
        let nodeConfig:any = {};
        this.addNodeConfig?.forEach((data)=>{
          if(data.type === 'condition'){
            nodeConfig = data;
          }
        })
        params = { methods: methods, data: this.data, offset: nodeConfig };
        break;
      default:
        break;
    }
    this.subject?.next(params);
  }

  notEmpty(data: any) {
    if(null != data && data){
      let number = Object.keys(data)
      if (number.length === 0) {
        return false;
      }
      else {
        return true;
      }
    }
    return false;
  }

  onChildWheel(event: Event){
    // event.stopPropagation();
  }


}
