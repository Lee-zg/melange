# 插件 API

## 语音合成 (TTS)

### createSpeechSynthesizer

创建语音合成器实例。

```typescript
function createSpeechSynthesizer(config?: SynthesisConfig): Promise<SpeechSynthesizer>;
```

**参数：**
- `config` - 可选配置对象

**返回：** 语音合成器实例

---

### speak

快速朗读文本。

```typescript
function speak(text: string, config?: SynthesisConfig): Promise<void>;
```

**参数：**
- `text` - 要朗读的文本
- `config` - 可选配置

---

### isSpeechSynthesisSupported

检查浏览器是否支持语音合成。

```typescript
function isSpeechSynthesisSupported(): boolean;
```

---

### SpeechSynthesizer

语音合成器接口。

```typescript
interface SpeechSynthesizer {
  readonly currentProvider: SpeechProviderType;
  readonly status: SpeechServiceStatus;
  
  initialize(config?: SynthesisConfig): Promise<void>;
  getVoices(): Promise<VoiceInfo[]>;
  speak(text: string, config?: SynthesisConfig): Promise<void>;
  pause(): void;
  resume(): void;
  cancel(): void;
  isSpeaking(): boolean;
  isPaused(): boolean;
  on(event: SynthesisEventType, handler: SynthesisEventHandler): void;
  off(event: SynthesisEventType, handler: SynthesisEventHandler): void;
  dispose(): void;
}
```

---

### SynthesisConfig

语音合成配置。

```typescript
interface SynthesisConfig {
  lang?: string;                      // 语言代码，如 'zh-CN'
  voice?: VoiceInfo | string;         // 指定语音
  volume?: number;                    // 音量 (0-1)
  rate?: number;                      // 语速 (0.1-10)
  pitch?: number;                     // 音调 (0-2)
  preferredProvider?: SpeechProviderType;
  autoFallback?: boolean;
  fallbackProviders?: SpeechProviderType[];
}
```

---

### VoiceInfo

语音信息。

```typescript
interface VoiceInfo {
  id: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  provider: SpeechProviderType;
}
```

---

### SynthesisEventType

语音合成事件类型。

```typescript
type SynthesisEventType = 
  | 'start'      // 开始朗读
  | 'end'        // 朗读结束
  | 'pause'      // 暂停
  | 'resume'     // 继续
  | 'boundary'   // 词边界
  | 'mark'       // 标记
  | 'error';     // 错误
```

---

## 语音识别 (STT)

### createSpeechRecognizer

创建语音识别器实例。

```typescript
function createSpeechRecognizer(config?: RecognitionConfig): Promise<SpeechRecognizer>;
```

---

### listen

快速进行一次语音识别。

```typescript
function listen(config?: RecognitionConfig): Promise<RecognitionResult>;
```

---

### isSpeechRecognitionSupported

检查浏览器是否支持语音识别。

```typescript
function isSpeechRecognitionSupported(): boolean;
```

---

### SpeechRecognizer

语音识别器接口。

```typescript
interface SpeechRecognizer {
  readonly currentProvider: SpeechProviderType;
  readonly status: SpeechServiceStatus;
  
  initialize(config?: RecognitionConfig): Promise<void>;
  start(config?: RecognitionConfig): Promise<void>;
  stop(): void;
  abort(): void;
  isListening(): boolean;
  on(event: RecognitionEventType, handler: RecognitionEventHandler): void;
  off(event: RecognitionEventType, handler: RecognitionEventHandler): void;
  dispose(): void;
}
```

---

### RecognitionConfig

语音识别配置。

```typescript
interface RecognitionConfig {
  lang?: string;               // 语言代码
  continuous?: boolean;        // 连续识别
  interimResults?: boolean;    // 返回中间结果
  maxAlternatives?: number;    // 最大备选结果数
  preferredProvider?: SpeechProviderType;
  autoFallback?: boolean;
  fallbackProviders?: SpeechProviderType[];
}
```

---

### RecognitionResult

识别结果。

```typescript
interface RecognitionResult {
  results: RecognitionResultItem[];
  bestTranscript: string;
  bestConfidence: number;
  isFinal: boolean;
}

interface RecognitionResultItem {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}
```

---

### RecognitionEventType

语音识别事件类型。

```typescript
type RecognitionEventType =
  | 'start'        // 开始识别
  | 'end'          // 识别结束
  | 'result'       // 识别结果
  | 'error'        // 错误
  | 'soundstart'   // 检测到声音
  | 'soundend'     // 声音结束
  | 'speechstart'  // 检测到语音
  | 'speechend'    // 语音结束
  | 'audiostart'   // 音频开始
  | 'audioend'     // 音频结束
  | 'nomatch';     // 无匹配结果
```

---

## 通用类型

### SpeechProviderType

语音服务提供商类型。

```typescript
type SpeechProviderType = 'browser' | 'azure' | 'google' | 'aws' | 'custom';
```

---

### SpeechServiceStatus

服务状态。

```typescript
type SpeechServiceStatus = 'idle' | 'loading' | 'ready' | 'error';
```

---

### SpeechError

语音服务错误。

```typescript
interface SpeechError {
  code: string;
  message: string;
  originalError?: Error;
}
```

---

## 第三方提供商配置

### AzureSpeechConfig

```typescript
interface AzureSpeechConfig {
  subscriptionKey: string;
  region: string;
  endpoint?: string;
}
```

### GoogleSpeechConfig

```typescript
interface GoogleSpeechConfig {
  apiKey: string;
  projectId?: string;
}
```

### AWSSpeechConfig

```typescript
interface AWSSpeechConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}
```
