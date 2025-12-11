/**
 * @fileoverview 用于可空值处理的 Option 类型
 * @module melange/fp/option
 * @description 提供 Option 类型和工具，用于处理可能存在或不存在的值，
 * 而不直接使用 null/undefined。
 */

import type { Option, Some, None, UnaryFunction } from '../types';

/**
 * 创建包含给定值的 Some Option。
 *
 * @example
 * ```typescript
 * const option = some(42);
 * // { _tag: 'Some', value: 42 }
 * ```
 *
 * @template T - 值的类型
 * @param value - 要包装的值
 * @returns 包含该值的 Some Option
 */
export function some<T>(value: T): Some<T> {
  return { _tag: 'Some', value };
}

/**
 * 创建表示缺失值的 None Option。
 *
 * @example
 * ```typescript
 * const option = none();
 * // { _tag: 'None' }
 * ```
 *
 * @returns None Option
 */
export function none(): None {
  return { _tag: 'None' };
}

/**
 * 类型守卫，用于检查 Option 是否为 Some。
 *
 * @example
 * ```typescript
 * const option = some(42);
 * if (isSome(option)) {
 *   console.log(option.value); // 42
 * }
 * ```
 *
 * @template T - 值的类型
 * @param option - 要检查的 Option
 * @returns 如果 Option 是 Some 则返回 true
 */
export function isSome<T>(option: Option<T>): option is Some<T> {
  return option._tag === 'Some';
}

/**
 * 类型守卫，用于检查 Option 是否为 None。
 *
 * @example
 * ```typescript
 * const option = none();
 * if (isNone(option)) {
 *   console.log('无值');
 * }
 * ```
 *
 * @template T - 值的类型
 * @param option - 要检查的 Option
 * @returns 如果 Option 是 None 则返回 true
 */
export function isNone<T>(option: Option<T>): option is None {
  return option._tag === 'None';
}

/**
 * 从可空值创建 Option。
 * 如果值为 null 或 undefined，返回 None；否则返回 Some。
 *
 * @example
 * ```typescript
 * fromNullable(42);       // Some(42)
 * fromNullable(null);     // None
 * fromNullable(undefined);// None
 * ```
 *
 * @template T - 值的类型
 * @param value - 可空值
 * @returns 包装该值的 Option
 */
export function fromNullable<T>(value: T | null | undefined): Option<T> {
  return value == null ? none() : some(value);
}

/**
 * 在 Option 的值上映射函数。
 * 如果 Option 是 None，则原样返回 None。
 *
 * @example
 * ```typescript
 * const option = some(5);
 * const doubled = mapOption(option, x => x * 2);
 * // Some(10)
 *
 * const empty = none();
 * const still = mapOption(empty, x => x * 2);
 * // None
 * ```
 *
 * @template T - 原始值类型
 * @template U - 映射后的值类型
 * @param option - 要映射的 Option
 * @param fn - 要应用于值的函数
 * @returns 带有映射值的新 Option
 */
export function mapOption<T, U>(
  option: Option<T>,
  fn: UnaryFunction<T, U>
): Option<U> {
  if (isSome(option)) {
    return some(fn(option.value));
  }
  return option;
}

/**
 * 在 Option 的值上映射返回 Option 的函数。
 * 在其他库中这也被称为 `chain` 或 `bind`。
 *
 * @example
 * ```typescript
 * const safeDivide = (n: number): Option<number> =>
 *   n === 0 ? none() : some(100 / n);
 *
 * const option = some(10);
 * const divided = flatMapOption(option, safeDivide);
 * // Some(10)
 *
 * const zero = some(0);
 * const divideByZero = flatMapOption(zero, safeDivide);
 * // None
 * ```
 *
 * @template T - 原始值类型
 * @template U - 映射后的值类型
 * @param option - 要 flatMap 的 Option
 * @param fn - 应用的返回 Option 的函数
 * @returns 展平后的 Option
 */
export function flatMapOption<T, U>(
  option: Option<T>,
  fn: UnaryFunction<T, Option<U>>
): Option<U> {
  if (isSome(option)) {
    return fn(option.value);
  }
  return option;
}

/**
 * 从 Option 获取值，如果为 None 则返回默认值。
 *
 * @example
 * ```typescript
 * const present = some(42);
 * getOrElse(present, 0); // 42
 *
 * const absent = none();
 * getOrElse(absent, 0); // 0
 * ```
 *
 * @template T - 值的类型
 * @param option - 要解包的 Option
 * @param defaultValue - 如果为 None 的默认值
 * @returns 值或默认值
 */
export function getOrElse<T>(option: Option<T>, defaultValue: T): T {
  if (isSome(option)) {
    return option.value;
  }
  return defaultValue;
}

/**
 * 从 Option 获取值，如果为 None 则调用函数。
 *
 * @example
 * ```typescript
 * const present = some(42);
 * getOrElseL(present, () => 0); // 42
 *
 * const absent = none();
 * getOrElseL(absent, () => computeDefault()); // computeDefault() 的结果
 * ```
 *
 * @template T - 值的类型
 * @param option - 要解包的 Option
 * @param fn - 如果为 None 要调用的函数
 * @returns 值或函数的结果
 */
export function getOrElseL<T>(option: Option<T>, fn: () => T): T {
  if (isSome(option)) {
    return option.value;
  }
  return fn();
}

/**
 * 将 Option 与 Some 和 None 处理程序匹配。
 *
 * @example
 * ```typescript
 * const option = some(42);
 * const message = matchOption(option, {
 *   some: value => `得到 ${value}`,
 *   none: () => '无'
 * });
 * // "得到 42"
 * ```
 *
 * @template T - 值的类型
 * @template R - 返回类型
 * @param option - 要匹配的 Option
 * @param handlers - 带有 some 和 none 处理程序的对象
 * @returns 匹配处理程序的结果
 */
export function matchOption<T, R>(
  option: Option<T>,
  handlers: { some: UnaryFunction<T, R>; none: () => R }
): R {
  if (isSome(option)) {
    return handlers.some(option.value);
  }
  return handlers.none();
}

/**
 * 将 Option 转换为可空值。
 *
 * @example
 * ```typescript
 * toNullable(some(42)); // 42
 * toNullable(none());   // null
 * ```
 *
 * @template T - 值的类型
 * @param option - 要转换的 Option
 * @returns 值或 null
 */
export function toNullable<T>(option: Option<T>): T | null {
  if (isSome(option)) {
    return option.value;
  }
  return null;
}

/**
 * 基于谓词过滤 Option。
 * 如果 Option 是 Some 且谓词返回 false，则返回 None。
 *
 * @example
 * ```typescript
 * const option = some(10);
 * filter(option, x => x > 5);  // Some(10)
 * filter(option, x => x > 15); // None
 * ```
 *
 * @template T - 值的类型
 * @param option - 要过滤的 Option
 * @param predicate - 谓词函数
 * @returns 如果谓词通过则返回 Option，否则返回 None
 */
export function filterOption<T>(
  option: Option<T>,
  predicate: (value: T) => boolean
): Option<T> {
  if (isSome(option) && predicate(option.value)) {
    return option;
  }
  return none();
}

/**
 * 返回第一个为 Some 的 Option，如果都是 None 则返回 None。
 *
 * @example
 * ```typescript
 * alt(none(), some(42)); // Some(42)
 * alt(some(1), some(2)); // Some(1)
 * alt(none(), none());   // None
 * ```
 *
 * @template T - 值的类型
 * @param first - 第一个 Option
 * @param second - 第二个 Option
 * @returns 第一个 Some Option，或 None
 */
export function alt<T>(first: Option<T>, second: Option<T>): Option<T> {
  return isSome(first) ? first : second;
}
