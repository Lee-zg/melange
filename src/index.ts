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
// 类型导出
// ============================================================================

export type {
  // 基本类型
  Nullable,
  Optional,
  Primitive,
  AnyFunction,
  Constructor,
  // 函数类型
  Thunk,
  Predicate,
  Mapper,
  Reducer,
  Comparator,
  UnaryFunction,
  BinaryFunction,
  CurriedBinaryFunction,
  // Result 和 Option 类型
  Ok,
  Err,
  Result,
  Some,
  None,
  Option,
  // 异步类型
  AsyncFunction,
  AsyncThunk,
  Deferred,
  // 对象类型
  Dictionary,
  DeepPartial,
  DeepReadonly,
  RequiredKeys,
  OptionalKeys,
  Keys,
  Values,
  // 元组类型
  Pair,
  Triple,
  Head,
  Tail,
  // 装饰器类型
  ClassDecorator,
  MethodDecorator,
  PropertyDecorator,
  ParameterDecorator,
  // 事件类型
  EventHandler,
  EventListener,
  Subscription,
  // 品牌类型
  Brand,
  PositiveNumber,
  NonEmptyString,
  Email,
  UUID,
  // 实用类型
  ReturnTypeOf,
  ParametersOf,
  Mutable,
  JsonValue,
  JsonObject,
  JsonArray,
} from './types';

// ============================================================================
// 函数式编程模块
// ============================================================================

export {
  // 函数组合
  pipe,
  compose,
  flow,
  // 柯里化
  curry,
  uncurry,
  partial,
  partialRight,
  // Result 类型工具
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
  // Option 类型工具
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
  // 高阶函数
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
// 实用函数模块
// ============================================================================

export {
  // 对象工具
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
  // 数组工具
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
  // 字符串工具
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
  // 计时工具
  debounce,
  throttle,
  delay,
  retry,
  timeout,
  createDeferred,
  parallel,
  sequence,
  // 类型守卫
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
  // 验证工具
  isEmail,
  isUUID,
  isURL,
  isInteger,
  isPositive,
  isNegative,
  isInRange,
} from './utils';

// ============================================================================
// 核心面向对象模块
// ============================================================================

export {
  // 事件处理
  EventEmitter,
  // 依赖注入
  Container,
  globalContainer,
  Lifecycle,
  Injectable,
  Inject,
  Singleton,
  // 装饰器
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
  // 基础类
  Disposable,
  DisposableStore,
  toDisposable,
  combineDisposables,
} from './core';

// ============================================================================
// 库版本
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
