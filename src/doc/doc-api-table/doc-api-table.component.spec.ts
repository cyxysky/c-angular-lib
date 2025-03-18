import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocApiTableComponent } from './doc-api-table.component';

describe('DocApiTableComponent', () => {
  let component: DocApiTableComponent;
  let fixture: ComponentFixture<DocApiTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocApiTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocApiTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
