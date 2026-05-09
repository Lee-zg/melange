/**
 * @fileoverview 指纹识别模块类型定义
 * @module melange/plugins/fingerprint/types
 * @description
 * 定义指纹识别插件对外暴露的配置、结果、组件和采集器类型。
 *
 * 本模块的类型设计参考 FingerprintJS 的“组件集合 -> 稳定哈希”模型，
 * 但默认语义偏向隐私保护：组件值必须可序列化、可解释，并且鼓励调用方
 * 使用低敏、低熵信号，不采集音频、Canvas 像素、字体枚举、浏览历史等
 * 可能超出用户预期的内容。
 */

/**
 * 内置指纹组件键。
 *
 * @description
 * 这些键对应 `defaultFingerprintCollectors` 中提供的默认采集器。
 * 调用方可以在 `FingerprintOptions.include` 或 `FingerprintOptions.exclude`
 * 中使用这些键来精确控制组件范围。
 *
 * @remarks
 * 内置键只覆盖低敏浏览器环境信息和能力检测信息。若业务需要新增字段，
 * 应通过 `FingerprintCollector` 注册自定义采集器，并确保已获得合规授权。
 */
export type FingerprintComponentKey =
  /** 浏览器 User-Agent。默认会归一化补丁版本和构建号。 */
  | 'userAgent'
  /** 操作系统或浏览器平台标识，例如 Win32、MacIntel。 */
  | 'platform'
  /** 浏览器首选语言，例如 zh-CN。 */
  | 'language'
  /** 浏览器语言偏好列表，strict 模式下仅保留首选语言。 */
  | 'languages'
  /** IANA 时区名称，strict 模式下仅记录是否可用。 */
  | 'timezone'
  /** 当前时区偏移量，单位为分钟。 */
  | 'timezoneOffset'
  /** 屏幕尺寸信息，balanced 模式下按桶归一化。 */
  | 'screen'
  /** 屏幕色深。 */
  | 'colorDepth'
  /** 设备像素比，默认按 0.25 桶归一化。 */
  | 'pixelRatio'
  /** 硬件线程数，默认按区间分桶。 */
  | 'hardwareConcurrency'
  /** 设备内存，默认按区间分桶。 */
  | 'deviceMemory'
  /** 最大触摸点数量。 */
  | 'maxTouchPoints'
  /** Cookie 是否可用。 */
  | 'cookiesEnabled'
  /** localStorage/sessionStorage 能力检测结果。 */
  | 'storage'
  /** IndexedDB 是否可用。 */
  | 'indexedDB'
  /** 浏览器 Do Not Track 偏好。 */
  | 'doNotTrack';

/**
 * 指纹组件来源。
 *
 * @description
 * 来源用于解释组件的敏感度和用途，便于调用方在日志、审计或调试界面中
 * 判断某个组件为什么会进入指纹计算。
 */
export type FingerprintComponentSource =
  /** 低熵环境信息，如语言、平台、分桶后的屏幕尺寸。 */
  | 'low-entropy'
  /** 能力检测信息，如存储能力、Cookie 可用性。 */
  | 'capability'
  /** 调用方通过 `collectors` 传入的业务自定义组件。 */
  | 'custom';

/**
 * 指纹隐私模式。
 *
 * @description
 * 隐私模式会影响默认采集器如何处理可能带来唯一性的字段。
 * 模式越严格，组件值越粗粒度，visitorId 的稳定性和区分度也会相应下降。
 */
export type FingerprintPrivacyMode =
  /** 最小化模式：尽量只保留可用性或首选项，适合隐私优先场景。 */
  | 'strict'
  /** 平衡模式：默认模式，保留低敏信号并对高波动字段分桶/归一化。 */
  | 'balanced'
  /** 调试模式：保留更多原始值，便于定位环境差异，不建议生产默认启用。 */
  | 'debug';

/**
 * 指纹哈希算法。
 *
 * @description
 * `fnv1a64` 体积小、速度快，适合本地非安全标识生成。
 * `sha256` 会优先使用 Web Crypto API，在不可用时自动降级到 `fnv1a64`。
 *
 * @remarks
 * 指纹哈希不是加密身份凭证，不应作为鉴权、风控唯一依据或秘密值使用。
 */
export type FingerprintHashAlgorithm =
  /** 64 位 FNV-1a 非加密哈希，默认算法。 */
  | 'fnv1a64'
  /** SHA-256 哈希，依赖 `globalThis.crypto.subtle`。 */
  | 'sha256';

/**
 * 可序列化的指纹组件值。
 *
 * @description
 * 组件值必须可以稳定序列化，才能保证相同组件集合在不同执行时机生成相同
 * 的哈希输入。这里刻意限制为 JSON 兼容值，避免函数、DOM 节点、错误对象、
 * Map/Set 等不可预测结构进入指纹计算。
 */
export type FingerprintValue =
  /** 字符串组件值。 */
  | string
  /** 数字组件值。应优先使用分桶后的粗粒度数值。 */
  | number
  /** 布尔组件值，常用于能力检测。 */
  | boolean
  /** 明确表示采集不到或环境不支持。 */
  | null
  /** 由可序列化值组成的只读数组。 */
  | readonly FingerprintValue[]
  /** 键为字符串、值为可序列化值的只读对象。 */
  | { readonly [key: string]: FingerprintValue };

/**
 * 单个指纹组件。
 *
 * @template T - 组件值类型，必须是可稳定序列化的 `FingerprintValue`
 *
 * @description
 * 组件是指纹计算的最小单元。每个组件包含值、来源、采集耗时和稳定性权重。
 * 生成器只会将 `value` 写入哈希输入，其余字段用于调试、审计和置信度计算。
 */
export interface FingerprintComponent<T extends FingerprintValue = FingerprintValue> {
  /**
   * 组件值。
   *
   * @remarks
   * 该值会参与 `visitorId` 计算。请勿放入直接身份信息、精确位置、账号 ID、
   * 设备序列号或其他可单独识别个人的数据。
   */
  readonly value: T;

  /**
   * 组件来源。
   *
   * @remarks
   * 来源不会参与哈希计算，只用于解释该组件来自内置低熵采集、能力检测，
   * 还是调用方提供的自定义采集器。
   */
  readonly source: FingerprintComponentSource;

  /**
   * 组件采集耗时，单位毫秒。
   *
   * @remarks
   * 该字段用于性能分析，不参与哈希计算。耗时由 `context.now()` 计算，
   * 在浏览器中通常来自 `performance.now()`。
   */
  readonly duration: number;

  /**
   * 组件稳定性权重，范围 0-1。
   *
   * @remarks
   * 数值越高表示该组件越稳定、越适合参与“同一浏览器环境”的粗略判断。
   * 它只参与 `confidence.score` 计算，不会改变组件值或哈希算法。
   */
  readonly confidence: number;
}

/**
 * 指纹组件集合。
 *
 * @description
 * 以组件键为索引的映射。生成哈希前会按键名排序，以避免对象插入顺序影响
 * `visitorId`。
 */
export type FingerprintComponentMap = Record<string, FingerprintComponent>;

/**
 * 指纹置信度说明。
 *
 * @description
 * 置信度是一个可解释的质量指标，用于告诉调用方本次结果包含多少组件、
 * 跳过了多少组件，以及组件稳定性的大致水平。
 *
 * @remarks
 * 置信度不是概率，不代表识别某个自然人的准确率，也不应作为风控阈值的
 * 唯一依据。
 */
export interface FingerprintConfidence {
  /**
   * 置信度分数，范围 0-1。
   *
   * @remarks
   * 当前实现会结合组件平均权重和采集覆盖率，并将最高值限制在 0.99，
   * 避免表达“绝对确定”的含义。
   */
  readonly score: number;

  /**
   * 参与哈希的组件数量。
   *
   * @remarks
   * 仅统计成功采集且没有超时/抛错的组件。
   */
  readonly componentCount: number;

  /**
   * 被跳过的组件数量。
   *
   * @remarks
   * 组件可能因为 include/exclude 过滤、采集异常、超时或返回 `undefined`
   * 被跳过。
   */
  readonly skippedCount: number;
}

/**
 * 指纹生成结果。
 *
 * @description
 * 与 FingerprintJS 类似，结果包含稳定标识 `visitorId` 和组件详情
 * `components`。Melange 额外提供 `confidence`、`duration` 和版本信息，
 * 方便业务侧做性能监控和兼容判断。
 */
export interface FingerprintResult {
  /**
   * 生成的访问者标识。
   *
   * @remarks
   * 这是组件值稳定序列化后计算出的哈希。它不是用户 ID，也不是安全令牌；
   * 不建议跨业务、跨站点或无限期保存。
   */
  readonly visitorId: string;

  /**
   * 参与生成指纹的组件。
   *
   * @remarks
   * 只包含成功采集的组件。被 include/exclude 过滤、超时或抛错的组件不会出现。
   */
  readonly components: FingerprintComponentMap;

  /**
   * 本次指纹结果的质量说明。
   */
  readonly confidence: FingerprintConfidence;

  /**
   * 指纹模块版本。
   *
   * @remarks
   * 当默认采集器、归一化策略或哈希输入格式变化时，版本可用于帮助调用方
   * 做兼容处理。
   */
  readonly version: string;

  /**
   * 本次生成总耗时，单位毫秒。
   *
   * @remarks
   * 包括组件采集、序列化和哈希计算耗时。
   */
  readonly duration: number;

  /**
   * 生成时间戳，来自 `Date.now()`。
   */
  readonly generatedAt: number;
}

/**
 * 指纹组件采集上下文。
 *
 * @description
 * 生成器会把上下文传给每个内置或自定义采集器。上下文中包含已合并默认值
 * 的配置，以及统一的时间函数，方便采集器根据隐私模式调整返回值。
 */
export interface FingerprintCollectorContext {
  /**
   * 当前已解析配置。
   *
   * @remarks
   * 这里的配置已合并生成器默认配置和本次调用覆盖配置，不包含 `undefined`。
   */
  readonly options: RequiredFingerprintOptions;

  /**
   * 当前时间函数，返回毫秒级时间。
   *
   * @returns 当前高精度或普通时间戳
   */
  now(): number;
}

/**
 * 自定义指纹组件采集器。
 *
 * @template T - 采集器返回值类型，必须是 `FingerprintValue`
 *
 * @description
 * 业务可以通过 `FingerprintOptions.collectors` 传入自定义采集器，将自身
 * 已合法获得、低敏且可解释的状态纳入指纹。采集器可以同步或异步返回。
 *
 * @remarks
 * 采集器返回 `undefined` 会被视为跳过组件；返回 `null` 则表示“明确无值”，
 * 会参与哈希计算。采集器抛错或超时也会被跳过，不会中断整体指纹生成。
 */
export interface FingerprintCollector<T extends FingerprintValue = FingerprintValue> {
  /**
   * 组件键。
   *
   * @remarks
   * 键名会出现在 `components` 中，并参与稳定排序。建议使用业务内唯一、
   * 语义清晰的 camelCase 名称，避免覆盖内置组件，除非明确需要替换。
   */
  readonly key: string;

  /**
   * 组件来源。
   *
   * @defaultValue `'custom'`
   */
  readonly source?: FingerprintComponentSource;

  /**
   * 组件稳定性权重，范围 0-1。
   *
   * @defaultValue `0.4`
   *
   * @remarks
   * 权重只影响置信度，不影响哈希。自定义低敏业务状态通常建议给较低权重。
   */
  readonly confidence?: number;

  /**
   * 采集组件值。
   *
   * @param context - 指纹组件采集上下文，包含隐私模式、超时配置和时间函数
   * @returns 可序列化组件值；返回 Promise 时生成器会等待其完成或超时
   */
  collect(context: FingerprintCollectorContext): T | Promise<T>;
}

/**
 * 指纹生成配置。
 *
 * @description
 * 配置既可以传给 `createFingerprintGenerator` 作为实例默认值，也可以传给
 * `get` 或 `getFingerprint` 作为本次调用覆盖值。本次调用配置优先级更高。
 */
export interface FingerprintOptions {
  /**
   * 命名空间盐值，用于隔离不同业务域的指纹结果。
   *
   * @defaultValue `'melange'`
   *
   * @remarks
   * 建议每个产品、租户或用途使用不同盐值，避免不同业务之间的 visitorId
   * 可以直接关联。
   */
  readonly salt?: string;

  /**
   * 是否启用内存缓存。
   *
   * @defaultValue `true`
   *
   * @remarks
   * 缓存只存在于当前生成器实例内，不写入 localStorage、Cookie 或 IndexedDB。
   */
  readonly cache?: boolean;

  /**
   * 内存缓存有效期，单位毫秒。
   *
   * @defaultValue `300000`
   */
  readonly cacheTtl?: number;

  /**
   * 单个组件采集超时时间，单位毫秒。
   *
   * @defaultValue `80`
   *
   * @remarks
   * 超时的组件会被跳过，避免慢组件拖累首屏或交互流程。
   */
  readonly componentTimeout?: number;

  /**
   * 指纹隐私模式。
   *
   * @defaultValue `'balanced'`
   */
  readonly privacyMode?: FingerprintPrivacyMode;

  /**
   * 指纹哈希算法。
   *
   * @defaultValue `'fnv1a64'`
   */
  readonly hashAlgorithm?: FingerprintHashAlgorithm;

  /**
   * 屏幕尺寸分桶大小。
   *
   * @defaultValue `100`
   *
   * @remarks
   * 仅影响非 debug 模式下的屏幕尺寸组件。值越大，隐私越强，区分度越低。
   */
  readonly screenBucketSize?: number;

  /**
   * 是否归一化 User-Agent。
   *
   * @defaultValue
   * `balanced` 和 `strict` 模式为 `true`，`debug` 模式为 `false`。
   */
  readonly normalizeUserAgent?: boolean;

  /**
   * 只采集指定组件。
   *
   * @remarks
   * 为空数组或未提供时表示不限制。若同时提供 `include` 和 `exclude`，
   * 会先判断 include，再应用 exclude。
   */
  readonly include?: readonly string[];

  /**
   * 排除指定组件。
   *
   * @remarks
   * 可用于关闭业务不希望采集的内置组件，例如 `userAgent` 或 `screen`。
   */
  readonly exclude?: readonly string[];

  /**
   * 自定义低敏组件采集器。
   *
   * @remarks
   * 自定义采集器会追加到内置采集器之后，并受 include/exclude 和超时配置控制。
   */
  readonly collectors?: readonly FingerprintCollector[];
}

/**
 * 内部已填充默认值的配置。
 *
 * @description
 * 生成器内部使用的配置形态。与 `FingerprintOptions` 不同，这里所有字段都
 * 已经有确定值，便于采集器和内部函数直接读取。
 */
export interface RequiredFingerprintOptions {
  /** 命名空间盐值。 */
  readonly salt: string;
  /** 是否启用当前生成器实例内的内存缓存。 */
  readonly cache: boolean;
  /** 缓存有效期，单位毫秒。 */
  readonly cacheTtl: number;
  /** 单组件采集超时时间，单位毫秒。 */
  readonly componentTimeout: number;
  /** 已解析隐私模式。 */
  readonly privacyMode: FingerprintPrivacyMode;
  /** 已解析哈希算法。 */
  readonly hashAlgorithm: FingerprintHashAlgorithm;
  /** 已解析屏幕尺寸分桶大小。 */
  readonly screenBucketSize: number;
  /** 已解析 User-Agent 归一化开关。 */
  readonly normalizeUserAgent: boolean;
  /** 已解析 include 列表。 */
  readonly include: readonly string[];
  /** 已解析 exclude 列表。 */
  readonly exclude: readonly string[];
  /** 已解析自定义采集器列表。 */
  readonly collectors: readonly FingerprintCollector[];
}

/**
 * 指纹生成器接口。
 *
 * @description
 * 生成器封装默认配置和内存缓存，适合在应用启动时创建一次并通过依赖注入
 * 或模块单例复用。
 */
export interface FingerprintGenerator {
  /**
   * 获取指纹结果。
   *
   * @param options - 本次调用的覆盖配置
   * @returns 指纹生成结果
   */
  get(options?: FingerprintOptions): Promise<FingerprintResult>;

  /**
   * 清除当前生成器实例的内存缓存。
   *
   * @remarks
   * 该方法不会清除浏览器存储，因为本模块默认不会写入持久化存储。
   */
  clearCache(): void;
}
