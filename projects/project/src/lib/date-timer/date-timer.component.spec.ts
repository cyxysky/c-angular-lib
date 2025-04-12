import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateTimerComponent } from './date-timer.component';

describe('DateTimerComponent', () => {
  let component: DateTimerComponent;
  let fixture: ComponentFixture<DateTimerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateTimerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DateTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
