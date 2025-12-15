/**
 * @fileoverview Plugins 模块入口
 * @module melange/plugins
 * @description 提供扩展插件功能，包括语音合成、语音识别等
 *
 * @example
 * ```typescript
 * // 导入语音功能
 * import { speak, listen, createSpeechSynthesizer } from 'melange/plugins';
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
  // 语音合成
  SpeechSynthesizerImpl,
  createSpeechSynthesizer,
  isSpeechSynthesisSupported,
  speak,
  // 语音识别
  SpeechRecognizerImpl,
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  listen,
} from './speech';
