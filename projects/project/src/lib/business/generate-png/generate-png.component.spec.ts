import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneratePngComponent } from './generate-png.component';

describe('GeneratePngComponent', () => {
  let component: GeneratePngComponent;
  let fixture: ComponentFixture<GeneratePngComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneratePngComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneratePngComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
