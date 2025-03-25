import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocWaterMarkComponent } from './doc-water-mark.component';

describe('DocWaterMarkComponent', () => {
  let component: DocWaterMarkComponent;
  let fixture: ComponentFixture<DocWaterMarkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocWaterMarkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocWaterMarkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
