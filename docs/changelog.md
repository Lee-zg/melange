# 更新日志

所有重要更改都将记录在此文件中。

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
