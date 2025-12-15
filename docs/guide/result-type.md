# Result 类型

Result 类型是一种函数式的错误处理方式，让你可以显式地处理成功和失败两种情况，而不是使用 try-catch。

## 基本概念

Result 类型有两种可能的值：
- `Ok<T>` - 表示成功，包含成功值
- `Err<E>` - 表示失败，包含错误信息

```typescript
import type { Result, Ok, Err } from 'melange';
import { ok, err, isOk, isErr } from 'melange/fp';

// 创建成功结果
const success: Result<number, string> = ok(42);

// 创建失败结果
const failure: Result<number, string> = err('出错了');

// 检查结果类型
console.log(isOk(success)); // true
console.log(isErr(failure)); // true
```

## 从可能抛出异常的函数创建 Result

### tryCatch

```typescript
import { tryCatch } from 'melange/fp';

const parseJSON = (str: string) => JSON.parse(str);

const result = tryCatch(() => parseJSON('{"valid": true}'));
console.log(isOk(result)); // true

const badResult = tryCatch(() => parseJSON('invalid json'));
console.log(isErr(badResult)); // true
```

### tryCatchAsync

```typescript
import { tryCatchAsync } from 'melange/fp';

const fetchData = async (url: string) => {
  const response = await fetch(url);
  return response.json();
};

const result = await tryCatchAsync(() => fetchData('/api/data'));
```

## 转换 Result

### mapResult

对成功值进行转换，错误值保持不变。

```typescript
import { ok, err, mapResult } from 'melange/fp';

const success = ok(5);
const doubled = mapResult(success, (x) => x * 2);
// Ok(10)

const failure = err('error');
const stillFailure = mapResult(failure, (x) => x * 2);
// Err('error')
```

### flatMapResult

当转换函数也返回 Result 时使用。

```typescript
import { ok, err, flatMapResult } from 'melange/fp';

const divide = (a: number, b: number): Result<number, string> => {
  if (b === 0) return err('除数不能为零');
  return ok(a / b);
};

const result = flatMapResult(ok(10), (x) => divide(x, 2));
// Ok(5)

const badResult = flatMapResult(ok(10), (x) => divide(x, 0));
// Err('除数不能为零')
```

## 提取值

### unwrapOr

提取成功值，失败时返回默认值。

```typescript
import { ok, err, unwrapOr } from 'melange/fp';

console.log(unwrapOr(ok(42), 0)); // 42
console.log(unwrapOr(err('error'), 0)); // 0
```

### unwrapOrElse

提取成功值，失败时调用函数生成默认值。

```typescript
import { ok, err, unwrapOrElse } from 'melange/fp';

const result = unwrapOrElse(err('not found'), (error) => {
  console.log('处理错误:', error);
  return -1;
});
// 处理错误: not found
// -1
```

## 模式匹配

### matchResult

最强大的 Result 处理方式，分别处理成功和失败情况。

```typescript
import { ok, err, matchResult } from 'melange/fp';

const result = ok(42);

const message = matchResult(result, {
  ok: (value) => `成功: ${value}`,
  err: (error) => `失败: ${error}`,
});

console.log(message); // "成功: 42"
```

## 实际应用示例

```typescript
import { tryCatch, mapResult, flatMapResult, matchResult } from 'melange/fp';

// 定义业务逻辑
const parseNumber = (str: string) =>
  tryCatch(() => {
    const n = parseInt(str, 10);
    if (isNaN(n)) throw new Error('无效数字');
    return n;
  });

const validatePositive = (n: number) =>
  n > 0 ? ok(n) : err(new Error('必须是正数'));

// 组合处理
const processInput = (input: string) =>
  matchResult(
    flatMapResult(parseNumber(input), validatePositive),
    {
      ok: (value) => ({ success: true, data: value }),
      err: (error) => ({ success: false, message: error.message }),
    }
  );

console.log(processInput('42')); // { success: true, data: 42 }
console.log(processInput('-5')); // { success: false, message: '必须是正数' }
console.log(processInput('abc')); // { success: false, message: '无效数字' }
```
