/**
 * @fileoverview 函数式编程模块入口点
 * @module melange/fp
 * @description 导出所有函数式编程工具，包括
 * 函数组合、柯里化、Result/Option 类型和高阶函数。
 */

// ============================================================================
// 函数组合
// ============================================================================

export { compose, pipe, flow } from './compose';

// ============================================================================
// 柯里化和部分应用
// ============================================================================

export { curry, uncurry, partial, partialRight } from './curry';

// ============================================================================
// Result 类型（错误处理）
// ============================================================================

export {
  ok,
  err,
  isOk,
  isErr,
  mapResult,
  flatMapResult,
  unwrapOr,
  unwrapOrElse,
  matchResult,
  tryCatch,
  tryCatchAsync,
} from './result';

// ============================================================================
// Option 类型（可空值处理）
// ============================================================================

export {
  some,
  none,
  isSome,
  isNone,
  fromNullable,
  mapOption,
  flatMapOption,
  getOrElse,
  getOrElseL,
  matchOption,
  toNullable,
  filterOption,
  alt,
} from './option';

// ============================================================================
// 高阶函数
// ============================================================================

export {
  memoize,
  once,
  tap,
  identity,
  constant,
  noop,
  not,
  allPass,
  anyPass,
  flip,
  apply,
  thunk,
  invert,
} from './hof';
