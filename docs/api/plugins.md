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

创建语音识别器实例。支持原生识别和云端识别两种模式。

```typescript
function createSpeechRecognizer(
  config?: RecognitionConfig | IAdvancedRecognitionConfig
): Promise<SpeechRecognizer>;
```

**参数：**
- `config` - 可选配置对象，支持基础配置或高级配置

**返回：** 语音识别器实例

---

### listen

快速进行一次语音识别。

```typescript
function listen(
  config?: RecognitionConfig | IAdvancedRecognitionConfig
): Promise<RecognitionResult>;
```

---

### listenWithTimeout

带超时的语音识别。

```typescript
function listenWithTimeout(
  config?: RecognitionConfig | IAdvancedRecognitionConfig,
  timeout?: number  // 默认 10000ms
): Promise<RecognitionResult>;
```

---

### isSpeechRecognitionSupported

检查浏览器是否支持原生语音识别。

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
  readonly recognitionStatus: RecognitionStatus;  // 新增
  
  initialize(config?: RecognitionConfig): Promise<void>;
  start(config?: RecognitionConfig): Promise<void>;
  stop(): void;
  abort(): void;
  isListening(): boolean;
  on(event: RecognitionEventType, handler: RecognitionEventHandler): void;
  off(event: RecognitionEventType, handler: RecognitionEventHandler): void;
  dispose(): void;
  registerProvider(type: SpeechProviderType, provider: RecognitionProvider): void;
  useCloudAdapter(adapter: ICloudRecognitionAdapter): void;  // 新增
}
```

---

### RecognitionStatus

识别器状态枚举。

```typescript
enum RecognitionStatus {
  IDLE = 'IDLE',              // 空闲状态
  CONNECTING = 'CONNECTING',  // 连接中
  RECORDING = 'RECORDING',    // 录音中
  PROCESSING = 'PROCESSING',  // 处理中/上传中
}
```

---

### RecognitionConfig

基础语音识别配置。

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

### IAdvancedRecognitionConfig

高级语音识别配置（支持云端识别）。

```typescript
interface IAdvancedRecognitionConfig extends RecognitionConfig {
  mode?: RecognitionEngineMode;         // 识别引擎模式
  cloudAdapter?: ICloudRecognitionAdapter;  // 云端适配器
  transport?: CloudTransportType;       // 传输协议
  audioConfig?: IAudioConfig;           // 音频配置
  autoReconnect?: boolean;              // 是否自动重连
  maxReconnectAttempts?: number;        // 最大重连次数
  reconnectInterval?: number;           // 重连间隔 (ms)
}
```

---

### RecognitionEngineMode

识别引擎模式。

```typescript
type RecognitionEngineMode = 'native' | 'cloud' | 'auto';
```

- `native` - 仅使用浏览器原生 API
- `cloud` - 仅使用云端识别
- `auto` - 自动选择（默认）

---

### CloudTransportType

云端传输协议类型。

```typescript
type CloudTransportType = 'websocket' | 'http';
```

- `websocket` - WebSocket 流式识别（实时返回结果）
- `http` - HTTP 短语音识别（录音结束后一次性返回）

---

### IAudioConfig

音频配置。

```typescript
interface IAudioConfig {
  sampleRate?: number;          // 目标采样率 (默认 16000)
  vadThreshold?: number;        // VAD 阈值 (0.01 ~ 0.5)
  vadDuration?: number;         // VAD 静音超时 (ms)
  echoCancellation?: boolean;   // 回声消除
  noiseSuppression?: boolean;   // 噪声抑制
  autoGainControl?: boolean;    // 自动增益控制
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

## 云端识别适配器

### ICloudRecognitionAdapter

云端识别适配器接口。

```typescript
interface ICloudRecognitionAdapter {
  readonly name: string;
  getConnectUrl?(): Promise<string> | string;
  getHandshakeParams?(): unknown;
  recognizeShortAudio?(audioData: ArrayBuffer): Promise<IRecognitionResult>;
  transformAudioData?(pcmData: ArrayBuffer): ArrayBuffer | string;
  parseResult(data: unknown): IRecognitionResult | null;
  isAvailable?(): boolean;
}
```

---

### 内置适配器

#### GenericAdapter

通用 BFF 适配器，用于自建后端代理。

```typescript
class GenericAdapter implements ICloudRecognitionAdapter {
  constructor(baseUrl: string);
}
```

#### XunfeiAdapter

讯飞云适配器。

```typescript
class XunfeiAdapter implements ICloudRecognitionAdapter {
  constructor(
    appId: string,
    apiKey?: string,
    apiSecret?: string
  );
}
```

#### TencentAdapter

腾讯云适配器。

```typescript
class TencentAdapter implements ICloudRecognitionAdapter {
  constructor(
    secretId: string,
    secretKey: string
  );
}
```

#### BaiduAdapter

百度云适配器。

```typescript
class BaiduAdapter implements ICloudRecognitionAdapter {
  constructor(
    accessToken: string,
    appId?: string,
    appKey?: string,
    devPid?: number  // 语言模型 ID，默认 1537 (普通话)
  );
}
```

#### AlibabaAdapter

阿里云适配器。

```typescript
class AlibabaAdapter implements ICloudRecognitionAdapter {
  constructor(
    accessKeyId: string,
    accessKeySecret: string,
    appKey: string
  );
}
```

#### GoogleAdapter

Google Cloud Speech 适配器。

```typescript
class GoogleAdapter implements ICloudRecognitionAdapter {
  constructor(
    apiKey: string,
    languageCode?: string  // 默认 'zh-CN'
  );
}
```

#### AzureAdapter

Azure Speech 适配器。

```typescript
class AzureAdapter implements ICloudRecognitionAdapter {
  constructor(
    subscriptionKey: string,
    region: string,
    language?: string  // 默认 'zh-CN'
  );
}
```

---

## 音频工具

### AudioUtils

音频处理工具集。

```typescript
const AudioUtils = {
  // 重采样
  resample(data: Float32Array, inputRate: number, outputRate: number): Float32Array;
  
  // Float32 转 Int16 PCM
  floatTo16BitPCM(input: Float32Array): Int16Array;
  
  // 计算音量 RMS
  calculateRMS(data: Float32Array): number;
  
  // 合并 PCM 片段
  mergeBuffers(buffers: ArrayBuffer[], totalLength: number): Int16Array;
  
  // PCM 转 WAV
  encodeWAV(samples: Int16Array, sampleRate?: number, channels?: number): ArrayBuffer;
  
  // ArrayBuffer 转 Base64
  arrayBufferToBase64(buffer: ArrayBuffer): string;
};
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
