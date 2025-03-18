import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocSwitchComponent } from './doc-switch.component';

describe('DocSwitchComponent', () => {
  let component: DocSwitchComponent;
  let fixture: ComponentFixture<DocSwitchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocSwitchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocSwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
