/**
 * @fileoverview 指纹识别模块工具函数
 * @module melange/plugins/fingerprint/utils
 * @description
 * 提供稳定序列化、哈希计算和隐私友好的归一化工具。
 * 这些工具是生成 `visitorId` 的底层能力，也可以被业务侧复用来测试
 * 自定义组件的稳定性。
 */

import type { FingerprintComponentMap, FingerprintHashAlgorithm, FingerprintValue } from './types';

/**
 * FNV-1a 64 位算法的 offset basis。
 *
 * @internal
 */
const FNV_OFFSET_BASIS = 0xcbf29ce484222325n;

/**
 * FNV-1a 64 位算法的 prime。
 *
 * @internal
 */
const FNV_PRIME = 0x100000001b3n;

/**
 * 用于将 BigInt 哈希限制在 64 位无符号整数范围内的掩码。
 *
 * @internal
 */
const UINT64_MASK = 0xffffffffffffffffn;

/**
 * 稳定序列化指纹值，保证对象键顺序不影响哈希。
 *
 * @description
 * JavaScript 对象的键顺序可能受构造顺序影响。为了让相同组件值在不同
 * 采集顺序下得到相同哈希，本函数会递归排序对象键，再生成 JSON 兼容字符串。
 *
 * @example
 * ```typescript
 * stableStringify({ b: 2, a: 1 }) === stableStringify({ a: 1, b: 2 });
 * ```
 *
 * @param value - 要序列化的值
 * @returns 稳定 JSON 字符串
 */
export function stableStringify(value: FingerprintValue): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }

  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(',')}}`;
}

/**
 * 将组件集合转换为稳定的哈希输入。
 *
 * @description
 * 仅组件的 `value` 会参与哈希计算，`duration`、`source` 和 `confidence`
 * 只用于调试和置信度说明。组件键会先排序，避免对象插入顺序影响输出。
 *
 * @param components - 指纹组件集合
 * @param salt - 命名空间盐值，用于隔离不同业务域或用途
 * @returns 稳定的哈希输入字符串
 */
export function serializeComponents(components: FingerprintComponentMap, salt: string): string {
  const values: Record<string, FingerprintValue> = {};
  for (const key of Object.keys(components).sort()) {
    const component = components[key];
    if (component) {
      values[key] = component.value;
    }
  }
  return stableStringify({ salt, values });
}

/**
 * 计算 FNV-1a 64 位哈希。
 *
 * @description
 * FNV-1a 是非加密哈希，速度快、实现小，适合生成本地稳定标识。
 * 它不具备抗碰撞或安全签名能力，不应作为密码学用途。
 *
 * @param input - 输入字符串
 * @returns 16 位十六进制哈希
 */
export function fnv1a64(input: string): string {
  let hash = FNV_OFFSET_BASIS;

  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * FNV_PRIME) & UINT64_MASK;
  }

  return hash.toString(16).padStart(16, '0');
}

/**
 * 计算 SHA-256 哈希。
 *
 * @description
 * 优先使用标准 Web Crypto API。部分非浏览器或旧浏览器环境可能没有
 * `crypto.subtle`，此时返回 `null`，由上层决定是否降级。
 *
 * @param input - 要计算哈希的输入字符串
 * @returns 十六进制哈希；不可用时返回 null
 */
export async function sha256(input: string): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    return null;
  }

  const data = new TextEncoder().encode(input);
  const digest = await subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 计算指纹哈希。
 *
 * @description
 * 统一封装哈希策略。选择 `sha256` 时，如果当前环境缺少 Web Crypto API，
 * 会自动降级到 `fnv1a64`，保证指纹生成不会因为环境能力不足而失败。
 *
 * @param input - 已稳定序列化的哈希输入
 * @param algorithm - 哈希算法，默认为 `fnv1a64`
 * @returns 指纹哈希
 */
export async function hashString(
  input: string,
  algorithm: FingerprintHashAlgorithm = 'fnv1a64'
): Promise<string> {
  if (algorithm === 'sha256') {
    return (await sha256(input)) ?? fnv1a64(input);
  }

  return fnv1a64(input);
}

/**
 * 将数值按指定大小分桶。
 *
 * @description
 * 分桶可以降低精确数值带来的唯一性。例如屏幕高度 1080 在 bucketSize=100
 * 时会归入 1100 桶，从而避免把过细的设备差异直接写入指纹。
 *
 * @param value - 原始数值
 * @param bucketSize - 分桶大小；小于等于 0 时返回原值
 * @returns 分桶后的数值
 */
export function bucketNumber(value: number, bucketSize: number): number {
  if (!Number.isFinite(value) || bucketSize <= 0) {
    return value;
  }
  return Math.round(value / bucketSize) * bucketSize;
}

/**
 * 归一化 User-Agent，降低补丁版本和构建号带来的高熵差异。
 *
 * @description
 * User-Agent 中的补丁版本和构建号会频繁变化，也可能提升唯一性。
 * 本函数保留主版本/次版本等粗粒度信息，同时去除常见构建号细节。
 *
 * @example
 * ```typescript
 * normalizeUserAgent('Chrome/120.0.6099.130');
 * // 'Chrome/120.0'
 * ```
 *
 * @param userAgent - 原始 User-Agent
 * @returns 归一化后的 User-Agent
 */
export function normalizeUserAgent(userAgent: string): string {
  return userAgent
    .replace(/\b(\d+)\.(\d+)(?:\.\d+)+\b/g, '$1.$2')
    .replace(/\bBuild\/[^\s;)]+/gi, 'Build/*')
    .replace(/\bVersion\/(\d+)\.(\d+)(?:\.\d+)+/gi, 'Version/$1.$2')
    .trim();
}

/**
 * 将硬件线程数分桶，降低唯一性。
 *
 * @description
 * 浏览器暴露的硬件线程数可能比较稳定，但精确值会增加区分度。
 * balanced 模式下会将常见高线程设备归入 4/8/16 等粗粒度区间。
 *
 * @param value - 原始硬件线程数
 * @returns 分桶后的线程数
 */
export function bucketHardwareConcurrency(value: number): number {
  if (value <= 2) return value;
  if (value <= 4) return 4;
  if (value <= 8) return 8;
  return 16;
}

/**
 * 将设备内存分桶，降低唯一性。
 *
 * @description
 * `navigator.deviceMemory` 本身通常已经是粗粒度值，但仍统一归入
 * 1/2/4/8/16 桶，便于跨浏览器表现一致。
 *
 * @param value - 原始设备内存，单位通常为 GB
 * @returns 分桶后的设备内存
 */
export function bucketDeviceMemory(value: number): number {
  if (value <= 1) return 1;
  if (value <= 2) return 2;
  if (value <= 4) return 4;
  if (value <= 8) return 8;
  return 16;
}
