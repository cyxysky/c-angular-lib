import { CdkOverlayOrigin, ConnectedOverlayPositionChange, ConnectedPosition, FlexibleConnectedPositionStrategy, Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ElementRef, Injectable, TemplateRef, ViewContainerRef } from '@angular/core';
import { OverlayBasicPositionConfigs } from '../overlay/overlay-basic.directive';

@Injectable({
  providedIn: 'root'
})
export class OverlayService {

  constructor(
    public overlay: Overlay,
  ) { }

  /**
   * 创建一个overlay并监听位置变化
   * @param configs 配置
   * @param elementRef 元素引用
   * @param position 位置
   * @param closeModal 关闭回调
   * @param positionCallback 位置变化回调
   * @returns overlayRef
   */
  createOverlay(
    configs: OverlayConfig, 
    elementRef: ElementRef | Element | any, 
    position: ConnectedPosition[], 
    closeModal: (overlayRef: OverlayRef, event: Event) => void,
    positionCallback?: (position: ConnectedPosition, isBackupUsed: boolean) => void
  ): OverlayRef {
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
    
    // 监听位置变化
    if (positionCallback) {
      const strategy = overlayRef.getConfig().positionStrategy as FlexibleConnectedPositionStrategy;
      strategy.positionChanges.subscribe((positionChange: ConnectedOverlayPositionChange) => {
        // 判断使用的是主位置还是备用位置
        const currentPositionIndex = positionChange.connectionPair ? 
          position.findIndex(p => 
            p.originX === positionChange.connectionPair.originX &&
            p.originY === positionChange.connectionPair.originY &&
            p.overlayX === positionChange.connectionPair.overlayX &&
            p.overlayY === positionChange.connectionPair.overlayY
          ) : -1;
          
        const isBackupPosition = currentPositionIndex > 0; // 索引0是主位置，其他是备用位置
        positionCallback(positionChange.connectionPair, isBackupPosition);
      });
    }
    
    // 点击背景，关闭浮层
    overlayRef.outsidePointerEvents().subscribe((event) => {
      closeModal(overlayRef, event);
    });
    
    return overlayRef;
  }

  attachTemplate(overlayRef: OverlayRef, overlayTemplate: TemplateRef<any>, viewContainerRef: ViewContainerRef) {
    overlayRef.attach(new TemplatePortal(overlayTemplate, viewContainerRef));
  }

  public getPositions(placement: string): ConnectedPosition[] {
    const positions: ConnectedPosition[] = [];
    // 添加主位置
    if (OverlayBasicPositionConfigs[placement]) {
      positions.push(OverlayBasicPositionConfigs[placement]);
    }
    // 确定备用位置策略
    const mainDirections = ['top', 'bottom', 'left', 'right'];
    let backupDirections = [];
    backupDirections = mainDirections.filter(dir => !placement.includes(dir));
    backupDirections.forEach(dir => {
      if (OverlayBasicPositionConfigs[dir]) {
        positions.push(OverlayBasicPositionConfigs[dir]);
      }
    });
    // 对于复合方向（如 'top-left'），还需添加相关的复合备用位置
    if (placement.includes('-')) {
      const parts = placement.split('-');
      // 如果有第二部分（如 'top-left' 中的 'left'）
      if (parts[1]) {
        // 添加与第二部分相关的复合备用位置
        backupDirections.forEach(dir => {
          const backupCompound = `${dir}-${parts[1]}`;
          if (OverlayBasicPositionConfigs[backupCompound]) {
            positions.push(OverlayBasicPositionConfigs[backupCompound]);
          }
        });
      }
    }
    return positions;
  }

  /**
   * 异步更新浮层位置
   * @param overlayRef 浮层引用
   * @param time 延迟时间
   */
  public asyncUpdateOverlayPosition(overlayRef: OverlayRef | null, time: number = 10  ) {
    let timer = setTimeout(() => {
      overlayRef && overlayRef.updatePosition();
      clearTimeout(timer);
    }, time);
  }
}
