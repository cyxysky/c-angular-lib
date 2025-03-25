import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetSource } from '../directive/widget.directive';

export interface Stage {
  key: string;
  name: string;
  sort: number;
  background: string;
  description: string;
  childrenFlow?: Array<Stage>;
  stages: Array<Stage>;
  [key: string]: any;
}

@Component({
  selector: 'lib-multi-dimensional-flowchart',
  imports: [FormsModule, CommonModule],
  templateUrl: './multi-dimensional-flowchart.component.html',
  styleUrl: './multi-dimensional-flowchart.component.less'
})
export class MultiDimensionalFlowchartComponent {
  public source = inject(WidgetSource);

  @Input() stageArray = [[1, 2, 3], [4, 5, 6, 7], [8, 9, 10]];
  @Input() data: any = {
    "steps": [
      {
        "key": "AAAAAAA",  // 环节的唯一标记
        "name": '流程1',         // 环节名称
        "background": "linear-gradient( 90deg, rgba(1,207,226,0.1) 0%, rgba(1,207,226,0) 100%)", // 背景色
      },
      {
        "key": "BBBBBB",  // 环节的唯一标记
        "name": '流程2',         // 环节名称
        "background": "linear-gradient( 90deg, rgba(215,238,244,0.5) 0%, rgba(215,238,244,0) 100%)", // 背景色
      },
      {
        "key": "CCCCCC",  // 环节的唯一标记
        "name": '流程3',         // 环节名称
        "background": "linear-gradient( 90deg, rgba(135,211,129,0.1) 0%, rgba(135,211,129,0) 100%)", // 背景色
      },
    ],
    "stages": [
      {
        "name": "阶段名称",
        "stepKey": "BBBBBB",  // 阶段所处的环节,
        "key": "stage1"
      },
      {
        "name": "阶段名称",
        "stepKey": "AAAAAAA",  // 阶段所处的环节,
        "key": "stage2"
      },
      {
        "name": "阶段名称",
        "stepKey": "BBBBBB",  // 阶段所处的环节,
        "key": "stage3"
      },
      {
        "childrenFlow": [
          {
            "stages": [
              {
                "name": "子流程1",
                "key": "stage4-1",
                "stepKey": "CCCCCC",  // 阶段所处的环节,
              },
              {
                "name": "子程1",
                "stepKey": "CCCCCC",  // 阶段所处的环节,
                "key": "stage4-2"
              },
              {
                "name": "子流程1",
                "stepKey": "AAAAAAA",  // 阶段所处的环节,
                "key": "stage4-3"
              },
              {
                "name": "子流程1",
                "stepKey": "AAAAAAA",  // 阶段所处的环节,
                "key": "stage4-4"
              },
            ]
          },
          {
            "stages": [
              {
                "name": "子流程2",
                "stepKey": "CCCCCC",  // 阶段所处的环节,
                "key": "stage4-5"
              },
              {
                "name": "子流程2",
                "stepKey": "CCCCCC",  // 阶段所处的环节,
                "key": "stage4-6"
              },
              {
                "name": "子流程2",
                "stepKey": "CCCCCC",  // 阶段所处的环节,
                "key": "stage4-7"
              },

            ]
          },
          {
            "stages": [
              {
                "name": "子流程3",
                "stepKey": "CCCCCC",  // 阶段所处的环节,
                "key": "stage4-8"
              },
              {
                "name": "子流程3",
                "stepKey": "BBBBBB",  // 阶段所处的环节,
                "key": "stage4-9"
              },
              {
                "name": "子流程3",
                "stepKey": "AAAAAAA",  // 阶段所处的环节,
                "key": "stage4-10"
              },
              {
                "name": "子流程3",
                "stepKey": "AAAAAAA",  // 阶段所处的环节,
                "key": "stage4-11"
              },
            ]
          }
        ]
      },
      {
        "name": "阶段名称",
        "stepKey": "CCCCCC",  // 阶段所处的环节,
        "key": "stage5"
      },
      {
        "name": "阶段名称",
        "stepKey": "BBBBBB",  // 阶段所处的环节,
        "key": "stage6"
      },
      {
        "name": "阶段名称",
        "stepKey": "BBBBBB",  // 阶段所处的环节,
        "key": "stage7"
      },
    ]
  }
  @Input() nowStage: Array<any> = [{ key: 'asdzxc' }];
  @Input() state: string = 'hold'
  @Output() selectNode = new EventEmitter();

  // 当前选中的节点
  selectedStage: any = { key: 'asdzxc' };
  // 行数 对应 行的key值
  rowKeyAndIndexMap: Map<any, any> = new Map([]);
  // 节点坐标map
  nodeCoordinatesMap: Map<number, Map<number, any>> = new Map([]);
  // 每行同一阶段所有的最大节点数
  rowMaxLengthMap: Map<any, any> = new Map([]);


  ngOnInit() {
    this.transFormData(this.data);
  }

  /**
   * 选择节点
   * @param node 节点
   */
  public selectStage(node: any): void {
    this.selectedStage = node;
    this.selectNode.emit(node);
  }

  /**
   * 计算2个数字之间的整数
   * @param number1 小的数字
   * @param number2 大的数字
   * @returns 
   */
  private computerCrossRow = (number1: number, number2: number): Array<number> => {
    return Array.from({ length: number2 - number1 - 1 }, (v, k) => k + number1 + 1);
  }

  /**
   * 根据节点数据获取线条配置数组
   * @param node 节点数据
   * @returns 线条配置数组
   */
  public showLine(node: any): any {
    let res: Array<any> = [];
    let afterNodes: Array<Array<number>> = node.afterCoordinates;
    let nowRow = node.row;
    let nowCol = node.stage;
    if (afterNodes) {
      afterNodes.forEach((item: any, index: number) => {
        let condition = {
          direction: '',
          xLength: item.col - nowCol,
          yLength: 0,
        };
        if (nowRow < item.row) {
          let height = 0;
          let cross = this.computerCrossRow(nowRow, item.row);
          cross.forEach((row) => {
            height += (this.rowMaxLengthMap.get(row) * 72);
          })
          condition.direction = 'down';
          condition.yLength = height + ((item.rowDetail ? item.rowDetail : 0.5) * this.rowMaxLengthMap.get(item.row) * 72) + ((1 - (node.rowDetail ? node.rowDetail : 0.5)) * this.rowMaxLengthMap.get(node.row) * 72);
        } else if (nowRow === item.row) {
          if (node.rowDetail || item.rowDetail) {
            let nowDetail = node.rowDetail ? node.rowDetail : 0.5;
            let itemDetail = item.rowDetail ? item.rowDetail : 0.5;
            if (nowDetail > itemDetail) {
              condition.direction = 'up';
              condition.yLength = (nowDetail - itemDetail) * this.rowMaxLengthMap.get(node.row) * 72;
            } else if (itemDetail === nowDetail) {
              condition.direction = 'flat';
            } else {
              condition.direction = 'down';
              condition.yLength = (itemDetail - nowDetail) * this.rowMaxLengthMap.get(node.row) * 72;
            }
          } else {
            condition.direction = 'flat';
          }
        } else {
          let height = 0;
          let cross = this.computerCrossRow(item.row, nowRow);
          cross.forEach((row) => {
            height += (this.rowMaxLengthMap.get(row) * 72);
          })
          condition.direction = 'up';
          condition.yLength = height + ((1 - (item.rowDetail ? item.rowDetail : 0.5)) * this.rowMaxLengthMap.get(item.row) * 72) + ((node.rowDetail ? node.rowDetail : 0.5) * this.rowMaxLengthMap.get(node.row) * 72);
        }
        res.push(condition);
      })
    }
    return res;
  }

  /**
   * 将原始数据进行处理，从中填充map
   * @param data 传入的原始数据
   */
  private transFormData(data: any): void {
    // 现在所在阶段数组
    let nowStageMap: Map<any, any> = new Map([]);
    this.nowStage.forEach((stage) => {
      nowStageMap.set(stage.key, stage);
    });
    // 将行的配置填充进map中
    data.steps.forEach((step: any, index: number) => {
      let colMap: Map<number, any> = new Map([]);
      this.rowKeyAndIndexMap.set(step.key, index + 1);
      this.nodeCoordinatesMap.set(index + 1, colMap);
    });
    let start = 1;
    let alreadyFinish = true;
    // 对原始数据进行处理
    data.stages.forEach((stage: Stage, index: number) => {
      if (stage.childrenFlow) {
        let childrenFlowLength = 0;
        let nowalreadyFinish = alreadyFinish;
        stage.childrenFlow.forEach((childrenFlow: Stage) => {
          let childrenFlowalreadyFinish = nowalreadyFinish;
          // 子流程的流程分支循环
          childrenFlow.stages.forEach((childrenFlowStage: Stage, childrenFlowIStageIndex: number) => {
            if (childrenFlow.stages[childrenFlowIStageIndex + 1]) {
              childrenFlowStage['afterCoordinates'] = [];
              childrenFlowStage['afterCoordinates'].push([this.rowKeyAndIndexMap.get(childrenFlow.stages[childrenFlowIStageIndex + 1]['stepKey']), start + childrenFlowIStageIndex + 1]);
            }
            childrenFlowStage['rootStage'] = index;
            childrenFlowStage['stage'] = start + childrenFlowIStageIndex;
            childrenFlowStage['row'] = this.rowKeyAndIndexMap.get(childrenFlowStage['stepKey']);
            if (nowStageMap.get(childrenFlowStage.key)) {
              childrenFlowalreadyFinish = false;
              alreadyFinish = false;
            }
            // 是否是当前阶段
            childrenFlowStage['statusClass'] = nowStageMap.get(childrenFlowStage.key) ? 'node-status-current' : childrenFlowalreadyFinish ? '' : 'node-status-after';
            // 将节点数据填充进节点坐标map中
            if (!this.nodeCoordinatesMap.get(childrenFlowStage['row'])?.get(childrenFlowStage['stage'])) {
              this.nodeCoordinatesMap.get(childrenFlowStage['row'])?.set(childrenFlowStage['stage'], []);
            }
            this.nodeCoordinatesMap.get(childrenFlowStage['row'])?.get(childrenFlowStage['stage']).push(childrenFlowStage);
            // 获取当前行当前阶段的最大节点数量
            if (this.rowMaxLengthMap.get(childrenFlowStage['row'])) {
              if (this.rowMaxLengthMap.get(childrenFlowStage['row']) < this.nodeCoordinatesMap.get(childrenFlowStage['row'])?.get(childrenFlowStage['stage']).length) {
                this.rowMaxLengthMap.set(childrenFlowStage['row'], this.nodeCoordinatesMap.get(childrenFlowStage['row'])?.get(childrenFlowStage['stage']).length);
              }
            } else {
              this.rowMaxLengthMap.set(childrenFlowStage['row'], this.nodeCoordinatesMap.get(childrenFlowStage['row'])?.get(childrenFlowStage['stage']).length);
            }
          });
          if (childrenFlow.stages.length > childrenFlowLength) {
            childrenFlowLength = childrenFlow.stages.length;
          }
        })
        start += childrenFlowLength;
      }
      else {
        if (nowStageMap.get(stage.key)) {
          alreadyFinish = false;
        }
        stage['statusClass'] = nowStageMap.get(stage.key) ? 'node-status-current' : alreadyFinish ? '' : 'node-status-after';
        stage['rootStage'] = index;
        stage['stage'] = start;
        stage['row'] = this.rowKeyAndIndexMap.get(stage['stepKey']);
        // 将节点数据填充进节点坐标map中
        if (!this.nodeCoordinatesMap.get(stage['row'])?.get(stage['stage'])) {
          this.nodeCoordinatesMap.get(stage['row'])?.set(stage['stage'], []);
        }
        this.nodeCoordinatesMap.get(stage['row'])?.get(stage['stage']).push(stage);
        // 获取当前行的最大节点数量
        if (this.rowMaxLengthMap.get(stage['row'])) {
          if (this.rowMaxLengthMap.get(stage['row']) < this.nodeCoordinatesMap.get(stage['row'])?.get(stage['stage']).length) {
            this.rowMaxLengthMap.set(stage['row'], this.nodeCoordinatesMap.get(stage['row'])?.get(stage['stage']).length);
          }
        } else {
          this.rowMaxLengthMap.set(stage['row'], this.nodeCoordinatesMap.get(stage['row'])?.get(stage['stage']).length);
        }
        start++;
      }
      // 将当前所有节点坐标放到上一个节点中
      if (data.stages[index - 1]) {
        let aheadNode = data.stages[index - 1];
        let coordinates: Array<any> = [];
        if (stage.childrenFlow) {
          stage.childrenFlow.forEach((childrenFlows: Stage) => {
            coordinates.push([childrenFlows.stages[0]['row'], childrenFlows.stages[0]['stage']])
          })
        } else {
          coordinates.push([stage['row'], stage['stage']])
        }
        if (aheadNode.childrenFlow) {
          aheadNode.childrenFlow.forEach((childrenFlows: Stage) => {
            childrenFlows.stages[childrenFlows.stages.length - 1]['afterCoordinates'] = coordinates;
          })
        } else {
          aheadNode['afterCoordinates'] = coordinates;
        }
      }
    })
    // 对子流程节点在同一行的进行处理，认为在一行中分为子行
    for (const [row, colMap] of this.nodeCoordinatesMap) {
      if (this.rowMaxLengthMap.get(row) > 1) {
        for (const [col, nodes] of colMap) {
          let coefficient = 1 / (this.rowMaxLengthMap.get(row) * 2);
          nodes.forEach((node: Stage, index: number) => {
            node['rowDetail'] = coefficient * (index * 2 + 1) + coefficient * (this.rowMaxLengthMap.get(row) - nodes.length);
          });
        }
      }
    }
    this.computerInLineSatge(data.stages)
  }

  /**
   * 存在多节点在同一行同一阶段时，对改行，该阶段节点的行进行细分
   * @param stages 阶段数组
   */
  private computerInLineSatge(stages: Array<Stage>): void {
    if (!stages) return;
    stages.forEach((stage: Stage, index: number) => {
      if (stage.childrenFlow) {
        stage.childrenFlow.forEach((childrenFlow: Stage) => {
          // 子流程的流程分支循环
          childrenFlow.stages.forEach((childrenFlowStage: Stage, childrenFlowIStageIndex: number) => {
            if (childrenFlow.stages[childrenFlowIStageIndex + 1]) {
              childrenFlowStage['afterCoordinates'] = [];
              childrenFlowStage['afterCoordinates'].push({ rowDetail: childrenFlow.stages[childrenFlowIStageIndex + 1]['rowDetail'] ? childrenFlow.stages[childrenFlowIStageIndex + 1]['rowDetail'] : undefined, col: childrenFlow.stages[childrenFlowIStageIndex + 1]['stage'], row: childrenFlow.stages[childrenFlowIStageIndex + 1]['row'] });
            }
          });
        })
      }
      // 将当前所有节点坐标放到上一个节点中
      if (stages[index - 1]) {
        let aheadNode = stages[index - 1];
        let coordinates: Array<{ rowDetail: number | undefined, row: number | undefined, col: number | undefined }> = [];
        if (stage.childrenFlow) {
          stage.childrenFlow.forEach((childrenFlows: any) => {
            coordinates.push({ rowDetail: childrenFlows.stages[0].rowDetail ? childrenFlows.stages[0].rowDetail : undefined, col: childrenFlows.stages[0].stage, row: childrenFlows.stages[0].row });
          })
        } else {
          coordinates.push({ rowDetail: stage['rowDetail'] ? stage['rowDetail'] : undefined, row: stage['row'], col: stage['stage'] });
        }
        if (aheadNode.childrenFlow) {
          aheadNode.childrenFlow.forEach((childrenFlows: Stage) => {
            childrenFlows.stages[childrenFlows.stages.length - 1]['afterCoordinates'] = coordinates;
          })
        } else {
          aheadNode['afterCoordinates'] = coordinates;
        }
      }
    })
  }

  /**
   * 根据子流程长度获取grid配置
   * @param length 子流程长度
   * @returns grid分组情况
   */
  public getGridColumns(length: number): string {
    return `repeat(${length},1fr)`;
  }

  /**
   * 根据传入的阶段分组获取所有的分组情况
   * @returns grid的分组
   */
  public getTotalStageGridColumns(): string {
    let res = '32px ';
    this.stageArray.forEach((stage: Array<number>) => {
      res += `${stage.length}fr `;
    })
    return res;
  }

}
