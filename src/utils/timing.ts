/**
 * @fileoverview 计时和速率限制工具
 * @module melange/utils/timing
 * @description 提供防抖、节流、延迟、
 * 重试和超时处理的工具。
 */

import type { AnyFunction } from '../types';

/**
 * 创建函数的防抖版本。
 * 防抖函数会延迟调用，直到自上次调用防抖函数以来经过了 `wait` 毫秒。
 *
 * @description
 * 防抖对于限制用户输入事件（如在搜索框中打字）的速率很有用，
 * 您希望等到用户停止打字后再进行 API 调用。
 *
 * @example
 * ```typescript
 * const search = debounce((query: string) => {
 *   console.log('搜索中:', query);
 * }, 300);
 *
 * search('h');
 * search('he');
 * search('hel');
 * search('hell');
 * search('hello');
 * // 只在 300ms 无调用后记录 '搜索中: hello'
 * ```
 *
 * @template T - 函数类型
 * @param fn - 要防抖的函数
 * @param wait - 等待的毫秒数
 * @param options - 可选配置
 * @returns 函数的防抖版本
 */
export function debounce<T extends AnyFunction>(
  fn: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean }
): T & { cancel: () => void; flush: () => void } {
  const { leading = false, trailing = true } = options ?? {};
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let result: ReturnType<T>;

  function invokeFunc(): void {
    if (lastArgs !== null) {
      result = fn.apply(lastThis, lastArgs) as ReturnType<T>;
      lastArgs = null;
      lastThis = null;
    }
  }

  function debounced(this: unknown, ...args: Parameters<T>): ReturnType<T> {
    lastArgs = args;
    lastThis = this;

    if (leading && timeoutId === null) {
      invokeFunc();
    }

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (trailing) {
        invokeFunc();
      }
      timeoutId = null;
    }, wait);

    return result;
  }

  debounced.cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      if (trailing) {
        invokeFunc();
      }
    }
  };

  return debounced as T & { cancel: () => void; flush: () => void };
}

/**
 * 创建函数的节流版本。
 * 节流函数每 `limit` 毫秒最多调用一次。
 *
 * @description
 * 节流对于限制频繁触发的事件（如滚动或调整大小事件）的速率很有用，
 * 您希望确保处理程序以一致的速率运行。
 *
 * @example
 * ```typescript
 * const onScroll = throttle(() => {
 *   console.log('滚动位置:', window.scrollY);
 * }, 100);
 *
 * window.addEventListener('scroll', onScroll);
 * // 滚动期间最多每 100ms 记录一次
 * ```
 *
 * @template T - 函数类型
 * @param fn - 要节流的函数
 * @param limit - 调用之间的最小时间
 * @returns 函数的节流版本
 */
export function throttle<T extends AnyFunction>(
  fn: T,
  limit: number
): T & { cancel: () => void } {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;

  function throttled(this: unknown, ...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      return fn.apply(this, args) as ReturnType<T>;
    }

    if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        if (lastArgs !== null) {
          fn.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, remaining);
    }

    return undefined;
  }

  throttled.cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  return throttled as T & { cancel: () => void };
}

/**
 * 创建在指定延迟后解决的承诺。
 *
 * @example
 * ```typescript
 * console.log('开始');
 * await delay(1000);
 * console.log('1秒后');
 *
 * // 带值
 * const result = await delay(1000, 'hello');
 * console.log(result); // 'hello'
 * ```
 *
 * @template T - 值类型
 * @param ms - 延迟毫秒数
 * @param value - 解决时的可选值
 * @returns 在延迟后解决的承诺
 */
export function delay<T = void>(ms: number, value?: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value as T), ms));
}

/**
 * 重试异步函数直到成功或达到最大重试次数。
 *
 * @example
 * ```typescript
 * const result = await retry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   {
 *     maxRetries: 3,
 *     delay: 1000,
 *     backoff: 'exponential'
 *   }
 * );
 * ```
 *
 * @template T - 返回类型
 * @param fn - 要重试的异步函数
 * @param options - 重试选项
 * @returns 函数的结果
 * @throws 如果所有重试都失败，则抛出最后一个错误
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    delay?: number;
    backoff?: 'none' | 'linear' | 'exponential';
    onRetry?: (error: unknown, attempt: number) => void;
  }
): Promise<T> {
  const {
    maxRetries = 3,
    delay: retryDelay = 1000,
    backoff = 'none',
    onRetry,
  } = options ?? {};

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        onRetry?.(error, attempt + 1);

        let waitTime = retryDelay;
        if (backoff === 'linear') {
          waitTime = retryDelay * (attempt + 1);
        } else if (backoff === 'exponential') {
          waitTime = retryDelay * Math.pow(2, attempt);
        }

        await delay(waitTime);
      }
    }
  }

  throw lastError;
}

/**
 * 用超时包装承诺。
 *
 * @example
 * ```typescript
 * try {
 *   const result = await timeout(fetch('/api/data'), 5000);
 * } catch (error) {
 *   if (error.message.includes('timed out')) {
 *     console.log('请求耗时太长');
 *   }
 * }
 * ```
 *
 * @template T - 承诺结果类型
 * @param promise - 要包装的承诺
 * @param ms - 超时毫秒数
 * @param errorMessage - 可选的自定义错误消息
 * @returns 如果超过超时时间则拒绝的承诺
 */
export function timeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage?: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage ?? `Operation timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * 创建可以从外部解决或拒绝的延迟承诺。
 *
 * @example
 * ```typescript
 * const deferred = createDeferred<string>();
 *
 * setTimeout(() => {
 *   deferred.resolve('Hello!');
 * }, 1000);
 *
 * const result = await deferred.promise; // 'Hello!'
 * ```
 *
 * @template T - 承诺结果类型
 * @returns 带有 promise、resolve 和 reject 的延迟对象
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * 以并发限制运行多个异步函数。
 *
 * @example
 * ```typescript
 * const urls = ['url1', 'url2', 'url3', 'url4', 'url5'];
 *
 * const results = await parallel(
 *   urls.map(url => () => fetch(url)),
 *   { concurrency: 2 }
 * );
 * ```
 *
 * @template T - 结果类型
 * @param tasks - 异步任务函数数组
 * @param options - 配置选项
 * @returns 结果数组
 */
export async function parallel<T>(
  tasks: Array<() => Promise<T>>,
  options?: { concurrency?: number }
): Promise<T[]> {
  const { concurrency = Infinity } = options ?? {};
  const results: T[] = new Array(tasks.length);
  let currentIndex = 0;

  async function runNext(): Promise<void> {
    while (currentIndex < tasks.length) {
      const index = currentIndex++;
      const task = tasks[index];
      if (task) {
        results[index] = await task();
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => runNext()
  );

  await Promise.all(workers);
  return results;
}

/**
 * 顺序运行任务，一个接一个。
 *
 * @example
 * ```typescript
 * const results = await sequence([
 *   () => fetch('/api/step1'),
 *   () => fetch('/api/step2'),
 *   () => fetch('/api/step3'),
 * ]);
 * ```
 *
 * @template T - 结果类型
 * @param tasks - 异步任务函数数组
 * @returns 结果数组
 */
export async function sequence<T>(
  tasks: Array<() => Promise<T>>
): Promise<T[]> {
  const results: T[] = [];

  for (const task of tasks) {
    results.push(await task());
  }

  return results;
}
