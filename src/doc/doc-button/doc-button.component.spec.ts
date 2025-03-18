import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocButtonComponent } from './doc-button.component';

describe('DocButtonComponent', () => {
  let component: DocButtonComponent;
  let fixture: ComponentFixture<DocButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
