import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuOverflowDemoComponent } from './menu-overflow-demo.component';

describe('MenuOverflowDemoComponent', () => {
  let component: MenuOverflowDemoComponent;
  let fixture: ComponentFixture<MenuOverflowDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuOverflowDemoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuOverflowDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
