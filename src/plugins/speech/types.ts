/**
 * @fileoverview 语音模块类型定义
 * @module melange/plugins/speech/types
 * @description 语音合成和语音识别的类型定义
 */

// ============================================================================
// 通用类型
// ============================================================================

/**
 * 语音服务提供商类型
 */
export type SpeechProviderType = 'browser' | 'azure' | 'google' | 'aws' | 'custom';

/**
 * 语音服务状态
 */
export type SpeechServiceStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * 语音服务错误
 */
export interface SpeechError {
  /** 错误代码 */
  code: string;
  /** 错误信息 */
  message: string;
  /** 原始错误对象 */
  originalError?: Error;
}

/**
 * 语音服务基础配置
 */
export interface BaseSpeechConfig {
  /** 语言代码 (如 'zh-CN', 'en-US') */
  lang?: string;
  /** 首选提供商 */
  preferredProvider?: SpeechProviderType;
  /** 是否自动降级 */
  autoFallback?: boolean;
  /** 降级提供商列表 */
  fallbackProviders?: SpeechProviderType[];
}

// ============================================================================
// 语音合成 (TTS) 类型
// ============================================================================

/**
 * 语音信息
 */
export interface VoiceInfo {
  /** 语音唯一标识 */
  id: string;
  /** 语音名称 */
  name: string;
  /** 语言代码 */
  lang: string;
  /** 是否为本地语音 */
  localService: boolean;
  /** 是否为默认语音 */
  default: boolean;
  /** 提供商类型 */
  provider: SpeechProviderType;
}

/**
 * 语音合成配置
 */
export interface SynthesisConfig extends BaseSpeechConfig {
  /** 语音对象或语音名称 */
  voice?: VoiceInfo | string;
  /** 音量 (0-1) */
  volume?: number;
  /** 语速 (0.1-10) */
  rate?: number;
  /** 音调 (0-2) */
  pitch?: number;
}

/**
 * 语音合成事件类型
 */
export type SynthesisEventType =
  | 'start'
  | 'end'
  | 'pause'
  | 'resume'
  | 'boundary'
  | 'mark'
  | 'error';

/**
 * 语音合成事件数据
 */
export interface SynthesisEvent {
  /** 事件类型 */
  type: SynthesisEventType;
  /** 当前字符索引 */
  charIndex?: number;
  /** 当前字符长度 */
  charLength?: number;
  /** 经过的时间（毫秒） */
  elapsedTime?: number;
  /** 边界名称 */
  name?: string;
  /** 错误信息 */
  error?: SpeechError;
}

/**
 * 语音合成事件处理器
 */
export type SynthesisEventHandler = (event: SynthesisEvent) => void;

/**
 * 语音合成提供商接口
 */
export interface SynthesisProvider {
  /** 提供商类型 */
  readonly type: SpeechProviderType;
  /** 检查是否可用 */
  isAvailable(): boolean;
  /** 获取可用语音列表 */
  getVoices(): Promise<VoiceInfo[]>;
  /** 朗读文本 */
  speak(text: string, config?: SynthesisConfig): Promise<void>;
  /** 暂停 */
  pause(): void;
  /** 继续 */
  resume(): void;
  /** 取消 */
  cancel(): void;
  /** 是否正在朗读 */
  isSpeaking(): boolean;
  /** 是否已暂停 */
  isPaused(): boolean;
  /** 添加事件监听 */
  on(event: SynthesisEventType, handler: SynthesisEventHandler): void;
  /** 移除事件监听 */
  off(event: SynthesisEventType, handler: SynthesisEventHandler): void;
}

/**
 * 语音合成器接口
 */
export interface SpeechSynthesizer {
  /** 当前使用的提供商 */
  readonly currentProvider: SpeechProviderType;
  /** 服务状态 */
  readonly status: SpeechServiceStatus;
  /** 初始化 */
  initialize(config?: SynthesisConfig): Promise<void>;
  /** 获取可用语音列表 */
  getVoices(): Promise<VoiceInfo[]>;
  /** 朗读文本 */
  speak(text: string, config?: SynthesisConfig): Promise<void>;
  /** 暂停 */
  pause(): void;
  /** 继续 */
  resume(): void;
  /** 取消 */
  cancel(): void;
  /** 是否正在朗读 */
  isSpeaking(): boolean;
  /** 是否已暂停 */
  isPaused(): boolean;
  /** 添加事件监听 */
  on(event: SynthesisEventType, handler: SynthesisEventHandler): void;
  /** 移除事件监听 */
  off(event: SynthesisEventType, handler: SynthesisEventHandler): void;
  /** 销毁实例 */
  dispose(): void;
}

// ============================================================================
// 语音识别 (STT) 类型
// ============================================================================

/**
 * 识别结果项
 */
export interface RecognitionResultItem {
  /** 识别的文本 */
  transcript: string;
  /** 置信度 (0-1) */
  confidence: number;
  /** 是否为最终结果 */
  isFinal: boolean;
}

/**
 * 识别结果
 */
export interface RecognitionResult {
  /** 结果列表 */
  results: RecognitionResultItem[];
  /** 最佳结果 */
  bestTranscript: string;
  /** 最佳置信度 */
  bestConfidence: number;
  /** 是否为最终结果 */
  isFinal: boolean;
}

/**
 * 语音识别配置
 */
export interface RecognitionConfig extends BaseSpeechConfig {
  /** 是否连续识别 */
  continuous?: boolean;
  /** 是否返回中间结果 */
  interimResults?: boolean;
  /** 最大备选结果数 */
  maxAlternatives?: number;
  /** 语法列表 (仅部分浏览器支持) */
  grammars?: string[];
}

/**
 * 语音识别事件类型
 */
export type RecognitionEventType =
  | 'start'
  | 'end'
  | 'result'
  | 'error'
  | 'soundstart'
  | 'soundend'
  | 'speechstart'
  | 'speechend'
  | 'audiostart'
  | 'audioend'
  | 'nomatch';

/**
 * 语音识别事件数据
 */
export interface RecognitionEvent {
  /** 事件类型 */
  type: RecognitionEventType;
  /** 识别结果 (仅 result 事件) */
  result?: RecognitionResult;
  /** 错误信息 (仅 error 事件) */
  error?: SpeechError;
}

/**
 * 语音识别事件处理器
 */
export type RecognitionEventHandler = (event: RecognitionEvent) => void;

/**
 * 语音识别提供商接口
 */
export interface RecognitionProvider {
  /** 提供商类型 */
  readonly type: SpeechProviderType;
  /** 检查是否可用 */
  isAvailable(): boolean;
  /** 开始识别 */
  start(config?: RecognitionConfig): Promise<void>;
  /** 停止识别 */
  stop(): void;
  /** 中止识别 */
  abort(): void;
  /** 是否正在识别 */
  isListening(): boolean;
  /** 添加事件监听 */
  on(event: RecognitionEventType, handler: RecognitionEventHandler): void;
  /** 移除事件监听 */
  off(event: RecognitionEventType, handler: RecognitionEventHandler): void;
}

/**
 * 语音识别器接口
 */
export interface SpeechRecognizer {
  /** 当前使用的提供商 */
  readonly currentProvider: SpeechProviderType;
  /** 服务状态 */
  readonly status: SpeechServiceStatus;
  /** 初始化 */
  initialize(config?: RecognitionConfig): Promise<void>;
  /** 开始识别 */
  start(config?: RecognitionConfig): Promise<void>;
  /** 停止识别 */
  stop(): void;
  /** 中止识别 */
  abort(): void;
  /** 是否正在识别 */
  isListening(): boolean;
  /** 添加事件监听 */
  on(event: RecognitionEventType, handler: RecognitionEventHandler): void;
  /** 移除事件监听 */
  off(event: RecognitionEventType, handler: RecognitionEventHandler): void;
  /** 销毁实例 */
  dispose(): void;
}

// ============================================================================
// 第三方提供商配置类型
// ============================================================================

/**
 * Azure 语音服务配置
 */
export interface AzureSpeechConfig {
  /** 订阅密钥 */
  subscriptionKey: string;
  /** 服务区域 */
  region: string;
  /** 自定义端点 */
  endpoint?: string;
}

/**
 * Google Cloud Speech 配置
 */
export interface GoogleSpeechConfig {
  /** API 密钥 */
  apiKey: string;
  /** 项目 ID */
  projectId?: string;
}

/**
 * AWS Polly/Transcribe 配置
 */
export interface AWSSpeechConfig {
  /** 访问密钥 ID */
  accessKeyId: string;
  /** 秘密访问密钥 */
  secretAccessKey: string;
  /** 区域 */
  region: string;
}

/**
 * 自定义提供商配置
 */
export interface CustomProviderConfig {
  /** 合成 API 端点 */
  synthesisEndpoint?: string;
  /** 识别 API 端点 */
  recognitionEndpoint?: string;
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 认证令牌 */
  authToken?: string;
}

/**
 * 提供商配置联合类型
 */
export type ProviderConfig =
  | AzureSpeechConfig
  | GoogleSpeechConfig
  | AWSSpeechConfig
  | CustomProviderConfig;
