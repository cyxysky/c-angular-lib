import { Component, effect, resource, signal, ViewChild } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ProjectModule } from '../../projects/project/src/public-api';
import { of, delay, interval } from 'rxjs';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import { DocModule } from '../doc/doc.module';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-root',
  imports: [FormsModule, ProjectModule, NzMenuModule, ScrollingModule, DocModule, RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent {
  title = 'project';
  show = signal(false);
  text = signal('hellossssssss');
  mySignal = signal({
    ok: 'false'
  });
  nowComponent = signal('popconfirm');
  checked = signal(false);

  onCheckedChange(checked: boolean) {
    this.checked.set(checked);
  }
  onClose(event: string) {
    console.log(event);
  }
  sets() {
    this.mySignal.set({
      ok: 'true'
    })
  }
  constructor(private router: Router) {
    effect(() => {
      console.log('change')
    })
    // resource({
    //   request: () => [this.mySignal(), this.show()],
    //   loader: async ({request: id}) => {
    //     console.log(id);
    //   }
    // })
  }

  test(value: any) {
    return value === '' ? false : true;
  }

  ngOnInit() {
    of(true).pipe(delay(2000)).subscribe((data) => {
      console.log(data)
      this.show.set(data)
    })

    // const obs$ = toObservable(this.mySignal);
    // obs$.subscribe(value => console.log(value));
    // mySignal.set(1);
    // mySignal.set(2);
    // mySignal.set(3);

  }

  cons(any: any) {
    console.log(any)
  }

  nav(path: string) {
    this.router.navigate([path]);
  }


  components = [
    { name: '气泡确认框', path: 'popconfirm' },
    { name: '气泡', path: 'popover' },
    { name: '按钮', path: 'button' },
    { name: '开关', path: 'switch' },
    { name: '标签', path: 'tag' },
    { name: '数字输入框', path: 'number-input' },
    { name: '分段器', path: 'segmented' },
    { name: '水印', path: 'water-mark' },
    { name: '输入框', path: 'input' },
    { name: '提示框', path: 'tooltip' },
    { name: '复选框', path: 'checkbox' },
    { name: '单选框', path: 'radio' },
    { name: '滑块', path: 'slider' },
    { name: '模态框', path: 'modal' },
    { name: '标签页', path: 'tabs' },
    { name: '日期时间', path: 'date-timer' },
    { name: '消息', path: 'message' },
    { name: '抽屉', path: 'drawer' },
    { name: '下拉菜单', path: 'drop-menu' },
    { name: '树', path: 'tree' },
    { name: '选择器', path: 'select' },
    { name: '树选择器', path: 'tree-select' },
    { name: '级联选择器', path: 'cascader' },
  ]

  businessComponents = [
    { name: '多维流程图', path: 'multi-dimensional-flowchart' },
    { name: '拖拽生成表单', path: 'customer-form' },
    { name: '流程树', path: 'process-tree' },
    { name: 'svg生成', path: 'generate-png' },
    { name: '结构树', path: 'structure-tree' },
    { name: '动态表格', path: 'dynamic-table' },
    { name: '用户选择', path: 'user-select' },
  ]
}
