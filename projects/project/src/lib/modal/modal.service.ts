import { ComponentRef, Injectable } from '@angular/core';
import { ModalComponent } from './modal.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ModalOptions, ModalRefMap } from './modal.interface';
import { UtilsService } from '../utils/utils.service';
@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalInstances: ModalRefMap = new Map();
  private modalCounter = 0;

  constructor(
    private overlay: Overlay,
    public utils: UtilsService
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
    });
    // 创建并附加模态框组件
    const modalPortal = new ComponentPortal(ModalComponent, null);
    const componentRef = overlayRef.attach(modalPortal);
    // 获取模态框实例
    const modalInstance = componentRef.instance;
    componentRef.setInput('width', modalOptions.width!);
    componentRef.setInput('height', modalOptions.height!);
    componentRef.setInput('zIndex', modalOptions.zIndex!);
    componentRef.setInput('closable', modalOptions.closable!);
    componentRef.setInput('centered', modalOptions.centered!);
    componentRef.setInput('maskClosable', modalOptions.maskClosable!);
    componentRef.setInput('top', modalOptions.top!);
    componentRef.setInput('headerContent', modalOptions.headerContent!);
    componentRef.setInput('footerContent', modalOptions.footerContent!);
    componentRef.setInput('contentContext', { $implicit: modalOptions.data });
    // 设置组件本身内容
    // 如果是组件，则设置组件内容
    if (this.utils.isComponent(modalOptions.bodyContent)) {
      componentRef.setInput('componentContent', modalOptions.bodyContent!);
      componentRef.setInput('componentInputs', modalOptions.componentInputs!);
      componentRef.setInput('componentOutputs', modalOptions.componentOutputs!);
    } 
    // 如果是模板，则设置模板内容
    else if (this.utils.isTemplate(modalOptions.bodyContent)) {
      componentRef.setInput('bodyContent', modalOptions.bodyContent!);
    }
    // 设置回调
    modalInstance.afterClose.subscribe(() => {
      modalOptions.afterClose && modalOptions.afterClose();
    });
    modalInstance.afterOpen.subscribe(() => {
      modalOptions.afterOpen && modalOptions.afterOpen();
    });
    // 点击背景关闭
    modalOptions.maskClosable && overlayRef.backdropClick().subscribe(() => {
      this.closeModal(modalId);
    });
    // 显示模态框
    componentRef.setInput('visible', true);
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
      componentRef.setInput('visible', false);
      let timer = setTimeout(() => {
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
      this.closeModal(modalId);
    });
  }

  /**
   * 获取模态框实例
   * @param modalId 模态框ID
   * @returns 模态框实例
   */
  getModalInstance(modalId: string): { overlayRef: OverlayRef, componentRef: ComponentRef<ModalComponent> } | undefined {
    if (this.modalInstances.has(modalId)) {
      return this.modalInstances.get(modalId);
    }
    return undefined;
  }

}