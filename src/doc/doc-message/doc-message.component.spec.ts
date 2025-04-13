import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocMessageComponent } from './doc-message.component';

describe('DocMessageComponent', () => {
  let component: DocMessageComponent;
  let fixture: ComponentFixture<DocMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocMessageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
