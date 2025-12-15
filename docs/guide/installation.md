# 安装

## 环境要求

- **Node.js** >= 18.0.0
- **TypeScript** >= 5.0（推荐，非必需）

## 包管理器安装

::: code-group

```bash [npm]
npm install melange
```

```bash [yarn]
yarn add melange
```

```bash [pnpm]
pnpm add melange
```

```bash [bun]
bun add melange
```

:::

## CDN 使用

你也可以通过 CDN 直接在浏览器中使用：

```html
<!-- ESM 版本 -->
<script type="module">
  import * as melange from 'https://unpkg.com/melange/dist/index.js';
</script>

<!-- UMD 版本 -->
<script src="https://unpkg.com/melange/dist/index.cjs"></script>
```

## TypeScript 配置

Melange 完全使用 TypeScript 编写，内置类型定义。推荐的 `tsconfig.json` 配置：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

::: tip 装饰器支持
如果你需要使用装饰器功能（如 `@Memoize`、`@Inject` 等），请确保启用 `experimentalDecorators` 和 `emitDecoratorMetadata`。
:::

## 模块导入

### 完整导入

```typescript
import * as melange from 'melange';
```

### 子模块导入（推荐）

按需导入可以获得更好的 tree-shaking 效果：

```typescript
// 函数式编程模块
import { pipe, compose, curry, tryCatch } from 'melange/fp';

// 工具函数模块
import { debounce, throttle, deepClone } from 'melange/utils';

// 核心 OOP 模块
import { EventEmitter, Container, Injectable } from 'melange/core';

// 插件模块
import { speak, listen, createSpeechSynthesizer } from 'melange/plugins';
```

## 验证安装

创建一个测试文件验证安装是否成功：

```typescript
import { pipe, ok, isOk } from 'melange/fp';

const result = pipe(
  5,
  (x) => x * 2,
  (x) => ok(x)
);

console.log(isOk(result)); // true
console.log('Melange 安装成功！');
```

## 下一步

- 了解[快速开始](/guide/getting-started)中的基本用法
- 深入学习[函数式编程](/guide/functional-programming)概念
