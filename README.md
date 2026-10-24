# Zonghuan Li · 个人网站

基于 **Astro + TypeScript + 原生 CSS** 的纯静态个人网站。页面在构建时生成 HTML，不需要后端服务。密码生成器和移动端菜单使用少量原生 JavaScript。

## 本地运行

需要 Node.js 22.12+（或 Astro 支持的更新版本）。

```sh
npm ci
npm run dev
```

打开终端输出的本地地址（默认 `http://127.0.0.1:4321`）。请通过开发服务器预览，不要直接双击 HTML 文件。

```sh
npm test             # 密码生成器及两个小游戏的规则与边界检查
npm run check        # Astro / TypeScript 检查
npm run build        # 生成 dist/
npm run check:links  # 检查构建后的站内链接和静态资源
npm run preview      # 预览 dist/ 中的发布版本
```

## 内容与结构

- `src/pages/`：首页、个人信息、联系方式、归档、广场、密码生成、足球、关于及 404 页面。
- `src/layouts/Layout.astro`：共用页面结构、导航和页脚。
- `src/data/site.ts`：姓名、邮箱、联系方式和公共链接。
- `src/styles/global.css`：配色、排版、响应式布局。
- `src/lib/generator.mjs`：独立的密码生成逻辑；使用浏览器 Web Crypto 随机数。
- `src/lib/bubble-game.mjs`：冒泡大战的独立规则引擎；`src/pages/playground/BubbleBattle.astro` 为本地双人游戏界面。
- `src/lib/three-capture.mjs`：三子吃棋的独立规则引擎；`src/pages/playground/ThreeCapture.astro` 为本地双人游戏界面。
- `public/`：直接复制到发布目录的静态资源。
- `legacy/`：迁移前的 HTML 和 Bootstrap 资源，作为原始内容备份，不参与构建。

保留原有公开路径：`/index.html`、`/profile/ContactMe.html`、`/archive/archive.html`、`/playground/playground.html`、`/playground/StringGenerator.html`、`/playground/FootballPage.html` 和 `/about/about.html`。新增 `/profile/profile.html` 承接原来的个人经历与兴趣爱好导航；没有补写个人履历。未填写的信息继续保留 `xxxxxxxx` 占位。

密码生成器保留原有默认值和全部选项：字符范围、首字符范围、固定／随机长度（1–30）、批量生成（1–50）及复制。选定字符范围表示允许出现的字符，并不保证每个字符集都会出现。操作仅在浏览器中完成；剪贴板不可用时会选中结果，支持手动复制。

冒泡大战位于 `/playground/BubbleBattle.html`，在广场中与密码生成并列。默认 8 列 × 4 行、红方先手，双方从左上／右下各 1 个泡泡开始。所有格子的爆炸阈值均为 4，先清空爆炸格，再将上下左右相邻格全部转为行动方并各增加 1 个泡泡；边界外没有格子，不接收泡泡。连锁按触发顺序逐个处理，待全部稳定后交换回合和判断胜负。支持鼠标、触摸、方向键和 Enter／空格操作；动画期间锁定落子，随时可重新开始。无需账号、联网或后端。

三子吃棋位于 `/playground/ThreeCapture.html`。4 × 4 棋盘，初始外圈上半部 6 枚红棋、下半部 6 枚蓝棋，中间 4 格为空，红方先手。只能移动一枚己方棋子到上下左右相邻的空格。检查目标格所在的整行及整列：恰好 3 枚连续棋子、己方 2 枚、敌方 1 枚且位于端点时，吃掉该敌方棋子。行列按同一移动后棋盘同时判断，最多吃 2 枚，不连锁吃子。整条线有 4 枚棋子、棋子不连续或敌方在中间均不吃子。消灭对方所有棋子，或使对方轮到行动时无合法走法，即获胜。支持鼠标、触摸、方向键、Enter／空格及 Escape 取消选择。

## 发布

本项目按 **GoDaddy / cPanel Git 部署**准备：本地构建，主机只复制静态文件，不要求主机安装 Node.js。

1. 本地执行 `npm run build` 和 `npm run check:links`。
2. 将本次源码改动、根目录 **`.cpanel.yml`**、`scripts/deploy-cpanel.sh` 和完整的 **`dist/`** 一起提交并推送到 cPanel 所跟踪的 GitHub 分支。`dist/` 已从 `.gitignore` 移除，专门用于这种不在主机上构建的部署方式；每次源码更新后都需要重新构建并提交新产物。
3. 在 cPanel 的 **Git Version Control → Manage → Pull or Deploy** 中，先点击 **Update from Remote**，再点击 **Deploy HEAD Commit**。
4. `.cpanel.yml` 调用部署脚本，将 `dist/` 的内容复制到 `/home/s32cavug58jx/public_html/`。此路径沿用旧配置；若 GoDaddy 实际文档根目录不同，请先修改 `.cpanel.yml` 中的 `DEPLOYPATH`。

原配置使用了 `.cpanel.yaml`，cPanel 要求的文件名是 **`.cpanel.yml`**；而且旧配置没有复制文件的任务。新脚本会检查构建产物是否存在，仅复制公开文件，保留 `public_html/` 中的其他文件，并一并复制 `.htaccess` 的 404 配置。

如果仍提示 “The system cannot deploy”，请检查**主机上 cPanel 管理的仓库**：根目录的 `.cpanel.yml` 是否已经提交到当前分支，以及 `git status --short` 是否为空。本机提交了改动，不等于主机上手工修改的文件也已提交；应先保存和处理主机上需要的改动，再更新远程。不要直接在 cPanel 仓库里修改网页或部署配置，否则又会产生未提交改动。

官方要求：[cPanel Git Deployment](https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-deployment/)。本次已准备配置和构建文件，尚未提交、推送或连接 GoDaddy 验证线上部署。

也可以手动将 **`dist/` 目录中的全部内容**上传到 `public_html/`，保留目录层级和 `.htaccess`。无需上传源代码、`legacy/`、`node_modules/` 或 `.git/`。

Bootstrap 的原有致谢保留在关于页，旧代码及其许可保留在 `legacy/`。根目录的 `LICENSE.txt` 继续有效。
