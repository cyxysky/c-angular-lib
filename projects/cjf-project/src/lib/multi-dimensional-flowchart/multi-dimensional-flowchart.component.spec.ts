import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiDimensionalFlowchartComponent } from './multi-dimensional-flowchart.component';

describe('MultiDimensionalFlowchartComponent', () => {
  let component: MultiDimensionalFlowchartComponent;
  let fixture: ComponentFixture<MultiDimensionalFlowchartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiDimensionalFlowchartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiDimensionalFlowchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
