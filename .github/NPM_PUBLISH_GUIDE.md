# NPM 自动发布指南

本项目已配置 GitHub Actions 自动发布到 npm。

## 配置步骤

### 1. 获取 npm Token

1. 登录 [npmjs.com](https://www.npmjs.com/)
2. 点击头像 → **Access Tokens**
3. 点击 **Generate New Token** → **Classic Token**
4. 选择 **Automation** 类型（用于 CI/CD）
5. 复制生成的 token

### 2. 配置 GitHub Secrets

1. 进入 GitHub 仓库：`https://github.com/Lee-zg/melange`
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 名称：`NPM_TOKEN`
5. 值：粘贴刚才复制的 npm token
6. 点击 **Add secret**

## 发布流程

### 自动发布（推荐）

使用 npm 脚本命令来创建版本并自动触发发布：

```bash
# 补丁版本（1.0.0 → 1.0.1）- 修复 bug
npm run release:patch

# 次版本（1.0.0 → 1.1.0）- 新增功能（向后兼容）
npm run release:minor

# 主版本（1.0.0 → 2.0.0）- 破坏性更改
npm run release:major
```

这些命令会：
1. 自动更新 `package.json` 和 `package-lock.json` 中的版本号
2. 创建 git commit
3. 创建版本标签（如 `v1.0.1`）
4. 推送代码和标签到 GitHub
5. 触发 GitHub Actions 自动发布到 npm

### 手动触发发布

1. 进入 GitHub 仓库的 **Actions** 页面
2. 选择 **Publish to npm** 工作流
3. 点击 **Run workflow**
4. 确认并运行

## 工作流说明

### 触发条件

- **自动触发**：当推送版本标签时（如 `v1.0.0`）
- **手动触发**：在 Actions 页面手动运行

### 执行步骤

1. **测试阶段**
   - 运行所有单元测试
   - 执行代码检查（ESLint）
   - 执行类型检查（TypeScript）

2. **发布阶段**（仅在测试通过后）
   - 安装依赖
   - 构建项目
   - 发布到 npm（带有 provenance 签名）

### npm Provenance

工作流使用 `--provenance` 标志发布，这会：
- 在 npm 包页面显示来源信息
- 证明包确实是从 GitHub 仓库构建的
- 提高包的可信度和安全性

## 版本号规范

遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)：

- **主版本号（Major）**：不兼容的 API 修改
- **次版本号（Minor）**：向下兼容的功能性新增
- **修订号（Patch）**：向下兼容的问题修正

## 发布检查清单

在发布前确保：

- [ ] 所有测试通过：`npm run test:run`
- [ ] 代码检查通过：`npm run lint`
- [ ] 类型检查通过：`npm run typecheck`
- [ ] 本地构建成功：`npm run build`
- [ ] 更新了 CHANGELOG
- [ ] 更新了文档（如果 API 有变化）
- [ ] 代码已推送到 main 分支

## 回滚发布

如果发现问题需要回滚：

```bash
# 撤销 npm 上的特定版本（发布后 72 小时内）
npm unpublish @lee-zg/melange@1.0.1

# 或者弃用某个版本
npm deprecate @lee-zg/melange@1.0.1 "This version has been deprecated due to critical bugs"
```

## 常见问题

### 1. 工作流失败：Authentication failed

- 检查 `NPM_TOKEN` secret 是否正确配置
- 确认 token 类型为 **Automation**
- 确认 token 未过期

### 2. 工作流失败：Package already exists

- 检查 `package.json` 中的版本号是否已更新
- 确认该版本号未在 npm 上发布过

### 3. 测试阶段失败

- 在本地运行 `npm run test:run` 检查测试
- 修复失败的测试后重新发布

## 相关链接

- npm 包地址：https://www.npmjs.com/package/@lee-zg/melange
- GitHub 仓库：https://github.com/Lee-zg/melange
- 文档站点：https://lee-zg.github.io/melange/
