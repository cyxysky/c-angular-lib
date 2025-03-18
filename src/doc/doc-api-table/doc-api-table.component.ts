import { Component, Input } from '@angular/core';
export interface ApiData {
  title: string;
  type?: string;
  description?: string;
  items: ApiItem[];
}

export interface ApiItem {
  name: string;
  description: string;
  type: string;
  default?: string;
  [key: string]: any;
}
@Component({
  selector: 'app-doc-api-table',
  imports: [],
  templateUrl: './doc-api-table.component.html',
  styleUrl: './doc-api-table.component.less'
})
export class DocApiTableComponent {
  @Input() apiData: ApiData[] = [];
}
