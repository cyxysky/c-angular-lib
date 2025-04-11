import { Injectable } from '@angular/core';
import { ModalComponent } from './modal.component';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ModalOptions, ModalRefMap } from './modal.interface';
@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalInstances: ModalRefMap = new Map();
  private modalCounter = 0;

  constructor(
    private overlay: Overlay,
  ) {
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
    // 创建并附加模态框组件
    const modalPortal = new ComponentPortal(ModalComponent, null);
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
      componentRef.instance.animationState = 'void';
      console.log(componentRef.instance.animationState);
      let timer = setTimeout(() => {
        componentRef.instance.visible = false;
        overlayRef.dispose();
        this.modalInstances.delete(modalId);
        clearTimeout(timer);
      }, 150);
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