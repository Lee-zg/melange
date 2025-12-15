# 函数式编程

Melange 提供了一套完整的函数式编程工具，帮助你编写更简洁、可组合、可测试的代码。

## 函数组合

### pipe

`pipe` 从左到右组合函数，将前一个函数的输出作为下一个函数的输入。

```typescript
import { pipe } from 'melange/fp';

const addOne = (x: number) => x + 1;
const double = (x: number) => x * 2;
const toString = (x: number) => `结果: ${x}`;

const result = pipe(5, addOne, double, toString);
console.log(result); // "结果: 12"
```

### compose

`compose` 从右到左组合函数，数学风格的函数组合。

```typescript
import { compose } from 'melange/fp';

const addOne = (x: number) => x + 1;
const double = (x: number) => x * 2;

// compose(f, g)(x) = f(g(x))
const fn = compose(double, addOne);
console.log(fn(5)); // 12
```

### flow

`flow` 类似于 `pipe`，但返回一个函数而不是立即执行。

```typescript
import { flow } from 'melange/fp';

const process = flow(
  (x: number) => x + 1,
  (x) => x * 2,
  (x) => `结果: ${x}`
);

console.log(process(5)); // "结果: 12"
```

## 柯里化

### curry

将多参数函数转换为一系列单参数函数。

```typescript
import { curry } from 'melange/fp';

const add = (a: number, b: number, c: number) => a + b + c;
const curriedAdd = curry(add);

// 可以分步调用
console.log(curriedAdd(1)(2)(3)); // 6
console.log(curriedAdd(1, 2)(3)); // 6
console.log(curriedAdd(1)(2, 3)); // 6
```

### partial

部分应用函数参数。

```typescript
import { partial } from 'melange/fp';

const greet = (greeting: string, name: string) => `${greeting}, ${name}!`;
const sayHello = partial(greet, 'Hello');

console.log(sayHello('World')); // "Hello, World!"
```

## 高阶函数

### memoize

缓存函数结果，避免重复计算。

```typescript
import { memoize } from 'melange/fp';

const expensiveCalc = memoize((n: number) => {
  console.log('计算中...');
  return n * n;
});

console.log(expensiveCalc(5)); // 计算中... 25
console.log(expensiveCalc(5)); // 25（使用缓存）
```

### once

确保函数只执行一次。

```typescript
import { once } from 'melange/fp';

const init = once(() => {
  console.log('初始化');
  return { ready: true };
});

init(); // "初始化"
init(); // 不执行
```

### tap

执行副作用但返回原值，用于调试。

```typescript
import { pipe, tap } from 'melange/fp';

const result = pipe(
  5,
  tap((x) => console.log('当前值:', x)), // 当前值: 5
  (x) => x * 2,
  tap((x) => console.log('翻倍后:', x)) // 翻倍后: 10
);
```

### not

创建谓词函数的否定版本。

```typescript
import { not } from 'melange/fp';

const isEven = (n: number) => n % 2 === 0;
const isOdd = not(isEven);

console.log(isOdd(3)); // true
console.log(isOdd(4)); // false
```

### allPass / anyPass

组合多个谓词函数。

```typescript
import { allPass, anyPass } from 'melange/fp';

const isPositive = (n: number) => n > 0;
const isEven = (n: number) => n % 2 === 0;
const isLessThan100 = (n: number) => n < 100;

// 所有条件都满足
const isValidNumber = allPass(isPositive, isEven, isLessThan100);
console.log(isValidNumber(50)); // true
console.log(isValidNumber(101)); // false

// 任一条件满足
const isSpecial = anyPass(isPositive, isEven);
console.log(isSpecial(-2)); // true（是偶数）
```

## 下一步

- 了解 [Result 类型](/guide/result-type) 处理错误
- 了解 [Option 类型](/guide/option-type) 处理空值
