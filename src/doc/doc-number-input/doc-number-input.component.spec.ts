import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DocNumberInputComponent } from './doc-number-input.component';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { DocApiTableComponent } from '../doc-api-table/doc-api-table.component';

describe('DocNumberInputComponent', () => {
  let component: DocNumberInputComponent;
  let fixture: ComponentFixture<DocNumberInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DocNumberInputComponent,
        DocBoxComponent,
        DocApiTableComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocNumberInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
