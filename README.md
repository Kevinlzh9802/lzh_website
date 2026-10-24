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
npm test             # 密码生成规则与边界检查
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
- `public/`：直接复制到发布目录的静态资源。
- `legacy/`：迁移前的 HTML 和 Bootstrap 资源，作为原始内容备份，不参与构建。

保留原有公开路径：`/index.html`、`/profile/ContactMe.html`、`/archive/archive.html`、`/playground/playground.html`、`/playground/StringGenerator.html`、`/playground/FootballPage.html` 和 `/about/about.html`。新增 `/profile/profile.html` 承接原来的个人经历与兴趣爱好导航；没有补写个人履历。未填写的信息继续保留 `xxxxxxxx` 占位。

密码生成器保留原有默认值和全部选项：字符范围、首字符范围、固定／随机长度（1–30）、批量生成（1–50）及复制。选定字符范围表示允许出现的字符，并不保证每个字符集都会出现。操作仅在浏览器中完成；剪贴板不可用时会选中结果，支持手动复制。

冒泡大战位于 `/playground/BubbleBattle.html`，在广场中与密码生成并列。默认 10 列 × 5 行、红方先手，双方从左上／右下各 1 个泡泡开始。所有格子的爆炸阈值均为 4，先清空爆炸格，再将上下左右相邻格全部转为行动方并各增加 1 个泡泡；边界外没有格子，不接收泡泡。连锁按触发顺序逐个处理，待全部稳定后交换回合和判断胜负。支持鼠标、触摸、方向键和 Enter／空格操作；动画期间锁定落子，随时可重新开始。无需账号、联网或后端。

## 发布

执行 `npm run build`，将 **`dist/` 目录中的内容**上传到任意静态托管服务或 cPanel 的 `public_html/`，保留目录层级。无需上传源代码、`legacy/` 或 `node_modules/`。本次只完成本地重写，未更改线上网站。

原 `.cpanel.yaml` 只声明了目标目录，没有部署命令，因此不承担自动构建或发布。若继续使用旧主机，请按上面的方式上传构建产物。支持自定义 404 的主机可以使用 `dist/404.html`；Apache/cPanel 可设置 `ErrorDocument 404 /404.html`。

Bootstrap 的原有致谢保留在关于页，旧代码及其许可保留在 `legacy/`。根目录的 `LICENSE.txt` 继续有效。
