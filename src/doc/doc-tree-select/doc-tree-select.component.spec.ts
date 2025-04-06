import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocTreeSelectComponent } from './doc-tree-select.component';

describe('DocTreeSelectComponent', () => {
  let component: DocTreeSelectComponent;
  let fixture: ComponentFixture<DocTreeSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocTreeSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocTreeSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
