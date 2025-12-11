/**
 * @fileoverview 用于发布/订阅模式的事件发射器类
 * @module melange/core/events
 * @description 提供一个类型安全的事件发射器实现
 * 遵循观察者模式。
 */

import type { EventHandler, Subscription } from '../types';

/**
 * 类型安全的事件映射接口。
 * 扩展此接口以定义您的事件类型。
 *
 * @example
 * ```typescript
 * interface MyEvents {
 *   userLogin: { userId: string; timestamp: Date };
 *   userLogout: { userId: string };
 *   error: Error;
 * }
 *
 * const emitter = new EventEmitter<MyEvents>();
 * emitter.on('userLogin', event => console.log(event.userId));
 * ```
 */
export interface EventMap {
  [event: string]: unknown;
}

/**
 * 带有元数据的内部监听器条目。
 */
interface ListenerEntry<T> {
  handler: EventHandler<T>;
  once: boolean;
}

/**
 * 类型安全的事件发射器类。
 * 实现观察者模式以进行解耦的事件驱动编程。
 *
 * @description
 * EventEmitter 提供了一种订阅和发射事件的方式，具有完整的
 * TypeScript 类型安全性。它支持一次性监听器、监听器移除
 * 和适当的清理。
 *
 * @template Events - 定义事件名称和载荷类型的事件映射类型
 *
 * @example
 * ```typescript
 * interface AppEvents {
 *   'user:created': { id: string; name: string };
 *   'user:deleted': { id: string };
 *   'error': Error;
 * }
 *
 * const events = new EventEmitter<AppEvents>();
 *
 * // 订阅事件
 * events.on('user:created', user => {
 *   console.log(`创建用户: ${user.name}`);
 * });
 *
 * // 发射事件
 * events.emit('user:created', { id: '1', name: 'John' });
 *
 * // 一次性监听器
 * events.once('error', err => console.error(err));
 *
 * // 取消订阅
 * const subscription = events.on('user:deleted', handleDelete);
 * subscription.unsubscribe();
 * ```
 */
export class EventEmitter<Events extends EventMap = EventMap> {
  /**
   * 事件名称到其监听器的映射
   */
  private listeners: Map<keyof Events, ListenerEntry<unknown>[]> = new Map();

  /**
   * 订阅事件。
   *
   * @param event - 要订阅的事件名称
   * @param handler - 事件发射时要调用的处理函数
   * @returns 带有取消订阅方法的订阅对象
   */
  public on<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>
  ): Subscription {
    return this.addListener(event, handler, false);
  }

  /**
   * 仅订阅事件的一次发射。
   * 监听器在被调用一次后自动移除。
   *
   * @param event - 要订阅的事件名称
   * @param handler - 事件发射时要调用的处理函数
   * @returns 带有取消订阅方法的订阅对象
   */
  public once<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>
  ): Subscription {
    return this.addListener(event, handler, true);
  }

  /**
   * 从事件中移除特定监听器。
   *
   * @param event - 事件名称
   * @param handler - 要移除的处理函数
   */
  public off<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.findIndex(entry => entry.handler === handler);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * 发射带有给定载荷的事件。
   * 所有订阅的监听器将同步调用。
   *
   * @param event - 要发射的事件名称
   * @param payload - 事件载荷
   */
  public emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    // 创建副本以避免监听器修改数组时出现问题
    const listenersCopy = [...eventListeners];

    for (const entry of listenersCopy) {
      entry.handler(payload);

      if (entry.once) {
        this.off(event, entry.handler as EventHandler<Events[K]>);
      }
    }
  }

  /**
   * 移除特定事件的所有监听器，或如果不指定事件则移除所有监听器。
   *
   * @param event - 可选的事件名称，用于清除监听器
   */
  public removeAllListeners<K extends keyof Events>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * 返回特定事件的监听器数量。
   *
   * @param event - 事件名称
   * @returns 监听器数量
   */
  public listenerCount<K extends keyof Events>(event: K): number {
    const eventListeners = this.listeners.get(event);
    return eventListeners?.length ?? 0;
  }

  /**
   * 返回所有具有监听器的事件名称。
   *
   * @returns 事件名称数组
   */
  public eventNames(): Array<keyof Events> {
    return Array.from(this.listeners.keys());
  }

  /**
   * 添加监听器的内部方法。
   */
  private addListener<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>,
    once: boolean
  ): Subscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const entry: ListenerEntry<Events[K]> = { handler, once };
    this.listeners.get(event)!.push(entry as ListenerEntry<unknown>);

    return {
      unsubscribe: () => this.off(event, handler),
    };
  }
}
