import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoxTooltipComponent } from './dox-tooltip.component';

describe('DoxTooltipComponent', () => {
  let component: DoxTooltipComponent;
  let fixture: ComponentFixture<DoxTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoxTooltipComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoxTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
