import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CjfProjectComponent } from './cjf-project.component';

describe('CjfProjectComponent', () => {
  let component: CjfProjectComponent;
  let fixture: ComponentFixture<CjfProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CjfProjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CjfProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
