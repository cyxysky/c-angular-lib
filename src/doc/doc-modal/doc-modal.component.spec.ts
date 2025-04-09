import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocModalComponent } from './doc-modal.component';

describe('DocModalComponent', () => {
  let component: DocModalComponent;
  let fixture: ComponentFixture<DocModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
