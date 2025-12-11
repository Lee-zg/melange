import { defineConfig } from 'vitest/config';

/**
 * 用于测试的 Vitest 配置
 */
export default defineConfig({
  test: {
    // 启用全局变量 (describe, it, expect)
    globals: true,

    // 测试环境
    environment: 'node',

    // 测试文件的包含模式
    include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/index.ts'],
    },

    // 类型检查
    typecheck: {
      enabled: true,
    },
  },

  resolve: {
    alias: {
      '@': './src',
    },
  },
});