/**
 * @fileoverview 隐私友好的浏览器/设备指纹生成器
 * @module melange/plugins/fingerprint/generator
 * @description
 * 参考 FingerprintJS 的组件化指纹模型：采集组件、稳定序列化、计算哈希并
 * 返回 `visitorId`。与常见高熵指纹方案不同，本实现默认只采集低敏信号，
 * 并通过分桶、归一化、超时保护和内存缓存降低隐私与性能风险。
 */

import { Container, globalContainer } from '../../core';
import { defaultFingerprintCollectors } from './collectors';
import type {
  FingerprintCollector,
  FingerprintCollectorContext,
  FingerprintComponent,
  FingerprintComponentMap,
  FingerprintConfidence,
  FingerprintGenerator,
  FingerprintOptions,
  FingerprintResult,
  RequiredFingerprintOptions,
} from './types';
import { hashString, serializeComponents } from './utils';

/**
 * 指纹模块版本。
 *
 * @description
 * 版本用于标识当前指纹生成策略。默认采集器、归一化规则或哈希输入结构
 * 发生不兼容变化时，应同步调整版本。
 */
export const FINGERPRINT_VERSION = '1.0.0';

/**
 * 指纹生成器 DI 令牌。
 *
 * @description
 * 用于在 Melange 的 `Container` 中注册和解析 `FingerprintGenerator`。
 *
 * @example
 * ```typescript
 * registerFingerprintPlugin(container);
 * const generator = container.resolve<FingerprintGenerator>(FINGERPRINT_GENERATOR);
 * ```
 */
export const FINGERPRINT_GENERATOR = Symbol('melange:fingerprint-generator');

/**
 * 生成器默认配置。
 *
 * @description
 * 默认值选择偏向“足够稳定，但不过度唯一”：启用内存缓存、采用 balanced
 * 隐私模式、使用快速的 FNV-1a 64 位哈希，并对屏幕尺寸进行 100 像素分桶。
 *
 * @internal
 */
const DEFAULT_OPTIONS: RequiredFingerprintOptions = {
  salt: 'melange',
  cache: true,
  cacheTtl: 5 * 60 * 1000,
  componentTimeout: 80,
  privacyMode: 'balanced',
  hashAlgorithm: 'fnv1a64',
  screenBucketSize: 100,
  normalizeUserAgent: true,
  include: [],
  exclude: [],
  collectors: [],
};

/**
 * 内存缓存条目。
 *
 * @description
 * 缓存仅存在于当前 `FingerprintGeneratorImpl` 实例内，不落盘、不写 Cookie、
 * 不写 localStorage。缓存键由配置生成，避免不同配置复用同一个结果。
 *
 * @internal
 */
interface CacheEntry {
  /** 当前缓存对应的配置键。 */
  readonly key: string;
  /** 缓存过期时间戳，来自 `Date.now()`。 */
  readonly expiresAt: number;
  /** 缓存的指纹结果。 */
  readonly result: FingerprintResult;
}

/**
 * 单个采集器的采集结果。
 *
 * @description
 * 当 `component` 不存在时表示该组件被跳过，常见原因包括超时、抛错或返回
 * `undefined`。
 *
 * @internal
 */
interface ComponentCollectionResult {
  /** 采集器键名。 */
  readonly key: string;
  /** 成功采集到的组件。 */
  readonly component?: FingerprintComponent;
}

/**
 * 获取当前时间。
 *
 * @description
 * 浏览器中优先使用 `performance.now()` 以获得更精确的耗时统计；
 * 其他环境降级到 `Date.now()`。
 *
 * @returns 当前时间，单位毫秒
 *
 * @internal
 */
function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/**
 * 合并生成器默认配置和本次调用配置。
 *
 * @description
 * `baseOptions` 来自构造函数，`overrideOptions` 来自 `get()` 调用。
 * 本次调用配置优先级更高。返回值会补齐所有默认值，便于后续采集器直接读取。
 *
 * @param baseOptions - 生成器实例的默认配置
 * @param overrideOptions - 本次调用的覆盖配置
 * @returns 已补齐默认值的内部配置
 *
 * @internal
 */
function resolveOptions(
  baseOptions: FingerprintOptions,
  overrideOptions: FingerprintOptions = {}
): RequiredFingerprintOptions {
  const privacyMode =
    overrideOptions.privacyMode ?? baseOptions.privacyMode ?? DEFAULT_OPTIONS.privacyMode;
  const normalizeUserAgent =
    overrideOptions.normalizeUserAgent ?? baseOptions.normalizeUserAgent ?? privacyMode !== 'debug';

  return {
    salt: overrideOptions.salt ?? baseOptions.salt ?? DEFAULT_OPTIONS.salt,
    cache: overrideOptions.cache ?? baseOptions.cache ?? DEFAULT_OPTIONS.cache,
    cacheTtl: overrideOptions.cacheTtl ?? baseOptions.cacheTtl ?? DEFAULT_OPTIONS.cacheTtl,
    componentTimeout:
      overrideOptions.componentTimeout ??
      baseOptions.componentTimeout ??
      DEFAULT_OPTIONS.componentTimeout,
    privacyMode,
    hashAlgorithm:
      overrideOptions.hashAlgorithm ?? baseOptions.hashAlgorithm ?? DEFAULT_OPTIONS.hashAlgorithm,
    screenBucketSize:
      overrideOptions.screenBucketSize ??
      baseOptions.screenBucketSize ??
      DEFAULT_OPTIONS.screenBucketSize,
    normalizeUserAgent,
    include: overrideOptions.include ?? baseOptions.include ?? DEFAULT_OPTIONS.include,
    exclude: overrideOptions.exclude ?? baseOptions.exclude ?? DEFAULT_OPTIONS.exclude,
    collectors: [
      ...(baseOptions.collectors ?? DEFAULT_OPTIONS.collectors),
      ...(overrideOptions.collectors ?? DEFAULT_OPTIONS.collectors),
    ],
  };
}

/**
 * 创建内存缓存键。
 *
 * @description
 * 缓存键只包含会影响组件采集或哈希结果的配置项。自定义采集器以 key 列表
 * 参与缓存键生成，避免同一生成器实例在不同自定义组件集合下误用缓存。
 *
 * @param options - 已解析配置
 * @returns 可比较的缓存键字符串
 *
 * @internal
 */
function createCacheKey(options: RequiredFingerprintOptions): string {
  return JSON.stringify({
    salt: options.salt,
    privacyMode: options.privacyMode,
    hashAlgorithm: options.hashAlgorithm,
    screenBucketSize: options.screenBucketSize,
    normalizeUserAgent: options.normalizeUserAgent,
    include: options.include,
    exclude: options.exclude,
    collectors: options.collectors.map(collector => collector.key),
  });
}

/**
 * 判断采集器是否应在当前配置下执行。
 *
 * @description
 * include/exclude 的优先级为：先检查 include 是否允许，再检查 exclude 是否排除。
 * 因此调用方可以用 include 缩小范围，再用 exclude 从中剔除少数项。
 *
 * @param collector - 待判断的采集器
 * @param options - 已解析配置
 * @returns 是否执行该采集器
 *
 * @internal
 */
function shouldCollect(
  collector: FingerprintCollector,
  options: RequiredFingerprintOptions
): boolean {
  if (options.include.length > 0 && !options.include.includes(collector.key)) {
    return false;
  }

  return !options.exclude.includes(collector.key);
}

/**
 * 为异步操作添加超时保护。
 *
 * @description
 * 如果操作在指定时间内完成，则返回操作结果；如果超时，则返回 `undefined`。
 * 调用方会把 `undefined` 视为跳过组件。操作完成或失败时会清理定时器，
 * 避免留下短生命周期资源。
 *
 * @template T - 异步操作返回值类型
 * @param operation - 要执行的异步操作
 * @param timeout - 超时时间，单位毫秒
 * @returns 操作结果；超时时返回 undefined
 *
 * @internal
 */
function withTimeout<T>(operation: Promise<T>, timeout: number): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => resolve(undefined), timeout);

    operation.then(
      value => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      error => {
        clearTimeout(timeoutId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  });
}

/**
 * 执行单个采集器并转换为标准组件结果。
 *
 * @description
 * 该函数负责记录采集耗时、填充默认来源和置信度，并把超时或 `undefined`
 * 返回值转换为“跳过组件”。抛错由外层 `get()` 捕获，以便单个组件失败不会
 * 阻断整体指纹生成。
 *
 * @param collector - 要执行的指纹组件采集器
 * @param context - 采集上下文
 * @returns 标准化后的采集结果
 *
 * @internal
 */
async function collectWithTimeout(
  collector: FingerprintCollector,
  context: FingerprintCollectorContext
): Promise<ComponentCollectionResult> {
  const startedAt = context.now();
  const value = await withTimeout(
    Promise.resolve(collector.collect(context)),
    context.options.componentTimeout
  );

  if (value === undefined) {
    return { key: collector.key };
  }

  return {
    key: collector.key,
    component: {
      value,
      source: collector.source ?? 'custom',
      duration: Math.max(0, context.now() - startedAt),
      confidence: Math.max(0, Math.min(1, collector.confidence ?? 0.4)),
    },
  };
}

/**
 * 计算指纹结果置信度。
 *
 * @description
 * 置信度综合考虑组件稳定性平均权重和采集覆盖率。它用于说明结果质量，
 * 不是识别准确率，也不代表某个自然人的身份概率。
 *
 * @param components - 成功采集并参与哈希的组件集合
 * @param skippedCount - 被跳过的组件数量
 * @returns 置信度信息
 *
 * @internal
 */
function calculateConfidence(
  components: FingerprintComponentMap,
  skippedCount: number
): FingerprintConfidence {
  const values = Object.values(components);
  if (values.length === 0) {
    return {
      score: 0,
      componentCount: 0,
      skippedCount,
    };
  }

  const totalWeight = values.reduce((sum, component) => sum + component.confidence, 0);
  const averageWeight = totalWeight / values.length;
  const coverage = values.length / (values.length + skippedCount);
  const score = Math.max(0, Math.min(0.99, averageWeight * 0.7 + coverage * 0.3));

  return {
    score: Number(score.toFixed(3)),
    componentCount: values.length,
    skippedCount,
  };
}

/**
 * 浏览器/设备指纹生成器实现。
 *
 * @description
 * 生成器持有默认配置和一次内存缓存。它会并发执行内置采集器和自定义采集器，
 * 对组件结果做稳定序列化后计算 `visitorId`。
 *
 * @example
 * ```typescript
 * const generator = new FingerprintGeneratorImpl({ salt: 'my-app' });
 * const result = await generator.get();
 * ```
 */
export class FingerprintGeneratorImpl implements FingerprintGenerator {
  /**
   * 当前生成器实例的内存缓存。
   *
   * @remarks
   * 只缓存最后一次匹配配置的结果，不持久化。
   */
  private cacheEntry: CacheEntry | undefined;

  /**
   * 创建指纹生成器。
   *
   * @param baseOptions - 生成器默认配置；后续 `get(options)` 可覆盖这些配置
   */
  constructor(private readonly baseOptions: FingerprintOptions = {}) {}

  /**
   * 获取指纹结果。
   *
   * @description
   * 生成流程：
   * 1. 合并默认配置和本次调用配置；
   * 2. 命中内存缓存时直接返回；
   * 3. 并发采集组件并跳过失败组件；
   * 4. 稳定序列化组件值并计算哈希；
   * 5. 返回 visitorId、组件详情、置信度和耗时。
   *
   * @param options - 本次生成配置，会覆盖构造函数中的同名默认配置
   * @returns 指纹生成结果
   */
  async get(options: FingerprintOptions = {}): Promise<FingerprintResult> {
    const resolvedOptions = resolveOptions(this.baseOptions, options);
    const cacheKey = createCacheKey(resolvedOptions);
    const generatedAt = Date.now();

    if (
      resolvedOptions.cache &&
      this.cacheEntry?.key === cacheKey &&
      this.cacheEntry.expiresAt > generatedAt
    ) {
      return this.cacheEntry.result;
    }

    const startedAt = now();
    const collectors = [...defaultFingerprintCollectors, ...resolvedOptions.collectors].filter(
      collector => shouldCollect(collector, resolvedOptions)
    );
    const context: FingerprintCollectorContext = {
      options: resolvedOptions,
      now,
    };
    const collected = await Promise.all(
      collectors.map(collector =>
        collectWithTimeout(collector, context).catch(
          (): ComponentCollectionResult => ({ key: collector.key })
        )
      )
    );

    const components: FingerprintComponentMap = {};
    let skippedCount = defaultFingerprintCollectors.length + resolvedOptions.collectors.length;

    for (const item of collected) {
      if (item.component) {
        components[item.key] = item.component;
        skippedCount--;
      }
    }

    const input = serializeComponents(components, resolvedOptions.salt);
    const visitorId = await hashString(input, resolvedOptions.hashAlgorithm);
    const result: FingerprintResult = {
      visitorId,
      components,
      confidence: calculateConfidence(components, skippedCount),
      version: FINGERPRINT_VERSION,
      duration: Math.max(0, now() - startedAt),
      generatedAt,
    };

    if (resolvedOptions.cache) {
      this.cacheEntry = {
        key: cacheKey,
        expiresAt: generatedAt + resolvedOptions.cacheTtl,
        result,
      };
    }

    return result;
  }

  /**
   * 清除内存缓存。
   *
   * @description
   * 下次调用 `get()` 时会重新采集组件。该方法不会清理任何浏览器存储，
   * 因为本插件默认不会写入持久化存储。
   */
  clearCache(): void {
    this.cacheEntry = undefined;
  }
}

/**
 * 创建指纹生成器实例。
 *
 * @description
 * 适合需要多次生成指纹、复用默认配置或通过 DI 管理生命周期的场景。
 *
 * @param options - 生成器默认配置
 * @returns 指纹生成器实例
 */
export function createFingerprintGenerator(options: FingerprintOptions = {}): FingerprintGenerator {
  return new FingerprintGeneratorImpl(options);
}

/**
 * 快速获取一次指纹。
 *
 * @description
 * 便捷函数。内部会创建临时生成器并立即调用 `get()`，适合一次性使用。
 * 如果需要复用缓存，请使用 `createFingerprintGenerator()`。
 *
 * @param options - 指纹生成配置
 * @returns 指纹生成结果
 */
export async function getFingerprint(options: FingerprintOptions = {}): Promise<FingerprintResult> {
  return createFingerprintGenerator(options).get();
}

/**
 * 将指纹生成器注册到依赖注入容器。
 *
 * @description
 * 使用 Melange 的容器将 `FingerprintGenerator` 注册为单例，方便应用服务
 * 通过 `FINGERPRINT_GENERATOR` 令牌解析。
 *
 * @param container - 目标容器；默认使用 `globalContainer`
 * @param options - 注册到容器中的生成器默认配置
 * @returns 传入的容器实例，便于链式调用
 */
export function registerFingerprintPlugin(
  container: Container = globalContainer,
  options: FingerprintOptions = {}
): Container {
  return container.registerSingleton(
    FINGERPRINT_GENERATOR,
    () => new FingerprintGeneratorImpl(options)
  );
}

/**
 * 检查当前环境是否具备基础指纹采集能力。
 *
 * @description
 * 只要存在 `navigator` 或 `screen`，就认为具备基础采集能力。Node 环境通常
 * 返回 false，测试或 SSR 场景可据此跳过浏览器相关逻辑。
 *
 * @returns 当前环境是否支持基础指纹采集
 */
export function isFingerprintSupported(): boolean {
  return typeof globalThis.navigator !== 'undefined' || typeof globalThis.screen !== 'undefined';
}
