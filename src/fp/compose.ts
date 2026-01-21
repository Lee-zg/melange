/**
 * @fileoverview 函数组合工具
 * @module melange/fp/compose
 * @description 提供组合和连接函数的工具，
 * 实现无点风格编程和函数链式调用。
 */

import type { UnaryFunction } from '../types';

/**
 * 从右到左组合多个函数。
 * 最右边的函数可以接受多个参数，其他所有函数必须是一元的。
 *
 * @description
 * 函数组合是函数式编程中的基本概念。
 * `compose(f, g, h)(x)` 等价于 `f(g(h(x)))`。
 *
 * @example
 * ```typescript
 * const addOne = (x: number) => x + 1;
 * const double = (x: number) => x * 2;
 * const square = (x: number) => x * x;
 *
 * const composed = compose(square, double, addOne);
 * composed(2); // ((2 + 1) * 2)² = 36
 * ```
 *
 * @param fns - 要组合的函数
 * @returns 一个新函数，从右到左应用所有函数
 */
export function compose<A, B>(fn1: UnaryFunction<A, B>): UnaryFunction<A, B>;
export function compose<A, B, C>(
  fn2: UnaryFunction<B, C>,
  fn1: UnaryFunction<A, B>
): UnaryFunction<A, C>;
export function compose<A, B, C, D>(
  fn3: UnaryFunction<C, D>,
  fn2: UnaryFunction<B, C>,
  fn1: UnaryFunction<A, B>
): UnaryFunction<A, D>;
export function compose<A, B, C, D, E>(
  fn4: UnaryFunction<D, E>,
  fn3: UnaryFunction<C, D>,
  fn2: UnaryFunction<B, C>,
  fn1: UnaryFunction<A, B>
): UnaryFunction<A, E>;
export function compose<A, B, C, D, E, F>(
  fn5: UnaryFunction<E, F>,
  fn4: UnaryFunction<D, E>,
  fn3: UnaryFunction<C, D>,
  fn2: UnaryFunction<B, C>,
  fn1: UnaryFunction<A, B>
): UnaryFunction<A, F>;
export function compose(...fns: UnaryFunction<unknown, unknown>[]): UnaryFunction<unknown, unknown>;

export function compose(
  ...fns: UnaryFunction<unknown, unknown>[]
): UnaryFunction<unknown, unknown> {
  if (fns.length === 0) {
    return (x: unknown) => x;
  }

  if (fns.length === 1) {
    return fns[0] as UnaryFunction<unknown, unknown>;
  }

  return fns.reduce((composed, fn) => (x: unknown) => composed(fn(x)));
}

/**
 * 从左到右连接多个函数。
 * 第一个函数可以接受多个参数，其他所有函数必须是一元的。
 *
 * @description
 * Pipe 是 compose 的反向操作，从左到右应用函数。
 * `pipe(f, g, h)(x)` 等价于 `h(g(f(x)))`。
 * 这通常更易读，因为它遵循自然的阅读顺序。
 *
 * @example
 * ```typescript
 * const addOne = (x: number) => x + 1;
 * const double = (x: number) => x * 2;
 * const square = (x: number) => x * x;
 *
 * const piped = pipe(addOne, double, square);
 * piped(2); // ((2 + 1) * 2)² = 36
 * ```
 *
 * @param fns - 要连接的函数
 * @returns 一个新函数，从左到右应用所有函数
 */
export function pipe<A, B>(fn1: UnaryFunction<A, B>): UnaryFunction<A, B>;
export function pipe<A, B, C>(
  fn1: UnaryFunction<A, B>,
  fn2: UnaryFunction<B, C>
): UnaryFunction<A, C>;
export function pipe<A, B, C, D>(
  fn1: UnaryFunction<A, B>,
  fn2: UnaryFunction<B, C>,
  fn3: UnaryFunction<C, D>
): UnaryFunction<A, D>;
export function pipe<A, B, C, D, E>(
  fn1: UnaryFunction<A, B>,
  fn2: UnaryFunction<B, C>,
  fn3: UnaryFunction<C, D>,
  fn4: UnaryFunction<D, E>
): UnaryFunction<A, E>;
export function pipe<A, B, C, D, E, F>(
  fn1: UnaryFunction<A, B>,
  fn2: UnaryFunction<B, C>,
  fn3: UnaryFunction<C, D>,
  fn4: UnaryFunction<D, E>,
  fn5: UnaryFunction<E, F>
): UnaryFunction<A, F>;
export function pipe(...fns: UnaryFunction<unknown, unknown>[]): UnaryFunction<unknown, unknown>;

export function pipe(...fns: UnaryFunction<unknown, unknown>[]): UnaryFunction<unknown, unknown> {
  if (fns.length === 0) {
    return (x: unknown) => x;
  }

  if (fns.length === 1) {
    return fns[0] as UnaryFunction<unknown, unknown>;
  }

  return fns.reduce((piped, fn) => (x: unknown) => fn(piped(x)));
}

/**
 * 创建函数流，类似于 pipe 但立即返回最终结果。
 * 适用于通过一系列函数转换值。
 *
 * @description
 * Flow 类似于 pipe，但不是返回函数，
 * 而是立即将值通过所有函数应用。
 *
 * @example
 * ```typescript
 * const result = flow(
 *   5,
 *   x => x + 1,
 *   x => x * 2,
 *   x => x.toString()
 * );
 * // result = "12"
 * ```
 *
 * @param value - 初始值
 * @param fns - 要应用的函数
 * @returns 将所有函数应用于值的结果
 */
export function flow<A>(value: A): A;
export function flow<A, B>(value: A, fn1: UnaryFunction<A, B>): B;
export function flow<A, B, C>(value: A, fn1: UnaryFunction<A, B>, fn2: UnaryFunction<B, C>): C;
export function flow<A, B, C, D>(
  value: A,
  fn1: UnaryFunction<A, B>,
  fn2: UnaryFunction<B, C>,
  fn3: UnaryFunction<C, D>
): D;
export function flow<A, B, C, D, E>(
  value: A,
  fn1: UnaryFunction<A, B>,
  fn2: UnaryFunction<B, C>,
  fn3: UnaryFunction<C, D>,
  fn4: UnaryFunction<D, E>
): E;
export function flow<A, B, C, D, E, F>(
  value: A,
  fn1: UnaryFunction<A, B>,
  fn2: UnaryFunction<B, C>,
  fn3: UnaryFunction<C, D>,
  fn4: UnaryFunction<D, E>,
  fn5: UnaryFunction<E, F>
): F;

export function flow(value: unknown, ...fns: UnaryFunction<unknown, unknown>[]): unknown {
  return fns.reduce((acc, fn) => fn(acc), value);
}
