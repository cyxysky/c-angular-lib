import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocDateTimerComponent } from './doc-date-timer.component';

describe('DocDateTimerComponent', () => {
  let component: DocDateTimerComponent;
  let fixture: ComponentFixture<DocDateTimerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocDateTimerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocDateTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
