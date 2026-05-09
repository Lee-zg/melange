/**
 * @fileoverview 指纹识别模块内置采集器
 * @module melange/plugins/fingerprint/collectors
 * @description
 * 提供默认的低敏浏览器/设备环境采集器。采集器只读取同步可得的环境信息，
 * 不触发权限弹窗，不渲染 Canvas/WebGL，不枚举字体或插件，也不写入持久化存储。
 */

import type { FingerprintCollector, FingerprintCollectorContext, FingerprintValue } from './types';
import {
  bucketDeviceMemory,
  bucketHardwareConcurrency,
  bucketNumber,
  normalizeUserAgent,
} from './utils';

/**
 * 指纹模块需要读取的 Navigator 子集。
 *
 * @description
 * 单独定义轻量接口是为了避免依赖非标准字段的完整 DOM 类型，同时让 Node
 * 测试环境可以通过简单对象模拟浏览器能力。
 */
interface NavigatorLike {
  /** 浏览器 User-Agent 字符串。 */
  readonly userAgent?: string;
  /** 浏览器平台字符串，例如 Win32、MacIntel。 */
  readonly platform?: string;
  /** 首选语言。 */
  readonly language?: string;
  /** 语言偏好列表。 */
  readonly languages?: readonly string[];
  /** Cookie 是否启用。 */
  readonly cookieEnabled?: boolean;
  /** 硬件线程数。 */
  readonly hardwareConcurrency?: number;
  /** 设备内存，单位通常为 GB；不是所有浏览器都支持。 */
  readonly deviceMemory?: number;
  /** 最大触摸点数量。 */
  readonly maxTouchPoints?: number;
  /** Do Not Track 偏好。 */
  readonly doNotTrack?: string | null;
}

/**
 * 指纹模块需要读取的 Screen 子集。
 */
interface ScreenLike {
  /** 屏幕宽度，单位 CSS 像素。 */
  readonly width?: number;
  /** 屏幕高度，单位 CSS 像素。 */
  readonly height?: number;
  /** 可用屏幕宽度，debug 模式下用于排查。 */
  readonly availWidth?: number;
  /** 可用屏幕高度，debug 模式下用于排查。 */
  readonly availHeight?: number;
  /** 屏幕色深。 */
  readonly colorDepth?: number;
}

/**
 * 安全读取 Navigator。
 *
 * @returns 当前环境的 Navigator 子集；Node 或无浏览器环境下返回 undefined
 */
function getNavigator(): NavigatorLike | undefined {
  return typeof globalThis.navigator === 'undefined'
    ? undefined
    : (globalThis.navigator as NavigatorLike);
}

/**
 * 安全读取 Screen。
 *
 * @returns 当前环境的 Screen 子集；Node 或无浏览器环境下返回 undefined
 */
function getScreen(): ScreenLike | undefined {
  return typeof globalThis.screen === 'undefined' ? undefined : (globalThis.screen as ScreenLike);
}

/**
 * 安全读取 Window。
 *
 * @returns 当前环境的 Window；Node 或无浏览器环境下返回 undefined
 */
function getWindow(): Window | undefined {
  return typeof window === 'undefined' ? undefined : window;
}

/**
 * 检测 Web Storage 是否可用。
 *
 * @description
 * 只检测能力，不写入测试键。部分浏览器隐私模式读取 storage 属性可能抛错，
 * 因此这里统一捕获并返回 false。
 *
 * @param type - 要检测的存储类型
 * @returns 指定存储能力是否可访问
 */
function getStorageAvailability(type: 'localStorage' | 'sessionStorage'): boolean {
  const currentWindow = getWindow();
  if (!currentWindow) {
    return false;
  }

  try {
    return Boolean(currentWindow[type]);
  } catch {
    return false;
  }
}

/**
 * 检测 IndexedDB 是否可用。
 *
 * @description
 * 只检测 `indexedDB` 全局对象是否存在，不打开数据库、不写入数据。
 *
 * @returns IndexedDB 是否可访问
 */
function getIndexedDBAvailability(): boolean {
  try {
    return typeof globalThis.indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * 获取时区组件值。
 *
 * @description
 * balanced/debug 模式返回 IANA 时区名称；strict 模式只返回是否能读取到时区，
 * 避免将精确地区信息写入指纹。
 *
 * @param context - 当前采集上下文
 * @returns 时区组件值
 */
function getTimezone(context: FingerprintCollectorContext): string {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (context.options.privacyMode === 'strict') {
    return timezone ? 'available' : 'unknown';
  }
  return timezone || 'unknown';
}

/**
 * 获取屏幕组件值。
 *
 * @description
 * debug 模式返回原始宽高和可用宽高，便于定位差异。其他模式会先忽略横竖屏
 * 方向差异，再按 `screenBucketSize` 分桶，降低唯一性。
 *
 * @param context - 当前采集上下文
 * @returns 屏幕组件值；无 Screen API 时返回 null
 */
function getScreenValue(context: FingerprintCollectorContext): FingerprintValue {
  const screen = getScreen();
  if (!screen) {
    return null;
  }

  const width = screen.width ?? 0;
  const height = screen.height ?? 0;

  if (context.options.privacyMode === 'debug') {
    return {
      width,
      height,
      availWidth: screen.availWidth ?? width,
      availHeight: screen.availHeight ?? height,
    };
  }

  const sorted = [width, height].sort((left, right) => left - right);
  return {
    min: bucketNumber(sorted[0] ?? 0, context.options.screenBucketSize),
    max: bucketNumber(sorted[1] ?? 0, context.options.screenBucketSize),
  };
}

/**
 * 获取 User-Agent 组件值。
 *
 * @description
 * strict 模式只记录 User-Agent 是否可读；balanced 模式默认归一化补丁版本；
 * debug 模式可通过 `normalizeUserAgent: false` 保留原始值。
 *
 * @param context - 当前采集上下文
 * @returns User-Agent 组件值；不可用时返回 null
 */
function collectUserAgent(context: FingerprintCollectorContext): string | null {
  const userAgent = getNavigator()?.userAgent;
  if (!userAgent) {
    return null;
  }

  if (context.options.privacyMode === 'strict') {
    return 'available';
  }

  return context.options.normalizeUserAgent ? normalizeUserAgent(userAgent) : userAgent;
}

/**
 * 获取语言列表组件值。
 *
 * @description
 * 浏览器语言列表可能包含较多偏好信息。strict 模式仅保留首选语言；
 * balanced/debug 模式保留浏览器提供的语言列表。
 *
 * @param context - 当前采集上下文
 * @returns 语言代码数组
 */
function collectLanguages(context: FingerprintCollectorContext): readonly string[] {
  const navigator = getNavigator();
  const languages = navigator?.languages?.length
    ? [...navigator.languages]
    : [navigator?.language ?? 'unknown'];

  if (context.options.privacyMode === 'strict') {
    return languages.slice(0, 1);
  }

  return languages;
}

/**
 * 内置低敏指纹组件采集器。
 *
 * @description
 * 采集器按数组顺序注册，但最终哈希输入会按组件键排序，因此顺序不会影响
 * `visitorId`。每个采集器都提供 `confidence`，用于最终置信度估算。
 *
 * @remarks
 * 这里刻意不包含 Canvas、音频、WebGL 渲染、字体探测、浏览器插件枚举等
 * 高熵或更易引发隐私争议的采集方式。
 */
export const defaultFingerprintCollectors: readonly FingerprintCollector[] = [
  {
    // User-Agent 是 FingerprintJS 类工具常见组件。这里默认归一化以降低波动。
    key: 'userAgent',
    source: 'low-entropy',
    confidence: 0.72,
    collect: collectUserAgent,
  },
  {
    // 平台值通常较稳定，但粒度较粗，因此给中等权重。
    key: 'platform',
    source: 'low-entropy',
    confidence: 0.55,
    collect: (): string | null => getNavigator()?.platform ?? null,
  },
  {
    // 首选语言可用于区分环境区域偏好，但不应单独识别用户。
    key: 'language',
    source: 'low-entropy',
    confidence: 0.5,
    collect: (): string => getNavigator()?.language ?? 'unknown',
  },
  {
    // 语言列表在 strict 模式下会收敛为首选语言。
    key: 'languages',
    source: 'low-entropy',
    confidence: 0.48,
    collect: collectLanguages,
  },
  {
    // 时区在 strict 模式下只记录可用性，避免过度暴露地区信息。
    key: 'timezone',
    source: 'low-entropy',
    confidence: 0.64,
    collect: getTimezone,
  },
  {
    // 偏移量比 IANA 时区更粗粒度，作为兼容补充。
    key: 'timezoneOffset',
    source: 'low-entropy',
    confidence: 0.55,
    collect: (): number => new Date().getTimezoneOffset(),
  },
  {
    // 屏幕尺寸默认分桶并忽略方向，减少精确设备特征。
    key: 'screen',
    source: 'low-entropy',
    confidence: 0.62,
    collect: getScreenValue,
  },
  {
    // 色深通常选择空间很小，权重较低。
    key: 'colorDepth',
    source: 'low-entropy',
    confidence: 0.38,
    collect: (): number | null => getScreen()?.colorDepth ?? null,
  },
  {
    // 像素比可能受缩放影响，因此按 0.25 分桶并给较低权重。
    key: 'pixelRatio',
    source: 'low-entropy',
    confidence: 0.42,
    collect: (): number => {
      const currentWindow = getWindow();
      return currentWindow ? bucketNumber(currentWindow.devicePixelRatio || 1, 0.25) : 1;
    },
  },
  {
    // 线程数默认分桶，debug 模式才保留原始值。
    key: 'hardwareConcurrency',
    source: 'low-entropy',
    confidence: 0.5,
    collect: (context): number | null => {
      const value = getNavigator()?.hardwareConcurrency;
      if (!value) {
        return null;
      }
      return context.options.privacyMode === 'debug' ? value : bucketHardwareConcurrency(value);
    },
  },
  {
    // 设备内存不是所有浏览器都支持；默认分桶降低唯一性。
    key: 'deviceMemory',
    source: 'low-entropy',
    confidence: 0.44,
    collect: (context): number | null => {
      const value = getNavigator()?.deviceMemory;
      if (!value) {
        return null;
      }
      return context.options.privacyMode === 'debug' ? value : bucketDeviceMemory(value);
    },
  },
  {
    // 触摸点有助于区分桌面/触屏环境，但粒度仍较粗。
    key: 'maxTouchPoints',
    source: 'low-entropy',
    confidence: 0.45,
    collect: (): number => getNavigator()?.maxTouchPoints ?? 0,
  },
  {
    // 仅检测 Cookie 能力，不读写任何 Cookie。
    key: 'cookiesEnabled',
    source: 'capability',
    confidence: 0.32,
    collect: (): boolean => getNavigator()?.cookieEnabled ?? false,
  },
  {
    // 仅检测存储 API 是否可访问，不写入测试数据。
    key: 'storage',
    source: 'capability',
    confidence: 0.28,
    collect: (): { localStorage: boolean; sessionStorage: boolean } => ({
      localStorage: getStorageAvailability('localStorage'),
      sessionStorage: getStorageAvailability('sessionStorage'),
    }),
  },
  {
    // IndexedDB 只做存在性检测，不打开数据库。
    key: 'indexedDB',
    source: 'capability',
    confidence: 0.24,
    collect: (): boolean => getIndexedDBAvailability(),
  },
  {
    // 记录浏览器隐私偏好，业务侧可用来决定是否进一步降级采集。
    key: 'doNotTrack',
    source: 'capability',
    confidence: 0.2,
    collect: (): string | null => getNavigator()?.doNotTrack ?? null,
  },
];
