import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocTabsComponent } from './doc-tabs.component';

describe('DocTabsComponent', () => {
  let component: DocTabsComponent;
  let fixture: ComponentFixture<DocTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocTabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
