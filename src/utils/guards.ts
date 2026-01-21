/**
 * @fileoverview 类型检查和验证工具
 * @module melange/utils/guards
 * @description 提供类型守卫和验证函数用于
 * 运行时类型检查。
 */

/**
 * 检查值是否为字符串。
 *
 * @example
 * ```typescript
 * isString('hello'); // true
 * isString(123);     // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是字符串则返回 true
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 检查值是否为数字（且不是 NaN）。
 *
 * @example
 * ```typescript
 * isNumber(123);      // true
 * isNumber(NaN);      // false
 * isNumber('123');    // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是有限数字则返回 true
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * 检查值是否为布尔值。
 *
 * @example
 * ```typescript
 * isBoolean(true);    // true
 * isBoolean(false);   // true
 * isBoolean(0);       // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是布尔值则返回 true
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 检查值是否为对象（非 null 或数组）。
 *
 * @example
 * ```typescript
 * isObject({});       // true
 * isObject([]);       // false
 * isObject(null);     // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是普通对象则返回 true
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 检查值是否为数组。
 *
 * @example
 * ```typescript
 * isArray([]);       // true
 * isArray([1, 2]);   // true
 * isArray({});       // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是数组则返回 true
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * 检查值是否为函数。
 *
 * @example
 * ```typescript
 * isFunction(() => {});           // true
 * isFunction(function() {});      // true
 * isFunction(async () => {});     // true
 * isFunction({});                 // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是函数则返回 true
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * 检查值是否为 null 或 undefined。
 *
 * @example
 * ```typescript
 * isNil(null);      // true
 * isNil(undefined); // true
 * isNil(0);         // false
 * isNil('');        // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是 null 或 undefined 则返回 true
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * 检查值是否不为 null 或 undefined。
 *
 * @example
 * ```typescript
 * isNotNil(0);         // true
 * isNotNil('');        // true
 * isNotNil(null);      // false
 * isNotNil(undefined); // false
 * ```
 *
 * @template T - 值类型
 * @param value - 要检查的值
 * @returns 如果值不是 null 或 undefined 则返回 true
 */
export function isNotNil<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 检查值是否为"空"。
 * 空值：null, undefined, '', [], {}, Map(0), Set(0)
 *
 * @example
 * ```typescript
 * isEmpty('');        // true
 * isEmpty([]);        // true
 * isEmpty({});        // true
 * isEmpty(null);      // true
 * isEmpty(0);         // false
 * isEmpty('hello');   // false
 * isEmpty([1]);       // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值为空则返回 true
 */
export function isEmpty(value: unknown): boolean {
  if (isNil(value)) return true;
  if (typeof value === 'string') return value.length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Map || value instanceof Set) return value.size === 0;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length === 0;
  return false;
}

/**
 * 检查值是否不为"空"。
 *
 * @example
 * ```typescript
 * isNotEmpty('hello');  // true
 * isNotEmpty([1, 2]);   // true
 * isNotEmpty('');       // false
 * isNotEmpty([]);       // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值不为空则返回 true
 */
export function isNotEmpty(value: unknown): boolean {
  return !isEmpty(value);
}

/**
 * 检查值是否为有效的 Date 对象。
 *
 * @example
 * ```typescript
 * isDate(new Date());           // true
 * isDate(new Date('invalid'));  // false
 * isDate('2023-01-01');         // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是有效日期则返回 true
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * 检查值是否为 Promise。
 *
 * @example
 * ```typescript
 * isPromise(Promise.resolve()); // true
 * isPromise(async () => {});    // false (函数，不是 promise)
 * isPromise({ then: () => {} }); // true (thenable)
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是 Promise 或 thenable 则返回 true
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value instanceof Promise ||
    (value !== null &&
      typeof value === 'object' &&
      typeof (value as { then?: unknown }).then === 'function')
  );
}

/**
 * 检查值是否为 Symbol。
 *
 * @param value - 要检查的值
 * @returns 如果值是 Symbol 则返回 true
 */
export function isSymbol(value: unknown): value is symbol {
  return typeof value === 'symbol';
}

/**
 * 检查值是否为 BigInt。
 *
 * @param value - 要检查的值
 * @returns 如果值是 BigInt 则返回 true
 */
export function isBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint';
}

/**
 * 检查值是否为有效的电子邮件地址。
 *
 * @example
 * ```typescript
 * isEmail('user@example.com');   // true
 * isEmail('user@');              // false
 * isEmail('not-an-email');       // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是有效邮箱则返回 true
 */
export function isEmail(value: unknown): boolean {
  if (!isString(value)) return false;
  // Basic email regex - covers most common cases
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * 检查值是否为有效的 UUID v4。
 *
 * @example
 * ```typescript
 * isUUID('550e8400-e29b-41d4-a716-446655440000'); // true
 * isUUID('not-a-uuid'); // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是有效 UUID 则返回 true
 */
export function isUUID(value: unknown): boolean {
  if (!isString(value)) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * 检查值是否为有效的 URL。
 *
 * @example
 * ```typescript
 * isURL('https://example.com');     // true
 * isURL('http://localhost:3000');   // true
 * isURL('not-a-url');               // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是有效 URL 则返回 true
 */
export function isURL(value: unknown): boolean {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查值是否为整数。
 *
 * @example
 * ```typescript
 * isInteger(42);     // true
 * isInteger(42.0);   // true
 * isInteger(42.5);   // false
 * isInteger('42');   // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是整数则返回 true
 */
export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

/**
 * 检查值是否为正数。
 *
 * @example
 * ```typescript
 * isPositive(1);    // true
 * isPositive(0);    // false
 * isPositive(-1);   // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是正数则返回 true
 */
export function isPositive(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * 检查值是否为负数。
 *
 * @example
 * ```typescript
 * isNegative(-1);   // true
 * isNegative(0);    // false
 * isNegative(1);    // false
 * ```
 *
 * @param value - 要检查的值
 * @returns 如果值是负数则返回 true
 */
export function isNegative(value: unknown): value is number {
  return isNumber(value) && value < 0;
}

/**
 * 检查值是否在范围内（包含边界）。
 *
 * @example
 * ```typescript
 * isInRange(5, 1, 10);   // true
 * isInRange(0, 1, 10);   // false
 * isInRange(1, 1, 10);   // true
 * isInRange(10, 1, 10);  // true
 * ```
 *
 * @param value - 要检查的值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 如果值在范围内则返回 true
 */
export function isInRange(value: unknown, min: number, max: number): value is number {
  return isNumber(value) && value >= min && value <= max;
}
