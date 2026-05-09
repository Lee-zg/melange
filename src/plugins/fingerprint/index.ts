/**
 * @fileoverview 指纹识别模块入口
 * @module melange/plugins/fingerprint
 * @description
 * 提供隐私友好的浏览器/设备指纹生成能力。模块入口统一导出类型、
 * 默认采集器、工具函数和生成器 API，调用方通常从 `melange/plugins`
 * 或根入口按需导入。
 *
 * @example
 * ```typescript
 * import { getFingerprint, createFingerprintGenerator } from '@lee-zg/melange/plugins';
 *
 * const result = await getFingerprint({ salt: 'my-app' });
 *
 * const generator = createFingerprintGenerator({ privacyMode: 'strict' });
 * const strictResult = await generator.get();
 * ```
 */

// ============================================================================
// 类型导出
// ============================================================================

export type {
  // 组件键、来源和模式
  FingerprintComponentKey,
  FingerprintComponentSource,
  FingerprintPrivacyMode,
  FingerprintHashAlgorithm,
  // 组件与结果结构
  FingerprintValue,
  FingerprintComponent,
  FingerprintComponentMap,
  FingerprintConfidence,
  FingerprintResult,
  // 采集器与配置
  FingerprintCollectorContext,
  FingerprintCollector,
  FingerprintOptions,
  FingerprintGenerator,
} from './types';

// ============================================================================
// 内置采集器导出
// ============================================================================

export { defaultFingerprintCollectors } from './collectors';

// ============================================================================
// 工具函数导出
// ============================================================================

export {
  // 稳定序列化与哈希
  stableStringify,
  serializeComponents,
  fnv1a64,
  sha256,
  hashString,
  // 隐私友好的归一化/分桶工具
  normalizeUserAgent,
  bucketNumber,
  bucketHardwareConcurrency,
  bucketDeviceMemory,
} from './utils';

// ============================================================================
// 指纹生成器导出
// ============================================================================

export {
  // 常量与 DI 令牌
  FINGERPRINT_VERSION,
  FINGERPRINT_GENERATOR,
  // 生成器与便捷 API
  FingerprintGeneratorImpl,
  createFingerprintGenerator,
  getFingerprint,
  registerFingerprintPlugin,
  isFingerprintSupported,
} from './generator';
