/**
 * @fileoverview 指纹识别插件单元测试
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Container } from '../src/core';
import {
  FINGERPRINT_GENERATOR,
  FingerprintGeneratorImpl,
  bucketDeviceMemory,
  bucketHardwareConcurrency,
  bucketNumber,
  createFingerprintGenerator,
  fnv1a64,
  getFingerprint,
  hashString,
  isFingerprintSupported,
  normalizeUserAgent,
  registerFingerprintPlugin,
  stableStringify,
  type FingerprintGenerator,
} from '../src/plugins/fingerprint';

function defineGlobalProperty<T>(key: string, value: T): void {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
}

function setupBrowserLikeEnvironment(): void {
  defineGlobalProperty('navigator', {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.6099.130 Safari/537.36',
    platform: 'Win32',
    language: 'zh-CN',
    languages: ['zh-CN', 'en-US'],
    cookieEnabled: true,
    hardwareConcurrency: 12,
    deviceMemory: 6,
    maxTouchPoints: 0,
    doNotTrack: '1',
  });
  defineGlobalProperty('screen', {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
    colorDepth: 24,
  });
  defineGlobalProperty('window', {
    devicePixelRatio: 1.25,
    localStorage: {},
    sessionStorage: {},
  });
  defineGlobalProperty('indexedDB', {});
}

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as Record<string, unknown>).window;
  delete (globalThis as Record<string, unknown>).screen;
  delete (globalThis as Record<string, unknown>).indexedDB;
});

describe('Fingerprint Utils', () => {
  it('should stringify objects in a stable order', () => {
    const left = stableStringify({ b: 2, a: { d: 4, c: 3 } });
    const right = stableStringify({ a: { c: 3, d: 4 }, b: 2 });

    expect(left).toBe(right);
  });

  it('should calculate known FNV-1a 64 hash', () => {
    expect(fnv1a64('hello')).toBe('a430d84680aabd0b');
  });

  it('should hash with sha256 when available or fall back safely', async () => {
    const hash = await hashString('melange', 'sha256');

    expect(hash).toMatch(/^[0-9a-f]{16,64}$/);
  });

  it('should normalize user agent patch versions and build ids', () => {
    const normalized = normalizeUserAgent(
      'Chrome/120.0.6099.130 Version/17.1.2 Build/ABCD123 Safari/605.1.15'
    );

    expect(normalized).toContain('Chrome/120.0');
    expect(normalized).toContain('Version/17.1');
    expect(normalized).toContain('Build/*');
    expect(normalized).not.toContain('6099.130');
  });

  it('should bucket noisy numeric values', () => {
    expect(bucketNumber(1080, 100)).toBe(1100);
    expect(bucketHardwareConcurrency(12)).toBe(16);
    expect(bucketDeviceMemory(6)).toBe(8);
  });
});

describe('FingerprintGeneratorImpl', () => {
  it('should generate stable visitorId for the same low entropy components', async () => {
    setupBrowserLikeEnvironment();
    const generator = new FingerprintGeneratorImpl({ cache: false });

    const first = await generator.get();
    const second = await generator.get();

    expect(first.visitorId).toBe(second.visitorId);
    expect(first.visitorId).toMatch(/^[0-9a-f]{16}$/);
    expect(first.components.userAgent?.value).toContain('Chrome/120.0');
    expect(first.components.screen?.value).toEqual({ min: 1100, max: 1900 });
    expect(first.components.hardwareConcurrency?.value).toBe(16);
    expect(first.components.deviceMemory?.value).toBe(8);
    expect(first.confidence.componentCount).toBeGreaterThan(0);
  });

  it('should change visitorId when salt changes', async () => {
    setupBrowserLikeEnvironment();

    const first = await getFingerprint({ salt: 'app-a', cache: false });
    const second = await getFingerprint({ salt: 'app-b', cache: false });

    expect(first.visitorId).not.toBe(second.visitorId);
  });

  it('should support strict privacy mode', async () => {
    setupBrowserLikeEnvironment();
    const result = await getFingerprint({
      privacyMode: 'strict',
      include: ['userAgent', 'timezone', 'languages'],
      cache: false,
    });

    expect(result.components.userAgent?.value).toBe('available');
    expect(result.components.timezone?.value).toBe('available');
    expect(result.components.languages?.value).toEqual(['zh-CN']);
  });

  it('should support include and exclude filters', async () => {
    setupBrowserLikeEnvironment();
    const result = await getFingerprint({
      include: ['language', 'timezone', 'screen'],
      exclude: ['screen'],
      cache: false,
    });

    expect(Object.keys(result.components).sort()).toEqual(['language', 'timezone']);
  });

  it('should cache generated result until cleared', async () => {
    setupBrowserLikeEnvironment();
    const collect = vi.fn(() => `value-${collect.mock.calls.length}`);
    const generator = createFingerprintGenerator({
      collectors: [{ key: 'customValue', collect }],
    });

    const first = await generator.get();
    const second = await generator.get();
    generator.clearCache();
    const third = await generator.get();

    expect(second).toBe(first);
    expect(third).not.toBe(first);
    expect(collect).toHaveBeenCalledTimes(2);
  });

  it('should skip collectors that timeout or throw', async () => {
    vi.useFakeTimers();
    setupBrowserLikeEnvironment();

    const generator = createFingerprintGenerator({
      include: ['slow', 'broken', 'stable'],
      componentTimeout: 10,
      cache: false,
      collectors: [
        {
          key: 'slow',
          collect: () => new Promise(resolve => setTimeout(() => resolve('late'), 100)),
        },
        {
          key: 'broken',
          collect: () => {
            throw new Error('broken collector');
          },
        },
        {
          key: 'stable',
          confidence: 0.9,
          collect: () => 'ok',
        },
      ],
    });

    const pending = generator.get();
    await vi.advanceTimersByTimeAsync(20);
    const result = await pending;

    expect(result.components.stable?.value).toBe('ok');
    expect(result.components.slow).toBeUndefined();
    expect(result.components.broken).toBeUndefined();
    expect(result.confidence.skippedCount).toBeGreaterThanOrEqual(2);
  });

  it('should register with dependency injection container', async () => {
    setupBrowserLikeEnvironment();
    const container = new Container();

    registerFingerprintPlugin(container, {
      include: ['language'],
      cache: false,
    });

    const generator = container.resolve<FingerprintGenerator>(FINGERPRINT_GENERATOR);
    const result = await generator.get();

    expect(result.components.language?.value).toBe('zh-CN');
  });

  it('should report support in browser-like environments', () => {
    setupBrowserLikeEnvironment();

    expect(isFingerprintSupported()).toBe(true);
  });
});
