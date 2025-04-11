import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as _ from 'lodash';
import { CustomerFormComponentComponent } from '../customer-form-component/customer-form-component.component';
@Component({
  selector: 'lib-customer-form-modal',
  standalone: true,
  imports: [FormsModule, CommonModule, CustomerFormComponentComponent],
  templateUrl: './customer-form-modal.component.html',
  styleUrl: './customer-form-modal.component.less'
})
export class CustomerFormModalComponent {
  /**
     * 该组件拖拽的实现原理为
     * 1.通过输入的 columns属性以及data的y确定每一组的grid矩阵大小，例如是个 3 x 4之类的大小。在grid中通过循环生成每个坐标的grid占位元素，每个元素存在mouseenter事件，事件参数为该占位元素的x，y坐标
     * 2.通过对应组件的 mousedown事件，获取到组件的初始位置，并设置定时器，如果长按时间少于1s ，就取消定时器使得拖拽事件失效。
     * 3.在拖拽事件开始的时候创造出一个div元素，将对应组件的内部html结构复制进该div元素，并设置该div元素的样式，使得该div元素的样式与对应组件的样式一致。
     * 4.通过mousemove事件，获取到组件的移动位置，并设置该div元素的transation样式，使得该div元素的跟随鼠标移动。
     * 5.组件在移动时，如果enter进入对应的gird占位元素，就触发事件，将当前拖拽元素的x，y坐标设置为进入的坐标，然后重新计算本组的实际元素占用位置
     * 6.通过mouseup事件，获取到组件的结束位置，并删除该div元素。再重置对应的判断拖拽的属性
     * 
     * 其中，组内坐标重新计算的规则为：
     * 确定当前移动的元素坐标固定，不变。
     * 通过每个组内元素的x，y，width计算出对应的startIndex和endIndex。startIndex为一维数组的索引位置
     * 例如 当前的columns 为3 ，即一行存在3列。 那么 当 x为2，y为2，width为2时，startIndex为 x * ( y - 1) * ( columns + 1 ), endIndex为startIndex + width
     * 将所有元素根据startIndex进行排序，然后循环，判断是否与其他元素的索引存在重叠，如果重叠，就根据重叠元素的endIndex向下计算，规则是
     * 通过上一个元素的endIndex+1 计算出 x 坐标并加上width，如果大于columns+1，就计算出y坐标+1，x坐标为1，然后重新计算startIndex和endIndex
     * 依次类推，直到所有元素的startIndex和endIndex都不存在重叠为止。
     */

  values: any = 'asd'
  /** 数据 */
  @Input() data: any = [];
  /** 数据变化 */
  @Output() dataChange = new EventEmitter<any>();
  /** 模式 */
  @Input() mode: 'edit' | 'show' = 'edit';
  /** 列数 */
  @Input() columns: number = 3;
  /** 接收父组件的subject */
  @Input() subject!: Subject<any>;
  /** 选择组件事件 */
  @Output() selectComponent = new EventEmitter<any>();
  constructor() { }

  ngOnInit(): void {
    this.initGrid();
    if (this.subject) {
      this.subject.subscribe((data) => {
        switch (data.methods) {
          case 'addNewComponent':
            this.addNewComponent(data.data);
            break;
        }
      })
    }
  }

  ngOnChanges(): void {
    this.initGrid();
  }

  groupRowCountMap = new Map();
  columnsGridStyle!: string;
  isDropActive = false;
  newComponentData: any = {};
  isAddingComponent: boolean = false;
  draggedComponentData: any;
  draggedComponentIndex: any = {};
  isDragging = false;
  dragPosition: any;
  dragTimer: any;
  selectId: any;


  /**
   * 添加新组件
   * @param component 组件
   */
  public addNewComponent(component: any): void {
    this.selectId = component.id;
    this.isDragging = true;
    this.newComponentData = component;
    this.isAddingComponent = true;
    document.addEventListener('mouseup', this.stopDragging);
    document.addEventListener('mousemove', this.dragging);
  }

  /**
   * 获取行数
   * @param group 组
   * @returns 行数
   */
  public getGridTemplateRows(group: any): string {
    return `repeat(${this.groupRowCountMap.get(group.id)}, 1fr)`;
  }

  /**
   * 初始化grid
   */
  public initGrid(): void {
    this.initGroupRowCountMap();
    this.getGridTemplateColumns();
  }

  /**
   * 初始化组行数
   */
  public initGroupRowCountMap(): void {
    this.groupRowCountMap.clear();
    this.data.forEach((group: any) => {
      this.groupRowCountMap.set(group.id, 1);
      group.components.forEach((component: any) => {
        if (component.y > this.groupRowCountMap.get(group.id)) {
          this.groupRowCountMap.set(group.id, component.y);
        }
      });
    });
  }

  /**
   * 获取列数
   */
  public getGridTemplateColumns(): void {
    this.columnsGridStyle = `repeat(${this.columns}, 1fr)`;
  }

  /**
   * 设置行数
   * @param groupId 组id
   * @param rowCount 行数
   */
  public setGridRowCount(groupId: number, rowCount: number): void {
    this.groupRowCountMap.set(groupId, rowCount);
  }

  /**
   * 更新组位置
   * @param groupIndex 组索引
   * @param currentComponent 当前组件
   * @param groupId 组id
   */
  public updateGroupPosition(groupIndex: number, currentComponent: any, groupId: number): void {
    let group = this.data[groupIndex];
    // 初始化组件的起始和结束索引
    group.components.forEach((component: any) => {
      component['startIndex'] = component.x + (component.y - 1) * (this.columns + 1);
      component['endIndex'] = component['startIndex'] + component.width;
    });
    // 按起始位置排序
    group.components.sort((a: any, b: any) => a['startIndex'] - b['startIndex']);
    let maxRow = 0;
    let newComponentIndex = 0;
    let occupiedPositions: number[] = [];  // 记录所有已占用的位置
    // 第一次遍历：找到当前拖拽组件的新位置
    group.components.forEach((component: any, index: number) => {
      if (component.id === currentComponent.id) {
        newComponentIndex = index;
        // 记录当前拖拽组件占用的位置
        for (let i = component['startIndex']; i < component['endIndex']; i++) {
          occupiedPositions.push(i);
        }
      }
    });
    // 第二次遍历：调整其他组件的位置
    let adjustmentIndex = currentComponent['endIndex'];
    group.components.forEach((component: any) => {
      if (component.id === currentComponent.id) {
        maxRow = Math.max(maxRow, component.y);
        // 删除组件的startIndex和endIndex,避免污染对应的对象
        delete component['startIndex'];
        delete component['endIndex'];
        return; // 跳过当前拖拽的组件
      }
      let startIndex = component.x + (component.y - 1) * (this.columns + 1);
      let endIndex = startIndex + component.width;
      // 检查是否与已放置的任何组件重叠
      let hasOverlap = false;
      let componentRange = Array.from({ length: component.width }, (_, i) => startIndex + i);
      // 检查是否与已占用位置有重叠
      if (componentRange.some(pos => occupiedPositions.includes(pos))) {
        hasOverlap = true;
      }
      if (hasOverlap) {
        // 计算新位置
        let position = this.calculatePosition(adjustmentIndex % (this.columns + 1) === 0 ? adjustmentIndex + 1 : adjustmentIndex, component.width);
        // 更新组件位置
        component.x = position.x;
        component.y = position.y;
        startIndex = component.x + (component.y - 1) * (this.columns + 1);
        endIndex = startIndex + component.width;
        adjustmentIndex = position.nextIndex;
      }
      // 更新已占用位置
      for (let i = startIndex; i < endIndex; i++) {
        occupiedPositions.push(i);
      }
      // 删除组件的startIndex和endIndex,避免污染对应的对象
      delete component['startIndex'];
      delete component['endIndex'];
      maxRow = Math.max(maxRow, component.y);
    });
    // 重新设置该组的行数
    this.setGridRowCount(groupId, maxRow);
    this.draggedComponentIndex = {
      groupIndex,
      componentIndex: newComponentIndex
    };
    this.dataChange.emit(this.data);
  }

  /**
   * 计算组件位置
   * @param index 组件索引
   * @param width 组件宽度
   * @returns 组件位置
   */
  public calculatePosition(index: number, width: number): { x: number, y: number, nextIndex: number } {
    let row = Math.ceil(index / (this.columns + 1));
    let column = index - (row - 1) * (this.columns + 1);
    let condition = (column + width > (this.columns + 1));
    let x = (condition ? 1 : column);
    let y = (condition ? row + 1 : row);
    let nextIndex = (condition ? 1 + row * (this.columns + 1) + width : column + (row - 1) * (this.columns + 1) + width);
    return { x, y, nextIndex }
  }

  /**
   * 开始拖拽
   * @param groupIndex 组索引
   * @param componentIndex 组件索引
   * @param dragData 拖拽数据
   * @param event 事件
   * @param element 元素
   */
  public startDragging(groupIndex: any, componentIndex: any, dragData: any, element: any): void {
    // this.selectId = this.selectId !== undefined ? undefined : dragData.id
    this.selectId = dragData.id;
    this.selectComponent.emit(dragData);
    // 添加延迟定时器
    this.dragTimer = setTimeout(() => {
      this.isDragging = true;
      this.addDragPlaceholderElement(element);
      this.draggedComponentIndex = { groupIndex, componentIndex };
      this.draggedComponentData = dragData;
      document.addEventListener('mousemove', this.dragging);
    }, 500); // 1秒延迟
    document.addEventListener('mouseup', this.stopDragging);
  }

  /**
   * 鼠标移出时取消对应的移动事件
   */
  public leave(): void {
    clearTimeout(this.dragTimer);
  }

  /**
   * 添加拖拽占位元素
   * @param element 元素
   */
  public addDragPlaceholderElement(element: HTMLElement): void {
    let newElement = document.createElement('div');
    newElement.innerHTML = element.innerHTML;
    newElement.removeChild(newElement.children[0])
    newElement.id = 'dragElement';
    newElement.style.position = 'absolute';
    newElement.style.width = element.offsetWidth + 'px';
    newElement.style.height = element.offsetHeight + 'px';
    newElement.style.left = element.getBoundingClientRect().left + 'px';
    newElement.style.top = element.getBoundingClientRect().top + 'px';
    newElement.style.zIndex = '1000';
    newElement.style.pointerEvents = 'none';
    document.body.appendChild(newElement);
  }

  /**
   * 拖拽事件
   * @param event 拖拽事件
   */
  public dragging = (event: any): void => {
    this.mousemove(event);
  }

  /**
   * 停止拖拽
   */
  public stopDragging = (): void => {
    clearTimeout(this.dragTimer);
    document.removeEventListener('mousemove', this.dragging);
    document.removeEventListener('mouseup', this.stopDragging);
    this.isDragging = false;
    this.isAddingComponent = false;
    let element = document.getElementById('dragElement');
    this.dragPosition = undefined;
    if (element) {
      // this.selectId = null;
      document.body.removeChild(element);
    }
  }

  /**
   * 允许拖拽
   * @param event 拖拽事件
   */
  public mousemove(event: any): void {
    if (!this.isDragging) return;
    // 获取拖拽元素的初始位置
    if (!this.dragPosition) this.dragPosition = { x: event.clientX, y: event.clientY };
    let element = document.getElementById('dragElement');
    if (element) {
      element.style.transform = `translate(${event.clientX - this.dragPosition.x}px, ${event.clientY - this.dragPosition.y}px)`;
    }
  }

  /**
   * 进入拖拽
   * @param groupIndex 组索引
   * @param componentIndex 组件索引
   * @param enterX 进入的x坐标
   * @param enterY 进入的y坐标
   */
  public enterDrag(groupIndex: any, componentIndex: any, enterX: number, enterY: number): void {
    if (!this.isDragging) return;
    if (this.isAddingComponent) {
      this.addComponent(this.newComponentData, groupIndex, enterX, enterY);
      return;
    }
    if (this.draggedComponentIndex.groupIndex === groupIndex && this.draggedComponentIndex.componentIndex === componentIndex && this.draggedComponentData.x === enterX && this.draggedComponentData.y === enterY) return;
    if (this.draggedComponentIndex.groupIndex !== groupIndex) {
      this.handleInterGroupComponentMove(this.draggedComponentData, groupIndex, enterX, enterY);
    }
    if (this.draggedComponentIndex.groupIndex === groupIndex) {
      this.handleWithinGroupComponentMove(this.draggedComponentData, groupIndex, enterX, enterY);
    }
  }

  /**
   * 添加组件
   * @param data 数据
   * @param groupIndex 组索引
   * @param enterX 进入的x坐标
   * @param enterY 进入的y坐标
   */
  public addComponent(data: any, groupIndex: number, enterX: number, enterY: number): void {
    _.set(data, 'x', enterX);
    _.set(data, 'y', enterY);
    this.data[groupIndex].components.splice(0, 0, data);
    this.draggedComponentIndex = { groupIndex, componentIndex: 0 };
    this.draggedComponentData = data;
    this.updateGroupPosition(groupIndex, data, this.data[groupIndex].id);
    this.isAddingComponent = false;
  }

  /**
   * 组内位置切换
   * @param data 数据
   * @param groupIndex 组索引
   * @param enterX 进入的x坐标
   * @param enterY 进入的y坐标
   */
  public handleWithinGroupComponentMove(data: any, groupIndex: number, enterX: number, enterY: number): void {
    data.y = enterY;
    data.x = (data.width + enterX > this.columns + 1) ? (this.columns + 1 - data.width) : enterX;
    this.updateGroupPosition(groupIndex, data, this.data[groupIndex].id);
  }

  /**
   * 组间位置切换
   * @param data 数据
   * @param groupIndex 组索引
   * @param enterX 进入的x坐标
   * @param enterY 进入的y坐标
   */
  public handleInterGroupComponentMove(data: any, groupIndex: number, enterX: number, enterY: number): void {
    let dataIndex = this.findComponentIndex(this.data[this.draggedComponentIndex.groupIndex].components, this.draggedComponentData);
    let component = this.data[this.draggedComponentIndex.groupIndex].components.splice(dataIndex, 1)[0];
    component.y = enterY;
    component.x = (component.width + enterX > this.columns + 1) ? (this.columns + 1 - component.width) : enterX;
    this.data[groupIndex].components.unshift(data);
    this.draggedComponentIndex = { groupIndex, componentIndex: 0 };
    this.updateGroupPosition(groupIndex, data, this.data[groupIndex].id);
  }

  /**
   * 移动到另一个组
   * @param groupIndex 组索引
   * @param componentIndex 组件索引
   */
  public moveToAnotherGroup(groupIndex: any, componentIndex: any): void {
    let component = this.data[this.draggedComponentIndex.groupIndex].components.splice(componentIndex, 1)[0];
    component.y = 1;
    component.x = 1;
    this.data[groupIndex].components.unshift(component);
    this.draggedComponentIndex = { groupIndex, componentIndex: 0 };
    this.updateGroupPosition(groupIndex, component, this.data[groupIndex].id);
  }

  /**
   * 查找组件索引
   * @param group 组
   * @param data 数据
   * @returns 组件索引
   */
  public findComponentIndex(group: any, data: any): number {
    let index = 0;
    group.forEach((item: any, i: number) => {
      if (item.id === data.id) {
        index = i;
      }
    });
    return index;
  }

  /**
   * 获取行数
   * @param number 行数
   * @returns 行数
   */
  public range(number: number): Array<number> {
    return Array.from({ length: number }, (_, i) => i);
  }

  /**
   * 复制组件
   * @param groupIndex 组索引
   * @param componentIndex 组件索引
   */
  public copyComponents(groupIndex: number, componentIndex: number): void {
    let componentOrigin = this.data[groupIndex].components[componentIndex];
    let component = _.cloneDeep(this.data[groupIndex].components[componentIndex]);
    component.id = Math.random().toString(36).substring(2, 15);
    this.data[groupIndex].components.splice(componentIndex + 1, 0, component);
    this.updateGroupPosition(groupIndex, componentOrigin, this.data[groupIndex].id);
  }

  /**
   * 删除组件
   * @param groupIndex 组索引
   * @param componentIndex 组件索引
   */
  public deleteComponents(groupIndex: number, componentIndex: number): void {
    this.data[groupIndex].components.splice(componentIndex, 1);
  }


}
