import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocStructureTreeComponent } from './doc-structure-tree.component';

describe('DocStructureTreeComponent', () => {
  let component: DocStructureTreeComponent;
  let fixture: ComponentFixture<DocStructureTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocStructureTreeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocStructureTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
