import { ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Params } from '@angular/router';
import * as _ from 'lodash';
@Component({
  selector: 'lib-dynamic-table',
  imports: [],
  templateUrl: './dynamic-table.component.html',
  styleUrl: './dynamic-table.component.less'
})
export class DynamicTableComponent {
  // 数据，参考树形格式
  @Input() qzTableData: any | any[] = [];
  // 表头字段，参考domptable字段
  @Input() qzTableFields: any[] = [];
  // 表格表头过滤 todo
  @Input() qzTableFilters: Array<any> = [];
  // 对于td的样式
  @Input() qzTableSetting: any = {};
  // 表格模板对象
  @Input() qzSideTemplates: any;
  // 表格行交互
  @Input() qzRowHoverable: boolean = true;
  // 表格列交互
  @Input() qzColHoverable: boolean = false;
  // 编辑模式,即进行分组等内容的编辑
  @Input() editMode: boolean = false;
  // 是否展示底部翻页器
  @Input() qzShowPagination: boolean = true;
  // 是否显示表格2边侧边栏
  @Input() qzShowSideBorder: boolean = true;
  // 合计，总计，小计等内容配置
  @Input() qzTotalConfig: any = {};
  // 底部操作了固定
  @Input() qzStickyOption: any;
  // 是否固定位置
  @Input() overflow: boolean = false;
  // 表身是否进行加载等内容
  @Input() qzReloading: boolean = false;
  // 虚拟滚动
  @Input() virtual = false;
  // 一次加载的行数
  @Input() virtualRow = 80;
  // 数据重载
  @Output() qzReload = new EventEmitter();
  // 表格过滤等方法输出
  @Output() qzRefresh = new EventEmitter<any>();
  // 传递出对应数据map的方法
  @Output() dataMapOutput = new EventEmitter<{ data: Map<string, any>, title: Map<string, string> }>();

  constructor(
    private cdr: ChangeDetectorRef,
  ) { }

  header: any = []
  body: any = []

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.removeScrollEvent();
  }

  ngOnChanges(changes: any): void {
    if (changes.qzReloading) {
      if (this.qzReloading === true) {
        this.moveToTop();
      }
    }
    if (changes.qzTotalConfig) {
      this.initTotalConfig();
    }
    if (changes.qzTableData || changes.qzTableFields) {
      this.initTableHeader(this.qzTableFields);
      this.cdr.detectChanges();
      // 延迟加载，避免出现空白页情况
      let timer = setTimeout(() => {
        this.initTableBody(this.qzTableData);
        clearTimeout(timer);
        this.cdr.detectChanges();
      }, 0)
    }
    if(changes.editMode){
      this.getRenderRange();
    }
  }

  ngAfterViewInit() {
  }

  empty: Array<any> = [];

  // clear 总计小计配置
  totalConfig: any = {};
  // clear 字段对应标题的map 
  fieldMap: Map<string, any> = new Map();
  // clear 分组map 
  groupMap: Map<string, any> = new Map();
  // 用于渲染的表头字段
  headerFields: Array<any> = [];
  // clear 分组字段数组 
  groupFieldMap: Map<string, Map<any, any>> = new Map();
  // clear 分组字段索引 
  groupFieldIndexMap: Map<string, number> = new Map();
  // clear 分组数组 
  groupArray: Array<any> = [];
  // clear 数据字段map 
  dataFieldMap: Map<string, any> = new Map();
  // clear 数据索引map 
  dataFieldIndexMap: Map<string, any> = new Map();
  // clear 可见的数据数组 
  visiableDataArray: Array<any> = [];
  // clear 所有的数据数组 
  allDataArray: Array<any> = [];
  // clear 子级字段数组 
  afterFieldsMap: Map<string, any> = new Map();
  // clear 表头最大层级数
  headerFieldMaxDepth: number = 0;
  // clear 最小颗粒度划分的行数，即最大行数
  maxRows: number = 0;
  // clear 最小颗粒度数组
  maxRowsArray: Array<any> = [];
  // clear 表格分组及筛选对象
  tableFilterObject: any  = {};
  // 是否页码是初始化
  initPage: boolean = true;
  // 页码等参数
  pageParams: any  = {};
  // 初始固定对象
  tableSticky: any = {};
  // 合计，小计的位置map
  totalMap: Map<any, any> = new Map();
  // 过滤器配置map
  filterMap: Map<string, any> = new Map();
  // 加载状态
  loading: boolean = true;
  // 是否是列表表格
  listTable: boolean = false;
  // 原始未经转换的过滤条件
  originFilterParams: any = {};
  // 数据行数map
  dataCountMap: Map<any,any> = new Map();
  // 范围索引
  rangeIndex = 0;
  // 表格展示行
  tableRow: Array<any> = [];
  // 范围数组
  rangeArray: Array<any> = [];

  /**
   * 表格数据emit事件，目前已有
   * 1. 过滤
   */
  public refreshTable(type?: string): void {
    this.qzRefresh.emit({
      params: {
        ...this.tableFilterObject,
        ...this.pageParams
      },
      config: {
        originFilter: this.originFilterParams,
        total: this.totalConfig?.total?.show,
        subtotal: this.totalConfig?.subtotal?.show
      },
    });
  }

  /**
   * 初始化总计小计内容
   */
  private initTotalConfig(): void {
    if (!this.qzTotalConfig) {
      return;
    }
    this.totalConfig = _.cloneDeep(this.qzTotalConfig);
  }

  /**
   * 初始化智能表格分组
   */
  private initTableGroup(group: any): void {
    // 分组数据的map初始化
    this.groupMap.clear();
    this.groupFieldIndexMap.clear();
    this.groupFieldMap.clear();
    this.afterFieldsMap.clear();
    if (group && group.length) {
      group.forEach((item: any, index: any) => {
        let array = _.drop(group, index + 1);
        let keyArray: any = [];
        array.forEach((element: any) => {
          keyArray.push(element.field);
        });
        if (keyArray.length !== 0) {
          this.afterFieldsMap.set(item.field, keyArray);
        }
        this.groupMap.set(item.field, item);
        this.groupFieldIndexMap.set(item.field, 0);
        this.groupFieldMap.set(item.field, new Map());
      });
    }
  }

  /**
   * 初始化智能表格表头
   */
  private initTableHeader(header: any[]): void {
    this.groupArray = [];
    this.visiableDataArray = [];
    this.allDataArray = [];
    this.dataFieldIndexMap.clear();
    this.dataFieldMap.clear();
    this.fieldMap.clear();
    this.headerFields = this.transferTableFields(_.cloneDeep(header));
    this.initHeaderStyle();
  }

  /**
   * 转化表格列。将用户定义的表格列，转化为适合数据表格的格式，包括表格头、表格体的列分别单独设置。
   * @param fields 用户定义的表格列
   */
  private transferTableFields(fields: Array<any>) {
    // 数据表格头展示的列
    let headerFields: Array<Array<any>> = [];
    // 各个层级的表格列。key：层级；value：本层级表格列数组
    let levelFields: { [depth: number]: Array<any> } = {};
    // 转化数据表格列实体并进行处理，并初始化分组列以及可视数据列
    this.headerFieldMaxDepth = this.buildTableFields(fields, 1, levelFields, {}, { value: 0 });
    // 将各个层级的列数组放在一个双层数组中
    Object.entries(levelFields).forEach(([k, v]) => {
      headerFields.push(v);
    });
    return headerFields;
  }

  /**
   * 转化数据表格列实体，并计算 rowspan、colspan 属性值，并按照层级分别组装列表
   * @param fields 数据表格列
   * @param depth 层级
   * @param levelFields 各个层级的表格列
   * @param rowspans 每层级对应的 rowspan 属性最大值
   * @param parentColspan 父层级的 colspan
   * @returns 数据表格列嵌套的最大层级
   */
  private buildTableFields(fields: Array<any>, depth: number, levelFields: { [depth: number]: Array<any> }, rowspans: { [depth: number]: { rowspan: any } }, parentColspan: any,): number {
    if (fields && fields.length > 0) {
      // 当前层级的 rowspan、colspan 属性
      let currentRowspan = rowspans[depth];
      if (undefined == currentRowspan) {
        currentRowspan = { rowspan: { value: 1 } };
        rowspans[depth] = currentRowspan;
      }
      // 当前层级的列
      let currentFields: Array<any> = levelFields[depth];
      if (undefined == currentFields) {
        currentFields = [];
        levelFields[depth] = currentFields;
      }
      // 最大层级
      let headerFieldMaxDepth = depth;
      // 遍历数组进行处理
      for (let item of fields) {
        // 先判断自身是否展示，在对子级进行递归判断，只要子级有一个展示，就展示这个层级
        if (item.show || item.show === undefined) {
          this.isShow(item, item);
        }
        // 如果展示，对子级进行递归
        if (item.show) {
          let children = item.children;
          delete item.children;
          let left = item.fixed == 'left'; // 是否固定在左侧，只有顶级列才可固定。
          let right = item.fixed == 'right';  // 是否固定在右侧，只有顶级列才可固定。
          delete item.fixed;
          let field = item as any;
          field.left = left;
          field.right = right;
          if (children && children.length > 0) {
            children.forEach((element: any) => {
              element.fatherFields = item.field
            });
            field.rowspan = { value: 1 }; // 表格头中，父列固定占一行
            field.colspan = { value: 0 };
            let childDepth = this.buildTableFields(children, depth + 1, levelFields, rowspans, field.colspan);
            headerFieldMaxDepth = Math.max(headerFieldMaxDepth, childDepth);
            rowspans[depth].rowspan.value = Math.max(rowspans[depth].rowspan.value, rowspans[depth + 1].rowspan.value + 1);
          } else {
            // 区分数据列还是分组列
            if (item.group) {
              this.groupArray.push(item);
            } else {
              this.visiableDataArray.push(item);
            }
            field.rowspan = rowspans[depth].rowspan;
            field.colspan = { value: 1 };
          }
          parentColspan.value = parentColspan.value + field.colspan.value;
          currentFields.push(field);
        }
        this.fieldMap.set(item.field, item);
      }
      return headerFieldMaxDepth;
    }
    return 0;
  }

  /**
   * 初始化表头样式
   */
  private initHeaderStyle(): void {
    this.headerFields.forEach((col, index) => {
      col.forEach((row: any, colIndex: any) => {
        row.style = this.qzTableSetting?.thead?.th?.ngStyle ? this.qzTableSetting?.thead?.th?.ngStyle(index, colIndex, row.field, row.fatherFields) : '';
      });
    })
  }

  /**
   * 初始化所有的数据列
   * @param fields 表头列数据
   */
  private initAllDataArray(fields: Array<any>): void {
    if (fields && fields.length > 0) {
      for (let item of fields) {
        if (item.children && item.children.length > 0) {
          this.initAllDataArray(item.children);
        } else {
          // 区分是数据列
          if (!this.groupMap.has(item.field)) {
            this.allDataArray.push(item);
            this.dataFieldIndexMap.set(item.field, 0);
            this.dataFieldMap.set(item.field, new Map());
          }
        }
      }
    }
  }

  /**
   * 递归获取根节点是否显示，如果根节点的子节点有一个需要展示，那么就显示根节点，否则不显示
   * @param node 当前节点
   * @param rootNode 根节点
   */
  private isShow(node: any, rootNode: any): void {
    if (node.children) {
      node.children.forEach((element: any) => {
        this.isShow(element, rootNode);
      });
    } else {
      if (node.show || node.show === undefined) {
        rootNode.show = true;
      }
    }
  }

  /**
   * 判断字段是否为小计字段
   * @param field 字段名
   */
  private isSubtotalField(field: string): boolean {
    return this.groupMap.get(field) && this.groupMap.get(field).total;
  }

  /**
   * 初始化智能表格表身数据
   */
  private initTableBody(data: any[]): void {
    // 初始化分组信息
    this.initTableGroup(this.groupArray);
    // 初始化所有的数据列
    this.initAllDataArray(_.cloneDeep(this.qzTableFields));
    let tableData: any = _.cloneDeep(data);
    this.listTable = false;
    this.maxRowsArray = [];
    this.maxRows = 0;
    // 列表分页数据,如果没有分组字段，就认为这是一个列表表格
    if (this.groupArray.length === 0) {
      this.listTable = true;
      this.buildListData(tableData.content);
    } else {
      if (tableData && tableData.length) {
        tableData.forEach((data: any) => {
          this.buildTableData(data);
        })
      }
      this.buildPageAndTotalData();
    }
    this.initTableSticky();
    this.dataMapOutput.emit({ data: this.dataFieldMap, title: this.fieldMap });
    this.cdr.detectChanges();
    if (this.virtual !== undefined && this.virtual && !this.listTable) {
      this.getRenderRange();
    }
  }

  /**
   * 构建分页数据
   * @param data 数据
   */
  public buildListData(datas: any): void {
    if (datas) {
      datas.forEach((data: any) => {
        this.increaseMaxRow();
        this.allDataArray.forEach((item, index) => {
          // 设置样式
          this.setDataStyles(data);
          // 如果该字段在这一级别有值，那么就将这个字段的位置以及值设置进入map
          this.setIndexMap(this.dataFieldMap, this.dataFieldIndexMap, item.field, data, 1);
        })
      });
    }
  }

  /**
   * 递归每一级数据
   * @param data 数据
   */
  private buildTableData(data: any): void {
    // 找到当前节点所占的行数
    this.getCountNumber(data, data);
    // 将自身的小计的count数量除去
    if (this.isSubtotalField(data.field)) {
      data.totalCount = data.totalCount - 1;
    }
    // 如果有子级，对子级进行递归
    if (data.children && data.children.length > 0) {
      data.children.forEach((element: any) => {
        element.fatherNode = data;
        this.buildTableData(element);
      });
    }
    // 没有子级，进行处理
    else {
      // 有data数据进行处理
      if (data.data && data.data.length > 0) {
        data.data.forEach((element: any) => {
          this.increaseMaxRow();
          this.allDataArray.forEach((item, index) => {
            // 设置样式
            this.setDataStyles(data);
            // 如果该字段在这一级别有值，那么就将这个字段的位置以及值设置进入map
            this.setIndexMap(this.dataFieldMap, this.dataFieldIndexMap, item.field, element, 1);
          })
        });
        // 没有data数据
      } else {
        this.increaseMaxRow();
        // 计算所有数据列位置索引信息，并设置进map中   数据列
        this.allDataArray.forEach((item, index) => {
          // 设置样式
          this.setDataStyles(data);
          // 如果该字段在这一级别有值，那么就将这个字段的位置以及值设置进入map
          if (data && item.field && data[item.field]) {
            this.setIndexMap(this.dataFieldMap, this.dataFieldIndexMap, item.field, data, data.rowCount);
          } else {
            // 没有值则向父级递归知道寻找到值并设置进map
            this.findValueByFatherNode(data, item.field, data);
          }
        })
      }
    }
    // 计算右侧分组的索引信息   分组列
    this.processGroupData(data);
  }

  /**
   * 找出每个根节点下有几级
   * @param data 数据
   * @param root 根节点
   */
  private getCountNumber(data: any, root: any): void {
    root.totalCount = (root.totalCount || 0) + (this.isSubtotalField(data.field) ? 1 : 0);
    if (data.children && data.children.length && data.children.length > 0) {
      data.children.forEach((child: any) => this.getCountNumber(child, root));
    } else {
      root.rowCount = (root.rowCount || 0);
      root.rowCount += data.data?.length || 1; // 如果没有数据，计数为1
    }
  }

  /**
   * 设置数据样式
   * @param element 数据元素
   */
  private setDataStyles(element: any): void {
    element.dataStyle = this.qzTableSetting?.body?.dataTd?.ngStyle ? this.qzTableSetting.body.dataTd.ngStyle(element.field, element) : '';
  }

  /**
   * 处理分组数据
   * @param data 数据
   */
  private processGroupData(data: any): void {
    if (this.groupMap.has(data.field)) {
      data.groupStyle = this.qzTableSetting?.body?.groupTd?.ngStyle ? this.qzTableSetting.body.groupTd.ngStyle(data.field, data) : '';
      this.setIndexMap(this.groupFieldMap, this.groupFieldIndexMap, data.field, data, data.rowCount);
      if (!data.children?.length) {
        this.fillEmptyData(data);
      }
    }
  }

  /**
   * 填充空数据
   * @param data 数据
   */
  private fillEmptyData(data: any): void {
    const array = this.afterFieldsMap.get(data.field);
    if (array) {
      array.forEach((element:any) => {
        const item = this.fieldMap.get(element);
        const emptyData = {
          ...item,
          name: '--',
          emptyCol: true,
          groupStyle: this.qzTableSetting?.body?.groupTd?.ngStyle ? this.qzTableSetting.body.groupTd.ngStyle(data.field, data) : ''
        };
        this.setIndexMap(this.groupFieldMap, this.groupFieldIndexMap, element, emptyData, 1);
      });
    }
  }

  /**
   * 增加最大行数
   */
  private increaseMaxRow(): void {
    this.maxRowsArray.push({ index: this.maxRows });
    this.maxRows++;
  }

  /**
   * 设置数据索引map
   * @param dataMap 数据map
   * @param indexMap 索引map
   * @param field 字段
   * @param data 数据
   * @param rowCount 数据行数
   */
  private setIndexMap(dataMap: Map<string, any>, indexMap: Map<string, any>, field: string, data: any, rowCount: number): void {
    // 设置数据索引
    dataMap.get(field)?.set(indexMap.get(field), data);
    // 设置展示的位置索引
    indexMap.set(field, indexMap.get(field) + rowCount);
  }

  /**
   * 通过父级寻找数据
   */
  private findValueByFatherNode(node: any, key: string, originNode: any): void {
    if (!node.fatherNode) {
      this.setIndexMap(this.dataFieldMap, this.dataFieldIndexMap, key, originNode, originNode.rowCount);
      return;
    }
    // let empty = true;
    // node.fatherNode.children.forEach(element => {
    //   if (element[key]) {
    //     empty = false;
    //   }
    // });
    // // 其下子级存在改值
    // if (!empty) {
    //   this.setIndexMap(this.dataFieldMap, this.dataFieldIndexMap, key, originNode, originNode.rowCount);
    //   return;
    // }                                                                                             
    // 其下子级没有该值,则在父级中寻找，如果有值，就将父级写入map。并在父级中标注一个属性，其下子级如果再向上在这个父级寻找这个属性，就返回
    if (node.fatherNode[key] !== undefined && node.fatherNode[key] !== null) {
      if (node.fatherNode[key + 'alreadyChosedValue']) {
        return;
      }
      node.fatherNode[key + 'alreadyChosedValue'] = true;
      this.setDataStyles(node.fatherNode);
      this.setIndexMap(this.dataFieldMap, this.dataFieldIndexMap, key, node.fatherNode, node.fatherNode.rowCount);
    }
    // 父级没有该值，递归向父级的父级寻找
    else {
      this.findValueByFatherNode(node.fatherNode, key, originNode);
    }
  };

  /**
   * 计算合计，小计的内容
   */
  private buildPageAndTotalData(): void {
    let result: any = [];
    // 行处理
    this.maxRowsArray.forEach((item, index) => {
      let row: any = [];
      this.groupFieldMap.forEach((value, key) => {
        row.push(this.groupFieldMap.get(key)!.get(index));
      })
      result.push(row);
    });
    let totalMaps: Map<number, Array<any>> = new Map();
    this.groupArray.forEach((group, colIndex) => {
      let field = group.field;
      let addTotal = false;
      let copyArray: any = [];
      result.forEach((array: any, rowIndex: any) => {
        if (!totalMaps.get(rowIndex)) {
          totalMaps.set(rowIndex, []);
        }
        // 添加分组行的方法所在
        // 下一级
        if ((array[colIndex] || rowIndex === result.length - 1) && addTotal) {
          // 如果在最后一行，会有2种情况 ， 1.当前该字段对应的列为空，那么认为是当前行添加， 2.不为空，就是上一行添加
          let rows = (rowIndex === result.length - 1) ? (array[colIndex] ? rowIndex - 1 : rowIndex) : rowIndex - 1;
          totalMaps.get(rows)!.splice(0, 0, { col: colIndex, value: copyArray[colIndex] });
          addTotal = false;
        }
        // 上一级 判断该字段对应的数据不为空，且该字段具有total，那么就将数据拷贝一份，并设置判断之后的该字段对应的值
        if (array[colIndex] && this.groupMap.get(field) && this.groupMap.get(field).total && array[colIndex].emptyCol !== true) {
          if (rowIndex === result.length - 1) {
            totalMaps.get(rowIndex)!.splice(0, 0, { col: colIndex, value: _.cloneDeep(array[colIndex]) });
          } else {
            addTotal = true;
            copyArray = _.cloneDeep(array);
          }
        }
      });
    });
    this.totalMap = totalMaps;
  }

  /**
   * 通过字段计算总计值
   * @param field 字段
   */
  computerTotal(field: string) {
    let map: Map<string, any> = this.dataFieldMap.get(field);
    if (map) {
      map.forEach((value, key) => {

      })
    }
  }

  /**
   * 页码变化回调
   * @param params 页码参数
   */
  public qzPageIndexAndSizeChange(params: any) {
    this.pageParams = { size: params.size, page: params.index };
    // 初始化后在进行emit
    if (!this.initPage) {
      this.refreshTable();
    }
    // 默认初始化会调用一次,将这次的emit事件隐藏
    this.initPage = false;
  }

  /**
   * 操作表格固定的高度
   */
  public initTableSticky(): void {
    // 初始表头固定参数设置,有就使用
    if (this.qzStickyOption) {
      this.tableSticky = _.cloneDeep(this.qzStickyOption);
      return;
    }
    // 没有默认进行配置
    if (!this.qzStickyOption) {
      this.tableSticky = {};
    }
    if (!this.tableSticky?.thead) {
      this.tableSticky.thead = '0px';
    }
    if (!this.tableSticky?.editBar) {
      this.tableSticky.editBar = '0px';
    }
    if (!this.tableSticky?.pagination && !this.tableSticky?.scrollBar) {
      this.listTable ? this.tableSticky.pagination = '0px' : this.tableSticky.scrollBar = '0px';
    }
  }



  /**
   * 数据重载
   */
  overlayLoading() {
    this.qzReload.emit({
      ...this.tableFilterObject,
      ...this.pageParams
    });
    // this.qzReloading = false;
  }

  /**
   * 出现加载，将位置滚动到顶部
   */
  moveToTop() {
    let item = document.getElementById('tableBodyScrollContent');
    if (item) {
      item.scrollTop = 0;
    }
  }

  /**
   * 补全滚动时添加新的内容
   */
  addShow() {
    if (this.rangeIndex === this.rangeArray.length - 1) {
      return;
    }
    for (let i = this.rangeIndex + 1; i < this.rangeArray.length; i++) {
      if (this.rangeArray[i] - this.rangeArray[this.rangeIndex] >= this.virtualRow) {
        this.rangeIndex = i;
        break;
      }
      else {
        if (i === this.rangeArray.length - 1) {
          this.rangeIndex = i;
          break;
        }
      }
    };
    let array = [];
    for (let i = 0; i < this.rangeArray[this.rangeIndex]; i++) {
      array.push(i);
    }
    this.tableRow = array;
    this.cdr.detectChanges();
  }

  /**
   * 获取使用补全滚动时的内容,这是初始化的内容
   */
  getRenderRange() {
    if (!this.virtual) {
      return;
    }
    // groupArray
    if (!this.qzTableFields || (this.qzTableFields && this.qzTableFields.length === 0) || !this.groupFieldMap.get(this.qzTableFields[0].field)) {
      return;
    }
    this.rangeIndex = 0;
    this.tableRow = [];
    let rangeArray = [];
    const keys = Array.from(this.groupFieldMap.get(this.qzTableFields[0].field)?.keys()!);
    for (const [index, key] of keys.entries()) {
      rangeArray.push(key);
      if (index === keys.length - 1) {
        rangeArray.push(key + this.groupFieldMap.get(this.qzTableFields[0].field)?.get(key)?.rowCount);
      }
    }
    this.rangeArray = rangeArray;
    this.addShow();
    this.virtualScroll();
  }

  /**
   * 虚拟滚动的雏形，加载滚动
   */
  virtualScroll() {
    if (!this.virtual) {
      return;
    }
    let item = document.getElementById('tableBodyScrollContent');
    let content = document.getElementById('tableBodyScrollContentBox');
    item?.removeEventListener('scroll', this.scroll);
    content?.removeEventListener('scroll', this.scroll);
    if (this.editMode) {
      if (item) {
        item.scrollTop = 0;
        item.addEventListener('scroll', this.scroll);
      }
    } else {
      if (content) {
        content.scrollTop = 0;
        content.addEventListener('scroll', this.scroll);
      }
    }
  }

  /**
   * 移除滚动事件
   */
  removeScrollEvent() {
    if (!this.virtual) {
      return;
    }
    let item = document.getElementById('tableBodyScrollContent');
    let content = document.getElementById('tableBodyScrollContentBox');
    item?.removeEventListener('scroll', this.scroll);
    content?.removeEventListener('scroll', this.scroll);
  }

  /**
   * 对对应容器添加滚动事件
   * @param event 滚动事件
   */
  scroll = (event: any) => {
    const item = event.target; // 获取触发事件的元素
    if (item.scrollTop / (item.scrollHeight - item.clientHeight) >= 0.99) {
      this.addShow();
    }
  }

  /**
   * 用于减少渲染量的索引函数，angular渲染时会根据返回的索引内容判断在渲染变化时哪些内容需要重新渲染
   * @param index 位置索引
   * @param item 内容
   * @returns 判断索引
   */
  trackByFn(index: any, item: any) {
    return index; // or index
  }

}
