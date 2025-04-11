import { TemplateRef, Component, ComponentRef } from "@angular/core";
import { ModalComponent } from "./modal.component";
import { OverlayRef } from "@angular/cdk/overlay";

export interface ModalOptions {
    /** 模态框宽度 */
    width?: string | number;
    /** 模态框高度 */
    height?: string | number;
    /** 模态框z-index值 */
    zIndex?: number;
    /** 是否显示关闭按钮 */
    closable?: boolean;
    /** 是否居中显示 */
    centered?: boolean;
    /** 点击蒙层是否允许关闭 */
    maskClosable?: boolean;
    /** 传递给模态框内容的数据 */
    data?: any;
    /** 模态框关闭后的回调 */
    afterClose?: () => void;
    /** 模态框打开后的回调 */
    afterOpen?: () => void;
    /** 头部内容 */
    headerContent?: TemplateRef<any>;
    /** 底部内容 */
    footerContent?: TemplateRef<any>;
    /** 内容 */
    bodyContent?: TemplateRef<any> | Component | any;
    /** 模态框顶部位置 */
    top?: string;
}

export type ModalRefMap = Map<string, { overlayRef: OverlayRef, componentRef: ComponentRef<ModalComponent> }>