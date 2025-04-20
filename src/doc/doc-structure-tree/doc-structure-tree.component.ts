import { Component } from '@angular/core';
import { StructureTreeComponent } from '@project';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SegmentedComponent } from '@project';
@Component({
  selector: 'app-doc-structure-tree',
  imports: [StructureTreeComponent, CommonModule, FormsModule, SegmentedComponent],
  templateUrl: './doc-structure-tree.component.html',
  styleUrl: './doc-structure-tree.component.less'
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
                  id: '3-7',
                  name: '柳牧7',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-8',
                  name: '柳牧8',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-9',
                  name: '柳牧9',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-10',
                  name: '柳牧10',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-11',
                  name: '柳牧11',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-12',
                  name: '柳牧12',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-13',
                  name: '柳牧13',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-14',
                  name: '柳牧14',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-15',
                  name: '柳牧15',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-16',
                  name: '柳牧16',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-17',
                  name: '柳牧17',
                  title: '研发总监',
                  value: 24,
                },
                {
                  id: '3-18',
                  name: '柳牧18',
                  title: '研发总监',
                  value: 24,
                },

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

  department: any[] = [
    {
      id: '1',
      name: '吴强',
      title: '齐治科技',
      value: 203,
      showChildren: true,
      children: [
        {
          id: '2',
          name: '吴强',
          title: '交付部',
          value: 53,
          showChildren: true,
          children: [
            {
              id: '2-1',
              name: '唐双',
              title: '远程交付部',
              value: 6,
            },
            {
              id: '2-2',
              name: '许立强',
              title: '东区交付部',
              value: 0,
            },
            {
              id: '2-3',
              name: '许立强',
              title: '北区交付部',
              value: 0,
            },
            {
              id: '2-4',
              name: '贺振涛',
              title: '南区交付部',
              value: 0,
            },
            {
              id: '2-5',
              name: '吴大大',
              title: '二线支持部',
              value: 0,
            },
            {
              id: '2-6',
              name: '吴大大',
              title: '项目管理部',
              value: 0,
            }
          ]
        },
        {
          id: '3',
          name: '蔡永娟',
          title: '运营部',
          value: 53,
          showChildren: true,
          children: [
            {
              id: '3-1',
              name: '吴大大',
              title: '人力资源部',
              value: 0,
            },
            {
              id: '3-2',
              name: '姓名',
              title: '财务部',
              value: 0,
            },
            {
              id: '3-3',
              name: '名字',
              title: '商务部',
              value: 12,
            },
            {
              id: '3-4',
              name: '吴大大',
              title: '行政部',
              value: 0,
            }
          ]
        },
        {
          id: '4',
          name: '许立强',
          title: '市场部',
          value: 53,
          showChildren: true,
          children: [
            {
              id: '4-1',
              name: '吴大大',
              title: '港澳客户部',
              value: 0,
            },
            {
              id: '4-2',
              name: '吴大大',
              title: '战略客户部',
              value: 0,
            },
            {
              id: '4-3',
              name: '吴大大',
              title: '东区客户部',
              value: 0,
            },
            {
              id: '4-4',
              name: '吴大大',
              title: '南区客户部',
              value: 0,
            },
            {
              id: '4-5',
              name: '吴大大',
              title: '北区客户部',
              value: 0,
            },
            {
              id: '4-6',
              name: '吴大大',
              title: '解决方案部',
              value: 0,
            },
            {
              id: '4-7',
              name: '吴大大',
              title: '营销管理部',
              value: 0,
            },
            {
              id: '4-8',
              name: '吴大大',
              title: '渠道客户部',
              value: 0,
            }
          ]
        },
        {
          id: '5',
          name: '杨传安',
          title: '研发部',
          value: 53,
          showChildren: true,
          children: [
            {
              id: '5-1',
              name: '孟宾',
              title: '数字化开发中心',
              value: 10,
            },
            {
              id: '5-2',
              name: '杨牧',
              title: '产品开发中心',
              value: 40,
              showChildren: false,
              children: [
                {
                  id: '5-2-1',
                  name: '杨牧',
                  title: 'ACA开发中心',
                  value: 40,
                },
                {
                  id: '5-2-2',
                  name: '杨牧',
                  title: 'PAM开发中心',
                  value: 40,
                },
                {
                  id: '5-2-3',
                  name: '杨牧',
                  title: 'XXX开发中心',
                  value: 40,
                },
                {
                  id: '5-2-4',
                  name: '杨牧',
                  title: 'QQQ开发中心',
                  value: 40,
                },
                {
                  id: '5-2-5',
                  name: '杨牧',
                  title: 'KKK开发中心',
                  value: 40,
                }
              ]
            },
            {
              id: '5-33',
              name: '李宁',
              title: '系统部',
              value: 3,
              children: [
                {
                  id: '5-33-1',
                  name: '杨牧',
                  title: 'ACA开发中心',
                  value: 40,
                },
                {
                  id: '5-33-2',
                  name: '杨牧',
                  title: 'PAM开发中心',
                  value: 40,
                },
                {
                  id: '5-33-3',
                  name: '杨牧',
                  title: 'XXX开发中心',
                  value: 40,
                },
                {
                  id: '5-33-4',
                  name: '杨牧',
                  title: 'QQQ开发中心',
                  value: 40,
                },
                {
                  id: '5-33-5',
                  name: '杨牧',
                  title: 'KKK开发中心',
                  value: 40,
                }
              ]
            },
            {
              id: '5-4',
              name: '梁瑞',
              title: '产研部',
              value: 4,
            }
          ]
        },
        {
          id: '6',
          name: '吴强',
          title: '产品部',
          value: 20,
          showChildren: true,
          children: [
            {
              id: '6-1',
              name: '姜锋',
              title: '设计部',
              value: 6,
            },
            {
              id: '6-2',
              name: '吴强',
              title: '产品管理部',
              value: 3,
            }
          ]
        }
      ]
    }
  ];

  segmentedOptions = [
    {
      label: '用户视图',
      value: 'user'
    },
    {
      label: '部门视图',
      value: 'department'
    }
  ]

  viewType: string = 'department';

  redirectToDepartment(id: string): void {
    // 进行部门的跳转
  }


  selectedLevel: number = 0;
  selectedId: string = '1';
  selectNode(node: any, level: number): void {
    this.selectedLevel = level;
    this.selectedId = node.id;
  }

  openChildren(node: any): void {
    node.openChildren();
  }

  onNodeClick(node: any): void {
    console.log('Node clicked:', node);
  }

  onNodeEdit(node: any): void {
    console.log('Node edit:', node);
  }
}
