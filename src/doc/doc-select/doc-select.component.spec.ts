import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocSelectComponent } from './doc-select.component';

describe('DocSelectComponent', () => {
  let component: DocSelectComponent;
  let fixture: ComponentFixture<DocSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
