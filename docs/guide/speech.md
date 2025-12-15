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

### 快速识别

```typescript
import { listen } from 'melange/plugins';

// 进行一次语音识别
const result = await listen({ lang: 'zh-CN' });
console.log('识别结果:', result.bestTranscript);
console.log('置信度:', result.bestConfidence);
```

### 高级用法

```typescript
import { createSpeechRecognizer } from 'melange/plugins';

// 创建语音识别器实例
const recognizer = await createSpeechRecognizer({
  lang: 'zh-CN',
  continuous: true,      // 连续识别
  interimResults: true,  // 返回中间结果
});

// 监听识别结果
recognizer.on('result', (event) => {
  if (event.result) {
    console.log('识别结果:', event.result.bestTranscript);
    console.log('是否最终结果:', event.result.isFinal);
  }
});

// 监听其他事件
recognizer.on('start', () => console.log('开始识别'));
recognizer.on('end', () => console.log('识别结束'));
recognizer.on('error', (event) => console.error('错误:', event.error));

// 开始识别
await recognizer.start();

// 停止识别
recognizer.stop();

// 销毁实例
recognizer.dispose();
```

### 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `lang` | `string` | `'zh-CN'` | 语言代码 |
| `continuous` | `boolean` | `false` | 是否连续识别 |
| `interimResults` | `boolean` | `true` | 是否返回中间结果 |
| `maxAlternatives` | `number` | `1` | 最大备选结果数 |

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

```typescript
const synthesizer = await createSpeechSynthesizer({
  preferredProvider: 'browser',
  autoFallback: true,
  fallbackProviders: ['azure', 'google', 'aws'],
});

// 查看当前使用的提供商
console.log('当前提供商:', synthesizer.currentProvider);
```

## 注意事项

::: warning 权限要求
语音识别需要麦克风权限。用户首次使用时，浏览器会请求权限。
:::

::: tip 浏览器兼容性
- 语音合成：Chrome、Edge、Safari、Firefox 均支持
- 语音识别：主要在 Chrome 和 Edge 中完全支持，Safari 部分支持
:::
