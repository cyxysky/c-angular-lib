import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocDrawerComponent } from './doc-drawer.component';

describe('DocDrawerComponent', () => {
  let component: DocDrawerComponent;
  let fixture: ComponentFixture<DocDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
