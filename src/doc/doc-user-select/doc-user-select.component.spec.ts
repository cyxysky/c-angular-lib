import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocUserSelectComponent } from './doc-user-select.component';

describe('DocUserSelectComponent', () => {
  let component: DocUserSelectComponent;
  let fixture: ComponentFixture<DocUserSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocUserSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocUserSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
