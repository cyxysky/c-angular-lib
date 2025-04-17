import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectTagComponent } from '../select-tag/select-tag.component';
import { SelectSearchComponent } from '../select-search/select-search.component';

@Component({
  selector: 'lib-select-box',
  imports: [FormsModule, CommonModule, SelectTagComponent, SelectSearchComponent],
  templateUrl: './select-box.component.html',
  styleUrl: './select-box.component.less'
})
export class SelectBoxComponent {
  @ViewChild('searchInput', { static: false }) searchInput!: SelectSearchComponent;
  @Input() size: 'default' | 'small' | 'large' = 'default';
  @Input() selectMode: 'single' | 'multiple' = 'single';
  @Input() status: 'default' | 'error' | 'warning' | any = 'default';
  @Input() allowClear: boolean = true;
  @Input() allowSearch: boolean = true;
  @Input() loading: boolean = false;
  @Input() borderless: boolean = false;
  @Input() disabled: boolean = false;
  @Input() placeholder: string = '';
  @Input() data: any;
  @Input() isActive: boolean = false;
  @Input() optionLabelTemplate: TemplateRef<any> | null = null;
  @Input() getLabel: (value: any) => string = (value: any) => value;

  @Input() searchValue: string = '';
  @Output() searchValueChange = new EventEmitter<string>();

  @Output() remove = new EventEmitter<any>();
  @Output() clear = new EventEmitter<any>();
  @Output() search = new EventEmitter<any>();
  @Output() inputWidthChange = new EventEmitter<any>();
  @Output() paste = new EventEmitter<any>();

  public searchOnCompositionValue = '';

  getDisplayTags(data: any): string {
    return this.getLabel && this.getLabel(data) || data;
  }


  removeTag(event: Event, value: any) {
    event.stopPropagation();
    this.remove.emit(value);
  }

  clearValue(event: Event) {
    event.stopPropagation();
    this.clear.emit();
  }

  handleInputWidthChange() {
    this.inputWidthChange.emit();
  }

  handleCompositionChange(event: any) {
    this.searchOnCompositionValue = event;
  }

  handlePaste(event: any) {
    this.paste.emit(event);
  }

  handleSearch(event: any) {
    this.searchOnCompositionValue = event;
    this.searchValueChange.emit(event);
    this.search.emit(event);
  }

  public focusSearchInput() {
    this.searchInput.focus();
  }

  public clearSearchValue() {
    this.searchValue = '';
    this.searchOnCompositionValue = '';
    this.searchInput.clear();
  }

  public blurSearchInput() {
    this.searchInput.blur();
  }

}
