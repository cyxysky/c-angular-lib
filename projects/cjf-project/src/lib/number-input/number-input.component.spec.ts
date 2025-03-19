import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NumberInputComponent } from './number-input.component';
@Component({
  template: `
    <lib-number-input
      [prefix]="prefix"
      [suffix]="suffix"
      [min]="min"
      [max]="max"
      [step]="step"
      [precision]="precision"
      [disabled]="disabled"
      [readonly]="readonly"
      (valueChange)="onValueChange($event)">
    </lib-number-input>
  `,
  standalone: true,
  imports: [NumberInputComponent]
})
class TestHostComponent {
  prefix = '¥';
  suffix = 'RMB';
  min = 0;
  max = 100;
  step = 0.1;
  precision = 2;
  disabled = false;
  readonly = false;
  value: number | null = null;
  
  onValueChange(value: number | null): void {
    this.value = value;
  }
}

describe('SelectComponent', () => {
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let numberInputEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        NumberInputComponent,
        TestHostComponent
      ]
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
    numberInputEl = hostFixture.nativeElement.querySelector('.lib-number-input-container');
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
  });

  it('should display prefix and suffix', () => {
    const prefixEl = hostFixture.debugElement.query(By.css('.lib-number-input-prefix'));
    const suffixEl = hostFixture.debugElement.query(By.css('.lib-number-input-suffix'));
    
    expect(prefixEl.nativeElement.textContent).toContain('¥');
    expect(suffixEl.nativeElement.textContent).toContain('RMB');
  });

  it('should increase value when up button is clicked', () => {
    const upButton = hostFixture.debugElement.query(
      By.css('.lib-number-input-handler-up')
    ).nativeElement;
    
    upButton.click();
    hostFixture.detectChanges();
    
    expect(hostComponent.value).toBe(0.1);
  });

  it('should decrease value when down button is clicked', () => {
    // 先设置一个初始值
    const upButton = hostFixture.debugElement.query(
      By.css('.lib-number-input-handler-up')
    ).nativeElement;
    upButton.click(); // 设置为0.1
    upButton.click(); // 设置为0.2
    hostFixture.detectChanges();
    
    const downButton = hostFixture.debugElement.query(
      By.css('.lib-number-input-handler-down')
    ).nativeElement;
    downButton.click();
    hostFixture.detectChanges();
    
    expect(hostComponent.value).toBe(0.1);
  });

  it('should respect min and max values', () => {
    // 测试最小值
    const inputEl = hostFixture.debugElement.query(
      By.css('input')
    ).nativeElement;
    inputEl.value = '-10';
    inputEl.dispatchEvent(new Event('input'));
    hostFixture.detectChanges();
    
    expect(hostComponent.value).toBe(0); // 应该被限制在最小值0
    
    // 测试最大值
    inputEl.value = '200';
    inputEl.dispatchEvent(new Event('input'));
    hostFixture.detectChanges();
    
    expect(hostComponent.value).toBe(100); // 应该被限制在最大值100
  });

  it('should handle decimal precision correctly', () => {
    const inputEl = hostFixture.debugElement.query(
      By.css('input')
    ).nativeElement;
    
    inputEl.value = '1.234';
    inputEl.dispatchEvent(new Event('input'));
    hostFixture.detectChanges();
    
    expect(hostComponent.value).toBe(1.23); // 应该四舍五入到小数点后2位
  });

  it('should disable the component when disabled is true', () => {
    hostComponent.disabled = true;
    hostFixture.detectChanges();
    
    const container = hostFixture.debugElement.query(
      By.css('.lib-number-input-container')
    );
    const input = hostFixture.debugElement.query(
      By.css('input')
    ).nativeElement;
    
    expect(container.classes['disabled']).toBeTruthy();
    expect(input.disabled).toBeTruthy();
  });
});
