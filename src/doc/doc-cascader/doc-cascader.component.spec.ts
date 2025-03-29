import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocCascaderComponent } from './doc-cascader.component';

describe('DocCascaderComponent', () => {
  let component: DocCascaderComponent;
  let fixture: ComponentFixture<DocCascaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocCascaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocCascaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
