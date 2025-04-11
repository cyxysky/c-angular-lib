import { Component, Input, TemplateRef, ViewChild, ContentChild, AfterContentInit, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

@Component({
  selector: 'lib-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-template #contentTemplate>
      <ng-content></ng-content>
    </ng-template>
    <ng-template #customTemplate>
      <ng-container *ngIf="titleTemplate; else defaultTitleTemplate" [ngTemplateOutlet]="titleTemplate"></ng-container>
      <ng-template #defaultTitleTemplate>{{ title }}</ng-template>
    </ng-template>
  `
})
export class TabComponent implements OnInit, AfterContentInit, OnDestroy {
  @Input() title: string = '';
  @Input() disabled: boolean = false;
  @Input() key: string = '';
  @Input() titleTemplate: TemplateRef<any> | null = null;
  
  @ViewChild('contentTemplate', { static: true }) contentTemplate!: TemplateRef<any>;
  @ViewChild('customTemplate', { static: true }) customTemplate!: TemplateRef<any>;
  
  private destroy$ = new Subject<void>();
  
  constructor() {}
  
  ngOnInit(): void {
    if (!this.key) {
      this.key = `tab-${Math.random().toString(36).substr(2, 9)}`;
    }
  }
  
  ngAfterContentInit(): void {
    // 初始化逻辑可在这里添加
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 