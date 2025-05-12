import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocChartComponent } from './doc-chart.component';

describe('DocChartComponent', () => {
  let component: DocChartComponent;
  let fixture: ComponentFixture<DocChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
