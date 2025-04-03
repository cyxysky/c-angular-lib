import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CascaderComponent } from '@project';
import { FormsModule } from '@angular/forms';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { ApiData, DocApiTableComponent } from '../doc-api-table/doc-api-table.component';

@Component({
  selector: 'app-doc-cascader',
  standalone: true,
  imports: [
    CommonModule, 
    CascaderComponent, 
    FormsModule,
    DocBoxComponent,
    DocApiTableComponent
  ],
  templateUrl: './doc-cascader.component.html',
  styleUrl: './doc-cascader.component.less'
})
export class DocCascaderComponent implements OnInit {
  // 基本用法
  selectedValue: string[] = [];
  
  // 三种大小
  selectedSizes = {
    large: [],
    default: [],
    small: []
  };
  
  // 移入展开
  hoverValue: string[] = [];
  
  // 选择即改变
  changeOnSelectValue: string[] = [];
  
  // 多选模式
  multipleSelected: string[] = [];
  
  // 禁用选项
  disabledOptionValue: string[] = [];
  disabledOptions = [
    {
      value: 'zhejiang',
      label: '浙江',
      children: [
        {
          value: 'hangzhou',
          label: '杭州',
          children: [
            {
              value: 'xihu',
              label: '西湖',
            },
            {
              value: 'xiasha',
              label: '下沙',
              disabled: true,
            },
          ],
        },
        {
          value: 'ningbo',
          label: '宁波',
          disabled: true,
          children: [
            {
              value: 'jiangbei',
              label: '江北',
            },
          ],
        },
      ],
    },
    {
      value: 'jiangsu',
      label: '江苏',
      children: [
        {
          value: 'nanjing',
          label: '南京',
          children: [
            {
              value: 'xuanwu',
              label: '玄武湖',
            }
          ],
        },
        {
          value: 'suzhou',
          label: '苏州',
          children: [
            {
              value: 'jinjihu',
              label: '金鸡湖',
            }
          ],
        }
      ],
    }
  ];
  
  // 搜索功能
  searchSelected: string[] = [];
  
  // 自定义字段名
  customFieldValue: string[] = [];
  customFieldOptions: any = [
    {
      id: 'zhejiang',
      name: '浙江',
      items: [
        {
          id: 'hangzhou',
          name: '杭州',
          items: [
            {
              id: 'xihu',
              name: '西湖',
            }
          ],
        }
      ],
    },
    {
      id: 'jiangsu',
      name: '江苏',
      items: [
        {
          id: 'nanjing',
          name: '南京',
          items: [
            {
              id: 'xuanwu',
              name: '玄武湖',
            }
          ],
        }
      ],
    }
  ];
  customFields = {
    label: 'name',
    value: 'id',
    children: 'items'
  };
  
  // 自定义选择函数
  optionSelectFnValue: string[] = [];
  
  // 多选时禁用复选框
  disableCheckboxValue: string[] = [];
  disableCheckboxOptions = [
    {
      value: 'zhejiang',
      label: '浙江',
      children: [
        {
          value: 'hangzhou',
          label: '杭州',
          children: [
            {
              value: 'xihu',
              label: '西湖',
            },
            {
              value: 'xiasha',
              label: '下沙',
              disableCheckbox: true,
            },
          ],
        },
        {
          value: 'ningbo',
          label: '宁波',
          children: [
            {
              value: 'jiangbei',
              label: '江北',
              disableCheckbox: true,
            },
          ],
        },
      ],
    },
    {
      value: 'jiangsu',
      label: '江苏',
      children: [
        {
          value: 'nanjing',
          label: '南京',
          children: [
            {
              value: 'xuanwu',
              label: '玄武湖',
            }
          ],
        }
      ],
    }
  ];
  
  // 自定义选项模板
  customTemplateValue: string[] = [];
  customOptions = [
    {
      value: 'food',
      label: '食品',
      icon: 'bi-egg-fried',
      children: [
        {
          value: 'fruit',
          label: '水果',
          icon: 'bi-apple',
          children: [
            {
              value: 'apple',
              label: '苹果',
              icon: 'bi-apple',
              description: '每天一苹果，医生远离我'
            },
            {
              value: 'banana',
              label: '香蕉',
              icon: 'bi-egg',
              description: '富含钾元素'
            }
          ]
        },
        {
          value: 'vegetable',
          label: '蔬菜',
          icon: 'bi-flower1',
          children: [
            {
              value: 'tomato',
              label: '西红柿',
              icon: 'bi-circle-fill',
              description: '红色蔬菜'
            }
          ]
        }
      ]
    },
    {
      value: 'electronic',
      label: '电子产品',
      icon: 'bi-laptop',
      children: [
        {
          value: 'phone',
          label: '手机',
          icon: 'bi-phone',
          children: [
            {
              value: 'apple-phone',
              label: 'iPhone',
              icon: 'bi-apple',
              description: '苹果手机'
            },
            {
              value: 'android',
              label: '安卓手机',
              icon: 'bi-android',
              description: '安卓系统'
            }
          ]
        }
      ]
    }
  ];
  
  // 自定义状态
  statusValues = {
    default: [],
    error: [],
    warning: []
  };
  
  // 无边框
  borderlessValue: string[] = [];
  
  // 禁用选择框
  disabledValue: string[] = [];
  
  // 基础选项
  options = [
    {
      value: 'zhejiang',
      label: '浙江',
      children: [
        {
          value: 'hangzhou',
          label: '杭州',
          children: [
            {
              value: 'xihu',
              label: '西湖',
            },
            {
              value: 'yuhang',
              label: '余杭',
            },
          ],
        },
        {
          value: 'ningbo',
          label: '宁波',
          children: [
            {
              value: 'jiangbei',
              label: '江北',
            },
          ],
        },
      ],
    },
    {
      value: 'jiangsu',
      label: '江苏',
      children: [
        {
          value: 'nanjing',
          label: '南京',
          children: [
            {
              value: 'xuanwu',
              label: '玄武湖',
            }
          ],
        },
        {
          value: 'suzhou',
          label: '苏州',
          children: [
            {
              value: 'jinjihu',
              label: '金鸡湖',
            },
            {
              value: 'shihu',
              label: '石湖',
            }
          ],
        }
      ],
    }
  ];
  
  // 大量选项用于搜索
  largeOptions: any[] = [];
  
  ngOnInit(): void {
    // 初始化大量选项
    this.initLargeOptions();
  }
  
  // 初始化大量选项
  initLargeOptions() {
    const provinces = ['浙江', '江苏', '安徽', '河南', '山东', '广东', '福建', '湖南'];
    
    this.largeOptions = provinces.map(province => {
      const cities = [];
      for (let i = 1; i <= 5; i++) {
        const districts = [];
        for (let j = 1; j <= 3; j++) {
          districts.push({
            value: `${province}-city${i}-district${j}`,
            label: `${province}市${i}区${j}`
          });
        }
        
        cities.push({
          value: `${province}-city${i}`,
          label: `${province}市${i}`,
          children: districts
        });
      }
      
      return {
        value: province,
        label: province,
        children: cities
      };
    });
  }
  
  // 自定义选择函数 - 只允许选择城市，不允许选择省份
  customSelectFunction = (option: any) => {
    return !option.label.includes('西湖');
  };
  
  // 获取显示文本
  getDisplayText(values: string[]): string {
    if (!values || values.length === 0) {
      return '';
    }
    return values.join(' / ');
  }
  
  // API 文档数据
  apiSections: ApiData[] = [
    {
      title: '属性',
      items: [
        { name: 'options', description: '可选项数据源', type: 'CascaderOption[]', default: '[]' },
        { name: 'defaultValue', description: '默认值', type: 'string[] | string', default: '[]' },
        { name: 'expandTrigger', description: '次级菜单的展开方式', type: "'click' | 'hover'", default: "'click'" },
        { name: 'showSearch', description: '是否支持搜索', type: 'boolean', default: 'false' },
        { name: 'disabled', description: '是否禁用', type: 'boolean', default: 'false' },
        { name: 'placeholder', description: '输入框占位文本', type: 'string', default: "'请选择'" },
        { name: 'allowClear', description: '是否支持清除', type: 'boolean', default: 'true' },
        { name: 'changeOnSelect', description: '是否选择即触发改变', type: 'boolean', default: 'false' },
        { name: 'isMultiple', description: '是否多选', type: 'boolean', default: 'false' },
        { name: 'checkable', description: '多选模式下是否显示复选框', type: 'boolean', default: 'true' },
        { name: 'size', description: '输入框大小', type: "'large' | 'default' | 'small'", default: "'default'" },
        { name: 'fieldNames', description: '自定义节点字段名', type: '{ label: string; value: string; children: string; }', default: "{ label: 'label', value: 'value', children: 'children' }" },
        { name: 'borderless', description: '是否无边框', type: 'boolean', default: 'false' },
        { name: 'status', description: '设置校验状态', type: "'error' | 'warning' | null", default: 'null' },
        { name: 'menuWidth', description: '下拉菜单的宽度', type: 'number', default: '160' },
        { name: 'minWidth', description: '选择器最小宽度', type: 'string', default: "'120px'" },
        { name: 'optionTemplate', description: '自定义选项模板', type: 'TemplateRef<any>', default: 'null' },
        { name: 'optionLabelTemplate', description: '自定义选中标签模板', type: 'TemplateRef<any>', default: 'null' },
        { name: 'loading', description: '是否加载中', type: 'boolean', default: 'false' },
        { name: 'displayRender', description: '自定义显示渲染函数', type: '(labels: string[], selectedOptions: CascaderOption[]) => string', default: '-' },
        { name: 'optionFilterFn', description: '自定义搜索过滤函数', type: '(inputValue: string, option: CascaderOption) => boolean', default: '-' },
        { name: 'optionSelectFn', description: '自定义选择判断函数', type: '(option: CascaderOption) => boolean', default: '-' }
      ]
    },
    {
      title: '事件',
      items: [
        { name: 'valueChange', description: '选择完成后的回调', type: 'EventEmitter<any>', default: '-' },
        { name: 'selectionChange', description: '选项变化时的回调', type: 'EventEmitter<CascaderOption[]>', default: '-' },
        { name: 'visibleChange', description: '菜单显示状态改变时的回调', type: 'EventEmitter<boolean>', default: '-' },
        { name: 'search', description: '搜索输入变化时的回调', type: 'EventEmitter<string>', default: '-' }
      ]
    },
    {
      title: 'CascaderOption 属性',
      items: [
        { name: 'value', description: '选项值', type: 'any', default: '-' },
        { name: 'label', description: '选项显示文本', type: 'string', default: '-' },
        { name: 'disabled', description: '是否禁用', type: 'boolean', default: 'false' },
        { name: 'children', description: '子选项列表', type: 'CascaderOption[]', default: '-' },
        { name: 'isLeaf', description: '是否是叶子节点', type: 'boolean', default: 'false' },
        { name: 'disableCheckbox', description: '多选时是否禁用复选框', type: 'boolean', default: 'false' }
      ]
    }
  ];
  
  // 示例代码（使用空字符串暂存）
  basicSource = '';
  sizeSource = '';
  hoverExpandSource = '';
  changeOnSelectSource = '';
  multipleSource = '';
  disabledOptionSource = '';
  searchSource = '';
  customFieldSource = '';
  optionSelectFnSource = '';
  disableCheckboxSource = '';
  customTemplateSource = '';
  statusSource = '';
  borderlessSource = '';
  disabledSource = '';
}
