/**
 * @fileoverview 语音模块入口
 * @module melange/plugins/speech
 * @description 提供语音合成 (TTS) 和语音识别 (STT) 功能
 *
 * @example
 * ```typescript
 * import {
 *   createSpeechSynthesizer,
 *   createSpeechRecognizer,
 *   speak,
 *   listen,
 * } from 'melange/plugins';
 *
 * // 快速语音合成
 * await speak('你好，世界！');
 *
 * // 快速语音识别
 * const result = await listen();
 * console.log('识别结果:', result.bestTranscript);
 *
 * // 高级用法 - 语音合成
 * const synthesizer = await createSpeechSynthesizer({
 *   lang: 'zh-CN',
 *   rate: 1.0,
 * });
 * synthesizer.on('end', () => console.log('朗读完成'));
 * await synthesizer.speak('这是一段测试文本');
 * synthesizer.dispose();
 *
 * // 高级用法 - 语音识别
 * const recognizer = await createSpeechRecognizer({
 *   lang: 'zh-CN',
 *   continuous: true,
 * });
 * recognizer.on('result', (event) => {
 *   console.log('识别结果:', event.result?.bestTranscript);
 * });
 * await recognizer.start();
 * ```
 */

// ============================================================================
// 类型导出
// ============================================================================

export type {
  // 通用类型
  SpeechProviderType,
  SpeechServiceStatus,
  SpeechError,
  BaseSpeechConfig,
  // 语音合成类型
  VoiceInfo,
  SynthesisConfig,
  SynthesisEventType,
  SynthesisEvent,
  SynthesisEventHandler,
  SynthesisProvider,
  SpeechSynthesizer,
  // 语音识别类型
  RecognitionResultItem,
  RecognitionResult,
  RecognitionConfig,
  RecognitionEventType,
  RecognitionEvent,
  RecognitionEventHandler,
  RecognitionProvider,
  SpeechRecognizer,
  // 第三方提供商配置
  AzureSpeechConfig,
  GoogleSpeechConfig,
  AWSSpeechConfig,
  CustomProviderConfig,
  ProviderConfig,
} from './types';

// ============================================================================
// 语音合成导出
// ============================================================================

export {
  SpeechSynthesizerImpl,
  createSpeechSynthesizer,
  isSpeechSynthesisSupported,
  speak,
} from './synthesis';

// ============================================================================
// 语音识别导出
// ============================================================================

export {
  SpeechRecognizerImpl,
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  listen,
} from './recognition';
