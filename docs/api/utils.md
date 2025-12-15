# 工具函数 API

## 对象工具

### deepClone

深度克隆对象。

```typescript
function deepClone<T>(obj: T): T;
```

---

### deepMerge

深度合并对象。

```typescript
function deepMerge<T extends object>(...objects: T[]): T;
```

---

### pick

选择对象的指定属性。

```typescript
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
```

---

### omit

排除对象的指定属性。

```typescript
function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
```

---

### get

安全地获取嵌套属性值。

```typescript
function get<T>(obj: object, path: string, defaultValue?: T): T | undefined;
```

---

### set

设置嵌套属性值（返回新对象）。

```typescript
function set<T extends object>(obj: T, path: string, value: unknown): T;
```

---

### has

检查对象是否有指定路径的属性。

```typescript
function has(obj: object, path: string): boolean;
```

---

### isPlainObject

检查是否为普通对象。

```typescript
function isPlainObject(value: unknown): value is object;
```

---

### mapValues

映射对象的值。

```typescript
function mapValues<T, U>(obj: Record<string, T>, fn: (value: T, key: string) => U): Record<string, U>;
```

---

### filterObject

过滤对象的属性。

```typescript
function filterObject<T>(obj: Record<string, T>, predicate: (value: T, key: string) => boolean): Record<string, T>;
```

---

## 数组工具

### chunk

将数组分割成指定大小的块。

```typescript
function chunk<T>(array: T[], size: number): T[][];
```

---

### flatten

扁平化一层嵌套数组。

```typescript
function flatten<T>(array: (T | T[])[]): T[];
```

---

### flattenDeep

完全扁平化嵌套数组。

```typescript
function flattenDeep<T>(array: unknown[]): T[];
```

---

### unique

去除数组重复元素。

```typescript
function unique<T>(array: T[]): T[];
```

---

### groupBy

按条件分组数组元素。

```typescript
function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]>;
```

---

### sortBy

按条件排序数组。

```typescript
function sortBy<T>(array: T[], keyFn: (item: T) => number | string): T[];
```

---

### partition

按条件将数组分成两部分。

```typescript
function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]];
```

---

### zip

合并多个数组。

```typescript
function zip<T, U>(arr1: T[], arr2: U[]): [T, U][];
```

---

### first / last

获取数组首/尾元素。

```typescript
function first<T>(array: T[]): T | undefined;
function last<T>(array: T[]): T | undefined;
```

---

### sample

随机获取数组元素。

```typescript
function sample<T>(array: T[]): T | undefined;
```

---

### shuffle

随机打乱数组。

```typescript
function shuffle<T>(array: T[]): T[];
```

---

### range

创建数字范围数组。

```typescript
function range(start: number, end: number, step?: number): number[];
```

---

### intersection

获取数组交集。

```typescript
function intersection<T>(arr1: T[], arr2: T[]): T[];
```

---

### difference

获取数组差集。

```typescript
function difference<T>(arr1: T[], arr2: T[]): T[];
```

---

## 字符串工具

### capitalize

首字母大写。

```typescript
function capitalize(str: string): string;
```

---

### camelCase / pascalCase / snakeCase / kebabCase

命名风格转换。

```typescript
function camelCase(str: string): string;   // helloWorld
function pascalCase(str: string): string;  // HelloWorld
function snakeCase(str: string): string;   // hello_world
function kebabCase(str: string): string;   // hello-world
function constantCase(str: string): string; // HELLO_WORLD
```

---

### truncate

截断字符串。

```typescript
function truncate(str: string, length: number, suffix?: string): string;
```

---

### padStart / padEnd

填充字符串。

```typescript
function padStart(str: string, length: number, char?: string): string;
function padEnd(str: string, length: number, char?: string): string;
```

---

### escapeHtml / unescapeHtml

HTML 转义。

```typescript
function escapeHtml(str: string): string;
function unescapeHtml(str: string): string;
```

---

### randomString

生成随机字符串。

```typescript
function randomString(length: number): string;
```

---

## 计时工具

### debounce

防抖函数。

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean }
): T & { cancel: () => void };
```

---

### throttle

节流函数。

```typescript
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean }
): T & { cancel: () => void };
```

---

### delay

延迟执行。

```typescript
function delay(ms: number): Promise<void>;
function delay<T>(ms: number, value: T): Promise<T>;
```

---

### retry

自动重试。

```typescript
function retry<T>(
  fn: () => Promise<T>,
  options?: { times?: number; delay?: number }
): Promise<T>;
```

---

### timeout

设置超时。

```typescript
function timeout<T>(promise: Promise<T>, ms: number): Promise<T>;
```

---

### parallel

并行执行多个异步任务。

```typescript
function parallel<T>(tasks: Array<() => Promise<T>>, concurrency?: number): Promise<T[]>;
```

---

### sequence

顺序执行多个异步任务。

```typescript
function sequence<T>(tasks: Array<() => Promise<T>>): Promise<T[]>;
```

---

## 类型守卫

### isString / isNumber / isBoolean

基本类型检查。

```typescript
function isString(value: unknown): value is string;
function isNumber(value: unknown): value is number;
function isBoolean(value: unknown): value is boolean;
```

---

### isObject / isArray / isFunction

复杂类型检查。

```typescript
function isObject(value: unknown): value is object;
function isArray(value: unknown): value is unknown[];
function isFunction(value: unknown): value is Function;
```

---

### isNil / isNotNil

空值检查。

```typescript
function isNil(value: unknown): value is null | undefined;
function isNotNil<T>(value: T): value is NonNullable<T>;
```

---

### isEmpty / isNotEmpty

空值检查（支持字符串、数组、对象）。

```typescript
function isEmpty(value: unknown): boolean;
function isNotEmpty(value: unknown): boolean;
```

---

### isEmail / isUUID / isURL

格式验证。

```typescript
function isEmail(value: string): boolean;
function isUUID(value: string): boolean;
function isURL(value: string): boolean;
```
