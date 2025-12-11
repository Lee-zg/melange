/**
 * @fileoverview 用于函数式错误处理的 Result 类型
 * @module melange/fp/result
 * @description 提供 Result 类型和工具，用于处理可能成功或失败的操作，
 * 而无需抛出异常。
 */

import type { Result, Ok, Err, UnaryFunction } from '../types';

/**
 * 创建包含给定值的成功 Result。
 *
 * @example
 * ```typescript
 * const result = ok(42);
 * // { _tag: 'Ok', value: 42 }
 * ```
 *
 * @template T - 成功值的类型
 * @param value - 成功值
 * @returns 包含该值的 Ok Result
 */
export function ok<T>(value: T): Ok<T> {
  return { _tag: 'Ok', value };
}

/**
 * 创建包含给定错误的失败 Result。
 *
 * @example
 * ```typescript
 * const result = err(new Error('出错了'));
 * // { _tag: 'Err', error: Error('出错了') }
 * ```
 *
 * @template E - 错误的类型
 * @param error - 错误值
 * @returns 包含该错误的 Err Result
 */
export function err<E>(error: E): Err<E> {
  return { _tag: 'Err', error };
}

/**
 * 类型守卫，用于检查 Result 是否为 Ok。
 *
 * @example
 * ```typescript
 * const result = ok(42);
 * if (isOk(result)) {
 *   console.log(result.value); // 42
 * }
 * ```
 *
 * @template T - 成功类型
 * @template E - 错误类型
 * @param result - 要检查的 Result
 * @returns 如果 Result 是 Ok 则返回 true
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result._tag === 'Ok';
}

/**
 * 类型守卫，用于检查 Result 是否为 Err。
 *
 * @example
 * ```typescript
 * const result = err('error');
 * if (isErr(result)) {
 *   console.log(result.error); // 'error'
 * }
 * ```
 *
 * @template T - 成功类型
 * @template E - 错误类型
 * @param result - 要检查的 Result
 * @returns 如果 Result 是 Err 则返回 true
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result._tag === 'Err';
}

/**
 * 在 Result 的成功值上映射函数。
 * 如果 Result 是 Err，则错误将原样传递。
 *
 * @example
 * ```typescript
 * const result = ok(5);
 * const doubled = mapResult(result, x => x * 2);
 * // { _tag: 'Ok', value: 10 }
 *
 * const error = err('error');
 * const still = mapResult(error, x => x * 2);
 * // { _tag: 'Err', error: 'error' }
 * ```
 *
 * @template T - 原始成功类型
 * @template U - 映射后的成功类型
 * @template E - 错误类型
 * @param result - 要映射的 Result
 * @param fn - 要应用于成功值的函数
 * @returns 带有映射值的新 Result
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: UnaryFunction<T, U>
): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value));
  }
  return result;
}

/**
 * 在 Result 的成功值上映射返回 Result 的函数。
 * 在其他库中这也被称为 `chain` 或 `bind`。
 *
 * @example
 * ```typescript
 * const safeDivide = (a: number, b: number): Result<number, string> =>
 *   b === 0 ? err('除零错误') : ok(a / b);
 *
 * const result = ok(10);
 * const divided = flatMapResult(result, x => safeDivide(x, 2));
 * // { _tag: 'Ok', value: 5 }
 *
 * const divideByZero = flatMapResult(result, x => safeDivide(x, 0));
 * // { _tag: 'Err', error: '除零错误' }
 * ```
 *
 * @template T - 原始成功类型
 * @template U - 映射后的成功类型
 * @template E - 错误类型
 * @param result - 要 flatMap 的 Result
 * @param fn - 应用的返回 Result 的函数
 * @returns 展平后的 Result
 */
export function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: UnaryFunction<T, Result<U, E>>
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.value);
  }
  return result;
}

/**
 * 解包 Result，返回成功值或如果为 Err 则返回默认值。
 *
 * @example
 * ```typescript
 * const success = ok(42);
 * unwrapOr(success, 0); // 42
 *
 * const failure = err('error');
 * unwrapOr(failure, 0); // 0
 * ```
 *
 * @template T - 成功类型
 * @template E - 错误类型
 * @param result - 要解包的 Result
 * @param defaultValue - 如果为 Err 的默认值
 * @returns 成功值或默认值
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.value;
  }
  return defaultValue;
}

/**
 * 解包 Result，返回成功值或如果为 Err 则调用函数。
 *
 * @example
 * ```typescript
 * const success = ok(42);
 * unwrapOrElse(success, () => 0); // 42
 *
 * const failure = err('error');
 * unwrapOrElse(failure, () => 0); // 0
 * ```
 *
 * @template T - 成功类型
 * @template E - 错误类型
 * @param result - 要解包的 Result
 * @param fn - 如果为 Err 要调用的函数
 * @returns 成功值或函数的结果
 */
export function unwrapOrElse<T, E>(
  result: Result<T, E>,
  fn: UnaryFunction<E, T>
): T {
  if (isOk(result)) {
    return result.value;
  }
  return fn(result.error);
}

/**
 * 将 Result 与成功和错误处理程序匹配。
 *
 * @example
 * ```typescript
 * const result = ok(42);
 * const message = match(result, {
 *   ok: value => `得到 ${value}`,
 *   err: error => `错误: ${error}`
 * });
 * // "得到 42"
 * ```
 *
 * @template T - 成功类型
 * @template E - 错误类型
 * @template R - 返回类型
 * @param result - 要匹配的 Result
 * @param handlers - 带有 ok 和 err 处理程序的对象
 * @returns 匹配处理程序的结果
 */
export function matchResult<T, E, R>(
  result: Result<T, E>,
  handlers: { ok: UnaryFunction<T, R>; err: UnaryFunction<E, R> }
): R {
  if (isOk(result)) {
    return handlers.ok(result.value);
  }
  return handlers.err(result.error);
}

/**
 * 尝试执行函数并将结果包装在 Result 类型中。
 *
 * @example
 * ```typescript
 * const result = tryCatch(() => JSON.parse('{"a": 1}'));
 * // { _tag: 'Ok', value: { a: 1 } }
 *
 * const error = tryCatch(() => JSON.parse('invalid'));
 * // { _tag: 'Err', error: SyntaxError(...) }
 * ```
 *
 * @template T - 函数的返回类型
 * @param fn - 要执行的函数
 * @returns 包含返回值或错误的 Result
 */
export function tryCatch<T>(fn: () => T): Result<T, unknown> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error);
  }
}

/**
 * 尝试执行异步函数并将结果包装在 Result 类型中。
 *
 * @example
 * ```typescript
 * const result = await tryCatchAsync(async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * });
 * ```
 *
 * @template T - 异步函数的返回类型
 * @param fn - 要执行的异步函数
 * @returns 包含返回值或错误的 Result 的 Promise
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T, unknown>> {
  try {
    const result = await fn();
    return ok(result);
  } catch (error) {
    return err(error);
  }
}
