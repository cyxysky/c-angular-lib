import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerFormComponentComponent } from './customer-form-component.component';

describe('CustomerFormComponentComponent', () => {
  let component: CustomerFormComponentComponent;
  let fixture: ComponentFixture<CustomerFormComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerFormComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerFormComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
