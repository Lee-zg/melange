/**
 * @fileoverview 对象操作工具
 * @module melange/utils/object
 * @description 提供深度克隆、合并和
 * 安全操作 JavaScript 对象的工具。
 */

/**
 * 创建对象的深度克隆。
 * 处理嵌套对象、数组、日期和其他内置类型。
 *
 * @description
 * 此函数创建输入的真实深度副本，意味着嵌套
 * 对象也会被克隆而不是引用。它处理循环
 * 引用和特殊对象类型。
 *
 * @example
 * ```typescript
 * const original = { a: 1, b: { c: 2 } };
 * const clone = deepClone(original);
 *
 * clone.b.c = 3;
 * console.log(original.b.c); // 2 (未改变)
 * ```
 *
 * @template T - 要克隆的值的类型
 * @param value - 要克隆的值
 * @returns 值的深度副本
 */
export function deepClone<T>(value: T): T {
  // Handle primitives and null
  if (value === null || typeof value !== 'object') {
    return value;
  }

  // Handle Date
  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  // Handle RegExp
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as unknown as T;
  }

  // Handle Array
  if (Array.isArray(value)) {
    return value.map(item => deepClone(item)) as unknown as T;
  }

  // Handle Map
  if (value instanceof Map) {
    const result = new Map();
    value.forEach((v, k) => {
      result.set(deepClone(k), deepClone(v));
    });
    return result as unknown as T;
  }

  // Handle Set
  if (value instanceof Set) {
    const result = new Set();
    value.forEach(v => {
      result.add(deepClone(v));
    });
    return result as unknown as T;
  }

  // Handle plain objects
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    result[key] = deepClone((value as Record<string, unknown>)[key]);
  }

  return result as unknown as T;
}

/**
 * 深度合并多个对象为一个。
 * 后面的对象会覆盖前面对象的冲突键。
 *
 * @example
 * ```typescript
 * const base = { a: 1, b: { c: 2, d: 3 } };
 * const override = { b: { c: 4 } };
 * const merged = deepMerge(base, override);
 * // { a: 1, b: { c: 4, d: 3 } }
 * ```
 *
 * @template T - 合并对象的类型
 * @param objects - 要合并的对象
 * @returns 合并后的对象
 */
export function deepMerge<T extends object>(...objects: Partial<T>[]): T {
  const result: Record<string, unknown> = {};

  for (const obj of objects) {
    if (!obj) continue;

    for (const key of Object.keys(obj)) {
      const targetValue = result[key];
      const sourceValue = (obj as Record<string, unknown>)[key];

      if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else {
        result[key] = deepClone(sourceValue);
      }
    }
  }

  return result as T;
}

/**
 * 从对象中选择指定属性。
 *
 * @example
 * ```typescript
 * const user = { id: 1, name: 'John', email: 'john@example.com' };
 * const partial = pick(user, ['id', 'name']);
 * // { id: 1, name: 'John' }
 * ```
 *
 * @template T - 对象类型
 * @template K - 要选择的键
 * @param obj - 源对象
 * @param keys - 要选择的键
 * @returns 只包含指定键的新对象
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;

  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }

  return result;
}

/**
 * 从对象中省略指定属性。
 *
 * @example
 * ```typescript
 * const user = { id: 1, name: 'John', password: 'secret' };
 * const safe = omit(user, ['password']);
 * // { id: 1, name: 'John' }
 * ```
 *
 * @template T - 对象类型
 * @template K - 要省略的键
 * @param obj - 源对象
 * @param keys - 要省略的键
 * @returns 不包含指定键的新对象
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Omit<T, K> {
  const keysSet = new Set<keyof T>(keys);
  const result = {} as Omit<T, K>;

  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (!keysSet.has(key)) {
      (result as Record<keyof T, unknown>)[key] = obj[key];
    }
  }

  return result;
}

/**
 * 使用路径字符串或数组获取嵌套属性值。
 *
 * @example
 * ```typescript
 * const obj = { a: { b: { c: 42 } } };
 * get(obj, 'a.b.c'); // 42
 * get(obj, ['a', 'b', 'c']); // 42
 * get(obj, 'a.x.y', 'default'); // 'default'
 * ```
 *
 * @template T - 默认值类型
 * @param obj - 要获取的对象
 * @param path - 属性路径
 * @param defaultValue - 路径不存在时的默认值
 * @returns 路径处的值或默认值
 */
export function get<T = unknown>(
  obj: unknown,
  path: string | readonly string[],
  defaultValue?: T
): T {
  const keys = typeof path === 'string' ? path.split('.') : path;
  let result: unknown = obj;

  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue as T;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return (result === undefined ? defaultValue : result) as T;
}

/**
 * 使用路径字符串或数组设置嵌套属性值。
 * 根据需要创建中间对象。
 *
 * @example
 * ```typescript
 * const obj = { a: { b: 1 } };
 * set(obj, 'a.c.d', 42);
 * // { a: { b: 1, c: { d: 42 } } }
 * ```
 *
 * @template T - 对象类型
 * @param obj - 要修改的对象
 * @param path - 属性路径
 * @param value - 要设置的值
 * @returns 修改后的对象
 */
export function set<T extends object>(
  obj: T,
  path: string | readonly string[],
  value: unknown
): T {
  const keys = typeof path === 'string' ? path.split('.') : path;
  let current: Record<string, unknown> = obj as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key === undefined) continue;

    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey !== undefined) {
    current[lastKey] = value;
  }

  return obj;
}

/**
 * 检查对象是否具有嵌套属性。
 *
 * @example
 * ```typescript
 * const obj = { a: { b: { c: 42 } } };
 * has(obj, 'a.b.c'); // true
 * has(obj, 'a.x');   // false
 * ```
 *
 * @param obj - 要检查的对象
 * @param path - 要检查的路径
 * @returns 如果路径存在则返回 true
 */
export function has(obj: unknown, path: string | readonly string[]): boolean {
  const keys = typeof path === 'string' ? path.split('.') : path;
  let current: unknown = obj;

  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return false;
    }
    if (!(key in (current as object))) {
      return false;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return true;
}

/**
 * 检查值是否为普通对象（非数组、null 或其他类型）。
 *
 * @param value - 要检查的值
 * @returns 如果值是普通对象则返回 true
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

/**
 * 从键值对创建对象。
 *
 * @example
 * ```typescript
 * fromEntries([['a', 1], ['b', 2]]);
 * // { a: 1, b: 2 }
 * ```
 *
 * @template K - 键类型
 * @template V - 值类型
 * @param entries - 键值对数组
 * @returns 从条目创建的对象
 */
export function fromEntries<K extends string | number | symbol, V>(
  entries: readonly (readonly [K, V])[]
): Record<K, V> {
  const result = {} as Record<K, V>;

  for (const [key, value] of entries) {
    result[key] = value;
  }

  return result;
}

/**
 * 映射对象值同时保留键。
 *
 * @example
 * ```typescript
 * const prices = { apple: 1, banana: 2 };
 * const doubled = mapValues(prices, v => v * 2);
 * // { apple: 2, banana: 4 }
 * ```
 *
 * @template T - 原始值类型
 * @template U - 映射值类型
 * @param obj - 要映射的对象
 * @param fn - 映射函数
 * @returns 具有映射值的对象
 */
export function mapValues<T, U>(
  obj: Record<string, T>,
  fn: (value: T, key: string) => U
): Record<string, U> {
  const result: Record<string, U> = {};

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== undefined) {
      result[key] = fn(value, key);
    }
  }

  return result;
}

/**
 * 基于谓词过滤对象条目。
 *
 * @example
 * ```typescript
 * const prices = { apple: 1, banana: 2, cherry: 3 };
 * const expensive = filterObject(prices, v => v > 1);
 * // { banana: 2, cherry: 3 }
 * ```
 *
 * @template T - 值类型
 * @param obj - 要过滤的对象
 * @param predicate - 过滤函数
 * @returns 过滤后的对象
 */
export function filterObject<T>(
  obj: Record<string, T>,
  predicate: (value: T, key: string) => boolean
): Record<string, T> {
  const result: Record<string, T> = {};

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== undefined && predicate(value, key)) {
      result[key] = value;
    }
  }

  return result;
}
