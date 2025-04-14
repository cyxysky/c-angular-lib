import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, TemplateRef, Injector, EnvironmentInjector, inject, ComponentRef } from '@angular/core';
import { DrawerComponent } from './drawer.component';
import { DrawerOptions } from './drawer.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DrawerService {
  private overlay = inject(Overlay);
  private injector = inject(Injector);
  private environmentInjector = inject(EnvironmentInjector);

  // 存储所有抽屉实例及其对应的OverlayRef
  private drawerInstances: Map<DrawerComponent, { overlayRef: OverlayRef, componentRef: ComponentRef<DrawerComponent> }> = new Map();
  private destroy$ = new Subject<void>();

  constructor() {}

  /**
   * 打开抽屉
   * @param options 抽屉配置项
   * @returns 抽屉组件实例
   */
  open(options: DrawerOptions): DrawerComponent {
    // 创建Overlay配置
    const overlayConfig = new OverlayConfig({
      positionStrategy: this.overlay.position().global(),
      scrollStrategy: options.mask !== false ? 
        this.overlay.scrollStrategies.block() : // 有遮罩时阻止滚动
        this.overlay.scrollStrategies.noop(),   // 无遮罩时允许滚动
      hasBackdrop: false, // 不使用CDK的遮罩，而是使用组件内部的遮罩
      disposeOnNavigation: true,
      panelClass: 'drawer-overlay-panel'
    });

    // 创建Overlay
    const overlayRef = this.overlay.create(overlayConfig);
    
    // 创建Portal
    const portal = new ComponentPortal(DrawerComponent, null, this.injector, this.environmentInjector);
    
    // 附着Portal到Overlay
    const componentRef = overlayRef.attach(portal);
    
    // 获取组件实例
    const drawerInstance = componentRef.instance;

    // 设置属性
    if (options.title !== undefined) {
      drawerInstance.title = options.title;
    }
    if (options.content !== undefined) {
      drawerInstance.content = options.content;
    }
    if (options.data !== undefined) {
      drawerInstance.data = options.data;
    }
    if (options.width !== undefined) {
      drawerInstance.width = options.width;
    }
    if (options.height !== undefined) {
      drawerInstance.height = options.height;
    }
    if (options.placement !== undefined) {
      drawerInstance.placement = options.placement;
    }
    if (options.mask !== undefined) {
      drawerInstance.mask = options.mask;
    }
    if (options.maskClosable !== undefined) {
      drawerInstance.maskClosable = options.maskClosable;
    }
    if (options.closable !== undefined) {
      drawerInstance.closable = options.closable;
    }
    if (options.zIndex !== undefined) {
      drawerInstance.zIndex = options.zIndex;
    }

    // 设置关闭回调
    if (options.onClose) {
      drawerInstance.visibleChange.subscribe((visible: boolean) => {
        if (!visible) {
          options.onClose?.();
        }
      });
    }

    // 设置关闭后回调
    drawerInstance.afterClose.subscribe(() => {
      if (options.afterClose) {
        options.afterClose();
      }
      this.removeDrawerInstance(drawerInstance);
    });

    // 设置打开后回调
    if (options.afterOpen) {
      drawerInstance.afterOpen.subscribe(() => options.afterOpen?.());
    }

    // 保存抽屉实例和OverlayRef的映射关系
    this.drawerInstances.set(drawerInstance, { overlayRef, componentRef });

    // 先创建，再显示
    drawerInstance.isVisible = true;
    
    // 立即显示抽屉并触发动画
    drawerInstance.visible = true;
    drawerInstance.handleVisibleChange(true);

    // 检测变化
    componentRef.changeDetectorRef.detectChanges();

    return drawerInstance;
  }

  /**
   * 关闭指定抽屉
   * @param drawerInstance 抽屉实例
   */
  close(drawerInstance: DrawerComponent): void {
    if (drawerInstance) {
      drawerInstance.close();
    }
  }

  /**
   * 关闭所有抽屉
   */
  closeAll(): void {
    Array.from(this.drawerInstances.keys()).forEach(instance => {
      this.close(instance);
    });
  }

  /**
   * 从实例数组中移除抽屉实例并销毁Overlay
   */
  private removeDrawerInstance(instance: DrawerComponent): void {
    const instanceData = this.drawerInstances.get(instance);
    if (instanceData) {
      const { overlayRef, componentRef } = instanceData;
      
      // 延迟销毁，确保动画完成
      setTimeout(() => {
        overlayRef.dispose();
        this.drawerInstances.delete(instance);
      }, 300);
    }
  }
} 