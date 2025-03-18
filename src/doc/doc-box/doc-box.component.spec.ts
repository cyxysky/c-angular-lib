import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CommonModule } from '@angular/common';
import { DocBoxComponent } from './doc-box.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('DocBoxComponent', () => {
  let component: DocBoxComponent;
  let fixture: ComponentFixture<DocBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        BrowserAnimationsModule,
        NzTabsModule,
        NzIconModule,
        DocBoxComponent
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should initialize tabs correctly', () => {
    component.sourceCode = 'console.log("test")';
    component.htmlCode = '<div>Test</div>';
    component.cssCode = '.test { color: red; }';
    component.ngOnInit();
    
    expect(component.tabs.length).toBe(3);
    expect(component.showTabs).toBeTrue();
  });
  
  it('should toggle code visibility', () => {
    expect(component.codeVisible).toBeFalse();
    component.toggleCode();
    expect(component.codeVisible).toBeTrue();
    component.toggleCode();
    expect(component.codeVisible).toBeFalse();
  });
  
  it('should copy code', () => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    component.sourceCode = 'console.log("test")';
    component.ngOnInit();
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('console.log("test")');
    expect(component.copied).toBeTrue();
  });
});
