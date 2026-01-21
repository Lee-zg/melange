# 更新日志

所有重要更改都将记录在此文件中。

## [1.1.0] - 2026-01-21

### 新增

#### 语音识别插件重构 (`melange/plugins/speech`)

**架构升级**
- 采用策略模式重构，支持原生识别 (Web Speech API) 和云端识别两种模式
- 状态机管理: `IDLE` → `CONNECTING` → `RECORDING` → `PROCESSING`
- 插件化适配器架构，便于集成第三方语音服务

**云端适配器**
- `GenericAdapter` - 通用 BFF 适配器，适用于自建后端代理
- `XunfeiAdapter` - 讯飞云语音听写
- `TencentAdapter` - 腾讯云一句话识别
- `BaiduAdapter` - 百度语音识别 (REST/WebSocket)
- `AlibabaAdapter` - 阿里云智能语音交互
- `GoogleAdapter` - Google Cloud Speech
- `AzureAdapter` - Azure Speech Services

**传输协议**
- WebSocket 流式识别 - 实时返回中间结果
- HTTP 短语音识别 - 录音完成后一次性上传

**音频处理**
- `AudioUtils` 工具集: 重采样、PCM 转换、WAV 编码、Base64 转换
- AudioWorklet 高性能音频处理，自动降级到 ScriptProcessor
- VAD (语音活动检测) - 自动检测静音并停止录音
- 支持自定义采样率、回声消除、噪声抑制、自动增益控制

**企业级特性**
- 断网重连机制 - 可配置重连次数和间隔
- 消息队列缓冲 - 网络波动时缓存音频数据
- 页面可见性检测 - 后台自动暂停录音
- 完善的错误处理和异常恢复

**新增 API**
- `RecognitionStatus` - 状态枚举
- `IAdvancedRecognitionConfig` - 高级配置接口
- `ICloudRecognitionAdapter` - 云端适配器接口
- `listenWithTimeout()` - 带超时的快速识别

### 文档
- 更新 API 文档 (docs/api/plugins.md) - 新增配置选项和适配器说明
- 更新语音功能指南 (docs/guide/speech.md) - 添加详细使用示例

### 测试
- 新增 85 个语音识别单元测试
- 覆盖 AudioUtils、所有适配器、状态管理、事件系统

---

## [1.0.0] - 2024-12-15

### 新增

#### 函数式编程模块 (`melange/fp`)
- `pipe` / `compose` / `flow` - 函数组合
- `curry` / `uncurry` / `partial` - 柯里化
- `ok` / `err` / `tryCatch` - Result 类型
- `some` / `none` / `fromNullable` - Option 类型
- `memoize` / `once` / `tap` - 高阶函数

#### 工具函数模块 (`melange/utils`)
- 对象工具：`deepClone`, `deepMerge`, `pick`, `omit`, `get`, `set`
- 数组工具：`chunk`, `flatten`, `unique`, `groupBy`, `sortBy`
- 字符串工具：`capitalize`, `camelCase`, `kebabCase`, `truncate`
- 计时工具：`debounce`, `throttle`, `delay`, `retry`, `timeout`
- 类型守卫：`isString`, `isNumber`, `isObject`, `isEmpty`

#### 核心模块 (`melange/core`)
- `EventEmitter` - 类型安全的事件发射器
- `Container` - IoC 依赖注入容器
- 装饰器：`@Memoize`, `@Debounce`, `@Throttle`, `@Log`, `@Retry`
- `Disposable` - 可释放资源管理

#### 插件模块 (`melange/plugins`)
- 语音合成 (TTS)：`speak`, `createSpeechSynthesizer`
- 语音识别 (STT)：`listen`, `createSpeechRecognizer`
- 自动降级机制：浏览器 API → 第三方服务

### 特性
- 完整的 TypeScript 类型支持
- 零依赖
- Tree-shakeable 设计
- 支持 ESM 和 CommonJS
- 完整的 JSDoc 文档
