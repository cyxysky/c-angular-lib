import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';
import { SegmentedComponent, SegmentedOption } from './segmented.component';

describe('SegmentedComponent', () => {
  let component: SegmentedComponent;
  let fixture: ComponentFixture<SegmentedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, SegmentedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SegmentedComponent);
    component = fixture.componentInstance;
    component.options = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3', disabled: true }
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all options', () => {
    const items = fixture.debugElement.queryAll(By.css('.segmented-item'));
    expect(items.length).toBe(3);
  });

  it('should mark option as selected when clicked', () => {
    const items = fixture.debugElement.queryAll(By.css('.segmented-item'));
    items[0].nativeElement.click();
    fixture.detectChanges();

    expect(component.value).toBe('1');
    expect(items[0].nativeElement.classList).toContain('segmented-item-selected');
  });

  it('should not select disabled options', () => {
    const disabledItem = fixture.debugElement.queryAll(By.css('.cjf-segmented-item'))[2];
    disabledItem.nativeElement.click();
    fixture.detectChanges();

    expect(component.value).not.toBe('3');
    expect(disabledItem.nativeElement.classList).toContain('cjf-segmented-item-disabled');
  });

  it('should emit valueChange event when selection changes', () => {
    spyOn(component.valueChange, 'emit');
    const items = fixture.debugElement.queryAll(By.css('.cjf-segmented-item'));
    items[1].nativeElement.click();
    fixture.detectChanges();

    expect(component.valueChange.emit).toHaveBeenCalledWith('2');
  });

  it('should apply different sizes', () => {
    component.size = 'large';
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.cjf-segmented-lg'))).toBeTruthy();

    component.size = 'small';
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.cjf-segmented-sm'))).toBeTruthy();
  });

  it('should show scroll buttons when content overflows', () => {
    // 模拟选项太多导致溢出
    component.options = Array(10).fill(0).map((_, i) => ({ 
      value: `${i}`, 
      label: `Option ${i}` 
    }));
    
    // 模拟容器宽度小于内容宽度
    const containerEl = fixture.debugElement.query(By.css('.segmented-container')).nativeElement;
    
    // 使用spyOn来模拟DOM元素属性
    Object.defineProperty(containerEl, 'clientWidth', { value: 100 });
    
    const groupEl = fixture.debugElement.query(By.css('.segmented-group')).nativeElement;
    Object.defineProperty(groupEl, 'scrollWidth', { value: 500 });
    
    component.updateScrollButtonsVisibility();
    fixture.detectChanges();
    
    // 应该显示导航按钮
    expect(component.showScrollButtons).toBeTrue();
  });

  it('should not show scroll buttons when content fits', () => {
    // 模拟内容宽度小于容器
    const containerEl = fixture.debugElement.query(By.css('.segmented-container')).nativeElement;
    
    // 使用spyOn来模拟DOM元素属性
    Object.defineProperty(containerEl, 'clientWidth', { value: 500 });
    
    const groupEl = fixture.debugElement.query(By.css('.segmented-group')).nativeElement;
    Object.defineProperty(groupEl, 'scrollWidth', { value: 100 });
    
    component.updateScrollButtonsVisibility();
    fixture.detectChanges();
    
    // 不应该显示导航按钮
    expect(component.showScrollButtons).toBeFalse();
  });
});
