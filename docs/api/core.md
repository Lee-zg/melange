# 核心模块 API

## 事件发射器

### EventEmitter

类型安全的事件发射器。

```typescript
class EventEmitter<Events extends Record<string, unknown>> {
  on<K extends keyof Events>(event: K, handler: (data: Events[K]) => void): () => void;
  once<K extends keyof Events>(event: K, handler: (data: Events[K]) => void): () => void;
  off<K extends keyof Events>(event: K, handler: (data: Events[K]) => void): void;
  emit<K extends keyof Events>(event: K, data: Events[K]): void;
  removeAllListeners<K extends keyof Events>(event?: K): void;
}
```

**示例：**
```typescript
import { EventEmitter } from 'melange/core';

interface AppEvents {
  userLogin: { userId: string; timestamp: number };
  userLogout: { userId: string };
}

const emitter = new EventEmitter<AppEvents>();

emitter.on('userLogin', (data) => {
  console.log(`用户 ${data.userId} 登录于 ${data.timestamp}`);
});

emitter.emit('userLogin', { userId: '123', timestamp: Date.now() });
```

---

## 依赖注入

### Container

IoC 容器。

```typescript
class Container {
  register<T>(token: string, implementation: new (...args: any[]) => T, lifecycle?: Lifecycle): void;
  registerInstance<T>(token: string, instance: T): void;
  registerFactory<T>(token: string, factory: () => T): void;
  resolve<T>(token: string): T;
  has(token: string): boolean;
  clear(): void;
}
```

---

### Lifecycle

服务生命周期枚举。

```typescript
enum Lifecycle {
  Transient = 'transient',  // 每次解析创建新实例
  Singleton = 'singleton',  // 单例
}
```

---

### globalContainer

全局容器实例。

```typescript
const globalContainer: Container;
```

---

### @Injectable

标记类为可注入。

```typescript
function Injectable(): ClassDecorator;
```

---

### @Inject

注入依赖。

```typescript
function Inject(token: string): ParameterDecorator;
```

---

### @Singleton

注册为单例服务。

```typescript
function Singleton(): ClassDecorator;
```

---

## 方法装饰器

### @Memoize

缓存方法返回值。

```typescript
function Memoize(): MethodDecorator;
```

---

### @Debounce

防抖装饰器。

```typescript
function Debounce(wait: number): MethodDecorator;
```

---

### @Throttle

节流装饰器。

```typescript
function Throttle(wait: number): MethodDecorator;
```

---

### @Log

日志装饰器。

```typescript
function Log(options?: { logArgs?: boolean; logResult?: boolean }): MethodDecorator;
```

---

### @Validate

参数验证装饰器。

```typescript
function Validate(validator: (...args: any[]) => boolean, message?: string): MethodDecorator;
```

---

### @Deprecated

废弃警告装饰器。

```typescript
function Deprecated(message?: string): MethodDecorator;
```

---

### @Retry

自动重试装饰器。

```typescript
function Retry(times: number, delay?: number): MethodDecorator;
```

---

### @Timeout

超时装饰器。

```typescript
function Timeout(ms: number): MethodDecorator;
```

---

### @Bind

自动绑定 this 装饰器。

```typescript
function Bind(): MethodDecorator;
```

---

## 类装饰器

### @Sealed

封闭类（阻止添加新属性）。

```typescript
function Sealed(): ClassDecorator;
```

---

### @Frozen

冻结类实例（完全不可变）。

```typescript
function Frozen(): ClassDecorator;
```

---

## 可释放资源

### Disposable

可释放资源的抽象基类。

```typescript
abstract class Disposable {
  protected _isDisposed: boolean;
  get isDisposed(): boolean;
  dispose(): void;
  protected abstract doDispose(): void;
}
```

---

### DisposableStore

管理多个可释放资源的容器。

```typescript
class DisposableStore extends Disposable {
  add<T extends IDisposable>(disposable: T): T;
  delete<T extends IDisposable>(disposable: T): void;
  clear(): void;
}
```

---

### toDisposable

将函数包装为可释放资源。

```typescript
function toDisposable(dispose: () => void): IDisposable;
```

---

### combineDisposables

组合多个可释放资源。

```typescript
function combineDisposables(...disposables: IDisposable[]): IDisposable;
```
