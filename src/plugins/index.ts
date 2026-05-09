/**
 * @fileoverview Plugins 模块入口
 * @module melange/plugins
 * @description 提供扩展插件功能，包括语音合成、语音识别、指纹识别等
 *
 * @example
 * ```typescript
 * // 导入插件功能
 * import { speak, listen, getFingerprint } from 'melange/plugins';
 *
 * // 或者导入整个模块
 * import * as plugins from 'melange/plugins';
 * ```
 */

// ============================================================================
// 语音模块重导出
// ============================================================================

export {
  // 类型
  type SpeechProviderType,
  type SpeechServiceStatus,
  type SpeechError,
  type BaseSpeechConfig,
  type VoiceInfo,
  type SynthesisConfig,
  type SynthesisEventType,
  type SynthesisEvent,
  type SynthesisEventHandler,
  type SynthesisProvider,
  type SpeechSynthesizer,
  type RecognitionResultItem,
  type RecognitionResult,
  type RecognitionConfig,
  type RecognitionEventType,
  type RecognitionEvent,
  type RecognitionEventHandler,
  type RecognitionProvider,
  type SpeechRecognizer,
  type AzureSpeechConfig,
  type GoogleSpeechConfig,
  type AWSSpeechConfig,
  type CustomProviderConfig,
  type ProviderConfig,
  type SynthesisEngineMode,
  type CloudAudioFormat,
  type ISynthesisResult,
  type ISynthesisError,
  type ICloudVoice,
  type IAdvancedSynthesisConfig,
  type ICloudSynthesisAdapter,
  type RecognitionEngineMode,
  type CloudTransportType,
  type IRecognitionResult,
  type IRecognitionError,
  type IAudioConfig,
  type IAdvancedRecognitionConfig,
  type ICloudRecognitionAdapter,
  // 语音合成
  SynthesisStatus,
  SynthesisAudioUtils,
  GenericSynthesisAdapter,
  AzureSynthesisAdapter,
  GoogleSynthesisAdapter,
  AWSSynthesisAdapter,
  XunfeiSynthesisAdapter,
  TencentSynthesisAdapter,
  BaiduSynthesisAdapter,
  AlibabaSynthesisAdapter,
  SpeechSynthesizerImpl,
  createSpeechSynthesizer,
  isSpeechSynthesisSupported,
  speak,
  speakWithCloud,
  // 语音识别
  SpeechRecognizerImpl,
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  listen,
  listenWithTimeout,
  RecognitionStatus,
  AudioUtils,
  GenericAdapter,
  XunfeiAdapter,
  TencentAdapter,
  BaiduAdapter,
  AlibabaAdapter,
  GoogleAdapter,
  AzureAdapter,
} from './speech';

// ============================================================================
// 指纹识别模块重导出
// ============================================================================

export {
  type FingerprintComponentKey,
  type FingerprintComponentSource,
  type FingerprintPrivacyMode,
  type FingerprintHashAlgorithm,
  type FingerprintValue,
  type FingerprintComponent,
  type FingerprintComponentMap,
  type FingerprintConfidence,
  type FingerprintResult,
  type FingerprintCollectorContext,
  type FingerprintCollector,
  type FingerprintOptions,
  type FingerprintGenerator,
  defaultFingerprintCollectors,
  stableStringify,
  serializeComponents,
  fnv1a64,
  sha256,
  hashString,
  normalizeUserAgent,
  bucketNumber,
  bucketHardwareConcurrency,
  bucketDeviceMemory,
  FINGERPRINT_VERSION,
  FINGERPRINT_GENERATOR,
  FingerprintGeneratorImpl,
  createFingerprintGenerator,
  getFingerprint,
  registerFingerprintPlugin,
  isFingerprintSupported,
} from './fingerprint';
