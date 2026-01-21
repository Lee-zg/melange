/**
 * @fileoverview 语音识别插件单元测试
 * @description 测试 recognition.ts 中的核心功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AudioUtils,
  RecognitionStatus,
  GenericAdapter,
  XunfeiAdapter,
  TencentAdapter,
  BaiduAdapter,
  AlibabaAdapter,
  GoogleAdapter,
  AzureAdapter,
  SpeechRecognizerImpl,
  isSpeechRecognitionSupported,
  type IRecognitionResult,
  type IAdvancedRecognitionConfig,
} from '../src/plugins/speech/recognition';

// ============================================================================
// 1. AudioUtils 音频工具测试
// ============================================================================

describe('AudioUtils', () => {
  describe('resample', () => {
    it('should return same data when rates are equal', () => {
      const data = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]);
      const result = AudioUtils.resample(data, 44100, 44100);
      expect(result).toBe(data);
    });

    it('should downsample audio data correctly', () => {
      const data = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]);
      const result = AudioUtils.resample(data, 44100, 22050);
      // 44100 / 22050 = 2, so every other sample is taken
      expect(result.length).toBe(4);
      expect(result[0]).toBeCloseTo(0.1);
      expect(result[1]).toBeCloseTo(0.3);
    });

    it('should handle empty array', () => {
      const data = new Float32Array([]);
      const result = AudioUtils.resample(data, 44100, 16000);
      expect(result.length).toBe(0);
    });

    it('should downsample from 44100 to 16000', () => {
      // Create a simple sine wave
      const length = 4410;
      const data = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        data[i] = Math.sin((i / length) * Math.PI * 2);
      }
      const result = AudioUtils.resample(data, 44100, 16000);
      // Expected length: ceil(4410 / (44100/16000)) = ceil(4410 / 2.75625) ≈ 1600
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThan(length);
    });
  });

  describe('floatTo16BitPCM', () => {
    it('should convert float audio to 16-bit PCM', () => {
      const input = new Float32Array([0, 0.5, 1.0, -1.0, -0.5]);
      const result = AudioUtils.floatTo16BitPCM(input);

      expect(result).toBeInstanceOf(Int16Array);
      expect(result.length).toBe(5);
      expect(result[0]).toBe(0); // 0 * 0x7FFF = 0
      expect(result[1]).toBeCloseTo(0.5 * 0x7fff, -1); // 0.5 * 32767 ≈ 16383
      expect(result[2]).toBe(0x7fff); // 1.0 * 32767 = 32767
      expect(result[3]).toBe(-0x8000); // -1.0 * 32768 = -32768
    });

    it('should clamp values outside [-1, 1]', () => {
      const input = new Float32Array([2.0, -2.0]);
      const result = AudioUtils.floatTo16BitPCM(input);

      expect(result[0]).toBe(0x7fff); // clamped to 1.0
      expect(result[1]).toBe(-0x8000); // clamped to -1.0
    });

    it('should handle empty array', () => {
      const input = new Float32Array([]);
      const result = AudioUtils.floatTo16BitPCM(input);
      expect(result.length).toBe(0);
    });
  });

  describe('calculateRMS', () => {
    it('should calculate RMS of silence as 0', () => {
      const data = new Float32Array([0, 0, 0, 0, 0]);
      const rms = AudioUtils.calculateRMS(data);
      expect(rms).toBe(0);
    });

    it('should calculate RMS of constant value', () => {
      const data = new Float32Array([0.5, 0.5, 0.5, 0.5]);
      const rms = AudioUtils.calculateRMS(data);
      expect(rms).toBeCloseTo(0.5);
    });

    it('should calculate RMS of mixed values', () => {
      const data = new Float32Array([1, -1, 1, -1]);
      const rms = AudioUtils.calculateRMS(data);
      expect(rms).toBeCloseTo(1);
    });

    it('should handle empty array', () => {
      const data = new Float32Array([]);
      const rms = AudioUtils.calculateRMS(data);
      expect(rms).toBeNaN(); // sqrt(0/0) = NaN
    });
  });

  describe('mergeBuffers', () => {
    it('should merge multiple PCM buffers', () => {
      const buf1 = new Int16Array([1, 2, 3]).buffer;
      const buf2 = new Int16Array([4, 5, 6]).buffer;
      const result = AudioUtils.mergeBuffers([buf1, buf2], 6);

      expect(result).toBeInstanceOf(Int16Array);
      expect(result.length).toBe(6);
      expect(Array.from(result)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should handle single buffer', () => {
      const buf = new Int16Array([1, 2, 3]).buffer;
      const result = AudioUtils.mergeBuffers([buf], 3);
      expect(Array.from(result)).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
      const result = AudioUtils.mergeBuffers([], 0);
      expect(result.length).toBe(0);
    });
  });

  describe('encodeWAV', () => {
    it('should create valid WAV header', () => {
      const samples = new Int16Array([0, 100, -100, 32767, -32768]);
      const wav = AudioUtils.encodeWAV(samples, 16000, 1);

      expect(wav).toBeInstanceOf(ArrayBuffer);
      expect(wav.byteLength).toBe(44 + samples.length * 2);

      const view = new DataView(wav);
      // Check RIFF header
      expect(String.fromCharCode(view.getUint8(0))).toBe('R');
      expect(String.fromCharCode(view.getUint8(1))).toBe('I');
      expect(String.fromCharCode(view.getUint8(2))).toBe('F');
      expect(String.fromCharCode(view.getUint8(3))).toBe('F');

      // Check WAVE format
      expect(String.fromCharCode(view.getUint8(8))).toBe('W');
      expect(String.fromCharCode(view.getUint8(9))).toBe('A');
      expect(String.fromCharCode(view.getUint8(10))).toBe('V');
      expect(String.fromCharCode(view.getUint8(11))).toBe('E');

      // Check fmt chunk
      expect(String.fromCharCode(view.getUint8(12))).toBe('f');
      expect(String.fromCharCode(view.getUint8(13))).toBe('m');
      expect(String.fromCharCode(view.getUint8(14))).toBe('t');

      // Check sample rate
      expect(view.getUint32(24, true)).toBe(16000);

      // Check bits per sample
      expect(view.getUint16(34, true)).toBe(16);
    });

    it('should use default parameters', () => {
      const samples = new Int16Array([100, 200]);
      const wav = AudioUtils.encodeWAV(samples);
      const view = new DataView(wav);

      // Default sample rate: 16000
      expect(view.getUint32(24, true)).toBe(16000);
      // Default channels: 1
      expect(view.getUint16(22, true)).toBe(1);
    });

    it('should handle stereo audio', () => {
      const samples = new Int16Array([100, 200, 300, 400]);
      const wav = AudioUtils.encodeWAV(samples, 44100, 2);
      const view = new DataView(wav);

      expect(view.getUint16(22, true)).toBe(2); // channels
      expect(view.getUint32(24, true)).toBe(44100); // sample rate
    });
  });

  describe('arrayBufferToBase64', () => {
    it('should convert ArrayBuffer to Base64', () => {
      const str = 'Hello, World!';
      const encoder = new TextEncoder();
      const buffer = encoder.encode(str).buffer;

      const base64 = AudioUtils.arrayBufferToBase64(buffer);
      expect(base64).toBe('SGVsbG8sIFdvcmxkIQ==');
    });

    it('should handle empty buffer', () => {
      const buffer = new ArrayBuffer(0);
      const base64 = AudioUtils.arrayBufferToBase64(buffer);
      expect(base64).toBe('');
    });

    it('should handle binary data', () => {
      const bytes = new Uint8Array([0, 1, 255, 128]);
      const base64 = AudioUtils.arrayBufferToBase64(bytes.buffer);
      expect(base64).toBeTruthy();
      expect(typeof base64).toBe('string');
    });
  });
});

// ============================================================================
// 2. RecognitionStatus 状态枚举测试
// ============================================================================

describe('RecognitionStatus', () => {
  it('should have IDLE status', () => {
    expect(RecognitionStatus.IDLE).toBe('IDLE');
  });

  it('should have CONNECTING status', () => {
    expect(RecognitionStatus.CONNECTING).toBe('CONNECTING');
  });

  it('should have RECORDING status', () => {
    expect(RecognitionStatus.RECORDING).toBe('RECORDING');
  });

  it('should have PROCESSING status', () => {
    expect(RecognitionStatus.PROCESSING).toBe('PROCESSING');
  });

  it('should have 4 status values', () => {
    const statusValues = Object.values(RecognitionStatus);
    expect(statusValues.length).toBe(4);
  });
});

// ============================================================================
// 3. Cloud Adapters 适配器测试
// ============================================================================

describe('Cloud Adapters', () => {
  describe('GenericAdapter', () => {
    const adapter = new GenericAdapter('https://api.example.com');

    it('should have correct name', () => {
      expect(adapter.name).toBe('Generic/BFF');
    });

    it('should convert HTTP URL to WebSocket URL', () => {
      const url = adapter.getConnectUrl();
      expect(url).toBe('wss://api.example.com');
    });

    it('should parse result correctly', () => {
      const data = { text: 'Hello World', score: 0.95 };
      const result = adapter.parseResult(data);

      expect(result).not.toBeNull();
      expect(result?.transcript).toBe('Hello World');
      expect(result?.confidence).toBe(0.95);
      expect(result?.isFinal).toBe(true);
    });

    it('should handle alternative field names', () => {
      const data = { transcript: 'Test', confidence: 0.8 };
      const result = adapter.parseResult(data);

      expect(result?.transcript).toBe('Test');
      expect(result?.confidence).toBe(0.8);
    });

    it('should use default confidence when not provided', () => {
      const data = { text: 'Test' };
      const result = adapter.parseResult(data);
      expect(result?.confidence).toBe(0.9);
    });
  });

  describe('XunfeiAdapter', () => {
    const adapter = new XunfeiAdapter('test-app-id', 'test-api-key', 'test-api-secret');

    it('should have correct name', () => {
      expect(adapter.name).toBe('Xunfei');
    });

    it('should return WebSocket URL', () => {
      const url = adapter.getConnectUrl();
      expect(url).toContain('wss://');
      expect(url).toContain('iat-api.xfyun.cn');
    });

    it('should provide handshake parameters', () => {
      const params = adapter.getHandshakeParams();
      expect(params).toBeDefined();
      expect(params.common).toHaveProperty('app_id', 'test-app-id');
      expect(params.business).toHaveProperty('language', 'zh_cn');
    });

    it('should parse successful WebSocket result', () => {
      const data = {
        code: 0,
        data: {
          status: 2,
          result: {
            ws: [{ cw: [{ w: '你好' }] }, { cw: [{ w: '世界' }] }],
          },
        },
      };
      const result = adapter.parseResult(data);

      expect(result).not.toBeNull();
      expect(result?.transcript).toBe('你好世界');
      expect(result?.isFinal).toBe(true);
    });

    it('should return null on error code', () => {
      const data = { code: 10001, message: 'error' };
      const result = adapter.parseResult(data);
      expect(result).toBeNull();
    });
  });

  describe('TencentAdapter', () => {
    const adapter = new TencentAdapter('test-secret-id', 'test-secret-key');

    it('should have correct name', () => {
      expect(adapter.name).toBe('Tencent');
    });

    it('should parse successful response', () => {
      const data = {
        Response: {
          Result: '测试结果',
        },
      };
      const result = adapter.parseResult(data);

      expect(result).not.toBeNull();
      expect(result?.transcript).toBe('测试结果');
      expect(result?.isFinal).toBe(true);
    });

    it('should throw on error response', () => {
      const data = {
        Response: {
          Error: { Message: 'API Error' },
        },
      };

      expect(() => adapter.parseResult(data)).toThrow('API Error');
    });
  });

  describe('BaiduAdapter', () => {
    const adapter = new BaiduAdapter('test-token', 'app-id', 'app-key');

    it('should have correct name', () => {
      expect(adapter.name).toBe('Baidu');
    });

    it('should return WebSocket URL with session ID', () => {
      const url = adapter.getConnectUrl();
      expect(url).toContain('wss://vop.baidu.com/realtime_asr');
      expect(url).toContain('sn=');
    });

    it('should provide handshake parameters', () => {
      const params = adapter.getHandshakeParams();
      expect(params).toHaveProperty('type', 'START');
      expect(params.data).toHaveProperty('format', 'pcm');
      expect(params.data).toHaveProperty('sample', 16000);
    });

    it('should parse HTTP response', () => {
      const data = {
        err_no: 0,
        result: ['语音识别结果'],
      };
      const result = adapter.parseResult(data);

      expect(result?.transcript).toBe('语音识别结果');
      expect(result?.isFinal).toBe(true);
    });

    it('should parse WebSocket MID_TEXT response', () => {
      const data = {
        type: 'MID_TEXT',
        result: '中间结果',
      };
      const result = adapter.parseResult(data);

      expect(result?.transcript).toBe('中间结果');
      expect(result?.isFinal).toBe(false);
    });

    it('should parse WebSocket FIN_TEXT response', () => {
      const data = {
        type: 'FIN_TEXT',
        result: '最终结果',
      };
      const result = adapter.parseResult(data);

      expect(result?.transcript).toBe('最终结果');
      expect(result?.isFinal).toBe(true);
    });

    it('should return null for HEARTBEAT', () => {
      const data = { type: 'HEARTBEAT' };
      const result = adapter.parseResult(data);
      expect(result).toBeNull();
    });

    it('should throw on HTTP error', () => {
      const data = { err_no: 3301, err_msg: 'Audio quality error' };
      expect(() => adapter.parseResult(data)).toThrow('Baidu API Error');
    });
  });

  describe('AlibabaAdapter', () => {
    const adapter = new AlibabaAdapter('access-key-id', 'access-key-secret', 'app-key');

    it('should have correct name', () => {
      expect(adapter.name).toBe('Alibaba');
    });

    it('should return WebSocket URL', () => {
      const url = adapter.getConnectUrl();
      expect(url).toBe('wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1');
    });

    it('should provide handshake parameters with UUID', () => {
      const params = adapter.getHandshakeParams() as {
        header: { namespace: string; name: string; appkey: string; message_id: string };
        payload: unknown;
      };
      expect(params.header).toHaveProperty('namespace', 'SpeechRecognizer');
      expect(params.header).toHaveProperty('name', 'StartRecognition');
      expect(params.header).toHaveProperty('appkey', 'app-key');
      expect(params.header.message_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should parse WebSocket response', () => {
      const data = {
        header: {
          status: 20000000,
          name: 'RecognitionCompleted',
        },
        payload: {
          result: '阿里云识别结果',
        },
      };
      const result = adapter.parseResult(data);

      expect(result?.transcript).toBe('阿里云识别结果');
      expect(result?.isFinal).toBe(true);
    });

    it('should parse intermediate result', () => {
      const data = {
        header: {
          status: 20000000,
          name: 'RecognitionResultChanged',
        },
        payload: {
          result: '中间',
        },
      };
      const result = adapter.parseResult(data);

      expect(result?.transcript).toBe('中间');
      expect(result?.isFinal).toBe(false);
    });

    it('should throw on error status', () => {
      const data = {
        header: {
          status: 40000000,
          status_text: 'Invalid request',
        },
      };
      expect(() => adapter.parseResult(data)).toThrow('Alibaba Error');
    });
  });

  describe('GoogleAdapter', () => {
    const adapter = new GoogleAdapter('test-api-key', 'en-US');

    it('should have correct name', () => {
      expect(adapter.name).toBe('Google');
    });

    it('should parse successful response', () => {
      const data = {
        results: [
          {
            alternatives: [{ transcript: 'Hello World', confidence: 0.98 }],
          },
        ],
      };
      const result = adapter.parseResult(data);

      expect(result?.transcript).toBe('Hello World');
      expect(result?.confidence).toBe(0.98);
      expect(result?.isFinal).toBe(true);
    });

    it('should return null for empty results', () => {
      const data = { results: [] };
      const result = adapter.parseResult(data);
      expect(result).toBeNull();
    });

    it('should throw on error response', () => {
      const data = {
        error: { message: 'Invalid API key' },
      };
      expect(() => adapter.parseResult(data)).toThrow('Invalid API key');
    });
  });

  describe('AzureAdapter', () => {
    const adapter = new AzureAdapter('test-subscription-key', 'eastus', 'zh-CN');

    it('should have correct name', () => {
      expect(adapter.name).toBe('Azure');
    });

    it('should return WebSocket URL with region and language', () => {
      const url = adapter.getConnectUrl();
      expect(url).toContain('eastus.stt.speech.microsoft.com');
      expect(url).toContain('language=zh-CN');
    });

    it('should provide handshake parameters with subscription key', () => {
      const params = adapter.getHandshakeParams();
      expect(params).toHaveProperty('Ocp-Apim-Subscription-Key', 'test-subscription-key');
    });

    it('should parse successful response', () => {
      const data = {
        RecognitionStatus: 'Success',
        DisplayText: 'Azure识别结果',
        Confidence: 0.92,
      };
      const result = adapter.parseResult(data);

      expect(result?.transcript).toBe('Azure识别结果');
      expect(result?.confidence).toBe(0.92);
      expect(result?.isFinal).toBe(true);
    });

    it('should parse WebSocket partial response', () => {
      const data = {
        Text: '部分结果',
        RecognitionStatus: 'Partial',
      };
      const result = adapter.parseResult(data);

      expect(result?.transcript).toBe('部分结果');
      expect(result?.isFinal).toBe(false);
    });

    it('should return null for non-success status', () => {
      const data = {
        RecognitionStatus: 'NoMatch',
      };
      const result = adapter.parseResult(data);
      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// 4. SpeechRecognizerImpl 主类测试
// ============================================================================

describe('SpeechRecognizerImpl', () => {
  let recognizer: SpeechRecognizerImpl;

  beforeEach(() => {
    recognizer = new SpeechRecognizerImpl();
  });

  afterEach(() => {
    recognizer.dispose();
  });

  describe('Initial State', () => {
    it('should have idle status initially', () => {
      expect(recognizer.status).toBe('idle');
    });

    it('should have browser as default provider', () => {
      expect(recognizer.currentProvider).toBe('browser');
    });

    it('should have IDLE recognition status', () => {
      expect(recognizer.recognitionStatus).toBe(RecognitionStatus.IDLE);
    });

    it('should not be listening initially', () => {
      expect(recognizer.isListening()).toBe(false);
    });
  });

  describe('Event System', () => {
    it('should register and trigger event handlers', () => {
      const handler = vi.fn();
      recognizer.on('start', handler);

      // Manually trigger internal event (simulating)
      const eventMap = (recognizer as unknown as { eventHandlers: Map<string, Set<Function>> })
        .eventHandlers;
      eventMap.get('start')?.forEach(h => h({ type: 'start' }));

      expect(handler).toHaveBeenCalledOnce();
    });

    it('should remove event handlers', () => {
      const handler = vi.fn();
      recognizer.on('start', handler);
      recognizer.off('start', handler);

      const eventMap = (recognizer as unknown as { eventHandlers: Map<string, Set<Function>> })
        .eventHandlers;
      eventMap.get('start')?.forEach(h => h({ type: 'start' }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple handlers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      recognizer.on('result', handler1);
      recognizer.on('result', handler2);

      const eventMap = (recognizer as unknown as { eventHandlers: Map<string, Set<Function>> })
        .eventHandlers;
      eventMap.get('result')?.forEach(h => h({ type: 'result' }));

      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();
    });
  });

  describe('Dispose', () => {
    it('should reset status on dispose', () => {
      recognizer.dispose();
      expect(recognizer.status).toBe('idle');
    });

    it('should clear event handlers on dispose', () => {
      const handler = vi.fn();
      recognizer.on('start', handler);
      recognizer.dispose();

      const eventMap = (recognizer as unknown as { eventHandlers: Map<string, Set<Function>> })
        .eventHandlers;
      expect(eventMap.size).toBe(0);
    });
  });

  describe('Cloud Adapter Integration', () => {
    it('should accept cloud adapter via useCloudAdapter', () => {
      const adapter = new GenericAdapter('https://api.example.com');
      recognizer.useCloudAdapter(adapter);

      const config = (recognizer as unknown as { config: IAdvancedRecognitionConfig }).config;
      expect(config.cloudAdapter).toBe(adapter);
      expect(config.mode).toBe('cloud');
    });
  });

  describe('Provider Registration', () => {
    it('should register custom provider', () => {
      const customProvider = {
        type: 'custom' as const,
        isAvailable: vi.fn().mockReturnValue(true),
        start: vi.fn(),
        stop: vi.fn(),
        abort: vi.fn(),
        isListening: vi.fn().mockReturnValue(false),
        on: vi.fn(),
        off: vi.fn(),
      };

      recognizer.registerProvider('custom', customProvider);

      const providers = (
        recognizer as unknown as {
          customProviders: Map<string, unknown>;
        }
      ).customProviders;
      expect(providers.has('custom')).toBe(true);
    });
  });
});

// ============================================================================
// 5. isSpeechRecognitionSupported 测试
// ============================================================================

describe('isSpeechRecognitionSupported', () => {
  it('should return false in Node.js environment', () => {
    // In Node.js test environment, window.SpeechRecognition is not available
    expect(isSpeechRecognitionSupported()).toBe(false);
  });
});

// ============================================================================
// 6. 类型导出测试
// ============================================================================

describe('Type Exports', () => {
  it('should export IRecognitionResult interface', () => {
    const result: IRecognitionResult = {
      transcript: 'test',
      isFinal: true,
      confidence: 0.9,
    };
    expect(result.transcript).toBe('test');
  });

  it('should export IAdvancedRecognitionConfig interface', () => {
    const config: IAdvancedRecognitionConfig = {
      mode: 'auto',
      transport: 'websocket',
      autoReconnect: true,
      maxReconnectAttempts: 3,
      reconnectInterval: 2000,
      audioConfig: {
        sampleRate: 16000,
        vadThreshold: 0.02,
        vadDuration: 3000,
      },
    };
    expect(config.mode).toBe('auto');
  });
});

// ============================================================================
// 7. Edge Cases 边界情况测试
// ============================================================================

describe('Edge Cases', () => {
  describe('AudioUtils edge cases', () => {
    it('resample should handle very small compression ratio', () => {
      const data = new Float32Array([0.1, 0.2, 0.3]);
      const result = AudioUtils.resample(data, 16000, 15999);
      expect(result.length).toBeGreaterThanOrEqual(data.length);
    });

    it('encodeWAV should handle single sample', () => {
      const samples = new Int16Array([1000]);
      const wav = AudioUtils.encodeWAV(samples);
      expect(wav.byteLength).toBe(46); // 44 header + 2 bytes
    });

    it('mergeBuffers should handle buffers of different sizes', () => {
      const buf1 = new Int16Array([1]).buffer;
      const buf2 = new Int16Array([2, 3, 4]).buffer;
      const buf3 = new Int16Array([5, 6]).buffer;
      const result = AudioUtils.mergeBuffers([buf1, buf2, buf3], 6);
      expect(Array.from(result)).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('Adapter edge cases', () => {
    it('BaiduAdapter should handle empty result array', () => {
      const adapter = new BaiduAdapter('token');
      const data = { err_no: 0, result: [] };

      // Should not throw but return null-like behavior
      expect(() => adapter.parseResult(data)).not.toThrow();
    });

    it('GoogleAdapter should handle missing alternatives', () => {
      const adapter = new GoogleAdapter('key');
      const data = { results: [{ alternatives: [] }] };
      const result = adapter.parseResult(data);
      expect(result).toBeNull();
    });

    it('XunfeiAdapter should return null for empty ws array', () => {
      const adapter = new XunfeiAdapter('appid');
      const data = {
        code: 0,
        data: { status: 2, result: { ws: [] } },
      };
      const result = adapter.parseResult(data);
      // When ws array is empty, no text is extracted, so it returns null
      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// 8. Integration-like Tests 集成测试
// ============================================================================

describe('Integration Scenarios', () => {
  it('should create adapter and parse multiple results', () => {
    const adapter = new BaiduAdapter('token', 'appid', 'appkey');
    const results: IRecognitionResult[] = [];

    // Simulate receiving multiple WebSocket messages
    const messages = [
      { type: 'MID_TEXT', result: '你' },
      { type: 'MID_TEXT', result: '你好' },
      { type: 'FIN_TEXT', result: '你好世界' },
    ];

    for (const msg of messages) {
      const res = adapter.parseResult(msg);
      if (res) results.push(res);
    }

    expect(results.length).toBe(3);
    expect(results[0]?.isFinal).toBe(false);
    expect(results[2]?.isFinal).toBe(true);
    expect(results[2]?.transcript).toBe('你好世界');
  });

  it('should encode and decode audio data correctly', () => {
    // Create original PCM data
    const original = new Float32Array([0.5, -0.5, 0.25, -0.25]);

    // Convert to PCM
    const pcm = AudioUtils.floatTo16BitPCM(original);

    // Encode to WAV
    const wav = AudioUtils.encodeWAV(pcm);

    // Convert to Base64
    const base64 = AudioUtils.arrayBufferToBase64(wav);

    // Verify the pipeline
    expect(base64.length).toBeGreaterThan(0);
    expect(wav.byteLength).toBe(44 + pcm.length * 2);
  });

  it('should handle complete audio processing pipeline', () => {
    // Simulate 1 second of audio at 44100Hz
    const inputLength = 44100;
    const input = new Float32Array(inputLength);
    for (let i = 0; i < inputLength; i++) {
      input[i] = Math.sin((i / inputLength) * Math.PI * 10);
    }

    // Downsample to 16000Hz
    const resampled = AudioUtils.resample(input, 44100, 16000);

    // Convert to 16-bit PCM
    const pcm = AudioUtils.floatTo16BitPCM(resampled);

    // Encode as WAV
    const wav = AudioUtils.encodeWAV(pcm, 16000);

    // Verify output
    expect(resampled.length).toBeLessThan(input.length);
    expect(pcm.length).toBe(resampled.length);
    expect(wav.byteLength).toBe(44 + pcm.length * 2);
  });
});
