# 语音功能

Melange 提供了内置的语音合成（TTS）和语音识别（STT）功能，优先使用浏览器原生 API，支持自动降级到第三方服务。

## 语音合成 (TTS)

### 快速朗读

```typescript
import { speak } from 'melange/plugins';

// 最简单的用法
await speak('你好，世界！');

// 带配置的朗读
await speak('Hello World', {
  lang: 'en-US',
  rate: 0.8,
  pitch: 1.0,
  volume: 1.0,
});
```

### 高级用法

```typescript
import { createSpeechSynthesizer } from 'melange/plugins';

// 创建语音合成器实例
const synthesizer = await createSpeechSynthesizer({
  lang: 'zh-CN',
  rate: 1.0,
  pitch: 1.0,
});

// 获取可用语音列表
const voices = await synthesizer.getVoices();
console.log('可用语音:', voices);

// 监听事件
synthesizer.on('start', () => console.log('开始朗读'));
synthesizer.on('end', () => console.log('朗读结束'));
synthesizer.on('error', (event) => console.error('错误:', event.error));

// 朗读文本
await synthesizer.speak('这是一段测试文本');

// 控制播放
synthesizer.pause();   // 暂停
synthesizer.resume();  // 继续
synthesizer.cancel();  // 取消

// 销毁实例
synthesizer.dispose();
```

### 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `lang` | `string` | `'zh-CN'` | 语言代码 |
| `voice` | `VoiceInfo \| string` | - | 指定语音 |
| `volume` | `number` | `1.0` | 音量 (0-1) |
| `rate` | `number` | `1.0` | 语速 (0.1-10) |
| `pitch` | `number` | `1.0` | 音调 (0-2) |

## 语音识别 (STT)

语音识别支持两种模式：

- **原生模式**：使用浏览器 Web Speech API
- **云端模式**：支持百度、腾讯、讯飞、阿里云、Google、Azure 等第三方服务

### 快速识别

```typescript
import { listen, listenWithTimeout } from 'melange/plugins';

// 进行一次语音识别
const result = await listen({ lang: 'zh-CN' });
console.log('识别结果:', result.bestTranscript);
console.log('置信度:', result.bestConfidence);

// 带超时的识别（5秒）
try {
  const result = await listenWithTimeout({ lang: 'zh-CN' }, 5000);
  console.log('识别结果:', result.bestTranscript);
} catch (e) {
  console.error('识别超时或失败');
}
```

### 原生识别模式

使用浏览器原生 Web Speech API：

```typescript
import { createSpeechRecognizer, RecognitionStatus } from 'melange/plugins';

// 创建语音识别器实例
const recognizer = await createSpeechRecognizer({
  lang: 'zh-CN',
  continuous: true,      // 连续识别
  interimResults: true,  // 返回中间结果
  mode: 'native',        // 明确指定使用原生模式
});

// 监听识别结果
recognizer.on('result', (event) => {
  if (event.result) {
    console.log('识别结果:', event.result.bestTranscript);
    console.log('是否最终结果:', event.result.isFinal);
  }
});

// 监听状态事件
recognizer.on('start', () => console.log('开始识别'));
recognizer.on('end', () => console.log('识别结束'));
recognizer.on('speechstart', () => console.log('检测到语音'));
recognizer.on('speechend', () => console.log('语音结束'));
recognizer.on('error', (event) => console.error('错误:', event.error));

// 开始识别
await recognizer.start();

// 停止识别
recognizer.stop();

// 销毁实例
recognizer.dispose();
```

### 云端识别模式

云端识别支持两种传输方式：

- **WebSocket**：流式识别，实时返回结果
- **HTTP**：短语音识别，录音结束后一次性返回

#### WebSocket 流式识别

```typescript
import { createSpeechRecognizer, BaiduAdapter } from 'melange/plugins';

// 创建百度适配器
const adapter = new BaiduAdapter(
  'your-access-token',
  'your-app-id',
  'your-app-key'
);

// 创建识别器
const recognizer = await createSpeechRecognizer({
  mode: 'cloud',
  transport: 'websocket',  // WebSocket 流式识别
  cloudAdapter: adapter,
  audioConfig: {
    sampleRate: 16000,
    vadThreshold: 0.02,
    vadDuration: 3000,     // 3秒无语音后自动停止
  },
  autoReconnect: true,     // 断网自动重连
  maxReconnectAttempts: 3,
});

recognizer.on('result', (event) => {
  if (event.result?.isFinal) {
    console.log('最终结果:', event.result.bestTranscript);
  } else {
    console.log('中间结果:', event.result?.bestTranscript);
  }
});

await recognizer.start();
```

#### HTTP 短语音识别

```typescript
import { createSpeechRecognizer, TencentAdapter } from 'melange/plugins';

// 创建腾讯云适配器
const adapter = new TencentAdapter(
  'your-secret-id',
  'your-secret-key'
);

// 创建识别器
const recognizer = await createSpeechRecognizer({
  mode: 'cloud',
  transport: 'http',  // HTTP 短语音模式
  cloudAdapter: adapter,
  audioConfig: {
    vadDuration: 2000,  // 2秒无语音后停止录音并上传
  },
});

recognizer.on('result', (event) => {
  // HTTP 模式只会返回一次最终结果
  console.log('识别结果:', event.result?.bestTranscript);
});

await recognizer.start();
// 说话后等待 VAD 检测静音，自动停止并上传
```

### 第三方适配器示例

#### 百度云

```typescript
import { createSpeechRecognizer, BaiduAdapter } from 'melange/plugins';

// 百度语音识别需要 access_token
// 生产环境建议通过后端获取
const adapter = new BaiduAdapter(
  'your-access-token',  // 必填
  'your-app-id',        // WebSocket 模式必填
  'your-app-key',       // WebSocket 模式必填
  1537                  // 语言模型: 1537=普通话, 1737=英语
);

const recognizer = await createSpeechRecognizer({
  mode: 'cloud',
  transport: 'http',  // 或 'websocket'
  cloudAdapter: adapter,
});
```

#### 讯飞云

```typescript
import { createSpeechRecognizer, XunfeiAdapter } from 'melange/plugins';

const adapter = new XunfeiAdapter(
  'your-app-id',
  'your-api-key',     // 可选，生产环境建议后端签名
  'your-api-secret'   // 可选
);

const recognizer = await createSpeechRecognizer({
  mode: 'cloud',
  transport: 'websocket',
  cloudAdapter: adapter,
});
```

#### 腾讯云

```typescript
import { createSpeechRecognizer, TencentAdapter } from 'melange/plugins';

const adapter = new TencentAdapter(
  'your-secret-id',
  'your-secret-key'
);

const recognizer = await createSpeechRecognizer({
  mode: 'cloud',
  transport: 'http',
  cloudAdapter: adapter,
});
```

#### 阿里云

```typescript
import { createSpeechRecognizer, AlibabaAdapter } from 'melange/plugins';

const adapter = new AlibabaAdapter(
  'your-access-key-id',
  'your-access-key-secret',
  'your-app-key'
);

const recognizer = await createSpeechRecognizer({
  mode: 'cloud',
  transport: 'websocket',
  cloudAdapter: adapter,
});
```

#### Google Cloud Speech

```typescript
import { createSpeechRecognizer, GoogleAdapter } from 'melange/plugins';

const adapter = new GoogleAdapter(
  'your-api-key',
  'zh-CN'  // 语言代码
);

const recognizer = await createSpeechRecognizer({
  mode: 'cloud',
  transport: 'http',
  cloudAdapter: adapter,
});
```

#### Azure Speech

```typescript
import { createSpeechRecognizer, AzureAdapter } from 'melange/plugins';

const adapter = new AzureAdapter(
  'your-subscription-key',
  'eastasia',  // 服务区域
  'zh-CN'      // 语言
);

const recognizer = await createSpeechRecognizer({
  mode: 'cloud',
  transport: 'websocket',
  cloudAdapter: adapter,
});
```

#### 自定义 BFF 适配器

推荐使用 BFF 模式，通过自己的后端代理调用云服务：

```typescript
import { createSpeechRecognizer, GenericAdapter } from 'melange/plugins';

const adapter = new GenericAdapter('https://api.yoursite.com/speech');

const recognizer = await createSpeechRecognizer({
  mode: 'cloud',
  transport: 'http',
  cloudAdapter: adapter,
});
```

### 高级配置选项

#### VAD (语音活动检测)

```typescript
const recognizer = await createSpeechRecognizer({
  mode: 'cloud',
  cloudAdapter: adapter,
  audioConfig: {
    vadThreshold: 0.02,  // 音量阈值 (0.01~0.5)，越小越敏感
    vadDuration: 3000,   // 静音超时时间 (ms)，超时后自动停止
  },
});
```

#### 音频采样率

```typescript
const recognizer = await createSpeechRecognizer({
  mode: 'cloud',
  cloudAdapter: adapter,
  audioConfig: {
    sampleRate: 16000,  // 目标采样率，大多数云服务要求 16000Hz
  },
});
```

#### 音频增强

```typescript
const recognizer = await createSpeechRecognizer({
  mode: 'cloud',
  cloudAdapter: adapter,
  audioConfig: {
    echoCancellation: true,   // 回声消除
    noiseSuppression: true,   // 噪声抑制
    autoGainControl: true,    // 自动增益控制
  },
});
```

#### 断网重连

```typescript
const recognizer = await createSpeechRecognizer({
  mode: 'cloud',
  transport: 'websocket',
  cloudAdapter: adapter,
  autoReconnect: true,        // 启用自动重连
  maxReconnectAttempts: 3,    // 最大重连次数
  reconnectInterval: 2000,    // 重连间隔 (ms)
});
```

## 配置选项参考

### 基础配置

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `lang` | `string` | `'zh-CN'` | 语言代码 |
| `continuous` | `boolean` | `false` | 是否连续识别 |
| `interimResults` | `boolean` | `true` | 是否返回中间结果 |
| `maxAlternatives` | `number` | `1` | 最大备选结果数 |

### 高级配置

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `mode` | `'native' \| 'cloud' \| 'auto'` | `'auto'` | 识别引擎模式 |
| `transport` | `'websocket' \| 'http'` | `'websocket'` | 云端传输协议 |
| `cloudAdapter` | `ICloudRecognitionAdapter` | - | 云端适配器 |
| `autoReconnect` | `boolean` | `true` | 是否自动重连 |
| `maxReconnectAttempts` | `number` | `3` | 最大重连次数 |
| `reconnectInterval` | `number` | `2000` | 重连间隔 (ms) |

### 音频配置

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `audioConfig.sampleRate` | `number` | `16000` | 目标采样率 |
| `audioConfig.vadThreshold` | `number` | `0.02` | VAD 阈值 |
| `audioConfig.vadDuration` | `number` | `3000` | VAD 静音超时 (ms) |
| `audioConfig.echoCancellation` | `boolean` | `true` | 回声消除 |
| `audioConfig.noiseSuppression` | `boolean` | `true` | 噪声抑制 |
| `audioConfig.autoGainControl` | `boolean` | `true` | 自动增益控制 |

## 检查浏览器支持

```typescript
import { isSpeechSynthesisSupported, isSpeechRecognitionSupported } from 'melange/plugins';

if (isSpeechSynthesisSupported()) {
  console.log('浏览器支持语音合成');
}

if (isSpeechRecognitionSupported()) {
  console.log('浏览器支持语音识别');
}
```

## 降级策略

语音功能采用分层设计：

1. **优先使用浏览器原生 API** - Web Speech API
2. **自动降级** - 当浏览器不支持时，可降级到第三方服务
3. **音频处理降级** - AudioWorklet 不可用时自动降级到 ScriptProcessor

```typescript
const synthesizer = await createSpeechSynthesizer({
  preferredProvider: 'browser',
  autoFallback: true,
  fallbackProviders: ['azure', 'google', 'aws'],
});

// 查看当前使用的提供商
console.log('当前提供商:', synthesizer.currentProvider);
```

## 架构优势

### v2.0 新架构特性

- **策略模式**：原生识别和云端识别使用统一接口
- **插件化适配器**：快速集成新的语音服务提供商
- **状态机管理**：IDLE → CONNECTING → RECORDING → PROCESSING
- **企业级特性**：断网重连、音频缓冲、页面可见性检测
- **音频处理核心**：AudioWorklet + VAD + 自动重采样 + WAV 编码

### 兼容性信息

| 特性 | Chrome | Edge | Safari | Firefox |
|------|--------|------|--------|--------|
| 语音合成 | ✅ | ✅ | ✅ | ✅ |
| 原生识别 | ✅ | ✅ | 部分 | ✖ |
| 云端识别 | ✅ | ✅ | ✅ | ✅ |
| AudioWorklet | ✅ | ✅ | ✅ | ✅ |
| ScriptProcessor | ✅ | ✅ | ✅ | ✅ |

## 注意事项

::: warning 权限要求
语音识别需要麦克风权限。用户首次使用时，浏览器会请求权限。
:::

::: warning 云服务安全
生产环境中，建议通过后端代理调用云服务 API，避免在前端暴露密钥。
:::

::: tip 浏览器兼容性
- 语音合成：Chrome、Edge、Safari、Firefox 均支持
- 原生识别：主要在 Chrome 和 Edge 中完全支持，Safari 部分支持
- 云端识别：所有现代浏览器均支持
:::

::: tip 页面后台处理
当页面进入后台时，云端识别会自动暂停录音，以避免资源浪费。
:::
