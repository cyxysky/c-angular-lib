import { Component } from '@angular/core';
import { StructureTreeComponent } from '@project';
@Component({
  selector: 'app-doc-structure-tree',
  imports: [StructureTreeComponent],
  templateUrl: './doc-structure.tree.component.html',
  styleUrl: './doc-structure.tree.component.less'
})
export class DocStructureTreeComponent {
  structureData: any[] = [
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

  onNodeClick(node: any): void {
    console.log('Node clicked:', node);
  }

  onNodeEdit(node: any): void {
    console.log('Node edit:', node);
  }
}
