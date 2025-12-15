# 快速开始

## 简介

Melange 是一个现代化的 JavaScript/TypeScript 工具库，提供函数式编程模式、面向对象工具和完整的类型支持。

## 安装

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

:::

## 基本使用

### 导入整个库

```typescript
import * as melange from 'melange';

// 使用函数组合
const result = melange.pipe(
  5,
  (x) => x * 2,
  (x) => x + 1
);
console.log(result); // 11
```

### 按需导入

```typescript
// 导入特定模块
import { pipe, compose, curry } from 'melange/fp';
import { debounce, throttle, deepClone } from 'melange/utils';
import { EventEmitter, Container } from 'melange/core';
import { speak, listen } from 'melange/plugins';
```

## 模块概览

| 模块 | 描述 | 导入路径 |
|------|------|----------|
| **FP** | 函数式编程工具 | `melange/fp` |
| **Utils** | 实用工具函数 | `melange/utils` |
| **Core** | 核心 OOP 工具 | `melange/core` |
| **Plugins** | 扩展插件 | `melange/plugins` |

## 快速示例

### 函数组合

```typescript
import { pipe, compose } from 'melange/fp';

// 使用 pipe（从左到右）
const addOne = (x: number) => x + 1;
const double = (x: number) => x * 2;

const result = pipe(5, addOne, double);
console.log(result); // 12

// 使用 compose（从右到左）
const fn = compose(double, addOne);
console.log(fn(5)); // 12
```

### Result 类型处理错误

```typescript
import { tryCatch, mapResult, matchResult } from 'melange/fp';

const divide = (a: number, b: number) => {
  if (b === 0) throw new Error('除数不能为零');
  return a / b;
};

const result = tryCatch(() => divide(10, 2));

matchResult(result, {
  ok: (value) => console.log('结果:', value), // 结果: 5
  err: (error) => console.log('错误:', error.message),
});
```

### 防抖和节流

```typescript
import { debounce, throttle } from 'melange/utils';

// 防抖：延迟执行，在停止触发后才执行
const debouncedFn = debounce(() => {
  console.log('搜索...');
}, 300);

// 节流：限制执行频率
const throttledFn = throttle(() => {
  console.log('滚动处理...');
}, 100);
```

### 语音合成

```typescript
import { speak, createSpeechSynthesizer } from 'melange/plugins';

// 快速朗读
await speak('你好，世界！');

// 高级用法
const synthesizer = await createSpeechSynthesizer({
  lang: 'zh-CN',
  rate: 1.0,
});
await synthesizer.speak('这是一段测试文本');
synthesizer.dispose();
```

## 下一步

- 阅读[安装指南](/guide/installation)了解更多安装选项
- 探索[函数式编程](/guide/functional-programming)核心概念
- 查看完整的 [API 参考](/api/fp)
