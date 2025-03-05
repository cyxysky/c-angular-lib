import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessTreeComponent } from './process-tree.component';

describe('ProcessTreeComponent', () => {
  let component: ProcessTreeComponent;
  let fixture: ComponentFixture<ProcessTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessTreeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
