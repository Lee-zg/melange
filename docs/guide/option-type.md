# Option 类型

Option 类型用于安全地处理可能为空的值，避免 `null` 和 `undefined` 带来的问题。

## 基本概念

Option 类型有两种可能的值：
- `Some<T>` - 表示存在值
- `None` - 表示没有值

```typescript
import type { Option, Some, None } from 'melange';
import { some, none, isSome, isNone } from 'melange/fp';

// 创建有值的 Option
const hasValue: Option<number> = some(42);

// 创建空的 Option
const empty: Option<number> = none();

// 检查 Option 类型
console.log(isSome(hasValue)); // true
console.log(isNone(empty)); // true
```

## 从可空值创建 Option

### fromNullable

```typescript
import { fromNullable, isSome } from 'melange/fp';

const value1 = fromNullable('hello');
console.log(isSome(value1)); // true

const value2 = fromNullable(null);
console.log(isNone(value2)); // true

const value3 = fromNullable(undefined);
console.log(isNone(value3)); // true
```

## 转换 Option

### mapOption

对存在的值进行转换。

```typescript
import { some, none, mapOption } from 'melange/fp';

const doubled = mapOption(some(5), (x) => x * 2);
// Some(10)

const stillNone = mapOption(none(), (x) => x * 2);
// None
```

### flatMapOption

当转换函数也返回 Option 时使用。

```typescript
import { some, none, flatMapOption } from 'melange/fp';

const findUser = (id: number): Option<{ name: string }> =>
  id > 0 ? some({ name: 'Alice' }) : none();

const result = flatMapOption(some(1), findUser);
// Some({ name: 'Alice' })

const noResult = flatMapOption(some(-1), findUser);
// None
```

### filterOption

根据条件过滤值。

```typescript
import { some, filterOption, isSome } from 'melange/fp';

const positive = filterOption(some(5), (x) => x > 0);
console.log(isSome(positive)); // true

const filtered = filterOption(some(-5), (x) => x > 0);
console.log(isNone(filtered)); // true
```

## 提取值

### getOrElse

提取值，没有值时返回默认值。

```typescript
import { some, none, getOrElse } from 'melange/fp';

console.log(getOrElse(some(42), 0)); // 42
console.log(getOrElse(none(), 0)); // 0
```

### getOrElseL

提取值，没有值时调用函数生成默认值。

```typescript
import { some, none, getOrElseL } from 'melange/fp';

const value = getOrElseL(none(), () => {
  console.log('生成默认值');
  return 0;
});
// 生成默认值
// 0
```

### toNullable

将 Option 转回可空值。

```typescript
import { some, none, toNullable } from 'melange/fp';

console.log(toNullable(some(42))); // 42
console.log(toNullable(none())); // null
```

## 模式匹配

### matchOption

分别处理有值和无值的情况。

```typescript
import { some, none, matchOption } from 'melange/fp';

const message = matchOption(some(42), {
  some: (value) => `找到值: ${value}`,
  none: () => '没有找到值',
});

console.log(message); // "找到值: 42"
```

## 备选值

### alt

当 Option 为 None 时，返回备选 Option。

```typescript
import { some, none, alt } from 'melange/fp';

const result1 = alt(some(1), () => some(2));
// Some(1)

const result2 = alt(none(), () => some(2));
// Some(2)
```

## 实际应用示例

```typescript
import { fromNullable, mapOption, flatMapOption, getOrElse } from 'melange/fp';

interface User {
  name: string;
  address?: {
    city?: string;
  };
}

const getCity = (user: User | null): string => {
  return getOrElse(
    flatMapOption(
      flatMapOption(fromNullable(user), (u) => fromNullable(u.address)),
      (a) => fromNullable(a.city)
    ),
    '未知城市'
  );
};

console.log(getCity({ name: 'Alice', address: { city: '北京' } })); // "北京"
console.log(getCity({ name: 'Bob' })); // "未知城市"
console.log(getCity(null)); // "未知城市"
```
