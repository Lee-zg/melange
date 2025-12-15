import { defineConfig } from 'tsup';

/**
 * 用于构建库的 tsup 配置
 * 支持带有 TypeScript 声明的 ESM 和 CJS 输出
 */
export default defineConfig({
  // 库的入口点
  entry: {
    index: 'src/index.ts',
    'fp/index': 'src/fp/index.ts',
    'utils/index': 'src/utils/index.ts',
    'core/index': 'src/core/index.ts',
    'plugins/index': 'src/plugins/index.ts',
  },

  // 输出格式：ESM 和 CommonJS
  format: ['esm', 'cjs'],

  // 生成 TypeScript 声明文件
  dts: true,

  // 生成用于调试的源映射
  sourcemap: true,

  // 构建前清理输出目录
  clean: true,

  // 分割块以获得更好的树摇优化
  splitting: true,

  // 压缩生产构建
  minify: false,

  // 面向现代环境
  target: 'es2022',

  // 在输出中保留 JSDoc 注释
  keepNames: true,

  // 外部依赖（此库无外部依赖）
  external: [],

  // 树摇优化
  treeshake: true,

  // 输出目录
  outDir: 'dist',
});