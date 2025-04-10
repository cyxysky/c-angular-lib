import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabComponent } from './tab.component';

export interface TabItem {
  key: string;
  title: string;
  disabled?: boolean;
  content: TemplateRef<any>;
}

@Component({
  selector: 'lib-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent implements AfterContentInit {
  @Input() items: TabItem[] = [];
  @Input() selectedIndex = 0;
  @Input() tabPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() size: 'default' | 'small' | 'large' = 'default';
  @Input() type: 'line' | 'card' = 'line';
  @Input() animated = true;
  @Input() centered = false;
  @Output() selectedIndexChange = new EventEmitter<number>();
  @Output() tabClick = new EventEmitter<{ index: number, tab: TabItem }>();
  
  @ContentChildren(TabComponent) tabComponents!: QueryList<TabComponent>;
  
  allTabs: TabItem[] = [];
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngAfterContentInit(): void {
    this.buildAllTabs();
    
    // 监听子组件变化
    if (this.tabComponents) {
      this.tabComponents.changes.subscribe(() => {
        this.buildAllTabs();
      });
    }
  }
  
  private buildAllTabs(): void {
    // 合并输入的items和子组件
    this.allTabs = [
      ...this.items,
      ...this.tabComponents?.map(tab => ({
        key: tab.key || `tab-${Math.random().toString(36).substr(2, 9)}`,
        title: tab.title,
        disabled: tab.disabled,
        content: tab.contentTemplate
      })) || []
    ];
    this.cdr.markForCheck();
  }
  
  selectTab(index: number): void {
    if (this.allTabs[index]?.disabled) {
      return;
    }
    this.selectedIndex = index;
    this.selectedIndexChange.emit(index);
    this.tabClick.emit({ index, tab: this.allTabs[index] });
    this.cdr.markForCheck();
  }
  
  isActive(index: number): boolean {
    return index === this.selectedIndex;
  }
}
