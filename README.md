# Melange

<p align="center">
  <strong>一个现代化的 JavaScript/TypeScript 工具库</strong>
</p>

<p align="center">
  <img alt="npm version" src="https://img.shields.io/npm/v/@lee-zg/melange">
  <img alt="License" src="https://img.shields.io/npm/l/@lee-zg/melange">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.0+-blue">
  <img alt="Bundle Size" src="https://img.shields.io/bundlephobia/minzip/@lee-zg/melange">
</p>

## 特性

- **函数式编程** - 组合、管道、柯里化、Result/Option 类型
- **面向对象工具** - 事件发射器、DI 容器、装饰器
- **实用函数** - 对象、数组、字符串操作
- **类型安全** - 完整的 TypeScript 支持和全面的类型定义
- **可摇树优化** - 只导入你需要的内容
- **零依赖** - 轻量级且自包含
- **文档完善** - 每个函数都有 JSDoc 注释

## 安装

```bash
# npm
npm install @lee-zg/melange

# yarn
yarn add @lee-zg/melange

# pnpm
pnpm add @lee-zg/melange
```

## 快速开始

```typescript
import { pipe, curry, debounce, EventEmitter } from '@lee-zg/melange';

// 函数式编程
const result = pipe(
  5,
  x => x + 1,
  x => x * 2,
  x => x.toString()
);
// result = "12"

// 柯里化
const add = curry((a: number, b: number) => a + b);
const addFive = add(5);
addFive(10); // 15

// 计时工具
const search = debounce((query: string) => {
  console.log('搜索中:', query);
}, 300);

// 事件处理
const emitter = new EventEmitter<{ message: string }>();
emitter.on('message', msg => console.log(msg));
emitter.emit('message', 'Hello, World!');
```

## 模块

Melange 组织为三个主要模块：

### 函数式编程 (`@lee-zg/melange/fp`)

```typescript
import { 
  pipe, compose, flow,           // 函数组合
  curry, partial,                // 柯里化和部分应用
  ok, err, mapResult,            // Result 类型（错误处理）
  some, none, mapOption,         // Option 类型（可空值处理）
  memoize, once, identity        // 高阶函数
} from '@lee-zg/melange/fp';
```

### 实用工具 (`@lee-zg/melange/utils`)

```typescript
import {
  deepClone, deepMerge, pick, omit,     // 对象工具
  chunk, unique, groupBy, sortBy,        // 数组工具
  camelCase, snakeCase, truncate,        // 字符串工具
  debounce, throttle, delay, retry,      // 计时工具
  isString, isNumber, isEmail            // 类型守卫
} from '@lee-zg/melange/utils';
```

### 核心面向对象 (`@lee-zg/melange/core`)

```typescript
import {
  EventEmitter,                          // 发布/订阅模式
  Container, Injectable, Inject,         // 依赖注入
  Memoize, Debounce, Throttle, Log,     // 方法装饰器
  Disposable, DisposableStore            // 资源管理
} from '@lee-zg/melange/core';
```

## API 参考

### 函数式编程

#### 函数组合

| 函数 | 描述 |
|----------|-------------|
| `pipe(...fns)` | 从左到右管道函数 |
| `compose(...fns)` | 从右到左组合函数 |
| `flow(value, ...fns)` | 通过函数应用值 |

#### Result 类型

```typescript
type Result<T, E> = Ok<T> | Err<E>;

// 创建
const success = ok(42);
const failure = err('error');

// 检查
if (isOk(result)) { /* 使用 result.value */ }
if (isErr(result)) { /* 处理 result.error */ }

// 转换
const doubled = mapResult(success, x => x * 2);
const value = unwrapOr(result, defaultValue);
```

#### Option 类型

```typescript
type Option<T> = Some<T> | None;

// 创建
const value = some(42);
const empty = none();

// 检查
if (isSome(option)) { /* 使用 option.value */ }
if (isNone(option)) { /* 处理缺失 */ }

// 转换
const doubled = mapOption(value, x => x * 2);
const result = getOrElse(option, defaultValue);
```

### 装饰器

```typescript
class Example {
  @Memoize()
  expensiveCalculation(n: number): number {
    return fibonacci(n);
  }

  @Debounce(300)
  onSearch(query: string): void {
    this.search(query);
  }

  @Log({ logArgs: true, logResult: true })
  processData(data: Data): Result {
    return process(data);
  }

  @Deprecated('请使用 newMethod 方法代替')
  oldMethod(): void {
    this.newMethod();
  }
}
```

### 事件发射器

```typescript
interface AppEvents {
  'user:login': { userId: string };
  'user:logout': { userId: string };
  'error': Error;
}

const events = new EventEmitter<AppEvents>();

// 订阅
const subscription = events.on('user:login', user => {
  console.log(`用户 ${user.userId} 已登录`);
});

// 触发
events.emit('user:login', { userId: '123' });

// 一次性监听器
events.once('error', err => handleError(err));

// 取消订阅
subscription.unsubscribe();
```

### 依赖注入

```typescript
const container = new Container();

// 注册依赖
container.register('logger', () => new ConsoleLogger());
container.registerSingleton('config', () => loadConfig());
container.registerValue('apiUrl', 'https://api.example.com');

// 解析
const logger = container.resolve<Logger>('logger');

// 使用装饰器
@Injectable()
class UserService {
  constructor(@Inject('logger') private logger: Logger) {}
}
```

## TypeScript 支持

Melange 使用 TypeScript 编写，并提供全面的类型定义：

```typescript
import type {
  Result, Ok, Err,
  Option, Some, None,
  Predicate, Mapper, Reducer,
  DeepPartial, DeepReadonly,
  Brand, NonEmptyString, Email
} from '@lee-zg/melange';
```

## 浏览器支持

Melange 支持所有现代浏览器和 Node.js 18+：

- Chrome 80+
- Firefox 80+
- Safari 14+
- Edge 80+
- Node.js 18+

## 贡献

欢迎贡献！请阅读我们的[贡献指南](CONTRIBUTING.md)了解更多详情。

## 许可证

MIT © [Melange 贡献者](LICENSE)
