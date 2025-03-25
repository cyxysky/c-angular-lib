import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessTreeNodeComponent } from './process-tree-node.component';

describe('ProcessTreeNodeComponent', () => {
  let component: ProcessTreeNodeComponent;
  let fixture: ComponentFixture<ProcessTreeNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessTreeNodeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessTreeNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
