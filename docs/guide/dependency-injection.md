# 依赖注入

Melange 提供了一个轻量级的 IoC（控制反转）容器，支持依赖注入、生命周期管理和装饰器注入。

## 基本概念

依赖注入（DI）是一种设计模式，通过外部注入依赖而不是在类内部创建，使代码更易于测试和维护。

## 使用容器

### 创建容器

```typescript
import { Container } from 'melange/core';

const container = new Container();
```

### 注册服务

```typescript
// 注册类
container.register('Logger', Logger);

// 注册实例
container.registerInstance('config', { apiUrl: 'https://api.example.com' });

// 注册工厂函数
container.registerFactory('database', () => new Database());
```

### 解析服务

```typescript
const logger = container.resolve<Logger>('Logger');
const config = container.resolve<Config>('config');
```

## 生命周期

### Transient（瞬态）

每次解析都创建新实例。

```typescript
import { Container, Lifecycle } from 'melange/core';

container.register('Service', Service, Lifecycle.Transient);

const s1 = container.resolve('Service');
const s2 = container.resolve('Service');
console.log(s1 === s2); // false
```

### Singleton（单例）

整个容器生命周期内只创建一个实例。

```typescript
container.register('Service', Service, Lifecycle.Singleton);

const s1 = container.resolve('Service');
const s2 = container.resolve('Service');
console.log(s1 === s2); // true
```

## 装饰器注入

### @Injectable

标记类为可注入。

```typescript
import { Injectable } from 'melange/core';

@Injectable()
class UserService {
  getUsers() {
    return ['Alice', 'Bob'];
  }
}
```

### @Inject

注入依赖。

```typescript
import { Injectable, Inject } from 'melange/core';

@Injectable()
class UserController {
  constructor(@Inject('UserService') private userService: UserService) {}

  listUsers() {
    return this.userService.getUsers();
  }
}
```

### @Singleton

将类注册为单例。

```typescript
import { Singleton } from 'melange/core';

@Singleton()
class ConfigService {
  private config = {};

  get(key: string) {
    return this.config[key];
  }
}
```

## 全局容器

Melange 提供了一个全局容器实例。

```typescript
import { globalContainer, Injectable, Singleton } from 'melange/core';

@Singleton()
@Injectable()
class AppConfig {
  apiUrl = 'https://api.example.com';
}

// 注册到全局容器
globalContainer.register('AppConfig', AppConfig);

// 在任何地方解析
const config = globalContainer.resolve<AppConfig>('AppConfig');
```

## 完整示例

```typescript
import { Container, Injectable, Inject, Singleton, Lifecycle } from 'melange/core';

// 定义接口
interface Logger {
  log(message: string): void;
}

interface UserRepository {
  findAll(): User[];
}

// 实现服务
@Injectable()
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

@Injectable()
class InMemoryUserRepository implements UserRepository {
  private users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];

  findAll() {
    return this.users;
  }
}

@Injectable()
class UserService {
  constructor(
    @Inject('Logger') private logger: Logger,
    @Inject('UserRepository') private userRepo: UserRepository
  ) {}

  getAllUsers() {
    this.logger.log('获取所有用户');
    return this.userRepo.findAll();
  }
}

// 配置容器
const container = new Container();
container.register('Logger', ConsoleLogger, Lifecycle.Singleton);
container.register('UserRepository', InMemoryUserRepository);
container.register('UserService', UserService);

// 使用
const userService = container.resolve<UserService>('UserService');
const users = userService.getAllUsers();
// [LOG] 获取所有用户
// [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
```

## 测试友好

依赖注入使得模拟依赖变得简单：

```typescript
// 测试时使用模拟实现
const mockLogger = { log: jest.fn() };
const mockRepo = { findAll: () => [{ id: 1, name: 'Test' }] };

container.registerInstance('Logger', mockLogger);
container.registerInstance('UserRepository', mockRepo);

const userService = container.resolve<UserService>('UserService');
userService.getAllUsers();

expect(mockLogger.log).toHaveBeenCalled();
```
