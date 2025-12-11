/**
 * @fileoverview 方法和类装饰器
 * @module melange/core/decorators
 * @description 提供一系列有用的装饰器，用于增强
 * 类和方法的横切关注点。
 */

/**
 * 用于缓存方法结果的记忆化装饰器。
 * 根据方法的参数缓存结果。
 *
 * @description
 * 此装饰器根据方法的参数缓存其返回值。
 * 后续使用相同参数的调用将返回缓存的值。
 *
 * @example
 * ```typescript
 * class Calculator {
 *   @Memoize()
 *   fibonacci(n: number): number {
 *     if (n <= 1) return n;
 *     return this.fibonacci(n - 1) + this.fibonacci(n - 2);
 *   }
 * }
 * ```
 *
 * @param keyFn - 生成缓存键的可选函数
 * @returns 方法装饰器
 */
export function Memoize(keyFn?: (...args: unknown[]) => string): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
    const cache = new Map<string, unknown>();

    descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
      const key = keyFn ? keyFn(...args) : JSON.stringify(args);

      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = originalMethod.apply(this, args);
      cache.set(key, result);
      return result;
    };

    return descriptor;
  };
}

/**
 * 用于限制方法调用频率的防抖装饰器。
 * 延迟方法执行直到指定的等待时间过后。
 *
 * @example
 * ```typescript
 * class SearchInput {
 *   @Debounce(300)
 *   onSearch(query: string): void {
 *     // 这将在上次调用后300毫秒才被调用
 *     console.log('搜索中:', query);
 *   }
 * }
 * ```
 *
 * @param waitMs - 等待的毫秒数
 * @returns 方法装饰器
 */
export function Debounce(waitMs: number): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    descriptor.value = function (this: unknown, ...args: unknown[]): void {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        originalMethod.apply(this, args);
        timeoutId = null;
      }, waitMs);
    };

    return descriptor;
  };
}

/**
 * 用于限制方法调用频率的节流装饰器。
 * 确保方法在指定的时间段内最多被调用一次。
 *
 * @example
 * ```typescript
 * class ScrollHandler {
 *   @Throttle(100)
 *   onScroll(event: Event): void {
 *     // 这将最多每100毫秒被调用一次
 *     console.log('滚动中');
 *   }
 * }
 * ```
 *
 * @param limitMs - 调用之间的最小时间间隔（毫秒）
 * @returns 方法装饰器
 */
export function Throttle(limitMs: number): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
    let lastCall = 0;

    descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
      const now = Date.now();

      if (now - lastCall >= limitMs) {
        lastCall = now;
        return originalMethod.apply(this, args);
      }

      return undefined;
    };

    return descriptor;
  };
}

/**
 * 用于记录方法调用的日志装饰器。
 * 记录方法进入、退出，以及可选的参数和返回值。
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Log({ logArgs: true, logResult: true })
 *   getUser(id: string): User {
 *     return this.userRepository.findById(id);
 *   }
 * }
 * // 日志: "Entering getUser with args: ["123"]"
 * // 日志: "Exiting getUser with result: { id: "123", name: "John" }"
 * ```
 *
 * @param options - 日志选项
 * @returns 方法装饰器
 */
export function Log(
  options: {
    logArgs?: boolean;
    logResult?: boolean;
    prefix?: string;
  } = {}
): MethodDecorator {
  const { logArgs = false, logResult = false, prefix = '' } = options;

  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
    const methodName = String(propertyKey);

    descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
      const logPrefix = prefix ? `[${prefix}] ` : '';

      if (logArgs) {
        // eslint-disable-next-line no-console
        console.log(`${logPrefix}Entering ${methodName} with args:`, args);
      } else {
        // eslint-disable-next-line no-console
        console.log(`${logPrefix}Entering ${methodName}`);
      }

      try {
        const result = originalMethod.apply(this, args);

        // Handle async methods
        if (result instanceof Promise) {
          return result
            .then(asyncResult => {
              if (logResult) {
                // eslint-disable-next-line no-console
                console.log(`${logPrefix}Exiting ${methodName} with result:`, asyncResult);
              } else {
                // eslint-disable-next-line no-console
                console.log(`${logPrefix}Exiting ${methodName}`);
              }
              return asyncResult;
            })
            .catch(error => {
              // eslint-disable-next-line no-console
              console.error(`${logPrefix}${methodName} threw error:`, error);
              throw error;
            });
        }

        if (logResult) {
          // eslint-disable-next-line no-console
          console.log(`${logPrefix}Exiting ${methodName} with result:`, result);
        } else {
          // eslint-disable-next-line no-console
          console.log(`${logPrefix}Exiting ${methodName}`);
        }

        return result;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`${logPrefix}${methodName} threw error:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 用于验证方法参数的验证装饰器。
 * 在方法执行前运行验证函数。
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Validate((id: string) => {
 *     if (!id) throw new Error('ID 是必需的');
 *   })
 *   getUser(id: string): User {
 *     return this.userRepository.findById(id);
 *   }
 * }
 * ```
 *
 * @param validator - 在输入无效时抛出异常的验证函数
 * @returns 方法装饰器
 */
export function Validate(
  validator: (...args: unknown[]) => void
): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
      validator(...args);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 用于标记方法已弃用的装饰器。
 * 在调用方法时记录警告。
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Deprecated('请改用 getUserById')
 *   getUser(id: string): User {
 *     return this.getUserById(id);
 *   }
 * }
 * ```
 *
 * @param message - 弃用消息
 * @returns 方法装饰器
 */
export function Deprecated(message?: string): MethodDecorator {
  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
    const methodName = String(propertyKey);
    const warningMessage = message ?? `${methodName} is deprecated`;

    descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
      // eslint-disable-next-line no-console
      console.warn(`[DEPRECATED] ${warningMessage}`);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 用于密封类的装饰器。
 * 防止向实例添加新属性。
 *
 * @example
 * ```typescript
 * @Sealed()
 * class Config {
 *   readonly apiUrl: string = 'https://api.example.com';
 * }
 *
 * const config = new Config();
 * config.newProp = 'value'; // 错误: 无法添加属性
 * ```
 *
 * @returns 类装饰器
 */
export function Sealed(): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction): TFunction {
    Object.seal(target);
    Object.seal(target.prototype);
    return target;
  };
}

/**
 * 用于冻结类的装饰器。
 * 防止对实例进行任何修改。
 *
 * @example
 * ```typescript
 * @Frozen()
 * class Constants {
 *   static readonly PI = 3.14159;
 * }
 *
 * Constants.PI = 3; // 错误: 无法修改
 * ```
 *
 * @returns 类装饰器
 */
export function Frozen(): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction): TFunction {
    Object.freeze(target);
    Object.freeze(target.prototype);
    return target;
  };
}

/**
 * 用于自动将方法绑定到类实例的装饰器。
 * 对于作为回调函数传递的方法很有用。
 *
 * @example
 * ```typescript
 * class Button {
 *   @Bind()
 *   onClick() {
 *     console.log(this); // 总是指向 Button 实例
 *   }
 * }
 *
 * const button = new Button();
 * const handler = button.onClick;
 * handler(); // `this` 仍然是 button 实例
 * ```
 *
 * @returns 方法装饰器
 */
export function Bind(): MethodDecorator {
  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    return {
      configurable: true,
      get(this: object) {
        const bound = originalMethod.bind(this);
        Object.defineProperty(this, propertyKey, {
          value: bound,
          configurable: true,
          writable: true,
        });
        return bound;
      },
    };
  };
}

/**
 * 用于自动重试失败方法调用的装饰器。
 *
 * @example
 * ```typescript
 * class ApiClient {
 *   @Retry(3, 1000)
 *   async fetchData(): Promise<Data> {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('请求失败');
 *     return response.json();
 *   }
 * }
 * ```
 *
 * @param maxRetries - 最大重试次数
 * @param delayMs - 重试之间的延迟（毫秒）
 * @returns 方法装饰器
 */
export function Retry(maxRetries: number, delayMs: number = 0): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      let lastError: unknown;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;

          if (attempt < maxRetries && delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

/**
 * 用于为异步方法添加超时的装饰器。
 *
 * @example
 * ```typescript
 * class ApiClient {
 *   @Timeout(5000)
 *   async fetchData(): Promise<Data> {
 *     // 如果这花费超过5秒，将抛出异常
 *     return await fetch('/api/data').then(r => r.json());
 *   }
 * }
 * ```
 *
 * @param timeoutMs - 超时时间（毫秒）
 * @param errorMessage - 可选的错误消息
 * @returns 方法装饰器
 */
export function Timeout(
  timeoutMs: number,
  errorMessage?: string
): MethodDecorator {
  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    const methodName = String(propertyKey);

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(errorMessage ?? `${methodName} timed out after ${timeoutMs}ms`)
          );
        }, timeoutMs);
      });

      return Promise.race([originalMethod.apply(this, args), timeoutPromise]);
    };

    return descriptor;
  };
}
