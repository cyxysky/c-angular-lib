import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TagComponent } from './tag.component';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';

// 创建测试宿主组件
@Component({
  template: `
    <lib-tag 
      [closable]="closable"
      [checkable]="checkable"
      [checked]="checked"
      [color]="color"
      [disabled]="disabled"
      (close)="onClose()"
      (checkedChange)="onCheckedChange($event)">
      测试标签
    </lib-tag>
  `,
  standalone: true,
  imports: [TagComponent]
})
class TestHostComponent {
  closable = false;
  checkable = false;
  checked = false;
  color = 'primary';
  disabled = false;
  
  onClose() {}
  onCheckedChange(value: boolean) {}
}

describe('TagComponent', () => {
  let hostComponent: TestHostComponent;
  let tagComponent: TagComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, TagComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    tagComponent = fixture.debugElement.query(By.directive(TagComponent)).componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(tagComponent).toBeTruthy();
  });

  it('should render basic tag', () => {
    const tagElement = fixture.debugElement.query(By.css('.lib-tag'));
    expect(tagElement).toBeTruthy();
  });

  it('should apply preset color class', () => {
    // 通过宿主组件设置输入属性
    hostComponent.color = 'primary';
    fixture.detectChanges();
    const tagElement = fixture.debugElement.query(By.css('.lib-tag-primary'));
    expect(tagElement).toBeTruthy();
  });

  it('should apply custom color style', () => {
    hostComponent.color = '#ff0000';
    fixture.detectChanges();
    const tagElement = fixture.debugElement.query(By.css('.lib-tag'));
    expect(tagElement.nativeElement.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('should show close icon when closable is true', () => {
    hostComponent.closable = true;
    fixture.detectChanges();
    const closeIcon = fixture.debugElement.query(By.css('.lib-tag-close-icon'));
    expect(closeIcon).toBeTruthy();
  });

  it('should emit close event when close icon is clicked', () => {
    hostComponent.closable = true;
    fixture.detectChanges();
    
    spyOn(hostComponent, 'onClose');
    const closeIcon = fixture.debugElement.query(By.css('.lib-tag-close-icon'));
    closeIcon.nativeElement.click();
    
    expect(hostComponent.onClose).toHaveBeenCalled();
  });

  it('should toggle checked state when checkable tag is clicked', () => {
    hostComponent.checkable = true;
    fixture.detectChanges();
    
    spyOn(hostComponent, 'onCheckedChange');
    const tagElement = fixture.debugElement.query(By.css('.lib-tag'));
    tagElement.nativeElement.click();
    
    expect(hostComponent.onCheckedChange).toHaveBeenCalledWith(true);
    // 验证内部状态（通过获取模板上的checked类）
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.lib-tag-checked'))).toBeTruthy();
  });

  it('should not toggle checked state when disabled', () => {
    hostComponent.checkable = true;
    hostComponent.disabled = true;
    fixture.detectChanges();
    
    spyOn(hostComponent, 'onCheckedChange');
    const tagElement = fixture.debugElement.query(By.css('.lib-tag'));
    tagElement.nativeElement.click();
    
    expect(hostComponent.onCheckedChange).not.toHaveBeenCalled();
    expect(fixture.debugElement.query(By.css('.lib-tag-checked'))).toBeFalsy();
  });
});
