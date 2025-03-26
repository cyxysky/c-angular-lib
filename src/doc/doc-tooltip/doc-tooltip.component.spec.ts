import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocTooltipComponent } from './doc-tooltip.component';

describe('DocTooltipComponent', () => {
  let component: DocTooltipComponent;
  let fixture: ComponentFixture<DocTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocTooltipComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
