# dsh-better-model-selector

[![npm version](https://img.shields.io/npm/v/dsh-better-model-selector)](https://www.npmjs.com/package/dsh-better-model-selector)

改造对话界面（composer）的模型选择器：把原来「模型 + 思考强度」集成在一个二级菜单里的组件，拆成两个可以单独设置的独立控件。

- **模型选择器**：保持下拉选单，但增加**搜索**和**标记喜爱（收藏）**功能。
- **思考强度选择器**：改成**滑动条**样式，更直观。
- **快捷键**：
  - `Ctrl/Cmd + P` — 快速切换模型，在**收藏模型**中轮换。
  - `Ctrl/Cmd + T` — 轮换**思考强度**。

## 原理

插件覆盖内置的 `conversation.input.model` slot（以更低优先级 `-1` 遮蔽内置的 `ModelSelect`，后者注册优先级为 0），并用同一个会话级 `ModelDirectory`（`ctx.modelDirectories`，由 `@deepseek-ai/dsh-client-ui-model-selection` 提供）读写模型与推理强度。因此它和 `/model` 命令弹窗共享同一份状态，任意入口切换后另一入口立即同步。

收藏列表持久化到**主机级 cookie**（`dms_favs`，`path=/`，约 1 年有效期），仅本地保存、不写入会话。之所以用 cookie 而不是 `localStorage`：`localStorage` 按「协议 + 主机 + 端口」隔离，而 `dsh web`（dshdeck）每次重启端口会变，旧端口的 `localStorage` 就找不到了；cookie 只按主机隔离，跨端口依然可见。首次读取会自动迁移旧版 cookie（`dmt_favs`）与旧版 `localStorage`（`dsh-model-toolbox:favorites:v1`）里的收藏。

## 安装

前置：DSH 已初始化 `web` profile（`dsh web` 能正常运行），Node.js ≥ 20。

> ⚠️ 依赖 DSH 的 `next` 通道：peerDependencies 指向 `@deepseek-ai/*` `^0.1.0-rc.6`（npm 上的 `next` dist-tag）。若你的 DSH 走 `latest`（`0.0.1-rc.x`），可能不满足依赖、缺少本插件所需的 `modelDirectories` 服务。

**npm 安装（推荐，自动挂载）**：

```sh
dsh plugin --profile web add dsh-better-model-selector
```

该命令会自动：登记依赖 → 识别包内 `dsh.bundle.patch`（`cordis.patch.yml`）→ 注册进 `dsh.profile.bundles` 完成挂载。装完**重启 dsh + 硬刷新浏览器**（Cmd/Ctrl+Shift+R）即可。

若报 `minimum release age`（发布不足 24 小时），重跑一次即可（pnpm 会自动补 `minimumReleaseAgeExclude`）。

**从源码安装（开发）**：把本目录拷贝/软链到 `~/.dsh/profiles/web/node_modules/dsh-better-model-selector`，并在 `~/.dsh/profiles/web/cordis.patch.yml` 追加：

```yaml
- insert:
    - id: dsh-better-model-selector
      name: dsh-better-model-selector
```

然后重启 `dsh web` + 硬刷新。

## 旧版本迁移（手动挂载 → npm 通道）

若之前通过「源码目录 + 手动挂载行」安装，切到 npm 通道时按顺序执行（**跳过 1、2 步会双挂载**：两个 host 半、出现两份 UI）：

1. 删除手动挂载行：编辑 `~/.dsh/profiles/web/cordis.patch.yml`（早期全局安装可能是 `~/.dsh/cordis.patch.yml`），删除 `dsh-better-model-selector` 对应的 `- insert: { id: ..., name: ... }` 段。
2. 删除旧包实体：

   ```powershell
   Remove-Item -Recurse -Force "$HOME\.dsh\profiles\web\node_modules\dsh-better-model-selector"
   ```

3. 官方 CLI 安装 npm 版：`dsh plugin --profile web add dsh-better-model-selector`
4. 重启 dsh + 硬刷新。

> 收藏/凭据不受影响（收藏存于主机级 cookie，与安装方式无关）。

## 结构

```
dsh-better-model-selector/
├── package.json       # dsh.bundle.patch + dsh.client + exports["./client"]
├── cordis.patch.yml   # 自动挂载补丁（insert 条目）
└── lib/
    ├── index.js       # host 半（纯客户端插件，空 apply）
    └── client.js      # 浏览器半：模型下拉 + 搜索/收藏 + 思考强度滑动条 + 快捷键
```

## 已知限制

- 思考强度滑动条仅在当前模型公布推理强度元数据时显示（与内置行为一致）。
- 已寻址子代理（subagent）会话不提供模型选择，控件隐藏、快捷键失效（与内置行为一致）。
- `Ctrl+P`/`Ctrl+T` 仅当存在当前会话时接管按键；无会话时不拦截浏览器默认行为（`Ctrl+T` 新建标签页等）。
