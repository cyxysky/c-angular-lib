import { Injectable, Injector, Type, TemplateRef, ComponentRef, Inject, Component } from '@angular/core';
import { OverlayService } from '../overlay/overlay.service';
import { ModalComponent } from './modal.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';

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

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalInstances: Map<string, {
    overlayRef: OverlayRef,
    componentRef: ComponentRef<ModalComponent>
  }> = new Map();
  private modalCounter = 0;
  private document: Document;

  constructor(
    private overlayService: OverlayService,
    private overlay: Overlay,
    private injector: Injector,
    @Inject(DOCUMENT) document: any
  ) {
    this.document = document;
  }

  /**
   * 创建一个模态框
   * @param content 模态框内容模板
   * @param options 模态框配置
   * @returns 模态框ID，可用于关闭模态框
   */
  create(options: ModalOptions = {}): string {
    const modalId = `modal-${this.modalCounter++}`;
    
    const modalOptions: ModalOptions = {
      width: '520px',
      height: 'auto',
      zIndex: 1000,
      closable: true,
      centered: false,
      maskClosable: true,
      ...options
    };
    
    // 创建全局Overlay
    const overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block(),
      hasBackdrop: false,
      backdropClass: 'cdk-overlay-dark-backdrop'
    });
    
    // 创建自定义注入器，用于传递数据
    const customInjector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: 'MODAL_DATA', useValue: modalOptions.data },
        { provide: 'MODAL_CLOSE', useValue: () => {
          this.closeModal(modalId);
        }}
      ]
    });
    
    // 创建并附加模态框组件
    const modalPortal = new ComponentPortal(ModalComponent, null, customInjector);
    const componentRef = overlayRef.attach(modalPortal);
    
    // 获取模态框实例
    const modalInstance = componentRef.instance;
    
    // 设置模态框属性
    modalInstance.width = modalOptions.width!;
    modalInstance.height = modalOptions.height!;
    modalInstance.zIndex = modalOptions.zIndex!;
    modalInstance.closable = modalOptions.closable!;
    modalInstance.centered = modalOptions.centered!;
    modalInstance.maskClosable = modalOptions.maskClosable!;
    modalInstance.top = modalOptions.top!;
    
    // 设置内容
    modalInstance.bodyContent = modalOptions.bodyContent || null;
    modalInstance.headerContent = modalOptions.headerContent || null;
    modalInstance.footerContent = modalOptions.footerContent || null;
    modalInstance.contentContext = { $implicit: modalOptions.data };
    
    // 设置回调
    modalInstance.afterClose.subscribe(() => {
      if (modalOptions.afterClose) {
        modalOptions.afterClose();
      }
    });
    
    modalInstance.afterOpen.subscribe(() => {
      if (modalOptions.afterOpen) {
        modalOptions.afterOpen();
      }
    });
    
    // 点击背景关闭
    if (modalOptions.maskClosable) {
      overlayRef.backdropClick().subscribe(() => {
        this.closeModal(modalId);
      });
    }
    
    // 显示模态框
    modalInstance.visible = true;
    
    // 存储实例
    this.modalInstances.set(modalId, {
      overlayRef,
      componentRef
    });
    
    return modalId;
  }
  
  /**
   * 关闭模态框
   * @param modalId 模态框ID
   */
  closeModal(modalId: string): void {
    const instance = this.modalInstances.get(modalId);
    if (instance) {
      const { overlayRef, componentRef } = instance;
      componentRef.instance.visible = false;
      overlayRef.dispose();
      this.modalInstances.delete(modalId);
    }
  }
  
  /**
   * 关闭所有模态框
   */
  closeAllModals(): void {
    this.modalInstances.forEach(({ componentRef }, modalId) => {
      componentRef.instance.visible = false;
      
      setTimeout(() => {
        this.closeModal(modalId);
      }, 200);
    });
  }
}