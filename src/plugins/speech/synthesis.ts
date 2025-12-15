/**
 * @fileoverview 语音合成 (TTS) 实现
 * @module melange/plugins/speech/synthesis
 * @description 提供语音合成功能，支持浏览器原生 API 和第三方服务降级
 */

import type {
  SpeechProviderType,
  SpeechServiceStatus,
  SpeechError,
  VoiceInfo,
  SynthesisConfig,
  SynthesisEventType,
  SynthesisEvent,
  SynthesisEventHandler,
  SynthesisProvider,
  SpeechSynthesizer,
} from './types';

// ============================================================================
// 浏览器原生提供商实现
// ============================================================================

/**
 * 浏览器原生语音合成提供商
 * 使用 Web Speech API 的 SpeechSynthesis 接口
 */
class BrowserSynthesisProvider implements SynthesisProvider {
  readonly type: SpeechProviderType = 'browser';
  private synthesis: SpeechSynthesis | null = null;
  private eventHandlers: Map<SynthesisEventType, Set<SynthesisEventHandler>> = new Map();
  private voicesLoaded: boolean = false;
  private voicesPromise: Promise<VoiceInfo[]> | null = null;

  constructor() {
    if (this.isAvailable()) {
      this.synthesis = window.speechSynthesis;
    }
  }

  /**
   * 检查浏览器是否支持语音合成
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * 获取可用语音列表
   */
  async getVoices(): Promise<VoiceInfo[]> {
    if (!this.synthesis) {
      return [];
    }

    // 如果已经有加载中的 Promise，直接返回
    if (this.voicesPromise) {
      return this.voicesPromise;
    }

    this.voicesPromise = new Promise((resolve) => {
      const loadVoices = () => {
        const voices = this.synthesis!.getVoices();
        if (voices.length > 0) {
          this.voicesLoaded = true;
          resolve(
            voices.map((voice) => ({
              id: voice.voiceURI,
              name: voice.name,
              lang: voice.lang,
              localService: voice.localService,
              default: voice.default,
              provider: 'browser' as SpeechProviderType,
            }))
          );
        }
      };

      // 尝试立即获取
      loadVoices();

      // 如果没有获取到，监听 voiceschanged 事件
      if (!this.voicesLoaded) {
        this.synthesis!.addEventListener('voiceschanged', loadVoices, { once: true });
        // 设置超时，防止永久等待
        setTimeout(() => {
          if (!this.voicesLoaded) {
            resolve([]);
          }
        }, 3000);
      }
    });

    return this.voicesPromise;
  }

  /**
   * 朗读文本
   */
  async speak(text: string, config?: SynthesisConfig): Promise<void> {
    if (!this.synthesis) {
      throw this.createError('NOT_AVAILABLE', '浏览器不支持语音合成');
    }

    // 取消当前正在进行的朗读
    this.cancel();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // 应用配置
      if (config) {
        if (config.lang) utterance.lang = config.lang;
        if (config.volume !== undefined) utterance.volume = config.volume;
        if (config.rate !== undefined) utterance.rate = config.rate;
        if (config.pitch !== undefined) utterance.pitch = config.pitch;

        // 设置语音
        if (config.voice) {
          const voices = this.synthesis!.getVoices();
          const voiceConfig = config.voice;
          const targetVoice =
            typeof voiceConfig === 'string'
              ? voices.find((v) => v.name === voiceConfig || v.voiceURI === voiceConfig)
              : voices.find((v) => v.voiceURI === voiceConfig.id);
          if (targetVoice) {
            utterance.voice = targetVoice;
          }
        }
      }

      // 设置事件处理
      utterance.onstart = () => {
        this.emit('start', { type: 'start' });
      };

      utterance.onend = () => {
        this.emit('end', { type: 'end' });
        resolve();
      };

      utterance.onpause = () => {
        this.emit('pause', { type: 'pause' });
      };

      utterance.onresume = () => {
        this.emit('resume', { type: 'resume' });
      };

      utterance.onboundary = (event) => {
        this.emit('boundary', {
          type: 'boundary',
          charIndex: event.charIndex,
          charLength: event.charLength,
          elapsedTime: event.elapsedTime,
          name: event.name,
        });
      };

      utterance.onmark = (event) => {
        this.emit('mark', {
          type: 'mark',
          name: event.name,
        });
      };

      utterance.onerror = (event) => {
        const error = this.createError(event.error, `语音合成错误: ${event.error}`);
        this.emit('error', { type: 'error', error });
        reject(error);
      };

      this.synthesis!.speak(utterance);
    });
  }

  /**
   * 暂停朗读
   */
  pause(): void {
    if (this.synthesis && this.isSpeaking()) {
      this.synthesis.pause();
    }
  }

  /**
   * 继续朗读
   */
  resume(): void {
    if (this.synthesis && this.isPaused()) {
      this.synthesis.resume();
    }
  }

  /**
   * 取消朗读
   */
  cancel(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  /**
   * 是否正在朗读
   */
  isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false;
  }

  /**
   * 是否已暂停
   */
  isPaused(): boolean {
    return this.synthesis?.paused ?? false;
  }

  /**
   * 添加事件监听
   */
  on(event: SynthesisEventType, handler: SynthesisEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * 移除事件监听
   */
  off(event: SynthesisEventType, handler: SynthesisEventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * 触发事件
   */
  private emit(type: SynthesisEventType, event: SynthesisEvent): void {
    this.eventHandlers.get(type)?.forEach((handler) => {
      try {
        handler(event);
      } catch (e) {
        console.error('语音合成事件处理器错误:', e);
      }
    });
  }

  /**
   * 创建错误对象
   */
  private createError(code: string, message: string, originalError?: Error): SpeechError {
    const result: SpeechError = { code, message };
    if (originalError) {
      result.originalError = originalError;
    }
    return result;
  }
}

// ============================================================================
// 语音合成器主类
// ============================================================================

/**
 * 语音合成器
 * 管理多个提供商，支持自动降级
 */
export class SpeechSynthesizerImpl implements SpeechSynthesizer {
  private _currentProvider: SpeechProviderType = 'browser';
  private _status: SpeechServiceStatus = 'idle';
  private provider: SynthesisProvider | null = null;
  private config: SynthesisConfig = {};
  private eventHandlers: Map<SynthesisEventType, Set<SynthesisEventHandler>> = new Map();
  private providers: Map<SpeechProviderType, SynthesisProvider> = new Map();

  /**
   * 当前使用的提供商类型
   */
  get currentProvider(): SpeechProviderType {
    return this._currentProvider;
  }

  /**
   * 服务状态
   */
  get status(): SpeechServiceStatus {
    return this._status;
  }

  /**
   * 初始化语音合成器
   * @param config - 合成配置
   */
  async initialize(config?: SynthesisConfig): Promise<void> {
    this._status = 'loading';
    this.config = {
      lang: 'zh-CN',
      preferredProvider: 'browser',
      autoFallback: true,
      fallbackProviders: ['azure', 'google', 'aws'],
      ...config,
    };

    try {
      // 注册浏览器提供商
      const browserProvider = new BrowserSynthesisProvider();
      this.providers.set('browser', browserProvider);

      // 尝试使用首选提供商
      const preferredProvider = this.config.preferredProvider || 'browser';
      if (await this.tryProvider(preferredProvider)) {
        this._status = 'ready';
        return;
      }

      // 如果首选提供商不可用且启用了自动降级
      if (this.config.autoFallback && this.config.fallbackProviders) {
        for (const providerType of this.config.fallbackProviders) {
          if (await this.tryProvider(providerType)) {
            this._status = 'ready';
            return;
          }
        }
      }

      // 所有提供商都不可用
      this._status = 'error';
      throw new Error('没有可用的语音合成提供商');
    } catch (error) {
      this._status = 'error';
      throw error;
    }
  }

  /**
   * 尝试使用指定提供商
   */
  private async tryProvider(type: SpeechProviderType): Promise<boolean> {
    const provider = this.providers.get(type);
    if (provider && provider.isAvailable()) {
      this.provider = provider;
      this._currentProvider = type;

      // 转发提供商事件
      this.forwardProviderEvents(provider);

      return true;
    }
    return false;
  }

  /**
   * 转发提供商事件到合成器
   */
  private forwardProviderEvents(provider: SynthesisProvider): void {
    const events: SynthesisEventType[] = [
      'start',
      'end',
      'pause',
      'resume',
      'boundary',
      'mark',
      'error',
    ];
    events.forEach((event) => {
      provider.on(event, (e) => this.emit(event, e));
    });
  }

  /**
   * 获取可用语音列表
   */
  async getVoices(): Promise<VoiceInfo[]> {
    if (!this.provider) {
      throw new Error('语音合成器未初始化');
    }
    return this.provider.getVoices();
  }

  /**
   * 朗读文本
   * @param text - 要朗读的文本
   * @param config - 可选的合成配置
   */
  async speak(text: string, config?: SynthesisConfig): Promise<void> {
    if (!this.provider) {
      throw new Error('语音合成器未初始化');
    }

    const mergedConfig = { ...this.config, ...config };
    return this.provider.speak(text, mergedConfig);
  }

  /**
   * 暂停朗读
   */
  pause(): void {
    this.provider?.pause();
  }

  /**
   * 继续朗读
   */
  resume(): void {
    this.provider?.resume();
  }

  /**
   * 取消朗读
   */
  cancel(): void {
    this.provider?.cancel();
  }

  /**
   * 是否正在朗读
   */
  isSpeaking(): boolean {
    return this.provider?.isSpeaking() ?? false;
  }

  /**
   * 是否已暂停
   */
  isPaused(): boolean {
    return this.provider?.isPaused() ?? false;
  }

  /**
   * 添加事件监听
   */
  on(event: SynthesisEventType, handler: SynthesisEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * 移除事件监听
   */
  off(event: SynthesisEventType, handler: SynthesisEventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * 触发事件
   */
  private emit(type: SynthesisEventType, event: SynthesisEvent): void {
    this.eventHandlers.get(type)?.forEach((handler) => {
      try {
        handler(event);
      } catch (e) {
        console.error('语音合成事件处理器错误:', e);
      }
    });
  }

  /**
   * 销毁实例
   */
  dispose(): void {
    this.cancel();
    this.eventHandlers.clear();
    this.provider = null;
    this._status = 'idle';
  }

  /**
   * 注册自定义提供商
   * @param type - 提供商类型
   * @param provider - 提供商实例
   */
  registerProvider(type: SpeechProviderType, provider: SynthesisProvider): void {
    this.providers.set(type, provider);
  }
}

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 创建语音合成器实例
 * @param config - 可选的合成配置
 * @returns 语音合成器实例
 *
 * @example
 * ```typescript
 * // 创建并初始化语音合成器
 * const synthesizer = await createSpeechSynthesizer({
 *   lang: 'zh-CN',
 *   rate: 1.0,
 *   pitch: 1.0,
 * });
 *
 * // 朗读文本
 * await synthesizer.speak('你好，世界！');
 *
 * // 监听事件
 * synthesizer.on('end', () => {
 *   console.log('朗读完成');
 * });
 *
 * // 销毁
 * synthesizer.dispose();
 * ```
 */
export async function createSpeechSynthesizer(
  config?: SynthesisConfig
): Promise<SpeechSynthesizer> {
  const synthesizer = new SpeechSynthesizerImpl();
  await synthesizer.initialize(config);
  return synthesizer;
}

/**
 * 检查当前环境是否支持语音合成
 * @returns 是否支持语音合成
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * 快速朗读文本（一次性使用）
 * @param text - 要朗读的文本
 * @param config - 可选的合成配置
 *
 * @example
 * ```typescript
 * // 快速朗读
 * await speak('你好，世界！');
 *
 * // 带配置的朗读
 * await speak('Hello World', { lang: 'en-US', rate: 0.8 });
 * ```
 */
export async function speak(text: string, config?: SynthesisConfig): Promise<void> {
  if (!isSpeechSynthesisSupported()) {
    throw new Error('当前环境不支持语音合成');
  }

  const synthesizer = await createSpeechSynthesizer(config);
  try {
    await synthesizer.speak(text, config);
  } finally {
    synthesizer.dispose();
  }
}
