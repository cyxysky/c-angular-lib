import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipComponent } from './tooltip.component';

// 测试宿主组件，用于提供模板引用
@Component({
  template: `
    <ng-template #testTemplate>模板内容</ng-template>
    <lib-tooltip [content]="content" [placement]="placement"></lib-tooltip>
  `
})
class TestHostComponent {
  @ViewChild('testTemplate', { static: true }) testTemplate!: TemplateRef<any>;
  content: string | TemplateRef<any> = '测试提示';
  placement: 'top' | 'bottom' | 'left' | 'right' = 'top';
}

describe('TooltipComponent', () => {
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let tooltipComponent: TooltipComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, TooltipComponent],
      declarations: [TestHostComponent]
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
    
    tooltipComponent = hostFixture.debugElement.children[1].componentInstance;
  });

  it('should create', () => {
    expect(tooltipComponent).toBeTruthy();
  });

  it('should display string content', () => {
    hostComponent.content = '字符串提示';
    hostFixture.detectChanges();
    
    const tooltipEl = hostFixture.nativeElement.querySelector('.lib-tooltip-content');
    expect(tooltipEl.textContent).toContain('字符串提示');
  });

  it('should display template content', () => {
    hostComponent.content = hostComponent.testTemplate;
    hostFixture.detectChanges();
    
    const tooltipEl = hostFixture.nativeElement.querySelector('.lib-tooltip-content');
    expect(tooltipEl.textContent).toContain('模板内容');
  });

  it('should apply correct placement class', () => {
    hostComponent.placement = 'bottom';
    hostFixture.detectChanges();
    
    const tooltipEl = hostFixture.nativeElement.querySelector('.lib-tooltip');
    expect(tooltipEl.classList).toContain('lib-tooltip-bottom');
  });
});
