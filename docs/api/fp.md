# 函数式编程 API

## 函数组合

### pipe

从左到右组合函数，将初始值依次传递给每个函数。

```typescript
function pipe<A>(a: A): A;
function pipe<A, B>(a: A, ab: (a: A) => B): B;
function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
// ... 最多支持 20 个函数
```

**示例：**
```typescript
import { pipe } from 'melange/fp';

const result = pipe(
  5,
  (x) => x + 1,
  (x) => x * 2
);
// 12
```

---

### compose

从右到左组合函数，返回一个新函数。

```typescript
function compose<A, B>(ab: (a: A) => B): (a: A) => B;
function compose<A, B, C>(bc: (b: B) => C, ab: (a: A) => B): (a: A) => C;
// ... 最多支持 20 个函数
```

---

### flow

类似 pipe，但返回函数而不是立即执行。

```typescript
function flow<A, B>(ab: (a: A) => B): (a: A) => B;
function flow<A, B, C>(ab: (a: A) => B, bc: (b: B) => C): (a: A) => C;
```

---

## 柯里化

### curry

将多参数函数转换为柯里化函数。

```typescript
function curry<A, B, R>(fn: (a: A, b: B) => R): CurriedFunction2<A, B, R>;
function curry<A, B, C, R>(fn: (a: A, b: B, c: C) => R): CurriedFunction3<A, B, C, R>;
```

---

### uncurry

将柯里化函数转换回多参数函数。

```typescript
function uncurry<A, B, R>(fn: (a: A) => (b: B) => R): (a: A, b: B) => R;
```

---

### partial

部分应用函数参数（从左侧）。

```typescript
function partial<A, B, R>(fn: (a: A, b: B) => R, a: A): (b: B) => R;
```

---

### partialRight

部分应用函数参数（从右侧）。

```typescript
function partialRight<A, B, R>(fn: (a: A, b: B) => R, b: B): (a: A) => R;
```

---

## Result 类型

### ok

创建成功结果。

```typescript
function ok<T>(value: T): Ok<T>;
```

---

### err

创建失败结果。

```typescript
function err<E>(error: E): Err<E>;
```

---

### isOk / isErr

检查 Result 类型。

```typescript
function isOk<T, E>(result: Result<T, E>): result is Ok<T>;
function isErr<T, E>(result: Result<T, E>): result is Err<E>;
```

---

### mapResult

对成功值进行转换。

```typescript
function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>;
```

---

### flatMapResult

链式处理 Result。

```typescript
function flatMapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E>;
```

---

### unwrapOr

提取值或返回默认值。

```typescript
function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T;
```

---

### matchResult

模式匹配处理 Result。

```typescript
function matchResult<T, E, R>(
  result: Result<T, E>,
  handlers: { ok: (value: T) => R; err: (error: E) => R }
): R;
```

---

### tryCatch

捕获同步函数异常并返回 Result。

```typescript
function tryCatch<T>(fn: () => T): Result<T, Error>;
```

---

### tryCatchAsync

捕获异步函数异常并返回 Result。

```typescript
function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>>;
```

---

## Option 类型

### some / none

创建 Option。

```typescript
function some<T>(value: T): Some<T>;
function none(): None;
```

---

### isSome / isNone

检查 Option 类型。

```typescript
function isSome<T>(option: Option<T>): option is Some<T>;
function isNone<T>(option: Option<T>): option is None;
```

---

### fromNullable

从可空值创建 Option。

```typescript
function fromNullable<T>(value: T | null | undefined): Option<T>;
```

---

### mapOption

对存在的值进行转换。

```typescript
function mapOption<T, U>(option: Option<T>, fn: (value: T) => U): Option<U>;
```

---

### getOrElse

提取值或返回默认值。

```typescript
function getOrElse<T>(option: Option<T>, defaultValue: T): T;
```

---

### matchOption

模式匹配处理 Option。

```typescript
function matchOption<T, R>(
  option: Option<T>,
  handlers: { some: (value: T) => R; none: () => R }
): R;
```

---

## 高阶函数

### memoize

缓存函数结果。

```typescript
function memoize<T extends (...args: any[]) => any>(fn: T): T;
```

---

### once

确保函数只执行一次。

```typescript
function once<T extends (...args: any[]) => any>(fn: T): T;
```

---

### tap

执行副作用但返回原值。

```typescript
function tap<T>(fn: (value: T) => void): (value: T) => T;
```

---

### identity

恒等函数，返回输入值。

```typescript
function identity<T>(value: T): T;
```

---

### constant

创建返回常量的函数。

```typescript
function constant<T>(value: T): () => T;
```

---

### noop

空操作函数。

```typescript
function noop(): void;
```

---

### not

创建谓词的否定版本。

```typescript
function not<T>(predicate: (value: T) => boolean): (value: T) => boolean;
```

---

### allPass

所有谓词都满足时返回 true。

```typescript
function allPass<T>(...predicates: Array<(value: T) => boolean>): (value: T) => boolean;
```

---

### anyPass

任一谓词满足时返回 true。

```typescript
function anyPass<T>(...predicates: Array<(value: T) => boolean>): (value: T) => boolean;
```

---

### flip

交换二元函数的参数顺序。

```typescript
function flip<A, B, R>(fn: (a: A, b: B) => R): (b: B, a: A) => R;
```
