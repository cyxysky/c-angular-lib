import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TreeSelectComponent } from './tree-select.component';
import { UtilsService } from '../utils/utils.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeComponent } from '../tree/tree.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('TreeSelectComponent', () => {
  let component: TreeSelectComponent;
  let fixture: ComponentFixture<TreeSelectComponent>;
  let mockUtilsService: any;

  beforeEach(() => {
    mockUtilsService = jasmine.createSpyObj('UtilsService', ['method1', 'method2']);
    
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        TreeSelectComponent
      ],
      providers: [
        { provide: UtilsService, useValue: mockUtilsService }
      ],
      schemas: [NO_ERRORS_SCHEMA] // 使用NO_ERRORS_SCHEMA以避免嵌套组件的错误
    });
    fixture = TestBed.createComponent(TreeSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // 添加更多测试用例
});
