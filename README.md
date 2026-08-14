# dsh-better-model-selector

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

前置：DSH 已初始化 `web` profile（`dsh web` 可正常运行）。

本插件是纯客户端插件，无需构建。将其复制/链接到 profile 的 `node_modules` 并注册到 `cordis.patch.yml`：

1. 把本目录拷贝（或软链）到 `~/.dsh/profiles/web/node_modules/dsh-better-model-selector`。
2. 在 `~/.dsh/profiles/web/cordis.patch.yml` 追加：

   ```yaml
   - insert:
       - id: dsh-better-model-selector
         name: dsh-better-model-selector
   ```

3. 重启 `dsh web`（host 侧需要重启以重新扫描 client 包与重组合 cordis 树），然后浏览器硬刷新。

## 结构

```
dsh-better-model-selector/
├── package.json     # dsh.client（platform: web）+ exports["./client"]
└── lib/
    ├── index.js     # host 半（纯客户端插件，空 apply）
    └── client.js    # 浏览器半：模型下拉 + 搜索/收藏 + 思考强度滑动条 + 快捷键
```

## 已知限制

- 思考强度滑动条仅在当前模型公布推理强度元数据时显示（与内置行为一致）。
- 已寻址子代理（subagent）会话不提供模型选择，控件隐藏、快捷键失效（与内置行为一致）。
- `Ctrl+P`/`Ctrl+T` 仅当存在当前会话时接管按键；无会话时不拦截浏览器默认行为（`Ctrl+T` 新建标签页等）。
