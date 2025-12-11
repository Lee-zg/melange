/**
 * @fileoverview Melange 库的核心类型定义
 * @module melange/types
 * @description 全面的 TypeScript 类型定义，支持函数式编程、
 * 面向对象模式和 Melange 库的工具类型。
 */

// ============================================================================
// Primitive & Basic Types
// ============================================================================

/**
 * 表示可为空的类型，可以是类型 T 或 null/undefined
 * @template T - 基础类型
 */
export type Nullable<T> = T | null | undefined;

/**
 * 表示可选类型，可以是类型 T 或 undefined
 * @template T - 基础类型
 */
export type Optional<T> = T | undefined;

/**
 * 表示原始 JavaScript 类型
 */
export type Primitive = string | number | boolean | symbol | bigint | null | undefined;

/**
 * 表示任何函数类型
 */
export type AnyFunction = (...args: unknown[]) => unknown;

/**
 * 表示构造函数类型
 * @template T - 实例类型
 */
export type Constructor<T = object> = new (...args: unknown[]) => T;

// ============================================================================
// Functional Programming Types
// ============================================================================

/**
 * 表示不接受参数并返回值的函数
 * @template T - 返回类型
 */
export type Thunk<T> = () => T;

/**
 * 表示返回布尔值的谓词函数
 * @template T - 输入类型
 */
export type Predicate<T> = (value: T) => boolean;

/**
 * 表示从类型 A 到类型 B 的映射函数
 * @template A - 输入类型
 * @template B - 输出类型
 */
export type Mapper<A, B> = (value: A) => B;

/**
 * 表示用于折叠/归约操作的归约函数
 * @template T - 累加器类型
 * @template U - 当前值类型
 */
export type Reducer<T, U> = (accumulator: T, current: U) => T;

/**
 * 表示用于排序的比较函数
 * @template T - 被比较的类型
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * 表示一元函数（单参数）
 * @template A - 输入类型
 * @template B - 输出类型
 */
export type UnaryFunction<A, B> = (arg: A) => B;

/**
 * 表示二元函数（两个参数）
 * @template A - 第一个参数类型
 * @template B - 第二个参数类型
 * @template C - 返回类型
 */
export type BinaryFunction<A, B, C> = (a: A, b: B) => C;

/**
 * 表示柯里化的二元函数
 * @template A - 第一个参数类型
 * @template B - 第二个参数类型
 * @template C - 返回类型
 */
export type CurriedBinaryFunction<A, B, C> = (a: A) => (b: B) => C;

// ============================================================================
// Result & Option Types (Functional Error Handling)
// ============================================================================

/**
 * 表示成功的结果
 * @template T - 成功值类型
 */
export interface Ok<T> {
  readonly _tag: 'Ok';
  readonly value: T;
}

/**
 * 表示失败的结果
 * @template E - 错误类型
 */
export interface Err<E> {
  readonly _tag: 'Err';
  readonly error: E;
}

/**
 * 表示用于错误处理的 Result 类型
 * @template T - 成功值类型
 * @template E - 错误类型
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * 表示存在的值
 * @template T - 值类型
 */
export interface Some<T> {
  readonly _tag: 'Some';
  readonly value: T;
}

/**
 * 表示缺失的值
 */
export interface None {
  readonly _tag: 'None';
}

/**
 * 表示用于可空值处理的 Option 类型
 * @template T - 值类型
 */
export type Option<T> = Some<T> | None;

// ============================================================================
// Async Types
// ============================================================================

/**
 * 表示异步函数
 * @template T - 返回类型
 */
export type AsyncFunction<T> = (...args: unknown[]) => Promise<T>;

/**
 * 表示异步 thunk
 * @template T - 返回类型
 */
export type AsyncThunk<T> = () => Promise<T>;

/**
 * 表示可能已解析或未解析的延迟值
 * @template T - 值类型
 */
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

// ============================================================================
// Object & Collection Types
// ============================================================================

/**
 * 表示具有字符串键的记录
 * @template T - 值类型
 */
export type Dictionary<T> = Record<string, T>;

/**
 * 表示深层部分类型
 * @template T - 基础类型
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/**
 * 表示深层只读类型
 * @template T - 基础类型
 */
export type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

/**
 * 使指定键变为必需
 * @template T - 基础类型
 * @template K - 要设为必需的键
 */
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * 使指定键变为可选
 * @template T - 基础类型
 * @template K - 要设为可选的键
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 提取对象类型的键
 * @template T - 对象类型
 */
export type Keys<T> = keyof T;

/**
 * 提取对象的值类型
 * @template T - 对象类型
 */
export type Values<T> = T[keyof T];

// ============================================================================
// Tuple Types
// ============================================================================

/**
 * 表示一对值
 * @template A - 第一个值类型
 * @template B - 第二个值类型
 */
export type Pair<A, B> = readonly [A, B];

/**
 * 表示三元组值
 * @template A - 第一个值类型
 * @template B - 第二个值类型
 * @template C - 第三个值类型
 */
export type Triple<A, B, C> = readonly [A, B, C];

/**
 * 提取元组的头部（第一个元素）
 * @template T - 元组类型
 */
export type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...unknown[]]
  ? H
  : never;

/**
 * 提取元组的尾部（除第一个元素外的所有元素）
 * @template T - 元组类型
 */
export type Tail<T extends readonly unknown[]> = T extends readonly [unknown, ...infer Rest]
  ? Rest
  : never;

// ============================================================================
// Decorator Types
// ============================================================================

/**
 * 表示类装饰器
 * @template T - 类类型
 */
export type ClassDecorator<T extends Constructor> = (target: T) => T | void;

/**
 * 表示方法装饰器
 */
export type MethodDecorator = (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => PropertyDescriptor | void;

/**
 * 表示属性装饰器
 */
export type PropertyDecorator = (target: object, propertyKey: string | symbol) => void;

/**
 * 表示参数装饰器
 */
export type ParameterDecorator = (
  target: object,
  propertyKey: string | symbol | undefined,
  parameterIndex: number
) => void;

// ============================================================================
// Event Types
// ============================================================================

/**
 * 表示事件处理函数
 * @template T - 事件数据类型
 */
export type EventHandler<T = unknown> = (event: T) => void;

/**
 * 表示事件监听器配置
 * @template T - 事件数据类型
 */
export interface EventListener<T = unknown> {
  handler: EventHandler<T>;
  once: boolean;
}

/**
 * 表示可以取消订阅的订阅
 */
export interface Subscription {
  unsubscribe: () => void;
}

// ============================================================================
// Brand Types (Nominal Typing)
// ============================================================================

/**
 * 为名义类型创建品牌类型
 * @template T - 基础类型
 * @template Brand - 品牌标识符
 */
export type Brand<T, Brand extends string> = T & { readonly __brand: Brand };

/**
 * 表示正数
 */
export type PositiveNumber = Brand<number, 'PositiveNumber'>;

/**
 * 表示非空字符串
 */
export type NonEmptyString = Brand<string, 'NonEmptyString'>;

/**
 * 表示有效的电子邮件字符串
 */
export type Email = Brand<string, 'Email'>;

/**
 * 表示有效的 UUID 字符串
 */
export type UUID = Brand<string, 'UUID'>;

// ============================================================================
// Utility Types for Library Internal Use
// ============================================================================

/**
 * 提取函数的返回类型
 * @template T - 函数类型
 */
export type ReturnTypeOf<T> = T extends (...args: unknown[]) => infer R ? R : never;

/**
 * 将函数的参数提取为元组
 * @template T - 函数类型
 */
export type ParametersOf<T> = T extends (...args: infer P) => unknown ? P : never;

/**
 * 从 Promise 中提取已解析的类型
 * @template T - Promise 类型
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * 使所有属性可变（移除 readonly）
 * @template T - 要设为可变的类型
 */
export type Mutable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * 表示可序列化为 JSON 的值
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

/**
 * 表示 JSON 对象
 */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * 表示 JSON 数组
 */
export type JsonArray = JsonValue[];
