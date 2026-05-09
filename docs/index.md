---
layout: home

hero:
  name: Melange
  text: 现代化的 TypeScript 工具库
  tagline: 函数式编程 · 面向对象模式 · 完整类型支持
  image:
    src: /logo.svg
    alt: Melange
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: API 参考
      link: /api/fp
    - theme: alt
      text: GitHub
      link: https://github.com/Lee-zg/melange

features:
  - icon: 🎯
    title: 函数式编程
    details: 提供 pipe、compose、curry 等函数组合工具，以及 Result 和 Option 类型实现优雅的错误处理
  - icon: 🛠️
    title: 实用工具函数
    details: 丰富的数组、对象、字符串处理函数，以及节流、防抖、重试等异步控制工具
  - icon: 🏗️
    title: 依赖注入容器
    details: 轻量级的 IoC 容器，支持生命周期管理、装饰器注入，让代码更易测试和维护
  - icon: 🎨
    title: 强大的装饰器
    details: 提供 @Memoize、@Debounce、@Throttle、@Log 等实用装饰器，简化常见编程模式
  - icon: 🔊
    title: 语音功能插件
    details: 内置语音合成和语音识别功能，优先使用浏览器 API，支持自动降级到第三方服务
  - icon: 🔐
    title: 隐私友好指纹
    details: 参考 FingerprintJS 的组件化模型，默认只采集低敏信号，支持分桶、归一化和 DI 接入
  - icon: 📦
    title: Tree-shakeable
    details: 零依赖、模块化设计，支持按需导入，最大程度减少打包体积
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);
  --vp-home-hero-image-background-image: linear-gradient(-45deg, #bd34fe 50%, #47caff 50%);
  --vp-home-hero-image-filter: blur(44px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>
