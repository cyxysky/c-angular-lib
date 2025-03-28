import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocPopconfirmComponent } from './doc-popconfirm.component';

describe('DocPopconfirmComponent', () => {
  let component: DocPopconfirmComponent;
  let fixture: ComponentFixture<DocPopconfirmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocPopconfirmComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocPopconfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
