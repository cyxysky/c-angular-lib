import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocCheckboxComponent } from './doc-checkbox.component';

describe('DocCheckboxComponent', () => {
  let component: DocCheckboxComponent;
  let fixture: ComponentFixture<DocCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocCheckboxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
