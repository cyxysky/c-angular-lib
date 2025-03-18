import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocNumberInputComponent } from './doc-number-input.component';

describe('DocNumberInputComponent', () => {
  let component: DocNumberInputComponent;
  let fixture: ComponentFixture<DocNumberInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocNumberInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocNumberInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
