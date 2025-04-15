import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocDropMenuComponent } from './doc-drop-menu.component';

describe('DocDropMenuComponent', () => {
  let component: DocDropMenuComponent;
  let fixture: ComponentFixture<DocDropMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocDropMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocDropMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
