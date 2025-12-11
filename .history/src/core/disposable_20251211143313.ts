/**
 * @fileoverview 用于资源管理的可释放基类
 * @module melange/core/disposable
 * @description 提供一个基类用于管理可释放资源
 * 包含适当的清理和生命周期管理。
 */

/**
 * 可释放对象的接口。
 * 实现此接口的对象可以被正确清理。
 */
export interface IDisposable {
  /**
   * 释放此对象持有的资源。
   */
  dispose(): void;

  /**
   * 此对象是否已被释放。
   */
  readonly isDisposed: boolean;
}

/**
 * 管理可释放资源的对象的抽象基类。
 *
 * @description
 * Disposable 类提供了一种管理模式，用于管理需要显式清理的资源。
 * 它跟踪释放状态并防止重复释放。
 *
 * @example
 * ```typescript
 * class DatabaseConnection extends Disposable {
 *   private connection: Connection;
 *
 *   constructor() {
 *     super();
 *     this.connection = createConnection();
 *     // 注册清理
 *     this.addDisposable({
 *       dispose: () => this.connection.close()
 *     });
 *   }
 *
 *   query(sql: string) {
 *     this.ensureNotDisposed();
 *     return this.connection.query(sql);
 *   }
 * }
 *
 * // 使用
 * const db = new DatabaseConnection();
 * try {
 *   await db.query('SELECT * FROM users');
 * } finally {
 *   db.dispose();
 * }
 * ```
 */
export abstract class Disposable implements IDisposable {
  /**
   * 此对象是否已被释放
   */
  private _isDisposed: boolean = false;

  /**
   * 待清理的可释放对象列表
   */
  private readonly disposables: IDisposable[] = [];

  /**
   * 获取此对象是否已被释放。
   */
  public get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * 释放此对象和所有已注册的可释放对象。
   * 多次调用 dispose 是安全的（后续调用无效）。
   */
  public dispose(): void {
    if (this._isDisposed) {
      return;
    }

    this._isDisposed = true;

    // 按相反顺序释放（后进先出）
    for (let i = this.disposables.length - 1; i >= 0; i--) {
      try {
        this.disposables[i]?.dispose();
      } catch (error) {
        // 记录日志但不抛出异常 - 继续释放其他资源
        // eslint-disable-next-line no-console
        console.error('Error during disposal:', error);
      }
    }

    this.disposables.length = 0;

    // 调用子类清理方法
    this.onDispose();
  }

  /**
   * 注册一个可释放对象，在此对象被释放时进行清理。
   *
   * @template T - 可释放对象类型
   * @param disposable - 要注册的可释放对象
   * @returns 相同的可释放对象，用于链式调用
   */
  protected addDisposable<T extends IDisposable>(disposable: T): T {
    if (this._isDisposed) {
      // 如果已经释放，则立即释放新的可释放对象
      disposable.dispose();
    } else {
      this.disposables.push(disposable);
    }
    return disposable;
  }

  /**
   * 注册一个清理函数，在此对象被释放时调用。
   *
   * @param fn - 清理函数
   */
  protected addDisposeFn(fn: () => void): void {
    this.addDisposable({ dispose: fn, isDisposed: false });
  }

  /**
   * 如果此对象已被释放则抛出错误。
   * 在不应在释放后调用的方法开头使用此函数。
   *
   * @throws Error 如果对象已被释放
   */
  protected ensureNotDisposed(): void {
    if (this._isDisposed) {
      throw new Error('Object has been disposed');
    }
  }

  /**
   * 在对象被释放时调用。
   * 在子类中重写以执行自定义清理。
   */
  protected onDispose(): void {
    // 默认实现不执行任何操作
  }
}

/**
 * 用于管理多个可释放对象的工具类。
 * 适用于收集应一起释放的可释放对象。
 *
 * @example
 * ```typescript
 * const disposables = new DisposableStore();
 *
 * // 添加各种可释放对象
 * disposables.add(eventListener1);
 * disposables.add(eventListener2);
 * disposables.add({ dispose: () => cleanupSomething() });
 *
 * // 一次性释放所有对象
 * disposables.dispose();
 * ```
 */
export class DisposableStore implements IDisposable {
  private readonly items: Set<IDisposable> = new Set();
  private _isDisposed: boolean = false;

  /**
   * 获取此存储是否已被释放。
   */
  public get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * 向存储中添加可释放对象。
   *
   * @template T - 可释放对象类型
   * @param disposable - 要添加的可释放对象
   * @returns 相同的可释放对象，用于链式调用
   */
  public add<T extends IDisposable>(disposable: T): T {
    if (this._isDisposed) {
      disposable.dispose();
    } else {
      this.items.add(disposable);
    }
    return disposable;
  }

  /**
   * 从存储中移除可释放对象而不释放它。
   *
   * @param disposable - 要移除的可释放对象
   */
  public delete(disposable: IDisposable): void {
    this.items.delete(disposable);
  }

  /**
   * 释放存储中的所有项目并清空存储。
   */
  public dispose(): void {
    if (this._isDisposed) {
      return;
    }

    this._isDisposed = true;

    for (const item of this.items) {
      try {
        item.dispose();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error during disposal:', error);
      }
    }

    this.items.clear();
  }

  /**
   * 释放所有项目但保持存储活跃以接收新项目。
   */
  public clear(): void {
    for (const item of this.items) {
      try {
        item.dispose();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error during disposal:', error);
      }
    }
    this.items.clear();
  }

  /**
   * 获取存储中的项目数量。
   */
  public get size(): number {
    return this.items.size;
  }
}

/**
 * 从清理函数创建可释放对象。
 *
 * @param dispose - 清理函数
 * @returns 可释放对象
 */
export function toDisposable(dispose: () => void): IDisposable {
  return {
    dispose,
    isDisposed: false,
  };
}

/**
 * 将多个可释放对象组合成单个可释放对象。
 *
 * @param disposables - 要组合的可释放对象
 * @returns 一次性释放所有对象的单个可释放对象
 */
export function combineDisposables(...disposables: IDisposable[]): IDisposable {
  return {
    dispose: () => {
      for (const d of disposables) {
        d.dispose();
      }
    },
    isDisposed: false,
  };
}
