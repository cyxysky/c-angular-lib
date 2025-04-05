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
      showChildren: true,
      children: [
        {
          id: '2',
          name: '杨传安',
          title: '研发副总裁',
          value: 60,
          showChildren: true,
          children: [
            {
              id: '3',
              name: '柳牧1',
              title: '研发总监',
              showChildren: true,
              value: 24,
              children: [

                {
                  id: '3-2',
                  name: '柳牧2',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-3',
                  name: '柳牧3',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-4',
                  name: '柳牧4',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-5',
                  name: '柳牧5',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-6',
                  name: '柳牧6',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-4',
                  name: '柳牧4',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-5',
                  name: '柳牧5',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-6',
                  name: '柳牧6',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-4',
                  name: '柳牧4',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-5',
                  name: '柳牧5',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-6',
                  name: '柳牧6',
                  title: '研发总监',
                  value: 24,
                }
              ]
            },
            {
              id: '4',
              name: '柳牧7',
              title: '研发总监',
              showChildren: true,
              value: 24,
              children: [
                {
                  id: '3-1',
                  name: '柳牧8',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-2',
                  name: '柳牧9',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-3',
                  name: '柳牧10',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-4',
                  name: '柳牧11',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-5',
                  name: '柳牧12',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-6',
                  name: '柳牧13',
                  title: '研发总监',
                  value: 24,
                }
              ]
            },
            {
              id: '5',
              name: '柳牧14',
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
