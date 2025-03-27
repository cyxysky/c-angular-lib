import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RadioComponent, RadioOption } from './radio.component';
import { Component, DebugElement } from '@angular/core';

// 创建测试宿主组件
@Component({
  template: `
    <lib-radio
      [(ngModel)]="selectedValue"
      [options]="options"
      [direction]="direction"
      [color]="color"
      (valueChange)="onValueChange($event)">
    </lib-radio>
  `
})
class TestHostComponent {
  selectedValue: string = 'option1';
  options: RadioOption[] = [
    { label: '选项一', value: 'option1' },
    { label: '选项二', value: 'option2' },
    { label: '选项三', value: 'option3', disabled: true }
  ];
  direction: 'horizontal' | 'vertical' = 'horizontal';
  color: string = '#1890ff';
  onValueChange(value: any): void {
    this.selectedValue = value;
  }
}

describe('RadioComponent', () => {
  // 独立组件测试
  describe('独立组件测试', () => {
    let component: RadioComponent;
    let fixture: ComponentFixture<RadioComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [RadioComponent, FormsModule]
      }).compileComponents();

      fixture = TestBed.createComponent(RadioComponent);
      component = fixture.componentInstance;
      
      // 设置测试数据
      component.options = [
        { label: '选项一', value: 'option1' },
        { label: '选项二', value: 'option2' },
        { label: '选项三', value: 'option3', disabled: true }
      ];
      
      fixture.detectChanges();
    });

    it('应该创建组件', () => {
      expect(component).toBeTruthy();
    });

    it('应该渲染正确数量的选项', () => {
      const radioWrappers = fixture.debugElement.queryAll(By.css('.radio-wrapper'));
      expect(radioWrappers.length).toBe(3);
    });

    it('应该正确显示选项标签', () => {
      const labels = fixture.debugElement.queryAll(By.css('.radio-label'));
      expect(labels[0].nativeElement.textContent.trim()).toBe('选项一');
      expect(labels[1].nativeElement.textContent.trim()).toBe('选项二');
      expect(labels[2].nativeElement.textContent.trim()).toBe('选项三');
    });

    it('选择选项应该更新值', () => {
      // 模拟点击第二个选项
      const radioWrappers = fixture.debugElement.queryAll(By.css('.radio-wrapper'));
      radioWrappers[1].triggerEventHandler('click', null);
      fixture.detectChanges();
      
      expect(component.value).toBe('option2');
    });

    it('禁用的选项不应该被选择', () => {
      const originalValue = component.value;
      
      // 设置初始值
      component.value = 'option1';
      fixture.detectChanges();
      
      // 尝试点击禁用的选项
      const radioWrappers = fixture.debugElement.queryAll(By.css('.radio-wrapper'));
      radioWrappers[2].triggerEventHandler('click', null);
      fixture.detectChanges();
      
      // 值不应该改变
      expect(component.value).toBe('option1');
    });

    it('应该根据方向应用正确的 CSS 类', () => {
      // 默认为水平
      let groupElement = fixture.debugElement.query(By.css('.radio-group'));
      expect(groupElement.classes['radio-group-vertical']).toBeFalsy();
      
      // 改为垂直
      component.direction = 'vertical';
      fixture.detectChanges();
      
      groupElement = fixture.debugElement.query(By.css('.radio-group'));
      expect(groupElement.classes['radio-group-vertical']).toBeTruthy();
    });

    it('应该应用自定义颜色', () => {
      component.value = 'option1';
      component.color = '#ff0000';
      fixture.detectChanges();
      
      const firstRadioInner = fixture.debugElement.queryAll(By.css('.radio-inner'))[0].nativeElement;
      expect(firstRadioInner.style.borderColor).toBe('rgb(255, 0, 0)');
    });
  });

  // 与宿主组件集成测试
  describe('与宿主组件集成测试', () => {
    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;
    let radioDebugElement: DebugElement;
    let radioComponent: RadioComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [TestHostComponent],
        imports: [RadioComponent, FormsModule]
      }).compileComponents();

      hostFixture = TestBed.createComponent(TestHostComponent);
      hostComponent = hostFixture.componentInstance;
      hostFixture.detectChanges();
      
      radioDebugElement = hostFixture.debugElement.query(By.directive(RadioComponent));
      radioComponent = radioDebugElement.componentInstance;
    });

    it('初始值应该通过 ngModel 正确设置', () => {
      expect(radioComponent.value).toBe('option1');
    });

    it('点击选项应该更新宿主组件的值', () => {
      // 点击第二个选项
      const radioWrappers = hostFixture.debugElement.queryAll(By.css('.radio-wrapper'));
      radioWrappers[1].triggerEventHandler('click', null);
      hostFixture.detectChanges();
      
      expect(hostComponent.selectedValue).toBe('option2');
    });

    it('改变宿主方向属性应该反映在组件上', () => {
      // 默认为水平
      let groupElement = hostFixture.debugElement.query(By.css('.radio-group'));
      expect(groupElement.classes['radio-group-vertical']).toBeFalsy();
      
      // 改为垂直
      hostComponent.direction = 'vertical';
      hostFixture.detectChanges();
      
      groupElement = hostFixture.debugElement.query(By.css('.radio-group'));
      expect(groupElement.classes['radio-group-vertical']).toBeTruthy();
    });

    it('更改宿主颜色属性应该反映在组件上', () => {
      // 设置新颜色
      hostComponent.color = '#00ff00';
      hostFixture.detectChanges();
      
      // 选中的选项应该有新颜色
      const firstRadioInner = hostFixture.debugElement.queryAll(By.css('.radio-inner'))[0].nativeElement;
      expect(firstRadioInner.style.borderColor).toBe('rgb(0, 255, 0)');
    });
  });
});
