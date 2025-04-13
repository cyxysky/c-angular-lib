import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ApplicationRef, ComponentRef, Injectable, Injector, NgZone, TemplateRef, createComponent, inject } from '@angular/core';
import { MessageComponent } from './message.component';
import { Message } from './message.interface';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private overlay = inject(Overlay);
  private injector = inject(Injector);
  private appRef = inject(ApplicationRef);
  private ngZone = inject(NgZone);

  private messageInstances: Map<string, ComponentRef<MessageComponent>> = new Map();
  private messageCounter = 0;
  private messageContainerElement: HTMLElement | null = null;

  // 消息事件
  public messageChange = new Subject<{ id: string, status: 'created' | 'removed' }>();

  constructor() {
    this.createMessageContainer();
  }

  /**
   * 创建消息容器
   */
  private createMessageContainer(): void {
    if (!this.messageContainerElement) {
      // 创建消息容器
      this.messageContainerElement = document.createElement('div');
      this.messageContainerElement.className = 'lib-message-container';
      this.messageContainerElement.style.position = 'fixed';
      this.messageContainerElement.style.top = '16px';
      this.messageContainerElement.style.left = '0';
      this.messageContainerElement.style.width = '100%';
      this.messageContainerElement.style.display = 'flex';
      this.messageContainerElement.style.flexDirection = 'column';
      this.messageContainerElement.style.alignItems = 'center';
      this.messageContainerElement.style.pointerEvents = 'none';
      this.messageContainerElement.style.zIndex = '1010';

      // 移除可能存在的旧容器
      const existingContainer = document.querySelector('.lib-message-container');
      if (existingContainer) {
        document.body.removeChild(existingContainer);
      }

      document.body.appendChild(this.messageContainerElement);
    }
  }

  /**
   * 创建消息
   */
  create(
    content: string | TemplateRef<{ $implicit: any }>,
    options: {
      type?: 'success' | 'error' | 'warning' | 'info',
      duration?: number,
      data?: any,
      closeable?: boolean
    } = {}
  ): string {
    return this.ngZone.run(() => {
      this.createMessageContainer();
      const id = `message-${this.messageCounter++}`;
      const componentRef = this.createMessage(id, content, options);
      this.messageInstances.set(id, componentRef);
      this.messageChange.next({ id, status: 'created' });
      return id;
    });
  }

  /**
   * 创建消息组件
   */
  private createMessage(
    id: string,
    content: string | TemplateRef<{ $implicit: any }>,
    options: {
      type?: 'success' | 'error' | 'warning' | 'info',
      duration?: number,
      data?: any,
      closeable?: boolean
    }
  ): ComponentRef<MessageComponent> {
    // 创建消息宿主元素
    const messageElement = document.createElement('div');
    messageElement.className = `lib-message-wrapper lib-message-wrapper-${id}`;
    messageElement.style.pointerEvents = 'auto';
    messageElement.style.marginBottom = '16px';
    messageElement.style.width = '100%';
    messageElement.style.display = 'flex';
    messageElement.style.justifyContent = 'center';

    // 确保容器存在
    if (!this.messageContainerElement) {
      this.createMessageContainer();
    }

    // 添加到容器中
    this.messageContainerElement!.appendChild(messageElement);

    // 创建组件
    const componentRef = createComponent(MessageComponent, {
      environmentInjector: this.appRef.injector,
      elementInjector: this.injector,
      hostElement: messageElement
    });

    // 初始化属性
    const instance = componentRef.instance;
    instance.id = id;
    instance.content = content;
    instance.type = options.type || 'info';
    instance.duration = options.duration !== undefined ? options.duration : 3000;
    instance.data = options.data || null;
    instance.closeable = options.closeable || false;
    instance.onClose = () => this.remove(id);

    // 手动触发变更检测
    componentRef.changeDetectorRef.detectChanges();

    // 自动附加到视图
    this.appRef.attachView(componentRef.hostView);

    return componentRef;
  }

  /**
   * 移除消息
   */
  remove(id: string): void {
    const messageRef = this.messageInstances.get(id);
    if (messageRef) {
      // 关闭动画
      messageRef.instance.close();
      this.messageChange.next({ id, status: 'removed' });

      // 动画结束后移除DOM
      setTimeout(() => {
        try {
          // 使用选择器更安全地查找对应的元素
          const wrapperSelector = `.lib-message-wrapper-${id}`;
          const wrapperElement = document.querySelector(wrapperSelector);
          if (wrapperElement && wrapperElement.parentNode) {
            wrapperElement.parentNode.removeChild(wrapperElement);
          }
          // 销毁组件
          this.appRef.detachView(messageRef.hostView);
          messageRef.destroy();
        } catch (err) {
          console.error('移除消息DOM时出错:', err);
        } finally {
          // 确保从实例映射中移除
          this.messageInstances.delete(id);
        }
      }, 350); // 增加一点时间确保动画完成
    }
  }

  /**
   * 移除所有消息
   */
  removeAll(): void {
    const ids = Array.from(this.messageInstances.keys());
    ids.forEach(id => {
      this.remove(id);
    });
  }

  /**
   * 成功消息
   */
  success(
    content: string | TemplateRef<{ $implicit: any }>,
    options: {
      duration?: number,
      data?: any
    } = {}
  ): string {
    return this.create(content, { ...options, type: 'success' });
  }

  /**
   * 错误消息
   */
  error(
    content: string | TemplateRef<{ $implicit: any }>,
    options: {
      duration?: number,
      data?: any
    } = {}
  ): string {
    return this.create(content, { ...options, type: 'error' });
  }

  /**
   * 警告消息
   */
  warning(
    content: string | TemplateRef<{ $implicit: any }>,
    options: {
      duration?: number,
      data?: any
    } = {}
  ): string {
    return this.create(content, { ...options, type: 'warning' });
  }

  /**
   * 信息消息
   */
  info(
    content: string | TemplateRef<{ $implicit: any }>,
    options: {
      duration?: number,
      data?: any
    } = {}
  ): string {
    return this.create(content, { ...options, type: 'info' });
  }
} 