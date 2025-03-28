import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocPopoverComponent } from './doc-popover.component';

describe('DocPopoverComponent', () => {
  let component: DocPopoverComponent;
  let fixture: ComponentFixture<DocPopoverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocPopoverComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocPopoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
