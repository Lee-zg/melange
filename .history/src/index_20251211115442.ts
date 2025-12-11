/**
 * @fileoverview Melange 库的主入口点
 * @module melange
 * @description 一个现代化的 JavaScript/TypeScript 工具库，具有
 * 函数式编程模式、面向对象工具和全面的类型支持。
 *
 * @example
 * ```typescript
 * // 导入所有内容
 * import * as melange from 'melange';
 *
 * // 导入特定模块
 * import { pipe, compose, curry } from 'melange/fp';
 * import { debounce, throttle, deepClone } from 'melange/utils';
 * import { EventEmitter, Container } from 'melange/core';
 * ```
 *
 * @license MIT
 * @author Melange 贡献者
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Primitive types
  Nullable,
  Optional,
  Primitive,
  AnyFunction,
  Constructor,
  // Functional types
  Thunk,
  Predicate,
  Mapper,
  Reducer,
  Comparator,
  UnaryFunction,
  BinaryFunction,
  CurriedBinaryFunction,
  // Result & Option types
  Ok,
  Err,
  Result,
  Some,
  None,
  Option,
  // Async types
  AsyncFunction,
  AsyncThunk,
  Deferred,
  // Object types
  Dictionary,
  DeepPartial,
  DeepReadonly,
  RequiredKeys,
  OptionalKeys,
  Keys,
  Values,
  // Tuple types
  Pair,
  Triple,
  Head,
  Tail,
  // Decorator types
  ClassDecorator,
  MethodDecorator,
  PropertyDecorator,
  ParameterDecorator,
  // Event types
  EventHandler,
  EventListener,
  Subscription,
  // Brand types
  Brand,
  PositiveNumber,
  NonEmptyString,
  Email,
  UUID,
  // Utility types
  ReturnTypeOf,
  ParametersOf,
  Mutable,
  JsonValue,
  JsonObject,
  JsonArray,
} from './types';

// ============================================================================
// Functional Programming Module
// ============================================================================

export {
  // Function composition
  pipe,
  compose,
  flow,
  // Currying
  curry,
  uncurry,
  partial,
  partialRight,
  // Result type utilities
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
  // Option type utilities
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
  // Higher-order functions
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
} from './fp';

// ============================================================================
// Utility Functions Module
// ============================================================================

export {
  // Object utilities
  deepClone,
  deepMerge,
  pick,
  omit,
  get,
  set,
  has,
  isPlainObject,
  mapValues,
  filterObject,
  // Array utilities
  chunk,
  flatten,
  flattenDeep,
  unique,
  groupBy,
  sortBy,
  partition,
  zip,
  first,
  last,
  sample,
  shuffle,
  range,
  intersection,
  difference,
  // String utilities
  capitalize,
  camelCase,
  pascalCase,
  snakeCase,
  kebabCase,
  constantCase,
  truncate,
  padStart,
  padEnd,
  collapseWhitespace,
  escapeHtml,
  unescapeHtml,
  randomString,
  words,
  titleCase,
  reverse,
  countOccurrences,
  // Timing utilities
  debounce,
  throttle,
  delay,
  retry,
  timeout,
  createDeferred,
  parallel,
  sequence,
  // Type guards
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isFunction,
  isNil,
  isNotNil,
  isEmpty,
  isNotEmpty,
  isDate,
  isPromise,
  // Validation utilities
  isEmail,
  isUUID,
  isURL,
  isInteger,
  isPositive,
  isNegative,
  isInRange,
} from './utils';

// ============================================================================
// Core OOP Module
// ============================================================================

export {
  // Event handling
  EventEmitter,
  // Dependency injection
  Container,
  globalContainer,
  Lifecycle,
  Injectable,
  Inject,
  Singleton,
  // Decorators
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
  // Base classes
  Disposable,
  DisposableStore,
  toDisposable,
  combineDisposables,
} from './core';

// ============================================================================
// Library Version
// ============================================================================

/**
 * 当前库版本
 * @constant
 */
export const VERSION = '1.0.0';

/**
 * 库名
 * @constant
 */
export const LIBRARY_NAME = 'melange';
