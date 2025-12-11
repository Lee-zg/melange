/**
 * @fileoverview 实用函数模块入口点
 * @module melange/utils
 * @description 导出所有实用函数，包括对象操作、
 * 数组辅助函数、字符串工具、计时函数和类型守卫。
 */

// ============================================================================
// 对象工具
// ============================================================================

export {
  deepClone,
  deepMerge,
  pick,
  omit,
  get,
  set,
  has,
  isPlainObject,
  fromEntries,
  mapValues,
  filterObject,
} from './object';

// ============================================================================
// 数组工具
// ============================================================================

export {
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
} from './array';

// ============================================================================
// 字符串工具
// ============================================================================

export {
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
} from './string';

// ============================================================================
// 计时工具
// ============================================================================

export {
  debounce,
  throttle,
  delay,
  retry,
  timeout,
  createDeferred,
  parallel,
  sequence,
} from './timing';

// ============================================================================
// 类型守卫和验证
// ============================================================================

export {
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
  isSymbol,
  isBigInt,
  isEmail,
  isUUID,
  isURL,
  isInteger,
  isPositive,
  isNegative,
  isInRange,
} from './guards';
