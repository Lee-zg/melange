import { defineConfig } from 'vitepress';

/**
 * VitePress 配置
 * @see https://vitepress.dev/reference/site-config
 */
export default defineConfig({
  // 站点标题
  title: 'Melange',
  // 站点描述
  description: '一个现代化的 JavaScript/TypeScript 工具库',

  // 基础路径（用于 GitHub Pages）
  base: '/melange/',

  // 语言
  lang: 'zh-CN',

  // 最后更新时间
  lastUpdated: true,

  // 清理 URL（移除 .html 后缀）
  cleanUrls: true,

  // 头部标签
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/melange/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#5f67ee' }],
  ],

  // 主题配置
  themeConfig: {
    // 导航栏 Logo
    logo: '/logo.svg',

    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/getting-started' },
      {
        text: 'API',
        items: [
          { text: '函数式编程 (FP)', link: '/api/fp' },
          { text: '工具函数 (Utils)', link: '/api/utils' },
          { text: '核心模块 (Core)', link: '/api/core' },
          { text: '插件 (Plugins)', link: '/api/plugins' },
        ],
      },
      {
        text: '1.0.0',
        items: [
          { text: '更新日志', link: '/changelog' },
          { text: 'GitHub', link: 'https://github.com/Lee-zg/melange' },
        ],
      },
    ],

    // 侧边栏
    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
          ],
        },
        {
          text: '核心概念',
          items: [
            { text: '函数式编程', link: '/guide/functional-programming' },
            { text: 'Result 类型', link: '/guide/result-type' },
            { text: 'Option 类型', link: '/guide/option-type' },
          ],
        },
        {
          text: '高级用法',
          items: [
            { text: '依赖注入', link: '/guide/dependency-injection' },
            { text: '装饰器', link: '/guide/decorators' },
            { text: '语音功能', link: '/guide/speech' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '函数式编程 (FP)', link: '/api/fp' },
            { text: '工具函数 (Utils)', link: '/api/utils' },
            { text: '核心模块 (Core)', link: '/api/core' },
            { text: '插件 (Plugins)', link: '/api/plugins' },
          ],
        },
      ],
    },

    // 社交链接
    socialLinks: [{ icon: 'github', link: 'https://github.com/Lee-zg/melange' }],

    // 编辑链接
    editLink: {
      pattern: 'https://github.com/Lee-zg/melange/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    // 页脚
    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2024 Melange Contributors',
    },

    // 搜索
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },

    // 文档页脚
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    // 大纲
    outline: {
      label: '页面导航',
      level: [2, 3],
    },

    // 最后更新时间
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
    },

    // 返回顶部
    returnToTopLabel: '回到顶部',

    // 侧边栏菜单标签
    sidebarMenuLabel: '菜单',

    // 深色模式切换标签
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
  },

  // Markdown 配置
  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
});
