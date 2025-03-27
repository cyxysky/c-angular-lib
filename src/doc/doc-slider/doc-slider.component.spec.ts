import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocSliderComponent } from './doc-slider.component';

describe('DocSliderComponent', () => {
  let component: DocSliderComponent;
  let fixture: ComponentFixture<DocSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocSliderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
