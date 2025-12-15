# 装饰器

Melange 提供了一系列实用的装饰器，简化常见的编程模式。

## 启用装饰器

在 `tsconfig.json` 中启用装饰器支持：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## 方法装饰器

### @Memoize

缓存方法的返回值。

```typescript
import { Memoize } from 'melange/core';

class Calculator {
  @Memoize()
  expensiveCalculation(n: number): number {
    console.log('计算中...');
    return n * n;
  }
}

const calc = new Calculator();
calc.expensiveCalculation(5); // 计算中... 25
calc.expensiveCalculation(5); // 25（使用缓存）
```

### @Debounce

防抖装饰器，延迟执行方法。

```typescript
import { Debounce } from 'melange/core';

class SearchService {
  @Debounce(300)
  search(query: string): void {
    console.log('搜索:', query);
  }
}

const service = new SearchService();
service.search('a');
service.search('ab');
service.search('abc'); // 只有这次会执行
```

### @Throttle

节流装饰器，限制方法执行频率。

```typescript
import { Throttle } from 'melange/core';

class ScrollHandler {
  @Throttle(100)
  onScroll(position: number): void {
    console.log('滚动位置:', position);
  }
}
```

### @Log

自动记录方法调用日志。

```typescript
import { Log } from 'melange/core';

class UserService {
  @Log()
  createUser(name: string): { id: number; name: string } {
    return { id: 1, name };
  }
}

const service = new UserService();
service.createUser('Alice');
// 日志: [UserService.createUser] 参数: ["Alice"]
// 日志: [UserService.createUser] 返回: {"id":1,"name":"Alice"}
```

### @Retry

自动重试失败的方法。

```typescript
import { Retry } from 'melange/core';

class ApiService {
  private attempts = 0;

  @Retry(3, 1000) // 最多重试3次，间隔1秒
  async fetchData(): Promise<string> {
    this.attempts++;
    if (this.attempts < 3) {
      throw new Error('网络错误');
    }
    return '成功';
  }
}
```

### @Timeout

为方法设置超时限制。

```typescript
import { Timeout } from 'melange/core';

class SlowService {
  @Timeout(5000) // 5秒超时
  async longRunningTask(): Promise<void> {
    // 如果超过5秒会抛出超时错误
  }
}
```

### @Validate

验证方法参数。

```typescript
import { Validate } from 'melange/core';

class UserService {
  @Validate((name: string) => name.length > 0, '名称不能为空')
  createUser(name: string): void {
    console.log('创建用户:', name);
  }
}

const service = new UserService();
service.createUser(''); // 抛出错误: 名称不能为空
```

### @Deprecated

标记方法为已废弃。

```typescript
import { Deprecated } from 'melange/core';

class OldService {
  @Deprecated('请使用 newMethod 代替')
  oldMethod(): void {
    // 调用时会输出警告
  }
}
```

### @Bind

自动绑定方法的 `this` 上下文。

```typescript
import { Bind } from 'melange/core';

class Counter {
  count = 0;

  @Bind()
  increment(): void {
    this.count++;
  }
}

const counter = new Counter();
const fn = counter.increment;
fn(); // this 正确绑定，count = 1
```

## 类装饰器

### @Sealed

封闭类，阻止添加新属性。

```typescript
import { Sealed } from 'melange/core';

@Sealed()
class Config {
  host = 'localhost';
  port = 3000;
}

const config = new Config();
// config.newProp = 'value'; // 错误：对象已封闭
```

### @Frozen

冻结类实例，完全不可变。

```typescript
import { Frozen } from 'melange/core';

@Frozen()
class ImmutableData {
  value = 42;
}

const data = new ImmutableData();
// data.value = 100; // 错误：对象已冻结
```

## 下一步

- 了解[依赖注入](/guide/dependency-injection)容器
