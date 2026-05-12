# 插件 API

插件模块通过 `@lee-zg/melange/plugins` 导出语音和指纹能力，也可从根入口按需导入已重导出的公共 API。

::: warning 安全与隐私基线
语音云端能力生产环境应优先使用 `GenericSynthesisAdapter` / `GenericAdapter` 对接自有 BFF。浏览器 SDK 只处理权限、录音和播放，云厂商鉴权、签名、限流、超时、审计和日志脱敏应由后端完成。指纹模块默认只采集低敏环境信号，不内置 Canvas、音频、WebGL 渲染、字体枚举、浏览历史或插件列表等高熵采集行为。
:::

## 指纹识别

### getFingerprint

快速生成一次浏览器/设备指纹。默认只采集低敏信号，并对部分字段做归一化或分桶处理。

```typescript
function getFingerprint(options?: FingerprintOptions): Promise<FingerprintResult>;
```

**参数：**
- `options` - 可选指纹生成配置

**返回：** 指纹结果，包含 `visitorId`、`components`、`confidence`、`duration`

**隐私说明：** 默认不采集 Canvas、音频、WebGL 渲染、字体枚举、浏览历史或插件列表。

---

### createFingerprintGenerator

创建可复用的指纹生成器实例，支持缓存与默认配置。

```typescript
function createFingerprintGenerator(options?: FingerprintOptions): FingerprintGenerator;
```

---

### registerFingerprintPlugin

将指纹生成器注册到 Melange 依赖注入容器。

```typescript
function registerFingerprintPlugin(
  container?: Container,
  options?: FingerprintOptions
): Container;
```

---

### isFingerprintSupported

检查当前环境是否具备基础指纹采集能力。

```typescript
function isFingerprintSupported(): boolean;
```

---

### FingerprintOptions

```typescript
interface FingerprintOptions {
  salt?: string;
  cache?: boolean;
  cacheTtl?: number;
  componentTimeout?: number;
  privacyMode?: 'strict' | 'balanced' | 'debug';
  hashAlgorithm?: 'fnv1a64' | 'sha256';
  screenBucketSize?: number;
  normalizeUserAgent?: boolean;
  include?: readonly string[];
  exclude?: readonly string[];
  collectors?: readonly FingerprintCollector[];
}
```

---

### FingerprintResult

```typescript
interface FingerprintResult {
  readonly visitorId: string;
  readonly components: FingerprintComponentMap;
  readonly confidence: FingerprintConfidence;
  readonly version: string;
  readonly duration: number;
  readonly generatedAt: number;
}
```

---

## 语音合成 (TTS)

### createSpeechSynthesizer

创建语音合成器实例。支持原生合成和云端合成两种模式。

```typescript
function createSpeechSynthesizer(
  config?: SynthesisConfig | IAdvancedSynthesisConfig
): Promise<SpeechSynthesizer>;
```

**参数：**
- `config` - 可选配置对象，支持基础配置或高级配置

**返回：** 语音合成器实例

**生产建议：** 云端合成推荐通过 BFF 代理接入；不要在浏览器中暴露云厂商长期密钥。

---

### speak

快速朗读文本。

```typescript
function speak(
  text: string, 
  config?: SynthesisConfig | IAdvancedSynthesisConfig
): Promise<void>;
```

**参数：**
- `text` - 要朗读的文本
- `config` - 可选配置

---

### speakWithCloud

使用云端服务快速朗读文本。

```typescript
function speakWithCloud(
  text: string,
  adapter: ICloudSynthesisAdapter,
  config?: SynthesisConfig
): Promise<void>;
```

**参数：**
- `text` - 要朗读的文本
- `adapter` - 云端合成适配器
- `config` - 可选配置

**安全说明：** 该 API 适合快速集成。生产环境建议传入 BFF 适配器，由后端完成云服务鉴权、签名和限流。

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
  readonly synthesisStatus: SynthesisStatus;  // 新增
  
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
  registerProvider(type: SpeechProviderType, provider: SynthesisProvider): void;
  useCloudAdapter(adapter: ICloudSynthesisAdapter): void;  // 新增
}
```

---

### SynthesisStatus

合成器状态枚举。

```typescript
enum SynthesisStatus {
  IDLE = 'IDLE',           // 空闲状态
  LOADING = 'LOADING',     // 加载中
  SPEAKING = 'SPEAKING',   // 正在播放
  PAUSED = 'PAUSED',       // 已暂停
}
```

---

### SynthesisConfig

基础语音合成配置。

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

### IAdvancedSynthesisConfig

高级语音合成配置（支持云端合成）。

```typescript
interface IAdvancedSynthesisConfig extends SynthesisConfig {
  mode?: SynthesisEngineMode;              // 合成引擎模式
  cloudAdapter?: ICloudSynthesisAdapter;   // 云端适配器
  audioFormat?: CloudAudioFormat;          // 音频格式偏好
  enableSSML?: boolean;                    // 是否启用 SSML
  preload?: boolean;                       // 是否预加载音频
  cacheSize?: number;                      // 音频缓存大小
}
```

---

### SynthesisEngineMode

合成引擎模式。

```typescript
type SynthesisEngineMode = 'native' | 'cloud' | 'auto';
```

- `native` - 仅使用浏览器原生 API
- `cloud` - 仅使用云端合成
- `auto` - 自动选择（默认）

---

### CloudAudioFormat

云端 TTS 音频格式。

```typescript
type CloudAudioFormat = 'mp3' | 'wav' | 'ogg' | 'pcm';
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

## 云端合成适配器

### ICloudSynthesisAdapter

云端合成适配器接口。

```typescript
interface ICloudSynthesisAdapter {
  readonly name: string;
  synthesize(text: string, config?: IAdvancedSynthesisConfig): Promise<ISynthesisResult>;
  getVoices?(): Promise<ICloudVoice[]>;
  isAvailable?(): boolean;
}
```

---

### 内置适配器

#### GenericSynthesisAdapter

通用 BFF 适配器，用于自建后端代理。

```typescript
class GenericSynthesisAdapter implements ICloudSynthesisAdapter {
  constructor(baseUrl: string);
}
```

**状态：** stable，生产推荐。

**BFF 协议：**
- `POST {baseUrl}/synthesize`：请求 JSON 包含 `text`、`lang`、`voice`、`rate`、`pitch`、`volume`、`format`，成功返回音频二进制。
- `GET {baseUrl}/voices`：成功返回 `{ voices: ICloudVoice[] }`。
- 失败响应建议为 `{ code: string, message: string, retryable: boolean, requestId?: string }`。

#### AzureSynthesisAdapter

Azure 语音服务适配器。

**状态：** demo-only。生产环境请通过 BFF 代理，不要在浏览器暴露 `subscriptionKey`。

```typescript
class AzureSynthesisAdapter implements ICloudSynthesisAdapter {
  constructor(
    subscriptionKey: string,
    region: string,
    defaultVoice?: string  // 默认 'zh-CN-XiaoxiaoNeural'
  );
}
```

#### GoogleSynthesisAdapter

Google Cloud TTS 适配器。

**状态：** demo-only。生产环境请通过 BFF 代理，不要在浏览器 URL 或 bundle 中暴露 `apiKey`。

```typescript
class GoogleSynthesisAdapter implements ICloudSynthesisAdapter {
  constructor(
    apiKey: string,
    defaultVoice?: string  // 默认 'zh-CN-Wavenet-A'
  );
}
```

#### AWSSynthesisAdapter

AWS Polly 适配器。

**状态：** demo-only。生产环境请在 BFF 完成 AWS 签名，不要在前端保存 `secretAccessKey`。

```typescript
class AWSSynthesisAdapter implements ICloudSynthesisAdapter {
  constructor(
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
    defaultVoice?: string  // 默认 'Zhiyu'
  );
}
```

#### XunfeiSynthesisAdapter

讯飞云适配器。

**状态：** demo-only。生产环境请在 BFF 完成讯飞鉴权签名。

```typescript
class XunfeiSynthesisAdapter implements ICloudSynthesisAdapter {
  constructor(
    appId: string,
    apiKey?: string,       // 可选，生产环境建议后端签名
    apiSecret?: string,    // 可选
    defaultVoice?: string  // 默认 'xiaoyan'
  );
}
```

#### TencentSynthesisAdapter

腾讯云适配器。

**状态：** demo-only。生产环境请在 BFF 完成 TC3-HMAC-SHA256 签名。

```typescript
class TencentSynthesisAdapter implements ICloudSynthesisAdapter {
  constructor(
    secretId: string,
    secretKey: string,
    defaultVoice?: string  // 默认 '101001'
  );
}
```

#### BaiduSynthesisAdapter

百度云适配器。

**状态：** experimental。生产环境请由 BFF 管理 access token 生命周期。

```typescript
class BaiduSynthesisAdapter implements ICloudSynthesisAdapter {
  constructor(
    accessToken: string,
    defaultVoice?: string  // 默认 '0' (度小美)
  );
}
```

#### AlibabaSynthesisAdapter

阿里云适配器。

**状态：** demo-only。生产环境请通过 BFF 管理凭证或后端直连阿里云。

```typescript
class AlibabaSynthesisAdapter implements ICloudSynthesisAdapter {
  constructor(
    accessKeyId: string,
    accessKeySecret: string,
    appKey: string,
    defaultVoice?: string  // 默认 'xiaoyun'
  );
}
```

---

## 合成音频工具

### SynthesisAudioUtils

音频处理工具集。

```typescript
const SynthesisAudioUtils = {
  // 创建 AudioContext
  createAudioContext(): AudioContext;
  
  // ArrayBuffer 转 Base64
  arrayBufferToBase64(buffer: ArrayBuffer): string;
  
  // Base64 转 ArrayBuffer
  base64ToArrayBuffer(base64: string): ArrayBuffer;
  
  // 估算音频时长
  estimateDuration(byteLength: number, format: CloudAudioFormat): number;
};
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

**生产建议：** 云端识别涉及麦克风音频，推荐通过 BFF 代理上传和转发，避免前端持有长期云密钥。

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

**状态：** stable，生产推荐。

**BFF 协议：**
- `POST {baseUrl}/recognize`：使用 `multipart/form-data` 字段 `file` 上传 WAV 音频，成功返回 `{ text, score }` 或 `{ transcript, confidence }`。
- `WebSocket {baseUrl}`：用于流式识别，服务端返回 `{ transcript, confidence, isFinal }` 分片。
- 失败响应建议为 `{ code: string, message: string, retryable: boolean, requestId?: string }`。

#### XunfeiAdapter

讯飞云适配器。

**状态：** demo-only。生产环境请由 BFF 生成鉴权 URL 和请求签名。

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

**状态：** demo-only。生产环境请在 BFF 完成 TC3-HMAC-SHA256 签名。

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

**状态：** experimental。生产环境请由 BFF 管理 token、音频大小限制和错误映射。

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

**状态：** demo-only。生产环境请通过 BFF 管理凭证或后端直连阿里云。

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

**状态：** demo-only。生产环境请通过 BFF 代理，不要在浏览器 URL 或 bundle 中暴露 `apiKey`。

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

**状态：** demo-only。生产环境请通过 BFF 代理，不要在浏览器暴露 `subscriptionKey`。

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
