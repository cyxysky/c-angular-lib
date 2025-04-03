import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

import { StructureTreeComponent, StructureNode } from './structure-tree.component';

// 创建一个测试宿主组件
@Component({
  standalone: true,
  imports: [StructureTreeComponent],
  template: `
    <lib-structure-tree 
      [data]="structureData" 
      [showLine]="true" 
      (nodeClick)="onNodeClick($event)"
      (nodeEdit)="onNodeEdit($event)">
    </lib-structure-tree>
  `
})
class TestHostComponent {
  structureData: StructureNode[] = [
    {
      id: '1',
      name: '吴强',
      title: '总经理',
      value: 200,
      children: [
        {
          id: '2',
          name: '杨传安',
          title: '研发副总裁',
          value: 60,
          editable: true,
          children: [
            {
              id: '3',
              name: '柳牧',
              title: '研发总监',
              value: 24,
            },
            {
              id: '4',
              name: '柳牧',
              title: '研发总监',
              value: 24,
            },
            {
              id: '5',
              name: '柳牧',
              title: '研发总监',
              value: 24,
            },
            {
              id: '6',
              name: '柳牧',
              title: '研发总监',
              value: 24,
            },
            {
              id: '7',
              name: '柳牧',
              title: '研发总监',
              value: 24,
            }
          ]
        }
      ]
    }
  ];

  onNodeClick(node: StructureNode): void {
    console.log('Node clicked:', node);
  }

  onNodeEdit(node: StructureNode): void {
    console.log('Node edit:', node);
  }
}

describe('StructureTreeComponent', () => {
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, StructureTreeComponent]
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
  });

  it('should render structure tree with nodes', () => {
    const treeNodes = hostFixture.debugElement.queryAll(By.css('.node-card'));
    // 根据上面的测试数据，应该有7个节点（1个总经理 + 1个副总裁 + 5个总监）
    expect(treeNodes.length).toBe(7);
  });

  it('should have correct node content', () => {
    const rootNode = hostFixture.debugElement.query(By.css('.node-card'));
    const nameElem = rootNode.query(By.css('.node-name'));
    const valueElem = rootNode.query(By.css('.node-value'));
    const titleElem = rootNode.query(By.css('.node-title'));
    
    expect(nameElem.nativeElement.textContent).toContain('吴强');
    expect(valueElem.nativeElement.textContent).toContain('200');
    expect(titleElem.nativeElement.textContent).toContain('总经理');
  });

  it('should emit event when node is clicked', () => {
    spyOn(hostComponent, 'onNodeClick');
    const nodeContent = hostFixture.debugElement.query(By.css('.node-content'));
    nodeContent.triggerEventHandler('click', null);
    expect(hostComponent.onNodeClick).toHaveBeenCalled();
  });

  it('should show edit button for editable nodes', () => {
    const editableNode = hostFixture.debugElement.queryAll(By.css('.node-card.with-edit'));
    expect(editableNode.length).toBe(1); // 只有"研发副总裁"节点可编辑
  });
});

// 使用示例
/*
import { StructureTreeComponent, StructureNode } from './structure-tree.component';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [StructureTreeComponent],
  template: `
    <div style="width: 100%; height: 500px;">
      <lib-structure-tree 
        [data]="structureData" 
        [showLine]="true" 
        (nodeClick)="onNodeClick($event)"
        (nodeEdit)="onNodeEdit($event)">
      </lib-structure-tree>
    </div>
  `
})
export class ExampleComponent {
  structureData: StructureNode[] = [
    {
      id: '1',
      name: '吴强',
      title: '总经理',
      value: 200,
      children: [
        {
          id: '2',
          name: '杨传安',
          title: '研发副总裁',
          value: 60,
          editable: true,
          children: [
            {
              id: '3',
              name: '柳牧',
              title: '研发总监',
              value: 24,
            },
            {
              id: '4',
              name: '柳牧',
              title: '研发总监',
              value: 24,
            },
            {
              id: '5',
              name: '柳牧',
              title: '研发总监',
              value: 24,
            },
            {
              id: '6',
              name: '柳牧',
              title: '研发总监',
              value: 24,
            },
            {
              id: '7',
              name: '柳牧',
              title: '研发总监',
              value: 24,
            }
          ]
        }
      ]
    }
  ];

  onNodeClick(node: StructureNode): void {
    console.log('节点点击:', node);
  }

  onNodeEdit(node: StructureNode): void {
    console.log('节点编辑:', node);
  }
}
*/
