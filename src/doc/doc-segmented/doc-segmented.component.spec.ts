import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocBoxComponent } from '../doc-box/doc-box.component';
import { DocApiTableComponent } from '../doc-api-table/doc-api-table.component';
import { SegmentedComponent } from '@project';
import { DoxSegmentedComponent } from './doc-segmented.component';

describe('DoxSegmentedComponent', () => {
  let component: DoxSegmentedComponent;
  let fixture: ComponentFixture<DoxSegmentedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        DoxSegmentedComponent
      ],
      // 如果DocBoxComponent和DocApiTableComponent没有standalone: true，则需要在这里声明
      // declarations: [DocBoxComponent, DocApiTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoxSegmentedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
