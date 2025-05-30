import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectModule, TableCheckedSelections, TableColumn } from '@project';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { ApiData, DocApiTableComponent } from '../doc-api-table/doc-api-table.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import html2canvas from 'html2canvas';

/**
 * 表格文档组件
 * 
 * 功能：
 * 1. 展示各种表格示例
 * 2. 支持将HTML表格导出为文本（保留样式信息）
 * 3. 支持将HTML表格导出为PNG图片
 * 4. 提供静态方法用于任意HTML内容的转换
 */
@Component({
  selector: 'app-doc-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProjectModule,
    DocBoxComponent,
    DocApiTableComponent,
  ],
  templateUrl: './doc-table.component.html',
  styleUrl: './doc-table.component.less'
})
export class DocTableComponent implements OnInit {

  constructor(
    private sanitizer: DomSanitizer
  ) {

  }

  htmls: any = '';
  src = '';
  blobToBase64(blob: any) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = (event: any) => {
        resolve(event.target.result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  }


  ngAfterViewInit() {

  }

  /**
   * 下载HTML元素为PNG图片
   */
  async downloadHtmlAsPng(): Promise<void> {
    const pngData = await this.getHtmlToPng();
    if (!pngData) return;
    const link = document.createElement('a');
    link.href = pngData;
    link.download = 'table-export.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * 将HTML元素转换为PNG图片
   * @returns Promise<string> 返回base64编码的PNG图片
   */
  async getHtmlToPng(): Promise<string> {
    const htmlElement = document.getElementById('baasicTable');
    if (!htmlElement) return '';
    try {
      const canvas = await html2canvas(htmlElement, {
        useCORS: true, // 允许加载跨域图片
        scale: 2, // 提高图片质量
        backgroundColor: null, // 透明背景
        logging: false, // 关闭日志
      });
      this.htmls = canvas;
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('HTML转PNG失败:', error);
      return '';
    }
  }


  // 基础表格数据
  basicData: any[] = [
    { id: 1, name: '张三', age: 32, address: '北京市朝阳区', department: '研发部', city: '北京', birthday: '1990-01-01', gender: '男', jobDuration: { start: '2020-01-01', end: '2023-01-01' } },
    { id: 2, name: '李四', age: 42, address: '上海市浦东新区', department: '市场部', city: '上海', birthday: '1990-01-01', gender: '女', jobDuration: { start: '2020-01-01', end: '2023-01-01' } },
    { id: 3, name: '王五', age: 28, address: '广州市天河区', department: '人事部', city: '广州', birthday: '1990-01-01', gender: '男', jobDuration: { start: '2020-01-01', end: '2023-01-01' } },
  ];

  basicColumns: TableColumn[] = [
    { field: 'name', title: '姓名', width: '100px' },
    { field: 'age', title: '年龄', width: '100px' },
    { field: 'address', title: '地址', width: '300px' },
    { field: 'department', title: '部门', width: '100px' },
    { field: 'city', title: '城市', width: '100px' },
    { field: 'birthday', title: '生日', width: '100px' },
    { field: 'gender', title: '性别', width: '100px' },
    { field: 'jobDuration', title: '工作年限', width: '100px' }
  ];

  // 带边框表格数据
  borderedData = [...this.basicData];
  borderedColumns = [...this.basicColumns];

  // 不同大小表格数据
  sizeData = [...this.basicData];
  sizeColumns = [...this.basicColumns];

  // 自定义单元格数据
  customData = [...this.basicData];
  customColumns: TableColumn[] = [
    { field: 'name', title: '姓名' },
    { field: 'age', title: '年龄' },
    { field: 'address', title: '地址', template: 'addressTemplate' },
    {
      field: 'action', title: '操作', buttons: [
        {
          text: '查看',
          click: (data: any) => {
            console.log('查看详情:', data);
          }
        }
      ]
    }
  ];

  checkedSelections: TableCheckedSelections[] = [
    {
      title: '全选',
      onSelect: (data: any) => {
        this.checkedRows = this.sortableData;
        console.log(this.checkedRows)
      }
    },
    {
      title: '反选',
      onSelect: (data: any) => {
        this.checkedRows = this.sortableData.filter(item => !this.checkedRows.includes(item));
        console.log(this.checkedRows)
      }
    },
    {
      title: '选中单数id',
      onSelect: (data: any) => {
        this.checkedRows = this.sortableData.filter(item => item.id % 2 === 1);
        console.log(this.checkedRows)
      }
    },
    {
      title: '选中双数id',
      onSelect: (data: any) => {
        this.checkedRows = this.sortableData.filter(item => item.id % 2 === 0);
        console.log(this.checkedRows)
      }
    }
  ];

  checkedRows: any[] = [
    { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
  ];


  // 分页表格数据
  paginationData: any[] = [
    { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
    { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
    { id: 3, name: '王五', age: 28, address: '广州市天河区' },
    { id: 4, name: '赵六', age: 35, address: '深圳市南山区' },
    { id: 5, name: '钱七', age: 26, address: '杭州市西湖区' },
  ];

  paginationColumns = [...this.basicColumns];
  pageIndex = 1;
  pageSize = 10;
  total = 20; // 假设总共有20条数据

  // 加载中表格数据
  loadingData = [...this.basicData];
  loadingColumns = [...this.basicColumns];

  // 排序表格数据
  sortableData = [...this.basicData];
  sortableColumns: TableColumn[] = [
    { field: 'name', title: '姓名', sortable: true, sortOrder: null },
    { field: 'age', title: '年龄', sortable: true, sortOrder: null },
    { field: 'address', title: '地址' }
  ];

  // 筛选表格数据
  filterData = [...this.basicData];
  filterColumns: TableColumn[] = [
    {
      field: 'name',
      title: '姓名',
      filterable: true,
      filters: {
        type: 'text',
      }
    },
    {
      field: 'age',
      title: '年龄',
      filterable: true,
      filters: {
        type: 'number',
      }
    },
    {
      field: 'address',
      title: '地址',
      filterable: true,
      filters: {
        type: 'select',
        options: [
          { label: '北京市', value: '北京市' },
          { label: '上海市', value: '上海市' },
          { label: '广州市', value: '广州市' },
          { label: '深圳市', value: '深圳市' },
          { label: '杭州市', value: '杭州市' }
        ]
      }
    },
    {
      field: 'birthday',
      title: '生日',
      filterable: true,
      filters: {
        type: 'date'
      }
    },
    {
      field: 'gender',
      title: '性别',
      filterable: true,
      filters: {
        type: 'radio',
        options: [
          { label: '男', value: '男' },
          { label: '女', value: '女' }
        ]
      }
    },
    {
      field: 'jobDuration',
      title: '工作年限',
      filterable: true,
      filters: {
        type: 'date-range'
      }
    }
  ];

  // 固定列表格数据
  fixedColumnsData = [
    ...this.basicData,
    { id: 4, name: '赵六', age: 35, address: '深圳市南山区' },
    { id: 5, name: '钱七', age: 26, address: '杭州市西湖区' }
  ];
  fixedColumnsColumns: TableColumn[] = [
    { field: 'id', title: 'ID', width: '80px', fixed: 'left' },
    { field: 'name', title: '姓名', width: '100px', fixed: 'left' },
    { field: 'age', title: '年龄', width: '100px' },
    { field: 'address', title: '地址', width: '300px' },
    { field: 'action', title: '操作', width: '100px', fixed: 'right', template: 'actionTemplate' }
  ];
  fixedColumnsScroll = { x: '800px' };

  // 操作列按钮数据
  actionButtonsData = [...this.basicData];
  actionButtonsColumns: TableColumn[] = [
    { field: 'name', title: '姓名', width: '100px' },
    { field: 'age', title: '年龄', width: '100px' },
    { field: 'address', title: '地址', width: '300px' },
    {
      field: 'action',
      title: '操作',
      width: '250px',
      buttons: [
        {
          text: '查看',
          icon: 'bi-eye',
          click: (data: any) => {
            console.log('查看:', data);
          }
        },
        {
          text: '编辑',
          icon: 'bi-pencil',
          click: (data: any) => {
            console.log('编辑:', data);
          }
        },
        {
          text: '删除',
          icon: 'bi-trash',
          click: (data: any) => {
            console.log('删除:', data);
          }
        },
        {
          text: '导出',
          icon: 'bi-download',
          click: (data: any) => {
            console.log('导出:', data);
          }
        },
        {
          text: '分享',
          icon: 'bi-share',
          click: (data: any) => {
            console.log('分享:', data);
          }
        }
      ],
      maxButtons: 3 // 最多显示3个按钮，多余的放到更多菜单中
    }
  ];

  // 复杂表格数据
  complexData = [
    {
      department: '研发部',
      id: 1,
      manager: '张三',
      count: 150,
      children: [
        {
          group: '前端组',
          leader: '李四',
          id: 2,
          count: 45,
          children: [
            { project: 'Angular项目', member: '王五', count: 15, id: 3 },
            { project: 'React项目', member: '赵六', count: 18, id: 4 },
            { project: 'Vue项目', member: '钱七', count: 12, id: 5 }
          ]
        },
        {
          group: '后端组',
          leader: '孙八',
          id: 6,
          count: 65,
          children: [
            { project: 'Java项目', member: '周九', count: 25, id: 7 },
            { project: 'Python项目', member: '吴十', count: 20, id: 8 },
            { project: 'Go项目', member: '郑十一', count: 20, id: 9 }
          ]
        },
        {
          group: '测试组',
          leader: '冯十二',
          id: 10,
          count: 40
        }
      ]
    },
    {
      department: '市场部',
      id: 11,
      manager: '陈十三',
      count: 80,
      children: [
        {
          group: '国内市场',
          leader: '楚十四',
          id: 12,
          count: 45
        },
        {
          group: '海外市场',
          leader: '魏十五',
          id: 13,
          count: 35
        }
      ]
    }
  ];

  flattenComplexData = [
    {
      department: '研发部',
      group: '前端组',
      project: 'Angular项目',
      manager: '张三',
      leader: '李四',
      member: '王五',
      count: 15
    },
    {
      department: '研发部',
      group: '前端组',
      project: 'Angular项目',
      manager: '张三',
      leader: '李四',
      member: '赵六',
      count: 18
    },
    {
      department: '研发部',
      group: '后端组',
      project: 'Java项目',
      manager: '张三',
      leader: '李四',
      member: '周九',
      count: 25
    },
    {
      department: '研发部',
      group: '后端组',
      project: 'Python项目',
      manager: '张三',
      leader: '李四',
      member: '吴十',
      count: 20
    },
    {
      department: '研发部',
      group: '后端组',
      project: 'Go项目',
      manager: '张三',
      leader: '李四',
      member: '郑十一',
      count: 20
    },
    {
      department: '研发部',
      group: '测试组',
      project: '测试项目',
      manager: '张三',
    },
    {
      department: '市场部',
      group: '国内市场',
      project: '国内市场项目',
      manager: '陈十三',
      leader: '楚十四',
      count: 45
    },
    {
      department: '市场部',
      group: '海外市场',
      project: '海外市场项目',
      manager: '陈十三',
      leader: '魏十五',
      count: 35
    }
  ]

  complexColumns: TableColumn[] = [
    { field: 'department', title: '部门', width: '150px' },
    { field: 'group', title: '小组', width: '150px' },
    { field: 'project', title: '项目', width: '150px' },
    { field: 'manager', title: '部门经理', width: '120px' },
    { field: 'leader', title: '组长', width: '120px' },
    { field: 'member', title: '成员', width: '120px' },
    { field: 'count', title: '人数', width: '100px', align: 'right' }
  ];

  // 异步加载表格数据
  asyncData: any[] = [];
  asyncLoading = true;
  asyncColumns = [...this.basicColumns];

  // 表头表尾模板数据
  headerFooterData = [...this.basicData];
  headerFooterColumns = [...this.basicColumns];
  tableTitle = '用户列表';
  tableFooter = '共3条数据';

  // 添加树形表格数据和列配置
  treeData: any[] = [
    {
      key: '1',
      name: '研发部',
      employees: 253,
      type: '技术部门',
      children: [
        {
          key: '1-1',
          name: '前端组',
          employees: 85,
          type: '开发',
          children: [
            { key: '1-1-1', name: 'Angular小组', employees: 28, type: '前端开发' },
            { key: '1-1-2', name: 'React小组', employees: 32, type: '前端开发' },
            { key: '1-1-3', name: 'Vue小组', employees: 25, type: '前端开发' }
          ]
        },
        {
          key: '1-2',
          name: '后端组',
          employees: 115,
          type: '开发',
          children: [
            { key: '1-2-1', name: 'Java小组', employees: 45, type: '后端开发' },
            { key: '1-2-2', name: 'Python小组', employees: 38, type: '后端开发' },
            { key: '1-2-3', name: 'Go小组', employees: 32, type: '后端开发' }
          ]
        },
        { key: '1-3', name: '测试组', employees: 53, type: 'QA' }
      ]
    },
    {
      key: '2',
      name: '市场部',
      employees: 128,
      type: '业务部门',
      children: [
        { key: '2-1', name: '国内市场组', employees: 68, type: '市场' },
        { key: '2-2', name: '海外市场组', employees: 60, type: '市场' }
      ]
    },
    {
      key: '3',
      name: '财务部',
      employees: 42,
      type: '职能部门',
      children: [
        { key: '3-1', name: '会计组', employees: 22, type: '财务' },
        { key: '3-2', name: '出纳组', employees: 20, type: '财务' }
      ]
    }
  ];

  treeColumns: TableColumn[] = [
    { field: 'name', title: '部门名称', treeExpand: true },
    { field: 'employees', title: '员工人数', align: 'right' },
    { field: 'type', title: '部门类型' },
    {
      field: 'action', title: '操作', align: 'center', buttons: [
        {
          text: '查看',
          icon: 'bi-bullseye',
          click: (data: any) => {
            console.log('查看部门:', data);
          }
        },
        {
          text: '编辑',
          icon: 'bi-pencil-fill',
          click: (data: any) => {
            console.log('编辑部门:', data);
          }
        }
      ],
      maxButtons: 1
    }
  ];

  // 引用表格实例，用于调用树形表格方法
  @ViewChild('treeTable') treeTable: any;

  // 展开所有树节点
  expandAllTreeNodes(): void {
    console.log('展开所有节点');
    this.treeTable?.expandAllTreeNodes();
  }

  // 折叠所有树节点
  collapseAllTreeNodes(): void {
    console.log('折叠所有节点');
    this.treeTable?.collapseAllTreeNodes();
  }

  // 代码示例
  basicTableSource = `
import { Component } from '@angular/core';
import { TableComponent } from 'project';

@Component({
  selector: 'app-basic-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: \`
    <lib-table [data]="data" [columns]="columns">
    </lib-table>
  \`,
})
export class BasicTableDemo {
  data = [
    { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
    { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
    { id: 3, name: '王五', age: 28, address: '广州市天河区' },
  ];
  
  columns = [
    { field: 'name', title: '姓名' },
    { field: 'age', title: '年龄' },
    { field: 'address', title: '地址' }
  ];
}`;

  borderedTableSource = `
import { Component } from '@angular/core';
import { TableComponent } from 'project';

@Component({
  selector: 'app-bordered-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: \`
    <lib-table 
      [data]="data" 
      [columns]="columns"
      [bordered]="true">
    </lib-table>
  \`,
})
export class BorderedTableDemo {
  data = [
    { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
    { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
    { id: 3, name: '王五', age: 28, address: '广州市天河区' },
  ];
  
  columns = [
    { field: 'name', title: '姓名' },
    { field: 'age', title: '年龄' },
    { field: 'address', title: '地址' }
  ];
}`;

  sizeTableSource = `
import { Component } from '@angular/core';
import { TableComponent } from 'project';

@Component({
  selector: 'app-size-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: \`
    <div style="margin-bottom: 16px;">
      <lib-table 
        [data]="data" 
        [columns]="columns"
        [size]="'default'">
      </lib-table>
    </div>
    <div style="margin-bottom: 16px;">
      <lib-table 
        [data]="data" 
        [columns]="columns"
        [size]="'middle'">
      </lib-table>
    </div>
    <div>
      <lib-table 
        [data]="data" 
        [columns]="columns"
        [size]="'small'">
      </lib-table>
    </div>
  \`,
})
export class SizeTableDemo {
  data = [
    { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
    { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
    { id: 3, name: '王五', age: 28, address: '广州市天河区' },
  ];
  
  columns = [
    { field: 'name', title: '姓名' },
    { field: 'age', title: '年龄' },
    { field: 'address', title: '地址' }
  ];
}`;

  customCellTableSource = `
import { Component } from '@angular/core';
import { TableComponent } from 'project';

@Component({
  selector: 'app-custom-cell-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: \`
    <lib-table [tableData]="data" [tableColumns]="columns">
      <ng-template widget="nameTemplate" let-data let-column="column">
        <strong>{{ data?.name }}</strong>
      </ng-template>
      <ng-template widget="actionTemplate" let-data>
        <button class="action-button" (click)="onAction(data)">查看</button>
      </ng-template>
    </lib-table>
  \`,
  styles: [\`
    .action-button {
      padding: 4px 8px;
      background-color: #1890ff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .action-button:hover {
      background-color: #40a9ff;
    }
  \`]
})
export class CustomCellTableDemo {
  data = [
    { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
    { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
    { id: 3, name: '王五', age: 28, address: '广州市天河区' },
  ];
  
  columns = [
    { field: 'name', title: '姓名', template: 'nameTemplate' },
    { field: 'age', title: '年龄' },
    { field: 'address', title: '地址' },
    { field: 'action', title: '操作', template: 'actionTemplate' }
  ];

  onAction(row) {
    console.log('查看详情:', row);
  }
}`;

  paginationTableSource = `
import { Component } from '@angular/core';
import { TableComponent } from 'project';

@Component({
  selector: 'app-pagination-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: \`
    <lib-table 
      [data]="data" 
      [columns]="columns"
      [showPagination]="true"
      [pageIndex]="1"
      [pageSize]="10"
      [total]="20"
      (pageIndexChange)="onPageIndexChange($event)"
      (pageSizeChange)="onPageSizeChange($event)">
    </lib-table>
  \`,
})
export class PaginationTableDemo {
  data = [
    { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
    { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
    { id: 3, name: '王五', age: 28, address: '广州市天河区' },
    { id: 4, name: '赵六', age: 35, address: '深圳市南山区' },
    { id: 5, name: '钱七', age: 26, address: '杭州市西湖区' },
  ];
  
  columns = [
    { field: 'name', title: '姓名' },
    { field: 'age', title: '年龄' },
    { field: 'address', title: '地址' }
  ];
  
  onPageIndexChange(pageIndex: number) {
    console.log('页码变化:', pageIndex);
    this.pageIndex = pageIndex;
    // 在实际应用中，这里可以根据页码重新获取数据
  }
  
  onPageSizeChange(pageSize: number) {
    console.log('每页条数变化:', pageSize);
    this.pageSize = pageSize;
    // 在实际应用中，这里可以根据每页条数重新获取数据
  }
}`;

  loadingTableSource = `
import { Component } from '@angular/core';
import { TableComponent } from 'project';

@Component({
  selector: 'app-loading-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: \`
    <lib-table 
      [data]="data" 
      [columns]="columns"
      [loading]="loading">
    </lib-table>
    <button (click)="toggleLoading()">{{ loading ? '关闭加载' : '显示加载' }}</button>
  \`,
})
export class LoadingTableDemo {
  data = [
    { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
    { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
    { id: 3, name: '王五', age: 28, address: '广州市天河区' },
  ];
  
  columns = [
    { field: 'name', title: '姓名' },
    { field: 'age', title: '年龄' },
    { field: 'address', title: '地址' }
  ];
  
  loading = false;
  
  toggleLoading() {
    this.loading = !this.loading;
  }
}`;

  // 添加新的代码示例
  sortableTableSource = `
import { Component } from '@angular/core';
import { TableComponent } from 'project';

@Component({
  selector: 'app-sortable-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: \`
    <lib-table 
      [data]="data" 
      [columns]="columns"
      (sortChange)="onSortChange($event)">
    </lib-table>
  \`,
})
export class SortableTableDemo {
  data = [
    { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
    { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
    { id: 3, name: '王五', age: 28, address: '广州市天河区' },
  ];
  
  columns = [
    { field: 'name', title: '姓名', sortable: true, sortOrder: null },
    { field: 'age', title: '年龄', sortable: true, sortOrder: null },
    { field: 'address', title: '地址' }
  ];

  onSortChange(sortInfo: { field: string; order: 'ascend' | 'descend' | null }) {
    console.log('排序信息:', sortInfo);
    // 在实际应用中，这里可以根据排序信息重新获取数据
  }
}`;

  filterTableSource = `
import { Component } from '@angular/core';
import { TableComponent } from 'project';

@Component({
  selector: 'app-filter-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: \`
    <lib-table 
      [data]="data" 
      [columns]="columns"
      (filterChange)="onFilterChange($event)">
    </lib-table>
  \`,
})
export class FilterTableDemo {
  data = [
    { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
    { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
    { id: 3, name: '王五', age: 28, address: '广州市天河区' },
  ];
  
  columns = [
    { 
      field: 'name', 
      title: '姓名', 
      filterable: true,
      filterMultiple: true,
      filters: [
        { text: '张三', value: '张三' },
        { text: '李四', value: '李四' },
        { text: '王五', value: '王五' }
      ]
    },
    { 
      field: 'age', 
      title: '年龄',
      filterable: true,
      filterMultiple: false,
      filters: [
        { text: '30岁以下', value: 30 },
        { text: '30-40岁', value: 40 },
        { text: '40岁以上', value: 50 }
      ]
    },
    { field: 'address', title: '地址' }
  ];

  onFilterChange(filterInfo: { field: string; value: any[] }) {
    console.log('过滤信息:', filterInfo);
    // 在实际应用中，这里可以根据过滤信息重新获取数据
  }
}`;

  fixedColumnsTableSource = `
import { Component } from '@angular/core';
import { TableComponent } from 'project';

@Component({
  selector: 'app-fixed-columns-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: \`
    <lib-table 
      [tableData]="data" 
      [tableColumns]="columns"
      [tableScroll]="{ x: '800px' }">
      <ng-template widget="actionTemplate" let-data>
        <button class="action-button" (click)="onAction(data)">查看</button>
      </ng-template>
    </lib-table>
  \`,
  styles: [\`
    .action-button {
      padding: 4px 8px;
      background-color: #1890ff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  \`]
})
export class FixedColumnsTableDemo {
  data = [
    { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
    { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
    { id: 3, name: '王五', age: 28, address: '广州市天河区' },
    { id: 4, name: '赵六', age: 35, address: '深圳市南山区' },
    { id: 5, name: '钱七', age: 26, address: '杭州市西湖区' }
  ];
  
  columns = [
    { field: 'id', title: 'ID', width: '80px', fixed: 'left' },
    { field: 'name', title: '姓名', width: '100px', fixed: 'left' },
    { field: 'age', title: '年龄', width: '100px' },
    { field: 'address', title: '地址', width: '300px' },
    { field: 'action', title: '操作', width: '100px', fixed: 'right', template: 'actionTemplate' }
  ];

  onAction(row) {
    console.log('查看详情:', row);
  }
}`;

  asyncTableSource = `
import { Component, OnInit } from '@angular/core';
import { TableComponent } from 'project';

@Component({
  selector: 'app-async-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: \`
    <lib-table 
      [data]="data" 
      [columns]="columns"
      [loading]="loading">
    </lib-table>
    <button (click)="loadData()">重新加载</button>
  \`,
})
export class AsyncTableDemo implements OnInit {
  data = [];
  columns = [
    { field: 'name', title: '姓名' },
    { field: 'age', title: '年龄' },
    { field: 'address', title: '地址' }
  ];
  loading = true;

  ngOnInit() {
    this.loadData();
  }
  
  loadData() {
    this.loading = true;
    // 模拟异步请求
    setTimeout(() => {
      this.data = [
        { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
        { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
        { id: 3, name: '王五', age: 28, address: '广州市天河区' }
      ];
      this.loading = false;
    }, 1500);
  }
}`;

  headerFooterTableSource = `
import { Component } from '@angular/core';
import { TableComponent } from 'project';

@Component({
  selector: 'app-header-footer-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: \`
    <lib-table 
      [data]="data" 
      [columns]="columns"
      [title]="title"
      [footer]="footer">
    </lib-table>
    <!-- 也可以使用模板方式 -->
    <lib-table 
      [data]="data" 
      [columns]="columns"
      [title]="tableTitle"
      [footer]="tableFooter">
      <ng-template #tableTitle>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>用户列表</span>
          <button>添加用户</button>
        </div>
      </ng-template>
      <ng-template #tableFooter>
        <div style="text-align: right;">共{{ data.length }}条数据</div>
      </ng-template>
    </lib-table>
  \`,
})
export class HeaderFooterTableDemo {
  data = [
    { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
    { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
    { id: 3, name: '王五', age: 28, address: '广州市天河区' }
  ];
  
  columns = [
    { field: 'name', title: '姓名' },
    { field: 'age', title: '年龄' },
    { field: 'address', title: '地址' }
  ];

  title = '用户列表';
  footer = '共3条数据';
}`;

  // 树形表格源代码示例
  treeTableSource = `
import { Component, ViewChild } from '@angular/core';
import { TableComponent } from 'project';

@Component({
  selector: 'app-tree-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: \`
    <lib-table 
      #treeTable
      [tableData]="treeData" 
      [tableColumns]="treeColumns"
      [tableIsTree]="true">
      <ng-template widget="actionTemplate" let-data>
        <div>
          <button class="action-button" (click)="viewDepartment(data)">查看</button>
          <button class="action-button" (click)="editDepartment(data)">编辑</button>
        </div>
      </ng-template>
    </lib-table>
    <div style="margin-top: 16px;">
      <button (click)="expandAllTreeNodes()">展开所有</button>
      <button (click)="collapseAllTreeNodes()">收起所有</button>
    </div>
  \`,
})
export class TreeTableDemo {
  @ViewChild('treeTable') treeTable: TableComponent;

  // 树形表格数据
  treeData = [
    {
      key: '1',
      name: '研发部',
      employees: 253,
      type: '技术部门',
      children: [
        {
          key: '1-1',
          name: '前端组',
          employees: 85,
          type: '开发',
          children: [
            { key: '1-1-1', name: 'Angular小组', employees: 28, type: '前端开发' },
            { key: '1-1-2', name: 'React小组', employees: 32, type: '前端开发' },
            { key: '1-1-3', name: 'Vue小组', employees: 25, type: '前端开发' }
          ]
        },
        {
          key: '1-2',
          name: '后端组',
          employees: 115,
          type: '开发',
          children: [
            { key: '1-2-1', name: 'Java小组', employees: 45, type: '后端开发' },
            { key: '1-2-2', name: 'Python小组', employees: 38, type: '后端开发' },
            { key: '1-2-3', name: 'Go小组', employees: 32, type: '后端开发' }
          ]
        },
        { key: '1-3', name: '测试组', employees: 53, type: 'QA' }
      ]
    },
    {
      key: '2',
      name: '市场部',
      employees: 128,
      type: '业务部门',
      children: [
        { key: '2-1', name: '国内市场组', employees: 68, type: '市场' },
        { key: '2-2', name: '海外市场组', employees: 60, type: '市场' }
      ]
    },
    {
      key: '3',
      name: '财务部',
      employees: 42,
      type: '职能部门',
      children: [
        { key: '3-1', name: '会计组', employees: 22, type: '财务' },
        { key: '3-2', name: '出纳组', employees: 20, type: '财务' }
      ]
    }
  ];

  // 树形表格列配置
  treeColumns = [
    { field: 'name', title: '部门名称', treeExpand: true },
    { field: 'employees', title: '员工人数', align: 'right' },
    { field: 'type', title: '部门类型' },
    { field: 'action', title: '操作', template: 'actionTemplate' }
  ];
  
  viewDepartment(data) {
    console.log('查看部门:', data);
  }
  
  editDepartment(data) {
    console.log('编辑部门:', data);
  }

  // 展开所有树节点
  expandAllTreeNodes(): void {
    this.treeTable.expandAllTreeNodes();
  }

  // 折叠所有树节点
  collapseAllTreeNodes(): void {
    this.treeTable.collapseAllTreeNodes();
  }
}`;

  // 添加虚拟滚动表格的代码示例
  virtualScrollTableSource = `
import { Component, OnInit } from '@angular/core';
import { TableComponent, TableRefreshEvent } from 'project';

@Component({
  selector: 'app-virtual-scroll-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: \`
    <lib-table 
      [tableData]="data" 
      [tableColumns]="columns"
      [tableVirtualScroll]="true"
      [tableScroll]="{ y: '400px' }"
      [tableVirtualItemSize]="48"
      [tableVirtualMinBufferPx]="100"
      [tableVirtualMaxBufferPx]="200"
      (tableRefresh)="onTableRefresh($event)">
      <ng-template widget="statusTemplate" let-data>
        <span [style.color]="getStatusColor(data.status)">{{ data.status }}</span>
      </ng-template>
    </lib-table>
  \`,
})
export class VirtualScrollTableDemo implements OnInit {
  data: any[] = [];
  columns = [
    { field: 'id', title: 'ID', width: '80px' },
    { field: 'name', title: '姓名', width: '120px' },
    { field: 'age', title: '年龄', width: '100px' },
    { field: 'address', title: '地址', width: '300px' },
    { field: 'department', title: '部门', width: '150px' },
    { field: 'position', title: '职位', width: '150px' },
    { field: 'salary', title: '薪资', width: '120px', align: 'right' },
    { field: 'status', title: '状态', width: '100px', template: 'statusTemplate' }
  ];

  ngOnInit() {
    this.generateData();
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case '在职': return 'green';
      case '离职': return 'red';
      case '休假': return 'orange';
      default: return 'black';
    }
  }

  generateData() {
    const positions = ['前端开发', '后端开发', '测试工程师', '产品经理', 'UI设计师'];
    const departments = ['研发部', '产品部', '设计部', '测试部', '运维部'];
    const statuses = ['在职', '离职', '休假'];
    const addresses = ['北京市朝阳区', '上海市浦东新区', '广州市天河区', '深圳市南山区'];

    // 生成200条数据用于虚拟滚动演示
    for (let i = 1; i <= 200; i++) {
      this.data.push({
        id: i,
        name: \`用户\${i}\`,
        age: Math.floor(Math.random() * 30) + 20,
        address: addresses[Math.floor(Math.random() * addresses.length)],
        department: departments[Math.floor(Math.random() * departments.length)],
        position: positions[Math.floor(Math.random() * positions.length)],
        salary: Math.floor(Math.random() * 10000) + 5000,
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }
  }

  onTableRefresh(event: TableRefreshEvent) {
    console.log('表格刷新事件:', event);
    // 在这里可以处理排序、筛选、分页等
    const { pagination, sort, filters } = event;
    
    // 根据这些信息可以重新请求数据或前端处理
    console.log('分页信息:', pagination);
    console.log('排序信息:', sort);
    console.log('筛选信息:', filters);
  }
}`;
  // API 数据定义
  apiSections: ApiData[] = [
    {
      title: '属性',
      items: [
        {
          name: 'tableData',
          description: '表格数据源',
          type: 'any[]',
          default: '[]'
        },
        {
          name: 'tableColumns',
          description: '表格列配置',
          type: 'TableColumn[]',
          default: '[]'
        },
        {
          name: 'tableSize',
          description: '表格大小',
          type: "'default' | 'middle' | 'small'",
          default: "'default'"
        },
        {
          name: 'tableBordered',
          description: '是否显示边框',
          type: 'boolean',
          default: 'false'
        },
        {
          name: 'tableLoading',
          description: '是否显示loading状态',
          type: 'boolean',
          default: 'false'
        },
        {
          name: 'tableTitle',
          description: '表格标题',
          type: 'string | TemplateRef<void> | null',
          default: 'null'
        },
        {
          name: 'tableFooter',
          description: '表格底部',
          type: 'string | TemplateRef<void> | null',
          default: 'null'
        },
        {
          name: 'tableIsTree',
          description: '是否为树形表格',
          type: 'boolean',
          default: 'false'
        },
        {
          name: 'tableShowPagination',
          description: '是否显示分页',
          type: 'boolean',
          default: 'true'
        },
        {
          name: 'tablePageIndex',
          description: '当前页码',
          type: 'number',
          default: '1'
        },
        {
          name: 'tablePageSize',
          description: '每页条数',
          type: 'number',
          default: '10'
        },
        {
          name: 'tableTotal',
          description: '总数据条数',
          type: 'number',
          default: '0'
        },
        {
          name: 'tablePageSizeOptions',
          description: '可选的每页条数',
          type: 'number[]',
          default: '[10, 20, 30, 50]'
        },
        {
          name: 'tableFrontPagination',
          description: '是否前端分页',
          type: 'boolean',
          default: 'true'
        },
        {
          name: 'tableScroll',
          description: '表格滚动配置',
          type: '{ x?: string | null; y?: string | null }',
          default: '{ x: null, y: null }'
        },
        {
          name: 'tableVirtualScroll',
          description: '是否启用虚拟滚动',
          type: 'boolean',
          default: 'false'
        },
        {
          name: 'tableVirtualItemSize',
          description: '虚拟滚动每行高度(px)',
          type: 'number',
          default: '48'
        },
        {
          name: 'tableVirtualMinBufferPx',
          description: '虚拟滚动最小缓冲区大小(px)',
          type: 'number',
          default: '100'
        },
        {
          name: 'tableVirtualMaxBufferPx',
          description: '虚拟滚动最大缓冲区大小(px)',
          type: 'number',
          default: '200'
        }
      ]
    },
    {
      title: '事件',
      items: [
        {
          name: 'tableRefresh',
          description: '表格刷新事件，排序、筛选、分页等变化时触发',
          type: 'EventEmitter<TableRefreshEvent>',
          params: '{ pagination: { pageIndex, pageSize, total }, sort: { field, order }, filters, virtualScroll }'
        },
        {
          name: 'pageIndexChange',
          description: '页码变化事件',
          type: 'EventEmitter<number>',
          params: 'pageIndex: number'
        },
        {
          name: 'pageSizeChange',
          description: '每页条数变化事件',
          type: 'EventEmitter<number>',
          params: 'pageSize: number'
        },
        {
          name: 'tableCheckedRowsChange',
          description: '选中行变化事件',
          type: 'EventEmitter<any[]>',
          params: 'checkedRows: any[]'
        }
      ]
    },
    {
      title: '列配置项',
      items: [
        {
          name: 'field',
          description: '列数据字段名',
          type: 'string',
          default: '-'
        },
        {
          name: 'title',
          description: '列标题',
          type: 'string',
          default: '-'
        },
        {
          name: 'width',
          description: '列宽度',
          type: 'string | number',
          default: '-'
        },
        {
          name: 'template',
          description: '自定义单元格渲染模板名称',
          type: 'string',
          default: '-'
        },
        {
          name: 'buttons',
          description: '列内按钮配置数组',
          type: 'Array<{ text: string, icon?: string, click: Function, show?: Function, disabled?: boolean }>',
          default: '[]'
        },
        {
          name: 'maxButtons',
          description: '直接显示的最大按钮数量，超出部分会显示在下拉菜单中',
          type: 'number',
          default: '按钮数量'
        },
        {
          name: 'fixed',
          description: '列是否固定',
          type: "boolean | 'left' | 'right'",
          default: 'false'
        },
        {
          name: 'sortable',
          description: '列是否可排序',
          type: 'boolean',
          default: 'false'
        },
        {
          name: 'sortOrder',
          description: '当前排序方向',
          type: "'ascend' | 'descend' | null",
          default: 'null'
        },
        {
          name: 'filterable',
          description: '列是否可筛选',
          type: 'boolean',
          default: 'false'
        },
        {
          name: 'filterMultiple',
          description: '列是否多选过滤',
          type: 'boolean',
          default: 'true'
        },
        {
          name: 'filters',
          description: '列过滤选项',
          type: 'TableColumnFilter[]',
          default: '[]'
        },
        {
          name: 'align',
          description: '列对齐方式',
          type: "'left' | 'center' | 'right'",
          default: "'left'"
        },
        {
          name: 'type',
          description: '列类型，operation表示操作列',
          type: "'operation' | string",
          default: '-'
        },
        {
          name: 'treeExpand',
          description: '是否为树形展开列',
          type: 'boolean',
          default: 'false'
        }
      ]
    },
    {
      title: '树形表格方法',
      items: [
        {
          name: 'expandAllTreeNodes',
          description: '展开所有树节点',
          type: '() => void',
          params: '-'
        },
        {
          name: 'collapseAllTreeNodes',
          description: '折叠所有树节点',
          type: '() => void',
          params: '-'
        },
        {
          name: 'toggleTreeNode',
          description: '切换指定树节点的展开/折叠状态',
          type: '(node: any) => void',
          params: 'node: 要切换的节点对象'
        }
      ]
    },
    {
      title: '列筛选配置',
      items: [
        {
          name: 'filters.type',
          description: '筛选框的类型',
          type: "'text' | 'number' | 'select' | 'select-multiple' | 'cascader' | 'cascader-multiple' | 'tree-select' | 'tree-select-multiple' | 'tree-select-checkable' | 'date' | 'date-range' | 'radio' | 'checkbox'",
          default: '-'
        },
        {
          name: 'filters.options',
          description: '筛选选项，适用于select/cascader/tree-select/radio/checkbox等类型',
          type: 'Array<{ label: string, value: any, children?: any[] }>',
          default: '[]'
        },
        {
          name: 'filters.title',
          description: '筛选项标题',
          type: 'string',
          default: '列标题'
        }
      ]
    }
  ];

  // 虚拟滚动表格数据
  virtualScrollData: any[] = [];
  virtualScrollColumns: TableColumn[] = [
    { field: 'id', title: 'ID', width: '80px' },
    { field: 'name', title: '姓名', width: '120px' },
    { field: 'age', title: '年龄', width: '100px' },
    { field: 'address', title: '地址', width: '300px' },
    { field: 'department', title: '部门', width: '150px' },
    { field: 'position', title: '职位', width: '150px' },
    { field: 'salary', title: '薪资', width: '120px', align: 'right' },
    { field: 'status', title: '状态', width: '100px' }
  ];

  // 处理表格刷新事件
  onTableRefresh(event: any): void {
    console.log('表格刷新事件:', event);
    // 实际应用中可以根据排序、筛选、分页等信息重新请求数据
  }

  ngOnInit(): void {
    // 模拟异步加载数据
    setTimeout(() => {
      this.asyncData = [
        { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
        { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
        { id: 3, name: '王五', age: 28, address: '广州市天河区' }
      ];
      this.asyncLoading = false;
    }, 1500);

    this.generateVirtualScrollData();
  }

  // 重新加载异步数据
  reloadAsyncData(): void {
    this.asyncLoading = true;
    setTimeout(() => {
      this.asyncData = [
        { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
        { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
        { id: 3, name: '王五', age: 28, address: '广州市天河区' }
      ];
      this.asyncLoading = false;
    }, 1500);
  }

  // 处理表格操作按钮点击事件
  onAction(row: any): void {
    console.log('查看详情:', row);
  }

  // 处理表格页码变化事件
  onPageIndexChange(pageIndex: number): void {
    console.log('页码变化:', pageIndex);
    this.pageIndex = pageIndex;
    // 在实际应用中，这里可以根据页码重新获取数据
  }

  // 处理表格每页条数变化事件
  onPageSizeChange(pageSize: number): void {
    console.log('每页条数变化:', pageSize);
    this.pageSize = pageSize;
    // 在实际应用中，这里可以根据每页条数重新获取数据
  }

  // 处理表格排序变化事件
  onSortChange(sortInfo: { field: string; order: 'ascend' | 'descend' | null }): void {
    console.log('排序信息:', sortInfo);
    // 在实际应用中，这里可以根据排序信息重新获取数据
  }

  // 处理表格过滤变化事件
  onFilterChange(filterInfo: { field: string; value: any[] }): void {
    console.log('过滤信息:', filterInfo);
    // 在实际应用中，这里可以根据过滤信息重新获取数据
  }

  // 处理表格当前页数据变化事件
  onCurrentPageDataChange(data: any[]): void {
    console.log('当前页数据:', data);
  }

  // 生成虚拟滚动数据
  generateVirtualScrollData(): void {
    const positions = ['前端开发', '后端开发', '测试工程师', '产品经理', 'UI设计师', '技术经理', '项目经理'];
    const departments = ['研发部', '产品部', '设计部', '测试部', '运维部'];
    const statuses = ['在职', '离职', '休假'];
    const addresses = [
      '北京市朝阳区', '上海市浦东新区', '广州市天河区', '深圳市南山区',
      '杭州市西湖区', '成都市高新区', '武汉市洪山区', '南京市鼓楼区'
    ];

    // 生成200条数据
    for (let i = 1; i <= 200; i++) {
      this.virtualScrollData.push({
        id: i,
        name: `用户${i}`,
        age: Math.floor(Math.random() * 30) + 20, // 20-49岁
        address: addresses[Math.floor(Math.random() * addresses.length)],
        department: departments[Math.floor(Math.random() * departments.length)],
        position: positions[Math.floor(Math.random() * positions.length)],
        salary: Math.floor(Math.random() * 10000) + 5000, // 5000-14999
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }
  }

  // 多层级表头数据
  multiLevelHeaderData = [
    {
      id: 1,
      name: '张三',
      age: 32,
      address: '北京市朝阳区',
      department: '研发部',
      position: '前端开发',
      performance: { q1: 85, q2: 88, q3: 90, q4: 92 },
      income: { base: 12000, bonus: 5000, subsidy: 1500 }
    },
    {
      id: 2,
      name: '李四',
      age: 42,
      address: '上海市浦东新区',
      department: '市场部',
      position: '市场经理',
      performance: { q1: 78, q2: 82, q3: 84, q4: 88 },
      income: { base: 15000, bonus: 8000, subsidy: 2000 }
    },
    {
      id: 3,
      name: '王五',
      age: 28,
      address: '广州市天河区',
      department: '人事部',
      position: 'HR专员',
      performance: { q1: 80, q2: 79, q3: 82, q4: 85 },
      income: { base: 10000, bonus: 3000, subsidy: 1000 }
    },
  ];

  multiLevelHeaderColumns: any[] = [
    {
      title: '基本信息',
      width: '300px',
      fixed: 'left',
      children: [
        {
          field: 'xxx',
          title: '个人信息',
          children: [
            {
              field: 'name',
              title: '姓名'
            },
            {
              field: 'age',
              title: '年龄'
            }
          ]
        },
        {
          field: 'xxx',
          title: '家庭信息',
          children: [
            {
              field: 'address',
              title: '地址'
            }
          ]
        }
      ]
    },
    {
      title: '部门信息',
      width: '300px',
      children: [
        { field: 'department', title: '部门名称' },
        { field: 'position', title: '职位' }
      ]
    },
    {
      title: '季度绩效',
      width: '300px',
      children: [
        { field: 'performance.q1', title: 'Q1', align: 'right' },
        { field: 'performance.q2', title: 'Q2', align: 'right' },
        { field: 'performance.q3', title: 'Q3', align: 'right' },
        { field: 'performance.q4', title: 'Q4', align: 'right' }
      ]
    },
    {
      title: '薪资构成',
      width: '300px',
      fixed: 'right',
      children: [
        { field: 'income.base', title: '基本工资', align: 'right' },
        { field: 'income.bonus', title: '奖金', align: 'right' },
        { field: 'income.subsidy', title: '补贴', align: 'right' }
      ]
    }
  ];

  // 多层级表头示例代码
  multiLevelHeaderTableSource = `
import { Component } from '@angular/core';
import { TableComponent, TableColumn } from 'project';

@Component({
  selector: 'app-multi-level-header-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: \`
    <lib-table [tableData]="data" [tableColumns]="columns" [tableBordered]="true">
      <ng-template widget="performanceTemplate" let-data let-column="column">
        <span [style.color]="getPerformanceColor(data?.performance?.[column.field.split('.')[1]])">
          {{ data?.performance?.[column.field.split('.')[1]] }}
        </span>
      </ng-template>
    </lib-table>
  \`,
})
export class MultiLevelHeaderTableDemo {
  data = [
    { 
      id: 1, 
      name: '张三', 
      age: 32, 
      address: '北京市朝阳区', 
      department: '研发部', 
      position: '前端开发',
      performance: { q1: 85, q2: 88, q3: 90, q4: 92 },
      income: { base: 12000, bonus: 5000, subsidy: 1500 }
    },
    { 
      id: 2, 
      name: '李四', 
      age: 42, 
      address: '上海市浦东新区', 
      department: '市场部', 
      position: '市场经理',
      performance: { q1: 78, q2: 82, q3: 84, q4: 88 },
      income: { base: 15000, bonus: 8000, subsidy: 2000 }
    },
    { 
      id: 3, 
      name: '王五', 
      age: 28, 
      address: '广州市天河区', 
      department: '人事部',
      position: 'HR专员',
      performance: { q1: 80, q2: 79, q3: 82, q4: 85 },
      income: { base: 10000, bonus: 3000, subsidy: 1000 }
    },
  ];

  columns: TableColumn[] = [
    {
      title: '基本信息',
      children: [
        { field: 'name', title: '姓名', width: '100px' },
        { field: 'age', title: '年龄', width: '80px' },
        { field: 'address', title: '地址', width: '200px' }
      ]
    },
    {
      title: '部门信息',
      children: [
        { field: 'department', title: '部门名称', width: '120px' },
        { field: 'position', title: '职位', width: '120px' }
      ]
    },
    {
      title: '季度绩效',
      children: [
        { field: 'performance.q1', title: 'Q1', width: '80px', align: 'right', template: 'performanceTemplate' },
        { field: 'performance.q2', title: 'Q2', width: '80px', align: 'right', template: 'performanceTemplate' },
        { field: 'performance.q3', title: 'Q3', width: '80px', align: 'right', template: 'performanceTemplate' },
        { field: 'performance.q4', title: 'Q4', width: '80px', align: 'right', template: 'performanceTemplate' }
      ]
    },
    {
      title: '薪资构成',
      children: [
        { field: 'income.base', title: '基本工资', width: '100px', align: 'right' },
        { field: 'income.bonus', title: '奖金', width: '100px', align: 'right' },
        { field: 'income.subsidy', title: '补贴', width: '100px', align: 'right' }
      ]
    }
  ];
  
  getPerformanceColor(value: number): string {
    if (value >= 90) return 'green';
    if (value >= 80) return 'blue';
    if (value >= 70) return 'orange';
    return 'red';
  }
}`;

  // 添加操作列按钮示例代码
  actionButtonsTableSource = `
import { Component } from '@angular/core';
import { TableComponent } from 'project';

@Component({
  selector: 'app-action-buttons-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: '<lib-table [tableData]="data" [tableColumns]="columns"></lib-table>',
})
export class ActionButtonsTableDemo {
  data = [
    { id: 1, name: '张三', age: 32, address: '北京市朝阳区' },
    { id: 2, name: '李四', age: 42, address: '上海市浦东新区' },
    { id: 3, name: '王五', age: 28, address: '广州市天河区' }
  ];
  
  columns = [
    { field: 'name', title: '姓名', width: '100px' },
    { field: 'age', title: '年龄', width: '100px' },
    { field: 'address', title: '地址', width: '300px' },
    {
      field: 'action', 
      title: '操作', 
      width: '250px',
      buttons: [
        {
          text: '查看',
          icon: 'bi-eye',
          click: (data) => {
            console.log('查看:', data);
          }
        },
        {
          text: '编辑',
          icon: 'bi-pencil',
          click: (data) => {
            console.log('编辑:', data);
          }
        },
        {
          text: '删除',
          icon: 'bi-trash',
          click: (data) => {
            console.log('删除:', data);
          }
        },
        {
          text: '导出',
          icon: 'bi-download',
          click: (data) => {
            console.log('导出:', data);
          }
        },
        {
          text: '分享',
          icon: 'bi-share',
          click: (data) => {
            console.log('分享:', data);
          }
        }
      ],
      maxButtons: 3 // 最多显示3个按钮，多余的放到更多菜单中
    }
  ];
}`;

  // 添加复杂表格示例代码
  complexTableSource = `
import { Component } from '@angular/core';
import { TableComponent } from 'project';

@Component({
  selector: 'app-complex-table-demo',
  standalone: true,
  imports: [TableComponent],
  template: '<lib-table [tableData]="data" [tableColumns]="columns" [tableComplex]="true"></lib-table>',
})
export class ComplexTableDemo {
  // 复杂表格数据
  data = [
    {
      department: '研发部',
      manager: '张三',
      count: 150,
      children: [
        {
          group: '前端组',
          leader: '李四',
          count: 45,
          children: [
            { project: 'Angular项目', member: '王五', count: 15 },
            { project: 'React项目', member: '赵六', count: 18 },
            { project: 'Vue项目', member: '钱七', count: 12 }
          ]
        },
        {
          group: '后端组',
          leader: '孙八',
          count: 65,
          children: [
            { project: 'Java项目', member: '周九', count: 25 },
            { project: 'Python项目', member: '吴十', count: 20 },
            { project: 'Go项目', member: '郑十一', count: 20 }
          ]
        },
        {
          group: '测试组', 
          leader: '冯十二',
          count: 40
        }
      ]
    },
    {
      department: '市场部',
      manager: '陈十三',
      count: 80,
      children: [
        {
          group: '国内市场',
          leader: '楚十四',
          count: 45
        },
        {
          group: '海外市场',
          leader: '魏十五',
          count: 35
        }
      ]
    }
  ];
  
  columns = [
    { field: 'department', title: '部门', width: '150px' },
    { field: 'group', title: '小组', width: '150px' },
    { field: 'project', title: '项目', width: '150px' },
    { field: 'manager', title: '部门经理', width: '120px' },
    { field: 'leader', title: '组长', width: '120px' },
    { field: 'member', title: '成员', width: '120px' },
    { field: 'count', title: '人数', width: '100px', align: 'right' }
  ];
}`;

}



