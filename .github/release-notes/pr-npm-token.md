# npm token fallback 发布说明

## 背景

v1.2.4 / v1.2.5 tag 触发的 `publish-npm` 工作流全部因 **404 Not Found** 失败——npm 侧的 OIDC Trusted Publisher 关联尚未配置成功，导致 OIDC token 可生成但 publish 被拒。

## 变更

- `publish-npm` job 恢复使用 `NPM_TOKEN` 进行身份认证（`NODE_AUTH_TOKEN` 注入）
- Node 版本从 24 回退到 20（与 `verify` / `publish-gpr` 保持一致）
- 保留 `--provenance` 与 `id-token: write` 权限（provenance 签名本身不依赖 trusted publishing）

## 当前口径

这份说明对应 **NPM_TOKEN fallback** 方案。只要 `.github/workflows/publish-npm.yml` 仍注入 `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`，文档和发布说明都应按 token fallback 描述，不应声称当前 workflow 已切换为纯 npm Trusted Publishing/OIDC。

如果后续确认 npm Trusted Publisher 可稳定发布，应同步修改 workflow、README/贡献文档和 release notes，并移除对 `NPM_TOKEN` 的依赖说明。

## 合并后续步骤

1. 在仓库 **Settings → Secrets and variables → Actions** 配置 `NPM_TOKEN`（npm Automation Token）
2. 通过 `workflow_dispatch` 手动触发 `Publish Package`，或删除并重推 `v1.2.5` tag
3. 确认 npm 上 `@lee-zg/melange@1.2.5` 发布成功
