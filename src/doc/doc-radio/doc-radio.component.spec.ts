import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocRadioComponent } from './doc-radio.component';

describe('DocRadioComponent', () => {
  let component: DocRadioComponent;
  let fixture: ComponentFixture<DocRadioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocRadioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocRadioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
