import { TemplateRef } from "@angular/core";

export interface TabItem {
    key: string;
    title: string;
    disabled?: boolean;
    content: TemplateRef<any>;
    customTitle?: TemplateRef<any>;
}

export interface TabConfig extends Omit<TabItem, 'key'> {
    key?: string;
}

export type tabsDirection = 'top' | 'bottom';
export type tabsSize = 'default' | 'small' | 'large';
export type tabsType = 'line' | 'card';
export type tabsAlign = 'left' | 'center' | 'right';

