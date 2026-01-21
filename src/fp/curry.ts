/**
 * @fileoverview 柯里化和部分应用工具
 * @module melange/fp/curry
 * @description 提供柯里化函数和部分应用的工具，
 * 实现更灵活的函数组合和重用。
 */

/**
 * 柯里化二元函数。
 * 将接受两个参数的函数转换为接受一个参数并返回接受第二个参数的函数。
 *
 * @description
 * 柯里化以数学家 Haskell Curry 命名。它将具有多个参数的函数转换为一系列函数，每个函数接受一个参数。
 *
 * @example
 * ```typescript
 * const add = (a: number, b: number) => a + b;
 * const curriedAdd = curry(add);
 *
 * curriedAdd(1)(2); // 3
 * const addFive = curriedAdd(5);
 * addFive(10); // 15
 * ```
 *
 * @template A - 第一个参数的类型
 * @template B - 第二个参数的类型
 * @template R - 返回类型
 * @param fn - 要柯里化的二元函数
 * @returns 函数的柯里化版本
 */
export function curry<A, B, R>(fn: (a: A, b: B) => R): (a: A) => (b: B) => R;

/**
 * 柯里化三元函数。
 *
 * @template A - 第一个参数的类型
 * @template B - 第二个参数的类型
 * @template C - 第三个参数的类型
 * @template R - 返回类型
 * @param fn - 要柯里化的三元函数
 * @returns 函数的柯里化版本
 */
export function curry<A, B, C, R>(fn: (a: A, b: B, c: C) => R): (a: A) => (b: B) => (c: C) => R;

/**
 * 柯里化四元函数。
 *
 * @template A - 第一个参数的类型
 * @template B - 第二个参数的类型
 * @template C - 第三个参数的类型
 * @template D - 第四个参数的类型
 * @template R - 返回类型
 * @param fn - 要柯里化的四元函数
 * @returns 函数的柯里化版本
 */
export function curry<A, B, C, D, R>(
  fn: (a: A, b: B, c: C, d: D) => R
): (a: A) => (b: B) => (c: C) => (d: D) => R;

export function curry(fn: (...args: unknown[]) => unknown): unknown {
  const arity = fn.length;

  function curried(...args: unknown[]): unknown {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...moreArgs: unknown[]) => curried(...args, ...moreArgs);
  }

  return curried;
}

/**
 * 反柯里化函数。
 * 将一元函数序列转换回接受多个参数的单个函数。
 *
 * @example
 * ```typescript
 * const curriedAdd = (a: number) => (b: number) => a + b;
 * const add = uncurry(curriedAdd);
 *
 * add(1, 2); // 3
 * ```
 *
 * @template A - 第一个参数的类型
 * @template B - 第二个参数的类型
 * @template R - 返回类型
 * @param fn - 要反柯里化的函数
 * @returns 函数的反柯里化版本
 */
export function uncurry<A, B, R>(fn: (a: A) => (b: B) => R): (a: A, b: B) => R;
export function uncurry<A, B, C, R>(fn: (a: A) => (b: B) => (c: C) => R): (a: A, b: B, c: C) => R;

export function uncurry(fn: (a: unknown) => unknown): (...args: unknown[]) => unknown {
  return (...args: unknown[]) => {
    let result: unknown = fn;
    for (const arg of args) {
      result = (result as (a: unknown) => unknown)(arg);
    }
    return result;
  };
}

/**
 * 从左侧部分应用参数到函数。
 * 返回一个接受剩余参数的新函数。
 *
 * @description
 * 部分应用不同于柯里化。柯里化将函数转换为一元函数序列，
 * 而部分应用固定一些参数并返回接受剩余参数的函数。
 *
 * @example
 * ```typescript
 * const greet = (greeting: string, name: string, punctuation: string) =>
 *   `${greeting}, ${name}${punctuation}`;
 *
 * const sayHello = partial(greet, 'Hello');
 * sayHello('World', '!'); // "Hello, World!"
 *
 * const sayHelloWorld = partial(greet, 'Hello', 'World');
 * sayHelloWorld('!'); // "Hello, World!"
 * ```
 *
 * @template T - 部分参数的元组类型
 * @template R - 剩余参数的元组类型
 * @template Result - 返回类型
 * @param fn - 要部分应用的函数
 * @param partialArgs - 要固定的参数
 * @returns 接受剩余参数的新函数
 */
export function partial<T extends unknown[], R extends unknown[], Result>(
  fn: (...args: [...T, ...R]) => Result,
  ...partialArgs: T
): (...remainingArgs: R) => Result {
  return (...remainingArgs: R): Result => fn(...partialArgs, ...remainingArgs);
}

/**
 * 从右侧部分应用参数到函数。
 * 返回一个接受剩余参数的新函数。
 *
 * @example
 * ```typescript
 * const greet = (greeting: string, name: string, punctuation: string) =>
 *   `${greeting}, ${name}${punctuation}`;
 *
 * const greetExcitedly = partialRight(greet, '!');
 * greetExcitedly('Hello', 'World'); // "Hello, World!"
 * ```
 *
 * @template L - 前导参数的元组类型
 * @template T - 部分参数的元组类型
 * @template Result - 返回类型
 * @param fn - 要部分应用的函数
 * @param partialArgs - 从右侧固定的参数
 * @returns 接受前导参数的新函数
 */
export function partialRight<L extends unknown[], T extends unknown[], Result>(
  fn: (...args: [...L, ...T]) => Result,
  ...partialArgs: T
): (...leadingArgs: L) => Result {
  return (...leadingArgs: L): Result => fn(...leadingArgs, ...partialArgs);
}
