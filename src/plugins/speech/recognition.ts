/**
 * @fileoverview 语音识别 (STT) 实现 - 商业级版本 v2.0
 * @module melange/plugins/speech/recognition
 * @description 生产级 Web 语音识别插件
 *
 * 架构：
 * [UI层] -> [SpeechRecognizerImpl] -> [NativeStrategy / CloudStrategy]
 *                                          |
 *                                          +-> [音频核心]: Worklet, VAD, Resample
 *                                          +-> [适配器]: BaiduAdapter, XunfeiAdapter, TencentAdapter...
 *
 * 功能特性：
 * 1. 多模式: 支持 WebSocket 流式识别 & HTTP 短语音识别
 * 2. 状态机: IDLE -> CONNECTING -> RECORDING -> PROCESSING
 * 3. 插件化: 内置 讯飞/腾讯/百度/阿里/Google/Azure 适配器
 * 4. 核心: AudioWorklet + VAD + 自动重采样 + WAV编码
 * 5. 兼容性: 自动降级处理 (ScriptProcessor) + 断网缓冲队列
 */

import type {
  SpeechProviderType,
  SpeechServiceStatus,
  RecognitionConfig,
  RecognitionEventType,
  RecognitionEvent,
  RecognitionEventHandler,
  RecognitionProvider,
  SpeechRecognizer,
  RecognitionResult,
} from './types';

// ============================================================================
// 1. 类型定义 & 枚举
// ============================================================================

// Window 接口扩展 - 支持浏览器语音 API 和 AudioContext
// 使用 unknown 避免循环引用，实际类型在下方 BrowserSpeechRecognition 中定义
declare global {
  interface Window {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
    webkitAudioContext?: typeof AudioContext;
  }
}

/**
 * 识别器状态枚举
 */
export enum RecognitionStatus {
  /** 空闲状态 */
  IDLE = 'IDLE',
  /** 连接中 */
  CONNECTING = 'CONNECTING',
  /** 录音中 */
  RECORDING = 'RECORDING',
  /** 处理中/上传中 */
  PROCESSING = 'PROCESSING',
}

/**
 * 识别引擎模式
 */
export type RecognitionEngineMode = 'native' | 'cloud' | 'auto';

/**
 * 云端传输协议类型
 */
export type CloudTransportType = 'websocket' | 'http';

/**
 * 识别结果接口
 */
export interface IRecognitionResult {
  /** 识别文本 */
  transcript: string;
  /** 是否为最终结果 */
  isFinal: boolean;
  /** 置信度 (0-1) */
  confidence: number;
  /** 原始响应数据 */
  original?: unknown;
}

/**
 * 识别错误接口
 */
export interface IRecognitionError {
  /** 错误代码 */
  code:
    | 'NETWORK'
    | 'NOT_ALLOWED'
    | 'NO_SPEECH'
    | 'NOT_SUPPORTED'
    | 'VAD_TIMEOUT'
    | 'ADAPTER_ERROR'
    | 'UNKNOWN';
  /** 错误信息 */
  message: string;
  /** 原始错误 */
  originalError?: unknown;
}

/**
 * 音频配置接口
 */
export interface IAudioConfig {
  /** 目标采样率 (默认 16000) */
  sampleRate?: number;
  /** VAD 阈值 (0.01 ~ 0.5) */
  vadThreshold?: number;
  /** VAD 静音超时 (ms) */
  vadDuration?: number;
  /** 是否启用回声消除 */
  echoCancellation?: boolean;
  /** 是否启用噪声抑制 */
  noiseSuppression?: boolean;
  /** 是否启用自动增益控制 */
  autoGainControl?: boolean;
}

/**
 * 高级识别配置
 */
export interface IAdvancedRecognitionConfig extends RecognitionConfig {
  /** 识别引擎模式 */
  mode?: RecognitionEngineMode;
  /** 云端适配器 */
  cloudAdapter?: ICloudRecognitionAdapter;
  /** 传输协议 */
  transport?: CloudTransportType;
  /** 音频配置 */
  audioConfig?: IAudioConfig;
  /** 是否启用自动重连 */
  autoReconnect?: boolean;
  /** 最大重连次数 */
  maxReconnectAttempts?: number;
  /** 重连间隔 (ms) */
  reconnectInterval?: number;
}

// ============================================================================
// 2. 云端适配器接口
// ============================================================================

/**
 * 云端识别适配器接口
 * 提供统一的第三方语音识别服务集成接口
 */
export interface ICloudRecognitionAdapter {
  /** 适配器名称 */
  readonly name: string;

  /**
   * 获取 WebSocket 连接地址
   * @returns WebSocket URL
   */
  getConnectUrl?(): Promise<string> | string;

  /**
   * 获取握手参数
   * @returns 握手消息
   */
  getHandshakeParams?(): unknown;

  /**
   * HTTP 短语音识别
   * @param audioData WAV/PCM 二进制数据
   * @returns 识别结果
   */
  recognizeShortAudio?(audioData: ArrayBuffer): Promise<IRecognitionResult>;

  /**
   * 转换音频数据格式
   * @param pcmData PCM 原始数据
   * @returns 转换后的数据
   */
  transformAudioData?(pcmData: ArrayBuffer): ArrayBuffer | string;

  /**
   * 解析识别结果
   * @param data 原始响应数据
   * @returns 识别结果
   */
  parseResult(data: unknown): IRecognitionResult | null;

  /**
   * 检查适配器是否可用
   * @returns 是否可用
   */
  isAvailable?(): boolean;
}

// ============================================================================
// 3. 音频工具类 (含 WAV 编码器)
// ============================================================================

/**
 * 音频处理工具集
 */
export const AudioUtils = {
  /**
   * 重采样音频数据
   * @param data 原始音频数据
   * @param inputRate 输入采样率
   * @param outputRate 输出采样率
   * @returns 重采样后的数据
   */
  resample(data: Float32Array, inputRate: number, outputRate: number): Float32Array {
    if (inputRate === outputRate) return data;
    const compression = inputRate / outputRate;
    const length = Math.ceil(data.length / compression);
    const result = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = data[Math.floor(i * compression)] ?? 0;
    }
    return result;
  },

  /**
   * Float32 转 Int16 PCM
   * @param input Float32 数据
   * @returns Int16 PCM 数据
   */
  floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i] ?? 0));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  },

  /**
   * 计算音量 RMS
   * @param data 音频数据
   * @returns RMS 值
   */
  calculateRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const sample = data[i] ?? 0;
      sum += sample * sample;
    }
    return Math.sqrt(sum / data.length);
  },

  /**
   * 合并 PCM 片段
   * @param buffers PCM 缓冲区数组
   * @param totalLength 总采样数
   * @returns 合并后的 Int16 数组
   */
  mergeBuffers(buffers: ArrayBuffer[], totalLength: number): Int16Array {
    const result = new Int16Array(totalLength);
    let offset = 0;
    for (const buffer of buffers) {
      const view = new Int16Array(buffer);
      result.set(view, offset);
      offset += view.length;
    }
    return result;
  },

  /**
   * PCM 转 WAV 封装
   * @param samples PCM 采样数据
   * @param sampleRate 采样率
   * @param channels 声道数
   * @returns WAV 格式 ArrayBuffer
   */
  encodeWAV(samples: Int16Array, sampleRate: number = 16000, channels: number = 1): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string): void => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // RIFF Header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');

    // fmt chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, channels, true); // channels
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, sampleRate * channels * 2, true); // byte rate
    view.setUint16(32, channels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // data chunk
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // 写入采样数据
    const dataOffset = 44;
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(dataOffset + i * 2, samples[i] ?? 0, true);
    }

    return buffer;
  },

  /**
   * ArrayBuffer 转 Base64
   * @param buffer ArrayBuffer
   * @returns Base64 字符串
   */
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i] ?? 0);
    }
    return typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary).toString('base64');
  },
};

// ============================================================================
// 4. AudioWorklet 核心代码
// ============================================================================

/**
 * AudioWorklet 处理器代码
 * 在音频线程中运行，实现实时音频处理
 */
const WORKLET_CODE = `
class SpeechProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.targetRate = 16000;
    this.currentRate = 44100;
    this.silenceFrames = 0;
    this.maxSilenceFrames = 0;
    this.vadThreshold = 0.02;
    this.isRecording = false;
    this.port.onmessage = this.handleMessage.bind(this);
  }

  static get parameterDescriptors() {
    return [];
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input.length || !this.isRecording) return true;
    const channelData = input[0];

    // VAD 检测
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(sum / channelData.length);

    if (rms < this.vadThreshold) {
      this.silenceFrames++;
      if (this.maxSilenceFrames > 0 && this.silenceFrames > this.maxSilenceFrames) {
        this.port.postMessage({ type: 'VAD_TIMEOUT' });
        this.silenceFrames = 0;
      }
    } else {
      this.silenceFrames = 0;
    }

    // 重采样
    if (this.targetRate < this.currentRate) {
      const compression = this.currentRate / this.targetRate;
      for (let i = 0; i < channelData.length; i += compression) {
        this.buffer.push(channelData[Math.floor(i)]);
      }
    } else {
      this.buffer.push(...channelData);
    }

    // 定期刷新 (~128ms)
    if (this.buffer.length >= 2048) {
      this.flush();
    }
    return true;
  }

  flush() {
    if (this.buffer.length === 0) return;
    const pcmData = new Int16Array(this.buffer.length);
    for (let i = 0; i < this.buffer.length; i++) {
      let s = Math.max(-1, Math.min(1, this.buffer[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      pcmData[i] = s;
    }
    this.port.postMessage({ type: 'AUDIO_DATA', payload: pcmData.buffer }, [pcmData.buffer]);
    this.buffer = [];
  }

  handleMessage(event) {
    const { type, payload } = event.data;
    if (type === 'CONFIG') {
      this.targetRate = payload.targetRate || 16000;
      this.currentRate = payload.currentRate || 44100;
      this.vadThreshold = payload.vadThreshold || 0.02;
      const secondsPerBlock = 128 / this.currentRate;
      this.maxSilenceFrames = (payload.vadDuration / 1000) / secondsPerBlock;
    }
    if (type === 'SET_RECORDING') {
      this.isRecording = payload;
      if (!payload) this.flush();
    }
  }
}
registerProcessor('speech-processor', SpeechProcessor);
`;

// ============================================================================
// 5. 浏览器 Speech Recognition API 类型声明
// ============================================================================

interface BrowserSpeechRecognitionResultList {
  readonly length: number;
  item(index: number): BrowserSpeechRecognitionResult | null;
  [index: number]: BrowserSpeechRecognitionResult;
}

interface BrowserSpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): BrowserSpeechRecognitionAlternative | null;
  [index: number]: BrowserSpeechRecognitionAlternative;
}

interface BrowserSpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface BrowserSpeechRecognitionEvent {
  readonly results: BrowserSpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface BrowserSpeechRecognitionErrorEvent {
  readonly error: string;
  readonly message: string;
}

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
  onerror:
    | ((this: BrowserSpeechRecognition, ev: BrowserSpeechRecognitionErrorEvent) => void)
    | null;
  onsoundstart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onsoundend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onaudiostart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onnomatch: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
}

interface BrowserSpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

// ============================================================================
// 6. 内置云端适配器实现
// ============================================================================

/**
 * 通用适配器 (BFF 模式 - 推荐)
 * 适用于自建后端代理场景
 */
export class GenericAdapter implements ICloudRecognitionAdapter {
  readonly name = 'Generic/BFF';

  constructor(private baseUrl: string) {}

  getConnectUrl(): string {
    return this.baseUrl.replace(/^http/, 'ws');
  }

  async recognizeShortAudio(audioData: ArrayBuffer): Promise<IRecognitionResult> {
    const formData = new FormData();
    formData.append('file', new Blob([audioData], { type: 'audio/wav' }));

    const res = await fetch(`${this.baseUrl}/recognize`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as Record<string, unknown>;
    const result = this.parseResult(json);
    if (!result) throw new Error('解析结果失败');
    return result;
  }

  parseResult(data: Record<string, unknown>): IRecognitionResult | null {
    return {
      transcript: (data['text'] as string) || (data['transcript'] as string) || '',
      isFinal: true,
      confidence: (data['score'] as number) || (data['confidence'] as number) || 0.9,
      original: data,
    };
  }
}

/**
 * 讯飞云适配器
 * 支持讯飞语音听写 WebAPI
 */
export class XunfeiAdapter implements ICloudRecognitionAdapter {
  readonly name = 'Xunfei';
  /** API Key - 生产环境应在后端使用 */
  readonly apiKey: string | undefined;
  /** API Secret - 生产环境应在后端使用 */
  readonly apiSecret: string | undefined;

  constructor(
    private appId: string,
    apiKey?: string,
    apiSecret?: string
  ) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  getConnectUrl(): string {
    // 生产环境应在后端生成鉴权 URL
    // 参见: https://www.xfyun.cn/doc/asr/voicedictation/API.html
    const host = 'iat-api.xfyun.cn';
    const path = '/v2/iat';
    // 简化演示，实际需要计算 authorization
    return `wss://${host}${path}?authorization=...&date=...&host=${host}`;
  }

  getHandshakeParams(): Record<string, unknown> {
    return {
      common: { app_id: this.appId },
      business: {
        language: 'zh_cn',
        domain: 'iat',
        accent: 'mandarin',
        vad_eos: 3000,
      },
      data: {
        status: 0,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
      },
    };
  }

  async recognizeShortAudio(audioData: ArrayBuffer): Promise<IRecognitionResult> {
    const blob = new Blob([audioData], { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audio', blob);
    formData.append('engine_type', 'sms16k');

    const response = await fetch('https://api.xfyun.cn/v1/service/v1/iat', {
      method: 'POST',
      headers: {
        'X-Appid': this.appId,
        // 生产环境需添加: 'X-CurTime', 'X-Param', 'X-CheckSum'
      },
      body: formData,
    });

    const data = (await response.json()) as Record<string, unknown>;
    const result = this.parseResult(data);
    if (!result) throw new Error('讯飞识别失败');
    return result;
  }

  parseResult(data: Record<string, unknown>): IRecognitionResult | null {
    // WebSocket 响应格式
    if (data['code'] !== undefined && data['code'] !== 0) {
      return null;
    }

    let text = '';

    // WebSocket 格式
    const wsData = data['data'] as Record<string, unknown> | undefined;
    if (wsData?.['result']) {
      const result = wsData['result'] as { ws?: Array<{ cw: Array<{ w: string }> }> };
      text = result.ws?.map(w => w.cw[0]?.w ?? '').join('') ?? '';
    }

    // HTTP 格式
    if (data['desc'] === 'success' && typeof data['data'] === 'string') {
      text = data['data'];
    }

    if (!text) return null;

    return {
      transcript: text,
      isFinal: wsData?.['status'] === 2 || !!data['desc'],
      confidence: 0.9,
      original: data,
    };
  }
}

/**
 * 腾讯云适配器
 * 支持腾讯云一句话识别
 */
export class TencentAdapter implements ICloudRecognitionAdapter {
  readonly name = 'Tencent';
  /** Secret ID - 生产环境应在后端使用 */
  readonly secretId: string;
  /** Secret Key - 生产环境应在后端使用 */
  readonly secretKey: string;

  constructor(secretId: string, secretKey: string) {
    this.secretId = secretId;
    this.secretKey = secretKey;
  }

  async recognizeShortAudio(audioData: ArrayBuffer): Promise<IRecognitionResult> {
    // TC3-HMAC-SHA256 签名应在后端完成
    const base64Audio = AudioUtils.arrayBufferToBase64(audioData);

    const payload = {
      ProjectId: 0,
      SubServiceType: 2,
      EngSerViceType: '16k_zh',
      SourceType: 1,
      VoiceFormat: 'wav',
      UsrAudioKey: `session-${Date.now()}`,
      Data: base64Audio,
      DataLen: audioData.byteLength,
    };

    const res = await fetch('https://asr.tencentcloudapi.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TC-Action': 'SentenceRecognition',
        // 生产环境需添加: 'Authorization', 'X-TC-Timestamp' 等
      },
      body: JSON.stringify(payload),
    });

    const json = (await res.json()) as Record<string, unknown>;
    const result = this.parseResult(json);
    if (!result) throw new Error('腾讯云识别失败');
    return result;
  }

  parseResult(data: Record<string, unknown>): IRecognitionResult | null {
    const resp = data['Response'] as Record<string, unknown> | undefined;
    if (resp?.['Error']) {
      const error = resp['Error'] as { Message?: string };
      throw new Error(error.Message ?? '腾讯云 API 错误');
    }
    if (resp?.['Result']) {
      return {
        transcript: resp['Result'] as string,
        isFinal: true,
        confidence: 0.9,
        original: data,
      };
    }
    return null;
  }
}

/**
 * 百度云适配器
 * 支持百度语音识别 REST API 和 WebSocket API
 */
export class BaiduAdapter implements ICloudRecognitionAdapter {
  readonly name = 'Baidu';

  constructor(
    private accessToken: string,
    private appId?: string,
    private appKey?: string,
    private devPid: number = 1537
  ) {}

  getConnectUrl(): string {
    const sn = Math.random().toString(36).substring(2) + Date.now();
    return `wss://vop.baidu.com/realtime_asr?sn=${sn}`;
  }

  getHandshakeParams(): Record<string, unknown> {
    if (!this.appId || !this.appKey) {
      console.warn('[BaiduAdapter] WebSocket 模式需要 appId 和 appKey');
    }
    return {
      type: 'START',
      data: {
        appid: Number(this.appId),
        appkey: this.appKey,
        dev_pid: this.devPid,
        cuid: `sdk-user-${Date.now()}`,
        format: 'pcm',
        sample: 16000,
      },
    };
  }

  async recognizeShortAudio(audioData: ArrayBuffer): Promise<IRecognitionResult> {
    const base64Audio = AudioUtils.arrayBufferToBase64(audioData);

    const payload = {
      format: 'wav',
      rate: 16000,
      channel: 1,
      cuid: `sdk-user-${Date.now()}`,
      token: this.accessToken,
      dev_pid: this.devPid,
      speech: base64Audio,
      len: audioData.byteLength,
    };

    // 建议通过 BFF 代理调用，避免 CORS 问题
    const response = await fetch('/api/baidu-speech/pro_api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as Record<string, unknown>;
    const result = this.parseResult(data);
    if (!result) throw new Error('百度识别失败');
    return result;
  }

  parseResult(data: Record<string, unknown>): IRecognitionResult | null {
    // HTTP 响应
    if (data['err_no'] !== undefined) {
      if (data['err_no'] !== 0) {
        throw new Error(`Baidu API Error [${String(data['err_no'])}]: ${String(data['err_msg'])}`);
      }
      const result = data['result'] as string[] | undefined;
      if (result && result.length > 0) {
        return {
          transcript: result[0] ?? '',
          isFinal: true,
          confidence: 0.9,
          original: data,
        };
      }
    }

    // WebSocket 响应
    if (data['type']) {
      if (data['type'] === 'HEARTBEAT') return null;
      if (data['type'] === 'ERROR') {
        throw new Error(`Baidu WS Error: ${String(data['err_msg'])}`);
      }
      if (data['type'] === 'MID_TEXT' || data['type'] === 'FIN_TEXT') {
        return {
          transcript: data['result'] as string,
          isFinal: data['type'] === 'FIN_TEXT',
          confidence: 0.9,
          original: data,
        };
      }
    }

    return null;
  }
}

/**
 * 阿里云适配器
 * 支持阿里云智能语音交互
 */
export class AlibabaAdapter implements ICloudRecognitionAdapter {
  readonly name = 'Alibaba';
  /** Access Key Secret - 生产环境应在后端使用 */
  readonly accessKeySecret: string;

  constructor(
    private accessKeyId: string,
    accessKeySecret: string,
    private appKey: string
  ) {
    this.accessKeySecret = accessKeySecret;
  }

  getConnectUrl(): string {
    // 阿里云实时语音识别 WebSocket 地址
    return `wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1`;
  }

  getHandshakeParams(): Record<string, unknown> {
    return {
      header: {
        message_id: this.generateUUID(),
        task_id: this.generateUUID(),
        namespace: 'SpeechRecognizer',
        name: 'StartRecognition',
        appkey: this.appKey,
      },
      payload: {
        format: 'pcm',
        sample_rate: 16000,
        enable_intermediate_result: true,
        enable_punctuation_prediction: true,
        enable_inverse_text_normalization: true,
      },
    };
  }

  async recognizeShortAudio(audioData: ArrayBuffer): Promise<IRecognitionResult> {
    const base64Audio = AudioUtils.arrayBufferToBase64(audioData);

    // 建议通过 BFF 代理调用
    const response = await fetch('/api/alibaba-speech/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-NLS-Token': this.accessKeyId,
      },
      body: JSON.stringify({
        appkey: this.appKey,
        format: 'wav',
        sample_rate: 16000,
        audio: base64Audio,
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;
    const result = this.parseResult(data);
    if (!result) throw new Error('阿里云识别失败');
    return result;
  }

  parseResult(data: Record<string, unknown>): IRecognitionResult | null {
    // WebSocket 响应
    const header = data['header'] as Record<string, unknown> | undefined;
    if (header) {
      const status = header['status'] as number;
      if (status !== 20000000) {
        throw new Error(`Alibaba Error [${status}]: ${String(header['status_text'])}`);
      }

      const payload = data['payload'] as Record<string, unknown> | undefined;
      if (payload?.['result']) {
        return {
          transcript: payload['result'] as string,
          isFinal: header['name'] === 'RecognitionCompleted',
          confidence: 0.9,
          original: data,
        };
      }
    }

    // HTTP 响应
    if (data['result']) {
      return {
        transcript: data['result'] as string,
        isFinal: true,
        confidence: (data['confidence'] as number) || 0.9,
        original: data,
      };
    }

    return null;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

/**
 * Google Cloud Speech 适配器
 */
export class GoogleAdapter implements ICloudRecognitionAdapter {
  readonly name = 'Google';

  constructor(
    private apiKey: string,
    private languageCode: string = 'zh-CN'
  ) {}

  async recognizeShortAudio(audioData: ArrayBuffer): Promise<IRecognitionResult> {
    const base64Audio = AudioUtils.arrayBufferToBase64(audioData);

    const payload = {
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: this.languageCode,
        enableAutomaticPunctuation: true,
      },
      audio: {
        content: base64Audio,
      },
    };

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = (await response.json()) as Record<string, unknown>;
    const result = this.parseResult(data);
    if (!result) throw new Error('Google 识别失败');
    return result;
  }

  parseResult(data: Record<string, unknown>): IRecognitionResult | null {
    if (data['error']) {
      const error = data['error'] as { message?: string };
      throw new Error(error.message ?? 'Google API Error');
    }

    const results = data['results'] as Array<{
      alternatives?: Array<{ transcript?: string; confidence?: number }>;
    }>;

    if (results && results.length > 0) {
      const alternatives = results[0]?.alternatives;
      if (alternatives && alternatives.length > 0) {
        return {
          transcript: alternatives[0]?.transcript ?? '',
          isFinal: true,
          confidence: alternatives[0]?.confidence ?? 0.9,
          original: data,
        };
      }
    }

    return null;
  }
}

/**
 * Azure Speech 适配器
 */
export class AzureAdapter implements ICloudRecognitionAdapter {
  readonly name = 'Azure';

  constructor(
    private subscriptionKey: string,
    private region: string,
    private language: string = 'zh-CN'
  ) {}

  getConnectUrl(): string {
    return `wss://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${this.language}`;
  }

  getHandshakeParams(): Record<string, unknown> {
    return {
      'Ocp-Apim-Subscription-Key': this.subscriptionKey,
    };
  }

  async recognizeShortAudio(audioData: ArrayBuffer): Promise<IRecognitionResult> {
    const response = await fetch(
      `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${this.language}`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        },
        body: audioData,
      }
    );

    const data = (await response.json()) as Record<string, unknown>;
    const result = this.parseResult(data);
    if (!result) throw new Error('Azure 识别失败');
    return result;
  }

  parseResult(data: Record<string, unknown>): IRecognitionResult | null {
    if (data['RecognitionStatus'] === 'Success') {
      return {
        transcript: (data['DisplayText'] as string) || (data['Text'] as string) || '',
        isFinal: true,
        confidence: (data['Confidence'] as number) || 0.9,
        original: data,
      };
    }

    // WebSocket 分片响应
    if (data['Text']) {
      return {
        transcript: data['Text'] as string,
        isFinal: data['RecognitionStatus'] === 'Success',
        confidence: 0.9,
        original: data,
      };
    }

    return null;
  }
}

// ============================================================================
// 7. 抽象策略基类
// ============================================================================

/**
 * 事件监听器类型定义
 */
type EventListeners = {
  result: Array<(res: IRecognitionResult) => void>;
  error: Array<(err: IRecognitionError) => void>;
  state: Array<(status: RecognitionStatus) => void>;
  start: Array<() => void>;
  end: Array<() => void>;
  soundstart: Array<() => void>;
  soundend: Array<() => void>;
  speechstart: Array<() => void>;
  speechend: Array<() => void>;
  audiostart: Array<() => void>;
  audioend: Array<() => void>;
};

/**
 * 识别策略基类
 */
abstract class BaseRecognitionStrategy {
  protected listeners: EventListeners = {
    result: [],
    error: [],
    state: [],
    start: [],
    end: [],
    soundstart: [],
    soundend: [],
    speechstart: [],
    speechend: [],
    audiostart: [],
    audioend: [],
  };

  protected _status: RecognitionStatus = RecognitionStatus.IDLE;

  constructor(protected config: IAdvancedRecognitionConfig) {}

  /**
   * 获取当前状态
   */
  get status(): RecognitionStatus {
    return this._status;
  }

  /**
   * 开始识别
   */
  abstract start(): Promise<void>;

  /**
   * 停止识别
   */
  abstract stop(): void;

  /**
   * 中止识别
   */
  abstract abort(): void;

  /**
   * 是否正在录音
   */
  abstract isListening(): boolean;

  /**
   * 设置状态
   */
  protected setStatus(status: RecognitionStatus): void {
    if (this._status !== status) {
      this._status = status;
      this.emit('state', status);
    }
  }

  /**
   * 添加事件监听
   */
  on<K extends keyof EventListeners>(event: K, fn: EventListeners[K][number]): void {
    (this.listeners[event] as Array<typeof fn>).push(fn);
  }

  /**
   * 移除事件监听
   */
  off<K extends keyof EventListeners>(event: K, fn: EventListeners[K][number]): void {
    const listeners = this.listeners[event] as Array<typeof fn>;
    const index = listeners.indexOf(fn);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  protected emit<K extends keyof EventListeners>(
    event: K,
    data?: Parameters<EventListeners[K][number]>[0]
  ): void {
    const listeners = this.listeners[event] as Array<(arg?: typeof data) => void>;
    listeners.forEach(fn => {
      try {
        fn(data);
      } catch (e) {
        console.error(`[Recognition] 事件处理器错误 (${event}):`, e);
      }
    });
  }

  /**
   * 销毁资源
   */
  dispose(): void {
    this.abort();
    Object.keys(this.listeners).forEach(key => {
      (this.listeners as Record<string, unknown[]>)[key] = [];
    });
  }
}

// ============================================================================
// 8. 原生识别策略
// ============================================================================

/**
 * 浏览器原生语音识别策略
 * 使用 Web Speech API
 */
class NativeRecognitionStrategy extends BaseRecognitionStrategy {
  private recognition: BrowserSpeechRecognition | null = null;
  private SpeechRecognitionClass: BrowserSpeechRecognitionConstructor | null = null;

  constructor(config: IAdvancedRecognitionConfig) {
    super(config);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const srClass =
      typeof window !== 'undefined'
        ? ((window.SpeechRecognition as BrowserSpeechRecognitionConstructor | undefined) ??
          (window.webkitSpeechRecognition as BrowserSpeechRecognitionConstructor | undefined))
        : undefined;
    this.SpeechRecognitionClass = srClass ?? null;
  }

  /**
   * 检查是否可用
   */
  isAvailable(): boolean {
    return this.SpeechRecognitionClass !== null;
  }

  async start(): Promise<void> {
    if (!this.SpeechRecognitionClass) {
      throw { code: 'NOT_SUPPORTED', message: '浏览器不支持语音识别' };
    }

    if (this._status !== RecognitionStatus.IDLE) {
      return;
    }

    this.setStatus(RecognitionStatus.CONNECTING);

    return new Promise((resolve, reject) => {
      this.recognition = new this.SpeechRecognitionClass!();

      // 配置
      this.recognition.lang = this.config.lang ?? 'zh-CN';
      this.recognition.continuous = this.config.continuous ?? false;
      this.recognition.interimResults = this.config.interimResults ?? true;
      this.recognition.maxAlternatives = this.config.maxAlternatives ?? 1;

      // 事件处理
      this.recognition.onstart = () => {
        this.setStatus(RecognitionStatus.RECORDING);
        this.emit('start');
        this.emit('audiostart');
        resolve();
      };

      this.recognition.onend = () => {
        this.setStatus(RecognitionStatus.IDLE);
        this.emit('audioend');
        this.emit('end');
      };

      this.recognition.onresult = e => {
        const results = e.results[e.resultIndex];
        if (results?.[0]) {
          this.emit('result', {
            transcript: results[0].transcript,
            isFinal: results.isFinal,
            confidence: results[0].confidence,
            original: e,
          });
        }
      };

      this.recognition.onerror = e => {
        const errorMap: Record<string, IRecognitionError['code']> = {
          'not-allowed': 'NOT_ALLOWED',
          'no-speech': 'NO_SPEECH',
          network: 'NETWORK',
        };

        const error: IRecognitionError = {
          code: errorMap[e.error] ?? 'UNKNOWN',
          message: this.getErrorMessage(e.error),
          originalError: e,
        };

        this.setStatus(RecognitionStatus.IDLE);
        this.emit('error', error);

        if (e.error === 'not-allowed' || e.error === 'audio-capture') {
          reject(error);
        }
      };

      this.recognition.onsoundstart = () => this.emit('soundstart');
      this.recognition.onsoundend = () => this.emit('soundend');
      this.recognition.onspeechstart = () => this.emit('speechstart');
      this.recognition.onspeechend = () => this.emit('speechend');

      try {
        this.recognition.start();
      } catch (e) {
        this.setStatus(RecognitionStatus.IDLE);
        reject({ code: 'UNKNOWN', message: '启动识别失败', originalError: e });
      }
    });
  }

  stop(): void {
    if (this.recognition && this._status === RecognitionStatus.RECORDING) {
      this.recognition.stop();
    }
  }

  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.setStatus(RecognitionStatus.IDLE);
    }
  }

  isListening(): boolean {
    return this._status === RecognitionStatus.RECORDING;
  }

  private getErrorMessage(errorCode: string): string {
    const messages: Record<string, string> = {
      'no-speech': '未检测到语音输入',
      'audio-capture': '无法访问麦克风',
      'not-allowed': '麦克风权限被拒绝',
      network: '网络错误',
      aborted: '识别被中止',
      'language-not-supported': '不支持的语言',
      'service-not-allowed': '语音服务不可用',
    };
    return messages[errorCode] ?? `语音识别错误: ${errorCode}`;
  }
}

// ============================================================================
// 9. 云端识别策略
// ============================================================================

/**
 * 云端语音识别策略
 * 支持 WebSocket 流式识别和 HTTP 短语音识别
 */
class CloudRecognitionStrategy extends BaseRecognitionStrategy {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private socket: WebSocket | null = null;
  private adapter: ICloudRecognitionAdapter;
  private transport: CloudTransportType;

  // HTTP 模式缓冲
  private pcmChunks: ArrayBuffer[] = [];
  private totalPCMLength = 0;

  // 页面可见性监听器
  private visibilityHandler: (() => void) | null = null;

  // 弱网消息队列
  private msgQueue: ArrayBuffer[] = [];
  private readonly MSG_QUEUE_MAX = 50;

  // ScriptProcessor 降级参数
  private spSilenceCount = 0;
  private spMaxSilence = 0;
  private isRecordingFlag = false;

  // 重连参数
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // Worklet 加载标记
  private workletLoaded = false;

  constructor(config: IAdvancedRecognitionConfig) {
    super(config);
    if (!config.cloudAdapter) {
      throw new Error('[CloudStrategy] 需要提供 cloudAdapter');
    }
    this.adapter = config.cloudAdapter;
    this.transport = config.transport ?? 'websocket';
  }

  async start(): Promise<void> {
    if (this._status !== RecognitionStatus.IDLE) {
      return;
    }

    this.setStatus(RecognitionStatus.CONNECTING);
    this.pcmChunks = [];
    this.totalPCMLength = 0;
    this.reconnectAttempts = 0;

    try {
      // 1. WebSocket 模式预连接
      if (this.transport === 'websocket') {
        if (!this.adapter.getConnectUrl) {
          throw new Error('适配器缺少 getConnectUrl 方法');
        }
        const url = await Promise.resolve(this.adapter.getConnectUrl());
        await this.initWebSocket(url);
      }

      // 2. 获取麦克风权限
      const audioConfig = this.config.audioConfig ?? {};
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: audioConfig.echoCancellation ?? true,
          noiseSuppression: audioConfig.noiseSuppression ?? true,
          autoGainControl: audioConfig.autoGainControl ?? true,
        },
      });

      // 3. 初始化音频上下文
      await this.initAudioContext();

      // 4. HTTP 模式直接进入录音状态
      if (this.transport === 'http') {
        this.setStatus(RecognitionStatus.RECORDING);
      }

      // 5. 监听页面可见性
      this.setupVisibilityListener();

      this.emit('start');
      this.emit('audiostart');
    } catch (err: unknown) {
      const error = err as Error;
      this.emit('error', {
        code: 'NOT_ALLOWED',
        message: error.message || '启动失败',
        originalError: err,
      });
      this.cleanup();
      throw err;
    }
  }

  /**
   * 初始化 WebSocket 连接
   */
  private initWebSocket(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(url);
      this.socket.binaryType = 'arraybuffer';

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket 连接超时'));
      }, 10000);

      this.socket.onopen = () => {
        clearTimeout(timeout);
        this.setStatus(RecognitionStatus.RECORDING);
        this.reconnectAttempts = 0;

        // 发送握手消息
        if (this.adapter.getHandshakeParams) {
          const params = this.adapter.getHandshakeParams();
          if (params) {
            const msg = typeof params === 'string' ? params : JSON.stringify(params);
            this.socket?.send(msg);
          }
        }
        resolve();
      };

      this.socket.onerror = e => {
        clearTimeout(timeout);
        reject(e);
      };

      this.socket.onmessage = e => {
        try {
          const data = e.data as string | ArrayBuffer;
          const raw = typeof data === 'string' ? data : new TextDecoder().decode(data);
          const res = this.adapter.parseResult(JSON.parse(raw));
          if (res) {
            this.emit('result', res);
          }
        } catch {
          // 忽略解析错误
        }
      };

      this.socket.onclose = () => {
        if (this._status === RecognitionStatus.RECORDING) {
          this.handleReconnect();
        }
      };
    });
  }

  /**
   * 处理重连逻辑
   */
  private handleReconnect(): void {
    const maxAttempts = this.config.maxReconnectAttempts ?? 3;
    const interval = this.config.reconnectInterval ?? 2000;

    if (this.config.autoReconnect && this.reconnectAttempts < maxAttempts) {
      this.reconnectAttempts++;
      // eslint-disable-next-line no-console
      console.log(`[CloudStrategy] 尝试重连 (${this.reconnectAttempts}/${maxAttempts})`);

      this.reconnectTimer = setTimeout(() => {
        void (async () => {
          try {
            if (this.adapter.getConnectUrl) {
              const url = await Promise.resolve(this.adapter.getConnectUrl());
              await this.initWebSocket(url);
            }
          } catch {
            this.handleReconnect();
          }
        })();
      }, interval);
    } else {
      this.emit('error', {
        code: 'NETWORK',
        message: '连接已断开',
      });
      void this.stop();
    }
  }

  /**
   * 初始化音频上下文
   */
  private async initAudioContext(): Promise<void> {
    const AudioCtor =
      typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AudioCtor) {
      throw new Error('浏览器不支持 AudioContext');
    }

    this.audioContext = new AudioCtor();
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const source = this.audioContext.createMediaStreamSource(this.mediaStream!);

    // 优先使用 AudioWorklet
    if (this.audioContext.audioWorklet && !this.workletLoaded) {
      try {
        const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
        await this.audioContext.audioWorklet.addModule(URL.createObjectURL(blob));
        this.workletLoaded = true;
        this.setupWorklet(source);
        console.log('[CloudStrategy] 使用 AudioWorklet 模式');
        return;
      } catch (e) {
        console.warn('[CloudStrategy] AudioWorklet 加载失败，降级到 ScriptProcessor:', e);
      }
    }

    // 降级到 ScriptProcessor
    this.setupScriptProcessor(source);
    console.log('[CloudStrategy] 使用 ScriptProcessor 降级模式');
  }

  /**
   * 设置 AudioWorklet
   */
  private setupWorklet(source: MediaStreamAudioSourceNode): void {
    this.workletNode = new AudioWorkletNode(this.audioContext!, 'speech-processor');

    const audioConfig = this.config.audioConfig ?? {};
    this.workletNode.port.postMessage({
      type: 'CONFIG',
      payload: {
        currentRate: this.audioContext!.sampleRate,
        targetRate: audioConfig.sampleRate ?? 16000,
        vadThreshold: audioConfig.vadThreshold ?? 0.02,
        vadDuration: audioConfig.vadDuration ?? 3000,
      },
    });

    this.workletNode.port.onmessage = (
      e: MessageEvent<{ type: string; payload?: ArrayBuffer }>
    ) => {
      const { type, payload } = e.data;
      if (type === 'AUDIO_DATA' && payload) {
        this.handlePCM(payload);
      }
      if (type === 'VAD_TIMEOUT') {
        this.emit('speechend');
        void this.stop();
      }
    };

    this.workletNode.port.postMessage({ type: 'SET_RECORDING', payload: true });
    source.connect(this.workletNode);
    this.workletNode.connect(this.audioContext!.destination);

    this.emit('speechstart');
  }

  /**
   * 设置 ScriptProcessor (降级方案)
   */
  private setupScriptProcessor(source: MediaStreamAudioSourceNode): void {
    const bufferSize = 4096;
    this.scriptProcessor = this.audioContext!.createScriptProcessor(bufferSize, 1, 1);

    const audioConfig = this.config.audioConfig ?? {};
    const targetRate = audioConfig.sampleRate ?? 16000;
    const currentRate = this.audioContext!.sampleRate;

    // VAD 参数
    const secondsPerBuf = bufferSize / currentRate;
    this.spMaxSilence = (audioConfig.vadDuration ?? 3000) / 1000 / secondsPerBuf;
    this.spSilenceCount = 0;
    this.isRecordingFlag = true;

    this.scriptProcessor.onaudioprocess = e => {
      if (!this.isRecordingFlag) return;

      const input = e.inputBuffer.getChannelData(0);

      // VAD 检测
      const rms = AudioUtils.calculateRMS(input);
      if (rms < (audioConfig.vadThreshold ?? 0.02)) {
        this.spSilenceCount++;
        if (this.spSilenceCount > this.spMaxSilence) {
          this.emit('speechend');
          void this.stop();
          return;
        }
      } else {
        this.spSilenceCount = 0;
      }

      // 重采样 + 转换
      const resampled = AudioUtils.resample(input, currentRate, targetRate);
      const pcm = AudioUtils.floatTo16BitPCM(resampled);
      this.handlePCM(pcm.buffer.slice(0));
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext!.destination);

    this.emit('speechstart');
  }

  /**
   * 处理 PCM 数据
   */
  private handlePCM(buffer: ArrayBuffer): void {
    if (this.transport === 'websocket') {
      // WebSocket 流式发送
      let payload: ArrayBuffer | string = buffer;
      if (this.adapter.transformAudioData) {
        payload = this.adapter.transformAudioData(buffer);
      }

      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // 先发送缓存队列
        this.flushMsgQueue();
        this.socket.send(payload);
      } else if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
        // 缓存到队列
        if (payload instanceof ArrayBuffer && this.msgQueue.length < this.MSG_QUEUE_MAX) {
          this.msgQueue.push(payload);
        }
      }
    } else {
      // HTTP 模式：堆积数据
      const chunk = buffer.slice(0);
      this.pcmChunks.push(chunk);
      this.totalPCMLength += chunk.byteLength / 2;
    }
  }

  /**
   * 刷新消息队列
   */
  private flushMsgQueue(): void {
    while (this.msgQueue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
      const data = this.msgQueue.shift();
      if (data) {
        this.socket.send(data);
      }
    }
  }

  /**
   * 设置页面可见性监听
   */
  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') return;

    this.visibilityHandler = () => {
      if (document.hidden && this._status === RecognitionStatus.RECORDING) {
        this.emit('error', {
          code: 'NOT_ALLOWED',
          message: '页面已进入后台，录音已暂停',
        });
        void this.stop();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  async stop(): Promise<void> {
    if (this._status === RecognitionStatus.IDLE) {
      return;
    }

    // 1. 停止录音
    this.isRecordingFlag = false;
    this.workletNode?.port.postMessage({ type: 'SET_RECORDING', payload: false });

    // 2. 停止媒体轨道
    this.mediaStream?.getTracks().forEach(t => t.stop());

    // 3. HTTP 模式提交音频
    if (
      this.transport === 'http' &&
      this.pcmChunks.length > 0 &&
      this.adapter.recognizeShortAudio
    ) {
      try {
        this.setStatus(RecognitionStatus.PROCESSING);

        // 合并 & 编码 WAV
        const mergedPCM = AudioUtils.mergeBuffers(this.pcmChunks, this.totalPCMLength);
        const sampleRate = this.config.audioConfig?.sampleRate ?? 16000;
        const wavBuffer = AudioUtils.encodeWAV(mergedPCM, sampleRate);

        // 调用适配器识别
        const result = await this.adapter.recognizeShortAudio(wavBuffer);
        this.emit('result', result);
      } catch (e: unknown) {
        const error = e as Error;
        this.emit('error', {
          code: 'ADAPTER_ERROR',
          message: error.message || '识别失败',
          originalError: e,
        });
      }
    }

    // 4. 清理资源
    this.cleanup();
    this.emit('audioend');
    this.emit('end');
  }

  abort(): void {
    this.isRecordingFlag = false;
    this.cleanup();
    this.emit('end');
  }

  isListening(): boolean {
    return this._status === RecognitionStatus.RECORDING;
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    // 清理重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 关闭 WebSocket
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    // 断开音频节点
    this.workletNode?.disconnect();
    this.scriptProcessor?.disconnect();
    void this.audioContext?.close();

    // 移除可见性监听
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    // 清理引用
    this.workletNode = null;
    this.scriptProcessor = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.pcmChunks = [];
    this.totalPCMLength = 0;
    this.msgQueue = [];

    this.setStatus(RecognitionStatus.IDLE);
  }
}

// ============================================================================
// 10. 主入口类 (Facade)
// ============================================================================

/**
 * 语音识别器实现
 * 统一封装原生识别和云端识别
 */
export class SpeechRecognizerImpl implements SpeechRecognizer {
  private strategy: BaseRecognitionStrategy | null = null;
  private config: IAdvancedRecognitionConfig = {};
  private _currentProvider: SpeechProviderType = 'browser';
  private _status: SpeechServiceStatus = 'idle';
  private eventHandlers: Map<RecognitionEventType, Set<RecognitionEventHandler>> = new Map();
  private customProviders: Map<SpeechProviderType, RecognitionProvider> = new Map();

  get currentProvider(): SpeechProviderType {
    return this._currentProvider;
  }

  get status(): SpeechServiceStatus {
    return this._status;
  }

  /**
   * 获取当前识别状态
   */
  get recognitionStatus(): RecognitionStatus {
    return this.strategy?.status ?? RecognitionStatus.IDLE;
  }

  /**
   * 初始化语音识别器
   */
  initialize(config?: RecognitionConfig): Promise<void> {
    this._status = 'loading';

    // 合并配置
    this.config = {
      lang: 'zh-CN',
      continuous: false,
      interimResults: true,
      maxAlternatives: 1,
      mode: 'auto',
      autoReconnect: true,
      maxReconnectAttempts: 3,
      reconnectInterval: 2000,
      audioConfig: {
        sampleRate: 16000,
        vadThreshold: 0.02,
        vadDuration: 3000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      ...config,
    } as IAdvancedRecognitionConfig;

    try {
      this.initializeStrategy();
      this._status = 'ready';
      return Promise.resolve();
    } catch (error) {
      this._status = 'error';
      return Promise.reject(error);
    }
  }

  /**
   * 初始化识别策略
   */
  private initializeStrategy(): void {
    const advConfig = this.config;
    const mode = advConfig.mode ?? 'auto';
    const hasNative =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    // 选择策略
    if (mode === 'native' || (mode === 'auto' && hasNative && !advConfig.cloudAdapter)) {
      const nativeStrategy = new NativeRecognitionStrategy(advConfig);
      if (!nativeStrategy.isAvailable()) {
        throw new Error('浏览器不支持原生语音识别');
      }
      this.strategy = nativeStrategy;
      this._currentProvider = 'browser';
    } else if (mode === 'cloud' || (mode === 'auto' && advConfig.cloudAdapter)) {
      if (!advConfig.cloudAdapter) {
        throw new Error('云端模式需要提供 cloudAdapter');
      }
      this.strategy = new CloudRecognitionStrategy(advConfig);
      this._currentProvider = 'custom';
    } else {
      throw new Error('没有可用的识别策略');
    }

    // 转发事件
    this.forwardStrategyEvents();
  }

  /**
   * 转发策略事件
   */
  private forwardStrategyEvents(): void {
    if (!this.strategy) return;

    this.strategy.on('result', res => {
      this.emit('result', {
        type: 'result',
        result: this.convertResult(res),
      });
    });

    this.strategy.on('error', err => {
      const errorEvent: RecognitionEvent = {
        type: 'error',
        error: {
          code: err.code,
          message: err.message,
        },
      };
      if (err.originalError) {
        errorEvent.error!.originalError = err.originalError as Error;
      }
      this.emit('error', errorEvent);
    });

    this.strategy.on('start', () => this.emit('start', { type: 'start' }));
    this.strategy.on('end', () => this.emit('end', { type: 'end' }));
    this.strategy.on('soundstart', () => this.emit('soundstart', { type: 'soundstart' }));
    this.strategy.on('soundend', () => this.emit('soundend', { type: 'soundend' }));
    this.strategy.on('speechstart', () => this.emit('speechstart', { type: 'speechstart' }));
    this.strategy.on('speechend', () => this.emit('speechend', { type: 'speechend' }));
    this.strategy.on('audiostart', () => this.emit('audiostart', { type: 'audiostart' }));
    this.strategy.on('audioend', () => this.emit('audioend', { type: 'audioend' }));
  }

  /**
   * 转换识别结果格式
   */
  private convertResult(res: IRecognitionResult): RecognitionResult {
    return {
      results: [
        {
          transcript: res.transcript,
          confidence: res.confidence,
          isFinal: res.isFinal,
        },
      ],
      bestTranscript: res.transcript,
      bestConfidence: res.confidence,
      isFinal: res.isFinal,
    };
  }

  /**
   * 开始识别
   */
  async start(config?: RecognitionConfig): Promise<void> {
    if (this._status !== 'ready') {
      throw new Error('识别器未就绪');
    }

    if (config) {
      // 更新配置并重新初始化
      this.config = { ...this.config, ...config } as IAdvancedRecognitionConfig;
      this.initializeStrategy();
    }

    return this.strategy?.start();
  }

  /**
   * 停止识别
   */
  stop(): void {
    this.strategy?.stop();
  }

  /**
   * 中止识别
   */
  abort(): void {
    this.strategy?.abort();
  }

  /**
   * 是否正在识别
   */
  isListening(): boolean {
    return this.strategy?.isListening() ?? false;
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
    this.eventHandlers.get(type)?.forEach(handler => {
      try {
        handler(event);
      } catch (e) {
        console.error('[SpeechRecognizer] 事件处理器错误:', e);
      }
    });
  }

  /**
   * 销毁实例
   */
  dispose(): void {
    this.strategy?.dispose();
    this.strategy = null;
    this.eventHandlers.clear();
    this._status = 'idle';
  }

  /**
   * 注册自定义提供商
   */
  registerProvider(type: SpeechProviderType, provider: RecognitionProvider): void {
    this.customProviders.set(type, provider);
  }

  /**
   * 使用云端适配器
   */
  useCloudAdapter(adapter: ICloudRecognitionAdapter): void {
    this.config.cloudAdapter = adapter;
    this.config.mode = 'cloud';
  }
}

// ============================================================================
// 11. 工厂函数和工具函数
// ============================================================================

/**
 * 获取浏览器的 SpeechRecognition 构造函数
 */
function getSpeechRecognitionConstructor(): BrowserSpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return (
    (window.SpeechRecognition as BrowserSpeechRecognitionConstructor | undefined) ??
    (window.webkitSpeechRecognition as BrowserSpeechRecognitionConstructor | undefined) ??
    null
  );
}

/**
 * 创建语音识别器实例
 * @param config 识别配置
 * @returns 语音识别器实例
 *
 * @example
 * ```typescript
 * // 使用原生识别
 * const recognizer = await createSpeechRecognizer({
 *   lang: 'zh-CN',
 *   continuous: true,
 * });
 *
 * // 使用云端识别 (百度)
 * const baiduAdapter = new BaiduAdapter('your-access-token');
 * const cloudRecognizer = await createSpeechRecognizer({
 *   mode: 'cloud',
 *   cloudAdapter: baiduAdapter,
 *   transport: 'http',
 * });
 *
 * recognizer.on('result', (event) => {
 *   console.log('识别结果:', event.result?.bestTranscript);
 * });
 *
 * await recognizer.start();
 * ```
 */
export async function createSpeechRecognizer(
  config?: RecognitionConfig | IAdvancedRecognitionConfig
): Promise<SpeechRecognizer> {
  const recognizer = new SpeechRecognizerImpl();
  await recognizer.initialize(config);
  return recognizer;
}

/**
 * 检查当前环境是否支持语音识别
 * @returns 是否支持
 */
export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

/**
 * 快速进行一次语音识别
 * @param config 识别配置
 * @returns 识别结果
 *
 * @example
 * ```typescript
 * const result = await listen({ lang: 'zh-CN' });
 * console.log('识别结果:', result.bestTranscript);
 * ```
 */
export async function listen(
  config?: RecognitionConfig | IAdvancedRecognitionConfig
): Promise<RecognitionResult> {
  const recognizer = await createSpeechRecognizer({
    ...config,
    continuous: false,
  });

  return new Promise((resolve, reject) => {
    let hasResult = false;

    recognizer.on('result', event => {
      if (event.result && event.result.isFinal) {
        hasResult = true;
        recognizer.dispose();
        resolve(event.result);
      }
    });

    recognizer.on('error', event => {
      recognizer.dispose();
      reject(event.error);
    });

    recognizer.on('end', () => {
      if (!hasResult) {
        recognizer.dispose();
        resolve({
          results: [],
          bestTranscript: '',
          bestConfidence: 0,
          isFinal: true,
        });
      }
    });

    recognizer.start().catch(reject);
  });
}

/**
 * 创建带超时的语音识别
 * @param config 识别配置
 * @param timeout 超时时间 (ms)
 * @returns 识别结果
 */
export async function listenWithTimeout(
  config?: RecognitionConfig | IAdvancedRecognitionConfig,
  timeout: number = 10000
): Promise<RecognitionResult> {
  return Promise.race([
    listen(config),
    new Promise<RecognitionResult>((_, reject) => {
      setTimeout(() => reject(new Error('识别超时')), timeout);
    }),
  ]);
}

/**
 * [使用示例 - 原生识别]
 *
 * const recognizer = await createSpeechRecognizer({
 *   lang: 'zh-CN',
 *   continuous: true,
 *   interimResults: true,
 * });
 *
 * recognizer.on('result', (event) => {
 *   console.log(event.result?.bestTranscript);
 * });
 *
 * recognizer.on('error', (event) => {
 *   console.error(event.error?.message);
 * });
 *
 * await recognizer.start();
 */

/**
 * [使用示例 - 云端识别 (百度)]
 *
 * const adapter = new BaiduAdapter('your-access-token', 'appId', 'appKey');
 * const recognizer = await createSpeechRecognizer({
 *   mode: 'cloud',
 *   transport: 'websocket', // 或 'http'
 *   cloudAdapter: adapter,
 *   audioConfig: {
 *     vadDuration: 2000,
 *     vadThreshold: 0.03,
 *   },
 *   autoReconnect: true,
 * });
 *
 * recognizer.on('result', (event) => {
 *   if (event.result?.isFinal) {
 *     console.log('最终结果:', event.result.bestTranscript);
 *   }
 * });
 *
 * await recognizer.start();
 */

/**
 * [使用示例 - 自定义 BFF 适配器]
 *
 * const adapter = new GenericAdapter('https://api.yoursite.com/speech');
 * const recognizer = await createSpeechRecognizer({
 *   mode: 'cloud',
 *   transport: 'http',
 *   cloudAdapter: adapter,
 * });
 */
