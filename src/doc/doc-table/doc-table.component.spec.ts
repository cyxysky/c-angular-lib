import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocTableComponent } from './doc-table.component';

describe('DocTableComponent', () => {
  let component: DocTableComponent;
  let fixture: ComponentFixture<DocTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
