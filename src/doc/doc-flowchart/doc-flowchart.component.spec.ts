import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocFlowchartComponent } from './doc-flowchart.component';

describe('DocFlowchartComponent', () => {
  let component: DocFlowchartComponent;
  let fixture: ComponentFixture<DocFlowchartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocFlowchartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocFlowchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
