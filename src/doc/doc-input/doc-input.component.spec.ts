import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocInputComponent } from './doc-input.component';

describe('DocInputComponent', () => {
  let component: DocInputComponent;
  let fixture: ComponentFixture<DocInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
