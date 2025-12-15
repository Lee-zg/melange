/**
 * @fileoverview 语音识别 (STT) 实现
 * @module melange/plugins/speech/recognition
 * @description 提供语音识别功能，支持浏览器原生 API 和第三方服务降级
 */

import type {
  SpeechProviderType,
  SpeechServiceStatus,
  SpeechError,
  RecognitionConfig,
  RecognitionEventType,
  RecognitionEvent,
  RecognitionEventHandler,
  RecognitionProvider,
  SpeechRecognizer,
  RecognitionResult,
  RecognitionResultItem,
} from './types';

// ============================================================================
// 浏览器原生提供商实现
// ============================================================================

// ============================================================================
// 浏览器 Speech Recognition API 类型声明
// ============================================================================

/**
 * SpeechRecognition 结果列表接口
 */
interface BrowserSpeechRecognitionResultList {
  readonly length: number;
  item(index: number): BrowserSpeechRecognitionResult | null;
  [index: number]: BrowserSpeechRecognitionResult;
}

/**
 * SpeechRecognition 结果接口
 */
interface BrowserSpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): BrowserSpeechRecognitionAlternative | null;
  [index: number]: BrowserSpeechRecognitionAlternative;
}

/**
 * SpeechRecognition 备选结果接口
 */
interface BrowserSpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

/**
 * SpeechRecognition 事件接口
 */
interface BrowserSpeechRecognitionEvent {
  readonly results: BrowserSpeechRecognitionResultList;
  readonly resultIndex: number;
}

/**
 * SpeechRecognition 错误事件接口
 */
interface BrowserSpeechRecognitionErrorEvent {
  readonly error: string;
  readonly message: string;
}

/**
 * 浏览器原生 SpeechRecognition 接口
 */
interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: BrowserSpeechRecognition, ev: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((this: BrowserSpeechRecognition, ev: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onsoundstart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onsoundend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onaudiostart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onnomatch: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
}

/**
 * SpeechRecognition 构造函数类型
 */
interface BrowserSpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

// 声明 window 对象上的 SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

/**
 * 获取浏览器的 SpeechRecognition 构造函数
 */
function getSpeechRecognitionConstructor(): BrowserSpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * 浏览器原生语音识别提供商
 * 使用 Web Speech API 的 SpeechRecognition 接口
 */
class BrowserRecognitionProvider implements RecognitionProvider {
  readonly type: SpeechProviderType = 'browser';
  private recognition: BrowserSpeechRecognition | null = null;
  private eventHandlers: Map<RecognitionEventType, Set<RecognitionEventHandler>> = new Map();
  private _isListening: boolean = false;
  private SpeechRecognitionClass: BrowserSpeechRecognitionConstructor | null = null;

  constructor() {
    this.SpeechRecognitionClass = getSpeechRecognitionConstructor();
  }

  /**
   * 检查浏览器是否支持语音识别
   */
  isAvailable(): boolean {
    return this.SpeechRecognitionClass !== null;
  }

  /**
   * 开始语音识别
   */
  async start(config?: RecognitionConfig): Promise<void> {
    if (!this.SpeechRecognitionClass) {
      throw this.createError('NOT_AVAILABLE', '浏览器不支持语音识别');
    }

    // 如果已经在监听，先停止
    if (this._isListening) {
      this.stop();
    }

    return new Promise((resolve, reject) => {
      this.recognition = new this.SpeechRecognitionClass!();

      // 应用配置
      if (config) {
        if (config.lang) this.recognition.lang = config.lang;
        if (config.continuous !== undefined) this.recognition.continuous = config.continuous;
        if (config.interimResults !== undefined) {
          this.recognition.interimResults = config.interimResults;
        }
        if (config.maxAlternatives !== undefined) {
          this.recognition.maxAlternatives = config.maxAlternatives;
        }
      }

      // 设置事件处理
      this.recognition.onstart = () => {
        this._isListening = true;
        this.emit('start', { type: 'start' });
        resolve();
      };

      this.recognition.onend = () => {
        this._isListening = false;
        this.emit('end', { type: 'end' });
      };

      this.recognition.onresult = (event) => {
        const results = this.convertResults(event.results);
        this.emit('result', { type: 'result', result: results });
      };

      this.recognition.onerror = (event) => {
        const error = this.createError(event.error, this.getErrorMessage(event.error));
        this._isListening = false;
        this.emit('error', { type: 'error', error });

        // 如果还没启动就出错，reject Promise
        if (event.error === 'not-allowed' || event.error === 'no-speech') {
          reject(error);
        }
      };

      this.recognition.onsoundstart = () => {
        this.emit('soundstart', { type: 'soundstart' });
      };

      this.recognition.onsoundend = () => {
        this.emit('soundend', { type: 'soundend' });
      };

      this.recognition.onspeechstart = () => {
        this.emit('speechstart', { type: 'speechstart' });
      };

      this.recognition.onspeechend = () => {
        this.emit('speechend', { type: 'speechend' });
      };

      this.recognition.onaudiostart = () => {
        this.emit('audiostart', { type: 'audiostart' });
      };

      this.recognition.onaudioend = () => {
        this.emit('audioend', { type: 'audioend' });
      };

      this.recognition.onnomatch = () => {
        this.emit('nomatch', { type: 'nomatch' });
      };

      // 启动识别
      try {
        this.recognition.start();
      } catch (e) {
        const error = this.createError('START_ERROR', '启动语音识别失败', e as Error);
        reject(error);
      }
    });
  }

  /**
   * 转换识别结果
   */
  private convertResults(results: BrowserSpeechRecognitionResultList): RecognitionResult {
    const items: RecognitionResultItem[] = [];
    let bestTranscript = '';
    let bestConfidence = 0;
    let isFinal = false;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (!result) continue;
      isFinal = isFinal || result.isFinal;

      for (let j = 0; j < result.length; j++) {
        const alternative = result[j];
        if (!alternative) continue;
        items.push({
          transcript: alternative.transcript,
          confidence: alternative.confidence,
          isFinal: result.isFinal,
        });

        // 更新最佳结果
        if (alternative.confidence > bestConfidence) {
          bestConfidence = alternative.confidence;
          bestTranscript = alternative.transcript;
        }
      }
    }

    // 如果没有置信度信息，使用第一个结果
    if (bestTranscript === '' && items.length > 0) {
      const firstItem = items[0];
      if (firstItem) {
        bestTranscript = firstItem.transcript;
        bestConfidence = firstItem.confidence || 1;
      }
    }

    return {
      results: items,
      bestTranscript,
      bestConfidence,
      isFinal,
    };
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': '未检测到语音输入',
      'audio-capture': '无法访问麦克风',
      'not-allowed': '麦克风权限被拒绝',
      network: '网络错误',
      aborted: '识别被中止',
      'language-not-supported': '不支持的语言',
      'service-not-allowed': '语音服务不可用',
      'bad-grammar': '语法错误',
    };
    return errorMessages[errorCode] || `语音识别错误: ${errorCode}`;
  }

  /**
   * 停止语音识别
   */
  stop(): void {
    if (this.recognition && this._isListening) {
      this.recognition.stop();
    }
  }

  /**
   * 中止语音识别
   */
  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
      this._isListening = false;
    }
  }

  /**
   * 是否正在监听
   */
  isListening(): boolean {
    return this._isListening;
  }

  /**
   * 添加事件监听
   */
  on(event: RecognitionEventType, handler: RecognitionEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * 移除事件监听
   */
  off(event: RecognitionEventType, handler: RecognitionEventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * 触发事件
   */
  private emit(type: RecognitionEventType, event: RecognitionEvent): void {
    this.eventHandlers.get(type)?.forEach((handler) => {
      try {
        handler(event);
      } catch (e) {
        console.error('语音识别事件处理器错误:', e);
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
// 语音识别器主类
// ============================================================================

/**
 * 语音识别器
 * 管理多个提供商，支持自动降级
 */
export class SpeechRecognizerImpl implements SpeechRecognizer {
  private _currentProvider: SpeechProviderType = 'browser';
  private _status: SpeechServiceStatus = 'idle';
  private provider: RecognitionProvider | null = null;
  private config: RecognitionConfig = {};
  private eventHandlers: Map<RecognitionEventType, Set<RecognitionEventHandler>> = new Map();
  private providers: Map<SpeechProviderType, RecognitionProvider> = new Map();

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
   * 初始化语音识别器
   * @param config - 识别配置
   */
  async initialize(config?: RecognitionConfig): Promise<void> {
    this._status = 'loading';
    this.config = {
      lang: 'zh-CN',
      continuous: false,
      interimResults: true,
      maxAlternatives: 1,
      preferredProvider: 'browser',
      autoFallback: true,
      fallbackProviders: ['azure', 'google', 'aws'],
      ...config,
    };

    try {
      // 注册浏览器提供商
      const browserProvider = new BrowserRecognitionProvider();
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
      throw new Error('没有可用的语音识别提供商');
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
   * 转发提供商事件到识别器
   */
  private forwardProviderEvents(provider: RecognitionProvider): void {
    const events: RecognitionEventType[] = [
      'start',
      'end',
      'result',
      'error',
      'soundstart',
      'soundend',
      'speechstart',
      'speechend',
      'audiostart',
      'audioend',
      'nomatch',
    ];
    events.forEach((event) => {
      provider.on(event, (e) => this.emit(event, e));
    });
  }

  /**
   * 开始语音识别
   * @param config - 可选的识别配置
   */
  async start(config?: RecognitionConfig): Promise<void> {
    if (!this.provider) {
      throw new Error('语音识别器未初始化');
    }

    const mergedConfig = { ...this.config, ...config };
    return this.provider.start(mergedConfig);
  }

  /**
   * 停止语音识别
   */
  stop(): void {
    this.provider?.stop();
  }

  /**
   * 中止语音识别
   */
  abort(): void {
    this.provider?.abort();
  }

  /**
   * 是否正在监听
   */
  isListening(): boolean {
    return this.provider?.isListening() ?? false;
  }

  /**
   * 添加事件监听
   */
  on(event: RecognitionEventType, handler: RecognitionEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * 移除事件监听
   */
  off(event: RecognitionEventType, handler: RecognitionEventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * 触发事件
   */
  private emit(type: RecognitionEventType, event: RecognitionEvent): void {
    this.eventHandlers.get(type)?.forEach((handler) => {
      try {
        handler(event);
      } catch (e) {
        console.error('语音识别事件处理器错误:', e);
      }
    });
  }

  /**
   * 销毁实例
   */
  dispose(): void {
    this.abort();
    this.eventHandlers.clear();
    this.provider = null;
    this._status = 'idle';
  }

  /**
   * 注册自定义提供商
   * @param type - 提供商类型
   * @param provider - 提供商实例
   */
  registerProvider(type: SpeechProviderType, provider: RecognitionProvider): void {
    this.providers.set(type, provider);
  }
}

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 创建语音识别器实例
 * @param config - 可选的识别配置
 * @returns 语音识别器实例
 *
 * @example
 * ```typescript
 * // 创建并初始化语音识别器
 * const recognizer = await createSpeechRecognizer({
 *   lang: 'zh-CN',
 *   continuous: true,
 *   interimResults: true,
 * });
 *
 * // 监听识别结果
 * recognizer.on('result', (event) => {
 *   if (event.result) {
 *     console.log('识别结果:', event.result.bestTranscript);
 *   }
 * });
 *
 * // 开始识别
 * await recognizer.start();
 *
 * // 停止识别
 * recognizer.stop();
 *
 * // 销毁
 * recognizer.dispose();
 * ```
 */
export async function createSpeechRecognizer(
  config?: RecognitionConfig
): Promise<SpeechRecognizer> {
  const recognizer = new SpeechRecognizerImpl();
  await recognizer.initialize(config);
  return recognizer;
}

/**
 * 检查当前环境是否支持语音识别
 * @returns 是否支持语音识别
 */
export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

/**
 * 快速进行一次语音识别
 * @param config - 可选的识别配置
 * @returns 识别结果
 *
 * @example
 * ```typescript
 * // 进行一次语音识别
 * const result = await listen({ lang: 'zh-CN' });
 * console.log('识别结果:', result.bestTranscript);
 * ```
 */
export async function listen(config?: RecognitionConfig): Promise<RecognitionResult> {
  if (!isSpeechRecognitionSupported()) {
    throw new Error('当前环境不支持语音识别');
  }

  const recognizer = await createSpeechRecognizer({
    ...config,
    continuous: false,
  });

  return new Promise((resolve, reject) => {
    recognizer.on('result', (event) => {
      if (event.result && event.result.isFinal) {
        recognizer.dispose();
        resolve(event.result);
      }
    });

    recognizer.on('error', (event) => {
      recognizer.dispose();
      reject(event.error);
    });

    recognizer.on('end', () => {
      // 如果结束时还没有结果，返回空结果
      recognizer.dispose();
      resolve({
        results: [],
        bestTranscript: '',
        bestConfidence: 0,
        isFinal: true,
      });
    });

    recognizer.start().catch(reject);
  });
}
