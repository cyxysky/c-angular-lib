import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { SwitchComponent } from './switch.component';

// 测试宿主组件
@Component({
  template: `
    <lib-switch
      [checked]="isChecked"
      [disabled]="isDisabled"
      [loading]="isLoading"
      [checkedChildren]="checkedText"
      [unCheckedChildren]="uncheckedText"
      [size]="switchSize"
      (checkedChange)="onCheckedChange($event)"
    ></lib-switch>
  `,
  standalone: true,
  imports: [SwitchComponent, FormsModule]
})
class TestHostComponent {
  isChecked = false;
  isDisabled = false;
  isLoading = false;
  checkedText = '开';
  uncheckedText = '关';
  switchSize: 'default' | 'small' = 'default';

  onCheckedChange(value: boolean): void {
    this.isChecked = value;
  }
}

describe('SwitchComponent', () => {
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let switchElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
    switchElement = hostFixture.debugElement.query(By.css('.lib-switch')).nativeElement;
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
  });

  it('should toggle when clicked', () => {
    expect(hostComponent.isChecked).toBeFalse();
    expect(switchElement.classList).not.toContain('lib-switch-checked');

    switchElement.click();
    hostFixture.detectChanges();

    expect(hostComponent.isChecked).toBeTrue();
    expect(switchElement.classList).toContain('lib-switch-checked');
  });

  it('should not toggle when disabled', () => {
    hostComponent.isDisabled = true;
    hostFixture.detectChanges();

    switchElement.click();
    hostFixture.detectChanges();

    expect(hostComponent.isChecked).toBeFalse();
    expect(switchElement.classList).not.toContain('lib-switch-checked');
    expect(switchElement.classList).toContain('lib-switch-disabled');
  });

  it('should not toggle when loading', () => {
    hostComponent.isLoading = true;
    hostFixture.detectChanges();

    switchElement.click();
    hostFixture.detectChanges();

    expect(hostComponent.isChecked).toBeFalse();
    expect(switchElement.classList).not.toContain('lib-switch-checked');
    expect(switchElement.classList).toContain('lib-switch-loading');
  });

  it('should display correct text for checked and unchecked states', () => {
    // 未选中状态显示uncheckedText
    const uncheckedTextElement = hostFixture.debugElement.query(By.css('.lib-switch-inner-unchecked'));
    expect(uncheckedTextElement.nativeElement.textContent.trim()).toBe('关');

    // 切换到选中状态
    switchElement.click();
    hostFixture.detectChanges();

    // 选中状态显示checkedText
    const checkedTextElement = hostFixture.debugElement.query(By.css('.lib-switch-inner-checked'));
    expect(checkedTextElement.nativeElement.textContent.trim()).toBe('开');
  });

  it('should apply small size class when size is set to small', () => {
    hostComponent.switchSize = 'small';
    hostFixture.detectChanges();
    expect(switchElement.classList).toContain('lib-switch-small');
  });
});
