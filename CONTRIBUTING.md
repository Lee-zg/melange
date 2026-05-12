# 为 Melange 做贡献

感谢您对为 Melange 做贡献的兴趣！本指南将帮助您入门。

## 开发环境设置

1. **克隆仓库**
   ```bash
   git clone https://github.com/username/melange.git
   cd melange
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **运行测试**
   ```bash
   npm test
   ```

4. **构建库**
   ```bash
   npm run build
   ```

## 项目结构

```
melange/
├── src/
│   ├── core/           # 面向对象工具（事件发射器、依赖注入、装饰器）
│   ├── fp/             # 函数式编程工具
│   ├── plugins/        # 扩展插件（语音、指纹等）
│   ├── utils/          # 通用工具函数
│   ├── types.ts        # TypeScript 类型定义
│   └── index.ts        # 主入口点
├── tests/              # 测试文件
├── dist/               # 构建输出（生成的）
└── docs/               # VitePress 文档源码
```

## 代码风格

- 我们使用 **ESLint** 和 **Prettier** 进行代码格式化
- 运行 `npm run lint` 检查语法错误
- 运行 `npm run format` 自动格式化代码
- 公共 API、类型、参数和重要行为应保持 JSDoc 注释完整

## 编写代码

### JSDoc 注释

所有公共函数必须有 JSDoc 注释：

```typescript
/**
 * 函数的简要描述。
 *
 * @description
 * 如有必要，提供更长的描述。
 *
 * @example
 * ```typescript
 * const result = myFunction(arg);
 * ```
 *
 * @template T - 类型参数的描述
 * @param param1 - 参数的描述
 * @returns 返回值的描述
 * @throws 如果适用，错误描述
 */
export function myFunction<T>(param1: T): T {
  // 实现
}
```

### 函数式编程指南

- 优先使用**纯函数**，无副作用
- 尽可能使用**不可变数据结构**
- 提供多参数函数的**柯里化版本**

### TypeScript 指南

- 使用 **严格模式** TypeScript
- 优先使用**显式返回类型**
- 为不可变属性使用 **readonly**
- 避免使用 `any` - 改用 `unknown`

## 测试

- 为所有新功能编写测试
- 测试位于 `tests/` 目录中
- 使用 **Vitest** 进行测试

### 运行测试

```bash
# 运行所有测试
npm test

# 在监视模式下运行测试
npm run test -- --watch

# 运行带覆盖率的测试
npm run test:coverage
```

### CI 门禁

Pull Request 和 main 分支推送会运行完整质量门禁：

```bash
npm run check:version
npm run lint
npm run typecheck
npm run test:coverage
npm run check:coverage
npm run build
npm run test:exports
npm run docs:build
npm run pack:dry-run
```

新增或修改公共 API 时，请同步更新 README、VitePress 指南、API 文档和导出冒烟测试。插件文档应明确浏览器端、BFF 和第三方云服务之间的安全边界。

### 测试结构

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../src/module';

describe('myFunction', () => {
  it('应该做某事', () => {
    expect(myFunction(input)).toBe(expected);
  });

  it('应该处理边缘情况', () => {
    expect(myFunction(edgeCase)).toBe(expectedEdgeResult);
  });
});
```

## 拉取请求流程

1. **Fork** 仓库
2. 创建**功能分支** (`git checkout -b feature/amazing-feature`)
3. **提交**您的更改 (`git commit -m '添加令人惊叹的功能'`)
4. **推送**到分支 (`git push origin feature/amazing-feature`)
5. 打开**拉取请求**

### PR 检查清单

- [ ] 测试通过 (`npm test`)
- [ ] 语法检查通过 (`npm run lint`)
- [ ] TypeScript 编译通过 (`npm run typecheck`)
- [ ] 覆盖率检查通过 (`npm run test:coverage && npm run check:coverage`)
- [ ] 构建通过 (`npm run build`)
- [ ] 导出冒烟测试通过 (`npm run test:exports`)
- [ ] 文档构建通过 (`npm run docs:build`)
- [ ] npm 包内容检查通过 (`npm run pack:dry-run`)
- [ ] 文档已更新
- [ ] 为新函数添加了 JSDoc 注释

## 发布流程

发布由 `.github/workflows/publish-npm.yml` 在版本 tag 上触发，并先执行完整 CI 门禁。

当前发布认证方式：

- npmjs.com：使用仓库 Secret `NPM_TOKEN` 注入 `NODE_AUTH_TOKEN`，并执行 `npm publish --provenance --access public`。
- GitHub Packages：使用 `GITHUB_TOKEN` 发布到 `https://npm.pkg.github.com`。
- 发布前必须确保 `package.json`、`src/index.ts` 中的 `VERSION`、文档导航版本和 Git tag 一致。

如果后续切回 npm Trusted Publishing/OIDC，应同时更新 `publish-npm.yml`、发布说明和贡献文档，避免 workflow 与文档口径漂移。

## 提交消息

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat:` - 新功能
- `fix:` - 修复错误
- `docs:` - 文档更改
- `style:` - 代码样式更改（格式化等）
- `refactor:` - 代码重构
- `test:` - 添加或更新测试
- `chore:` - 维护任务

示例：
```
feat(fp): 为 Result 类型添加 flatMap 函数
```

## 有问题？

如果您有任何问题或需要帮助，请随时提出问题！
