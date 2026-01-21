/**
 * @fileoverview 高阶函数和工具
 * @module melange/fp/hof
 * @description 提供高阶函数用于记忆化、函数控制
 * 和其他函数式编程工具。
 */

import type { AnyFunction } from '../types';

/**
 * 创建函数的记忆化版本。
 * 记忆化函数根据提供的参数缓存结果。
 *
 * @description
 * 记忆化是一种优化技术，存储昂贵函数调用的结果，
 * 当相同输入再次出现时返回缓存结果。
 *
 * @example
 * ```typescript
 * const expensiveCalculation = (n: number) => {
 *   console.log('计算中...');
 *   return n * n;
 * };
 *
 * const memoized = memoize(expensiveCalculation);
 * memoized(5); // 记录 '计算中...', 返回 25
 * memoized(5); // 从缓存返回 25, 无记录
 * memoized(3); // 记录 '计算中...', 返回 9
 * ```
 *
 * @template T - 函数类型
 * @param fn - 要记忆化的函数
 * @param keyFn - 生成缓存键的可选函数
 * @returns 函数的记忆化版本
 */
export function memoize<T extends AnyFunction>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * 创建只能调用一次的函数。
 * 后续调用返回第一次调用的结果。
 *
 * @example
 * ```typescript
 * const initialize = once(() => {
 *   console.log('初始化中...');
 *   return { initialized: true };
 * });
 *
 * initialize(); // 记录 '初始化中...', 返回 { initialized: true }
 * initialize(); // 返回 { initialized: true }, 无记录
 * ```
 *
 * @template T - 函数类型
 * @param fn - 要包装的函数
 * @returns 只能调用一次的函数
 */
export function once<T extends AnyFunction>(fn: T): T {
  let called = false;
  let result: ReturnType<T>;

  return ((...args: Parameters<T>): ReturnType<T> => {
    if (!called) {
      called = true;
      result = fn(...args) as ReturnType<T>;
    }
    return result;
  }) as T;
}

/**
 * 创建调用原始函数然后执行副作用的函数，返回原始结果。
 *
 * @description
 * Tap 适用于在管道中调试或记录日志
 * 而不影响数据流。
 *
 * @example
 * ```typescript
 * const addOne = (x: number) => x + 1;
 * const logValue = tap((x: number) => console.log('值:', x));
 *
 * pipe(
 *   5,
 *   addOne,
 *   logValue, // 记录 '值: 6', 返回 6
 *   x => x * 2
 * ); // 返回 12
 * ```
 *
 * @template T - 值类型
 * @param effect - 要执行的副作用函数
 * @returns 执行副作用并返回输入的函数
 */
export function tap<T>(effect: (value: T) => void): (value: T) => T {
  return (value: T): T => {
    effect(value);
    return value;
  };
}

/**
 * 返回传入的值而不改变。
 * 恒等函数作为默认转换器很有用。
 *
 * @example
 * ```typescript
 * identity(42);     // 42
 * identity('hello'); // 'hello'
 * [1, 2, 3].map(identity); // [1, 2, 3]
 * ```
 *
 * @template T - 值类型
 * @param value - 要返回的值
 * @returns 相同的值
 */
export function identity<T>(value: T): T {
  return value;
}

/**
 * 创建总是返回相同值的函数。
 * 适用于创建占位符函数。
 *
 * @example
 * ```typescript
 * const alwaysFive = constant(5);
 * alwaysFive();  // 5
 * alwaysFive(100); // 5
 *
 * [1, 2, 3].map(constant('x')); // ['x', 'x', 'x']
 * ```
 *
 * @template T - 值类型
 * @param value - 总是返回的值
 * @returns 总是返回值的函数
 */
export function constant<T>(value: T): () => T {
  return () => value;
}

/**
 * 不执行任何操作并返回 undefined 的函数。
 * 适合作为默认回调或占位符。
 *
 * @example
 * ```typescript
 * const callback = maybeCallback || noop;
 * callback();
 * ```
 */
export function noop(): void {
  // 故意为空
}

/**
 * 否定谓词函数。
 *
 * @example
 * ```typescript
 * const isEven = (n: number) => n % 2 === 0;
 * const isOdd = not(isEven);
 *
 * isOdd(3); // true
 * isOdd(4); // false
 * ```
 *
 * @template T - 参数类型
 * @param predicate - 要否定的谓词
 * @returns 否定的谓词
 */
export function not<T>(predicate: (value: T) => boolean): (value: T) => boolean {
  return (value: T) => !predicate(value);
}

/**
 * 创建当所有谓词都返回 true 时返回 true 的函数。
 *
 * @example
 * ```typescript
 * const isPositive = (n: number) => n > 0;
 * const isEven = (n: number) => n % 2 === 0;
 * const isPositiveEven = allPass([isPositive, isEven]);
 *
 * isPositiveEven(4);  // true
 * isPositiveEven(-4); // false
 * isPositiveEven(3);  // false
 * ```
 *
 * @template T - 参数类型
 * @param predicates - 要检查的谓词数组
 * @returns 当所有谓词都通过时返回 true 的函数
 */
export function allPass<T>(predicates: Array<(value: T) => boolean>): (value: T) => boolean {
  return (value: T) => predicates.every(predicate => predicate(value));
}

/**
 * 创建当任何谓词返回 true 时返回 true 的函数。
 *
 * @example
 * ```typescript
 * const isZero = (n: number) => n === 0;
 * const isNegative = (n: number) => n < 0;
 * const isNotPositive = anyPass([isZero, isNegative]);
 *
 * isNotPositive(0);  // true
 * isNotPositive(-1); // true
 * isNotPositive(1);  // false
 * ```
 *
 * @template T - 参数类型
 * @param predicates - 要检查的谓词数组
 * @returns 当任何谓词通过时返回 true 的函数
 */
export function anyPass<T>(predicates: Array<(value: T) => boolean>): (value: T) => boolean {
  return (value: T) => predicates.some(predicate => predicate(value));
}

/**
 * 翻转二元函数的参数。
 *
 * @example
 * ```typescript
 * const divide = (a: number, b: number) => a / b;
 * const flippedDivide = flip(divide);
 *
 * divide(10, 2);       // 5
 * flippedDivide(10, 2); // 0.2
 * ```
 *
 * @template A - 第一个参数类型
 * @template B - 第二个参数类型
 * @template R - 返回类型
 * @param fn - 要翻转的函数
 * @returns 参数翻转后的函数
 */
export function flip<A, B, R>(fn: (a: A, b: B) => R): (b: B, a: A) => R {
  return (b: B, a: A) => fn(a, b);
}

/**
 * 将值应用到函数。
 * 适用于无点编程。
 *
 * @example
 * ```typescript
 * const addOne = (x: number) => x + 1;
 * apply(5, addOne); // 6
 *
 * const funcs = [x => x + 1, x => x * 2];
 * funcs.map(f => apply(5, f)); // [6, 10]
 * ```
 *
 * @template T - 值类型
 * @template R - 返回类型
 * @param value - 要应用的值
 * @param fn - 要应用的函数
 * @returns 将值应用到函数的结果
 */
export function apply<T, R>(value: T, fn: (value: T) => R): R {
  return fn(value);
}

/**
 * 从值创建 thunk（延迟计算）。
 *
 * @example
 * ```typescript
 * const lazyValue = thunk(expensiveComputation);
 * // ... 稍后
 * const result = lazyValue(); // 计算在此处发生
 * ```
 *
 * @template T - 返回类型
 * @param fn - 要延迟的函数
 * @returns 调用时执行函数的 thunk
 */
export function thunk<T>(fn: () => T): () => T {
  return fn;
}

/**
 * 反转布尔值。
 *
 * @example
 * ```typescript
 * invert(true);  // false
 * invert(false); // true
 * ```
 *
 * @param value - 要反转的布尔值
 * @returns 反转后的布尔值
 */
export function invert(value: boolean): boolean {
  return !value;
}
