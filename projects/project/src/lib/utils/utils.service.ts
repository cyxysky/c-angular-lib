import { Component, Injectable, Type } from '@angular/core';
import { TemplateRef } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  /**
   * 使用防抖函数包装异步函数
   * @param fn 需要防抖的函数
   * @param delay 延迟时间（毫秒）
   * @returns 包装后的防抖函数，返回 Promise
   */
  debounce<T>(fn: (...args: any[]) => Promise<T>, delay: number = 300): (...args: any[]) => Promise<T> {
    let timeout: any = null;
    let requestId: number = 0;
    return function(...args: any[]): Promise<T> {
      return new Promise((resolve, reject) => {
        if (timeout) {
          clearTimeout(timeout);
        }
        const currentRequestId = ++requestId;
        timeout = setTimeout(() => {
          fn(...args)
            .then((result: T) => {
              if (currentRequestId === requestId) {
                resolve(result);
              }
            })
            .catch((error) => {
              if (currentRequestId === requestId) {
                reject(error);
              }
            });
        }, delay);
      });
    };
  }
  
  /**
   * 创建记忆化函数，用于缓存相同输入的计算结果
   * @param fn 需要记忆化的函数
   * @returns 记忆化后的函数
   */
  memoize<T>(fn: (...args: any[]) => T): (...args: any[]) => T {
    const cache = new Map();
    
    return function(...args: any[]): T {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  }
  
  /**
   * 获取对象的所有键
   * @param obj 任意对象
   * @returns 对象的键数组
   */
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
  
  /**
   * 通用的追踪函数，用于 ngFor 的 trackBy
   * @param index 索引
   * @param item 项目
   * @returns 追踪标识符
   */
  trackByFn(index: number, item: any): any {
    return index;
  }
  
  /**
   * 延迟执行函数
   * @param callback 回调函数
   * @param delay 延迟时间（毫秒）
   * @returns 定时器标识符
   */
  delayExecution(callback: () => void, delay: number = 10): any {
    return setTimeout(() => {
      callback();
    }, delay);
  }

  /**
   * 判断是否为 TemplateRef 类型
   * @param value 需要判断的值
   * @returns 是否为 TemplateRef 类型
   */
  isTemplateRef(value: any): boolean {
    return value instanceof TemplateRef;
  }

  /**
   * 通用遍历函数，用于对所有节点执行操作
   * @param nodes 节点
   * @param callback 回调函数
   */
  public traverseAllNodes(nodes: any[], callback: (node: any) => void): void {
    nodes && nodes.length && nodes.forEach(node => {
      callback(node);
      if (node.children && node.children.length) {
        this.traverseAllNodes(node.children, callback);
      }
    });
  }

  /**
   * 获取节点的所有父节点
   * @param node 节点
   * @param AllNodes 所有节点
   * @returns 父节点
   */
  private getParentNodes(node: any, AllNodes: any[]): any[] {
    const parents: any[] = [];
    const findParents = (nodes: any[], targetKey: string): boolean => {
      for (const current of nodes) {
        if (current.key === targetKey) {
          return true;
        }
        if (current.children) {
          if (findParents(current.children, targetKey)) {
            parents.unshift(current);
            return true;
          }
        }
      }
      return false;
    };
    findParents(AllNodes, node.key);
    return parents;
  }


  /**
   * 生成随机id
   */
  public getRandomId(): string {
    return `node_${new Date().getTime().toString().substring(5)}${Math.round(Math.random() * 9000 + 1000)}`;
  }

  /**
   * 生成UUID
   */
  public getUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  /**
   * 判断是否为组件
   * @param value 需要判断的值
   * @returns 是否为组件
   */
  isComponent(value: any): boolean {
    return value instanceof Type;
  }

  /**
   * 判断是否为模板
   * @param value 需要判断的值
   * @returns 是否为模板
   */
  isTemplate(value: any): boolean {
    return value instanceof TemplateRef;
  }
}