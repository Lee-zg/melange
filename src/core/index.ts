/**
 * @fileoverview 核心面向对象模块入口点
 * @module melange/core
 * @description 导出面向对象工具，包括事件发射器、依赖注入、
 * 装饰器和资源管理类。
 */

// ============================================================================
// 事件系统
// ============================================================================

export { EventEmitter } from './events';
export type { EventMap } from './events';

// ============================================================================
// 依赖注入
// ============================================================================

export { Container, globalContainer, Lifecycle, Injectable, Inject, Singleton } from './container';

export type { Token, Factory } from './container';

// ============================================================================
// 装饰器
// ============================================================================

export {
  Memoize,
  Debounce,
  Throttle,
  Log,
  Validate,
  Deprecated,
  Sealed,
  Frozen,
  Bind,
  Retry,
  Timeout,
} from './decorators';

// ============================================================================
// 资源管理
// ============================================================================

export { Disposable, DisposableStore, toDisposable, combineDisposables } from './disposable';

export type { IDisposable } from './disposable';
