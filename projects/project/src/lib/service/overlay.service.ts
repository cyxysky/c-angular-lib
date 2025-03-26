import { CdkOverlayOrigin, ConnectedPosition, Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ElementRef, Injectable, TemplateRef, ViewContainerRef } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OverlayService {

  constructor(
    public overlay: Overlay,
  ) { }

  /**
   * 创建一个overlay
   * @param configs 配置
   * @param _overlayOrigin 原点
   * @param position 位置
   * @param overlayTemplate 模板
   * @param viewContainerRef 视图容器
   * @param closeModal 关闭回调
   * @returns overlayRef
   */
  createOverlay(configs: OverlayConfig, elementRef: ElementRef | Element | any, position: ConnectedPosition[], closeModal: (overlayRef: OverlayRef) => void): OverlayRef {
    let config = new OverlayConfig();
    // 定位策略
    let positionStrategy = this.overlay.position().
                                        flexibleConnectedTo(elementRef).
                                        withPositions(position).
                                        withPush(false).
                                        withGrowAfterOpen(true).
                                        withLockedPosition(false);
    // 滚动策略
    config.scrollStrategy = this.overlay.scrollStrategies.reposition();
    // 定位策略
    config.positionStrategy = positionStrategy;
    // 是否在导航时关闭
    config.disposeOnNavigation = true;
    config = {
      ...config,
      ...configs
    }
    // 创建overlay
    let overlayRef = this.overlay.create(config);
    // 点击背景，关闭浮层
    overlayRef.outsidePointerEvents().subscribe(() => {
      closeModal(overlayRef);
    });
    // 附加模板
    return overlayRef;
  }

  attachTemplate(overlayRef: OverlayRef, overlayTemplate: TemplateRef<any>, viewContainerRef: ViewContainerRef) {
    overlayRef.attach(new TemplatePortal(overlayTemplate, viewContainerRef));
  }

  public getPositions(placement: string): ConnectedPosition[] {
    const positions: ConnectedPosition[] = [];

    switch (placement) {
      case 'top':
        positions.push({
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetY: -0
        });
        break;

      case 'bottom':
        positions.push({
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
          offsetY: 0
        });
        break;

      case 'left':
        positions.push({
          originX: 'start',
          originY: 'center',
          overlayX: 'end',
          overlayY: 'center',
          offsetX: -0
        });
        break;

      case 'right':
        positions.push({
          originX: 'end',
          originY: 'center',
          overlayX: 'start',
          overlayY: 'center',
          offsetX: 0
        });
        break;

      case 'left-top':
        positions.push({
          originX: 'start',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'top',
          offsetX: -0
        });
        break;

      case 'left-bottom':
        positions.push({
          originX: 'start',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'bottom',
          offsetX: -0
        });
        break;

      case 'right-top':
        positions.push({
          originX: 'end',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0
        });
        break;

      case 'right-bottom':
        positions.push({
          originX: 'end',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetX: 0
        });
        break;

      case 'top-left':
        positions.push({
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetY: -0
        });
        break;

      case 'top-right':
        positions.push({
          originX: 'end',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'bottom',
          offsetY: -0
        });
        break;

      case 'bottom-left':
        positions.push({
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 0
        });
        break;

      case 'bottom-right':
        positions.push({
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: 0
        });
        break;
    }
    return positions;
  }
}
