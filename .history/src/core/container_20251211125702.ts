/**
 * @fileoverview 依赖注入容器
 * @module melange/core/container
 * @description 提供一个简单而强大的依赖注入容器
 * 支持单例、工厂函数和自动解析。
 */

import type { Constructor } from '../types';

/**
 * 用于标识依赖项的令牌类型。
 * 可以是字符串、符号或类构造函数。
 */
export type Token<T = unknown> = string | symbol | Constructor<T>;

/**
 * 创建实例的工厂函数类型。
 */
export type Factory<T> = (container: Container) => T;

/**
 * 依赖注册的生命周期选项。
 */
export enum Lifecycle {
  /** 每次都创建新实例 */
  Transient = 'transient',
  /** 创建单个实例并重复使用 */
  Singleton = 'singleton',
}

/**
 * 容器中的注册条目。
 */
interface Registration<T> {
  factory: Factory<T>;
  lifecycle: Lifecycle;
  instance?: T;
}

/**
 * 可注入类的元数据键。
 */
const INJECTABLE_METADATA = Symbol('melange:injectable');
const INJECT_METADATA = Symbol('melange:inject');

/**
 * 依赖注入容器。
 * 管理依赖项的生命周期和解析。
 *
 * @description
 * Container 类提供控制反转 (IoC) 功能，
 * 允许您通过在运行时注册和解析依赖项来解耦代码。
 *
 * @example
 * ```typescript
 * // 创建容器
 * const container = new Container();
 *
 * // 注册类
 * container.register('logger', () => new ConsoleLogger());
 *
 * // 注册单例
 * container.registerSingleton('config', () => loadConfig());
 *
 * // 解析依赖项
 * const logger = container.resolve<Logger>('logger');
 *
 * // 使用装饰器
 * @Injectable()
 * class UserService {
 *   constructor(@Inject('logger') private logger: Logger) {}
 * }
 * container.registerClass(UserService);
 * ```
 */
export class Container {
  /**
   * 已注册依赖项的映射
   */
  private registrations: Map<Token, Registration<unknown>> = new Map();

  /**
   * 用于分层解析的父容器
   */
  private parent: Container | undefined;

  /**
   * 创建新的容器实例。
   *
   * @param parent - 用于分层解析的可选父容器
   */
  constructor(parent?: Container) {
    this.parent = parent;
  }

  /**
   * 使用工厂函数注册依赖项。
   *
   * @template T - 依赖项类型
   * @param token - 用于标识依赖项的令牌
   * @param factory - 创建依赖项的工厂函数
   * @param lifecycle - 依赖项的生命周期（默认：Transient）
   * @returns 容器实例，用于链式调用
   */
  public register<T>(
    token: Token<T>,
    factory: Factory<T>,
    lifecycle: Lifecycle = Lifecycle.Transient
  ): this {
    this.registrations.set(token, {
      factory: factory as Factory<unknown>,
      lifecycle,
    });
    return this;
  }

  /**
   * 注册单例依赖项。
   * 工厂函数只会被调用一次，之后返回相同的实例。
   *
   * @template T - 依赖项类型
   * @param token - 用于标识依赖项的令牌
   * @param factory - 创建依赖项的工厂函数
   * @returns 容器实例，用于链式调用
   */
  public registerSingleton<T>(token: Token<T>, factory: Factory<T>): this {
    return this.register(token, factory, Lifecycle.Singleton);
  }

  /**
   * 直接将值注册为单例。
   *
   * @template T - 值类型
   * @param token - 用于标识依赖项的令牌
   * @param value - 要注册的值
   * @returns 容器实例，用于链式调用
   */
  public registerValue<T>(token: Token<T>, value: T): this {
    this.registrations.set(token, {
      factory: () => value,
      lifecycle: Lifecycle.Singleton,
      instance: value,
    });
    return this;
  }

  /**
   * 将类注册为依赖项。
   * 类的实例化会自动解析其依赖项。
   *
   * @template T - 类类型
   * @param ClassConstructor - 要注册的类构造函数
   * @param lifecycle - 依赖项的生命周期（默认：Transient）
   * @returns 容器实例，用于链式调用
   */
  public registerClass<T extends object>(
    ClassConstructor: Constructor<T>,
    lifecycle: Lifecycle = Lifecycle.Transient
  ): this {
    const factory: Factory<T> = container => {
      const injectTokens = this.getInjectMetadata(ClassConstructor);
      const dependencies = injectTokens.map(token => container.resolve(token));
      return new ClassConstructor(...dependencies);
    };

    return this.register(ClassConstructor, factory, lifecycle);
  }

  /**
   * 通过令牌解析依赖项。
   *
   * @template T - 依赖项类型
   * @param token - 标识依赖项的令牌
   * @returns 已解析的依赖项
   * @throws Error 如果依赖项未注册
   */
  public resolve<T>(token: Token<T>): T {
    const registration = this.registrations.get(token) as Registration<T> | undefined;

    if (!registration) {
      // 尝试父容器
      if (this.parent) {
        return this.parent.resolve(token);
      }
      throw new Error(`Dependency not registered: ${String(token)}`);
    }

    if (registration.lifecycle === Lifecycle.Singleton) {
      if (registration.instance === undefined) {
        registration.instance = registration.factory(this);
      }
      return registration.instance;
    }

    return registration.factory(this);
  }

  /**
   * 检查依赖项是否已注册。
   *
   * @param token - 要检查的令牌
   * @returns 如果依赖项已注册则返回 true
   */
  public has(token: Token): boolean {
    if (this.registrations.has(token)) {
      return true;
    }
    return this.parent?.has(token) ?? false;
  }

  /**
   * 移除依赖项注册。
   *
   * @param token - 要移除的令牌
   * @returns 如果注册已被移除则返回 true
   */
  public unregister(token: Token): boolean {
    return this.registrations.delete(token);
  }

  /**
   * 清除所有注册。
   */
  public clear(): void {
    this.registrations.clear();
  }

  /**
   * 创建子容器。
   * 子容器从父容器继承注册。
   *
   * @returns 新的子容器
   */
  public createChild(): Container {
    return new Container(this);
  }

  /**
   * 获取类的注入元数据。
   */
  private getInjectMetadata(target: Constructor): Token[] {
    // 如果可用则使用 reflect-metadata，否则返回空数组
    const reflect = Reflect as unknown as {
      getMetadata?: (key: symbol, target: unknown) => Token[] | undefined;
    };
    return reflect.getMetadata?.(INJECT_METADATA, target) ?? [];
  }
}

/**
 * 为了方便而提供的全局容器实例。
 */
export const globalContainer = new Container();

// ============================================================================
// 依赖注入装饰器
// ============================================================================

/**
 * 将类标记为可注入。
 * 自动依赖解析所必需。
 *
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   constructor(private userRepo: UserRepository) {}
 * }
 * ```
 *
 * @returns 类装饰器
 */
export function Injectable(): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction): TFunction {
    // 如果可用则使用 reflect-metadata
    const reflect = Reflect as unknown as {
      defineMetadata?: (key: symbol, value: unknown, target: unknown) => void;
    };
    reflect.defineMetadata?.(INJECTABLE_METADATA, true, target);
    return target;
  };
}

/**
 * 标记构造函数参数以进行注入。
 *
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   constructor(@Inject('logger') private logger: Logger) {}
 * }
 * ```
 *
 * @param token - 要注入的令牌
 * @returns 参数装饰器
 */
export function Inject(token: Token): ParameterDecorator {
  return function (
    target: object,
    _propertyKey: string | symbol | undefined,
    parameterIndex: number
  ): void {
    // 如果可用则使用 reflect-metadata
    const reflect = Reflect as unknown as {
      getMetadata?: (key: symbol, target: unknown) => Token[] | undefined;
      defineMetadata?: (key: symbol, value: unknown, target: unknown) => void;
    };
    const existingTokens: Token[] = reflect.getMetadata?.(INJECT_METADATA, target) ?? [];
    existingTokens[parameterIndex] = token;
    reflect.defineMetadata?.(INJECT_METADATA, existingTokens, target);
  };
}

/**
 * 将类标记为单例。
 * 结合 @Injectable 和单例生命周期。
 *
 * @example
 * ```typescript
 * @Singleton()
 * class ConfigService {
 *   // 只会存在一个实例
 * }
 * ```
 *
 * @returns 类装饰器
 */
export function Singleton(): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction): TFunction {
    // 如果可用则使用 reflect-metadata
    const reflect = Reflect as unknown as {
      defineMetadata?: (key: symbol | string, value: unknown, target: unknown) => void;
    };
    reflect.defineMetadata?.(INJECTABLE_METADATA, true, target);
    reflect.defineMetadata?.('melange:singleton', true, target);
    return target;
  };
}
