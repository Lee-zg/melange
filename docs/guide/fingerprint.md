# 指纹识别

Melange 的指纹识别模块参考 FingerprintJS 的组件化模型：先采集一组环境组件，再稳定序列化并生成 `visitorId`。不同之处在于，模块默认只采集低敏信号，并对屏幕、硬件线程、设备内存、User-Agent 等信息做归一化或分桶处理，避免把高熵细节直接纳入指纹。

该模块适合用于风控、反滥用、设备一致性辅助判断等有限场景，不应作为用户身份认证的唯一依据。生产环境应提供清晰告知、合法依据、用途限制和退出机制，并尊重用户隐私偏好。

## 快速使用

```typescript
import { getFingerprint } from '@lee-zg/melange/plugins';

const result = await getFingerprint({
  salt: 'my-app',
});

console.log(result.visitorId);
console.log(result.components);
```

## 创建生成器

```typescript
import { createFingerprintGenerator } from '@lee-zg/melange/plugins';

const fingerprint = createFingerprintGenerator({
  salt: 'account-risk',
  privacyMode: 'balanced',
  cacheTtl: 60_000,
});

const result = await fingerprint.get();
fingerprint.clearCache();
```

## 配置项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `salt` | `string` | `'melange'` | 命名空间盐值，用于隔离不同业务域 |
| `cache` | `boolean` | `true` | 是否启用内存缓存 |
| `cacheTtl` | `number` | `300000` | 缓存有效期，单位毫秒 |
| `componentTimeout` | `number` | `80` | 单个组件采集超时，单位毫秒 |
| `privacyMode` | `'strict' \| 'balanced' \| 'debug'` | `'balanced'` | 隐私模式 |
| `hashAlgorithm` | `'fnv1a64' \| 'sha256'` | `'fnv1a64'` | 哈希算法，`sha256` 不可用时自动降级 |
| `screenBucketSize` | `number` | `100` | 屏幕尺寸分桶大小 |
| `normalizeUserAgent` | `boolean` | `true` | 是否归一化 User-Agent |
| `include` | `string[]` | `[]` | 只采集指定组件 |
| `exclude` | `string[]` | `[]` | 排除指定组件 |
| `collectors` | `FingerprintCollector[]` | `[]` | 自定义低敏组件采集器 |

## 隐私模式

- `strict`：进一步降低唯一性，User-Agent 和时区仅保留可用性，语言列表只保留首选语言。
- `balanced`：默认模式，保留常见低敏信号，并对高波动字段做归一化或分桶。
- `debug`：用于排查环境差异，保留更多原始值，不建议在生产默认启用。

无论使用哪种模式，内置采集器都不会采集 Canvas 像素、音频指纹、WebGL 渲染图、字体枚举、浏览历史或插件列表。若通过 `collectors` 增加自定义组件，应确保组件来源、用途和保留周期可向用户解释。

## 组件控制

```typescript
const result = await getFingerprint({
  include: ['language', 'timezone', 'screen'],
});

const privacyFirst = await getFingerprint({
  exclude: ['userAgent', 'screen', 'hardwareConcurrency', 'deviceMemory'],
});
```

## 自定义组件

自定义组件应只采集业务已经合法获得、低敏且可解释的状态。不要采集音频、Canvas 像素、WebGL 渲染图、字体探测、插件列表、浏览历史或任何需要绕过用户预期的信号。

```typescript
const result = await getFingerprint({
  collectors: [
    {
      key: 'appTheme',
      source: 'custom',
      confidence: 0.2,
      collect: () => 'dark',
    },
  ],
});
```

## 依赖注入

```typescript
import {
  Container,
  createFingerprintGenerator,
  FINGERPRINT_GENERATOR,
  registerFingerprintPlugin,
  type FingerprintGenerator,
} from '@lee-zg/melange';

const container = new Container();

registerFingerprintPlugin(container, {
  salt: 'my-app',
  privacyMode: 'strict',
});

const fingerprint = container.resolve<FingerprintGenerator>(FINGERPRINT_GENERATOR);
const result = await fingerprint.get();
```

## 与 FingerprintJS 的差异

FingerprintJS 的核心体验是返回 `visitorId` 和组件详情。Melange 保留这套易用 API，同时做了几项约束：

- 默认并发采集组件，单组件有超时保护，避免慢组件拖累页面。
- 内置内存缓存，重复调用不会反复采集。
- 屏幕、硬件线程、设备内存等字段默认分桶，降低唯一性。
- User-Agent 默认去掉补丁版本和构建号，减少无意义波动。
- 不内置 Canvas、音频、WebGL 渲染、字体枚举等高熵采集。

::: warning 合规提示
指纹识别可能属于在线标识符。生产环境应提供清晰告知、合法依据、用途限制和退出机制，不应将本模块用于跨站跟踪或绕过用户隐私偏好。
:::
