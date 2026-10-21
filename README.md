# Lollipop Store

Mr-XiaoLiang 的应用小店，部署在 `m.looly.top`。

页面在构建时读取 `app/apps.json`，向 GitHub 取得每个仓库的最新一次发布，把版本号、发布时间、产物体积与下载地址写进静态产物。访客打开页面时不发起任何外部请求，客户端也可以通过 `/api/v1/` 下的静态 JSON 检查更新。

## 本地运行

```bash
npm install
npm run data:local   # 取一次发布数据并生成页面数据
npm run dev          # http://localhost:5174
```

`npm run dev` 会在启动前重新生成页面数据。如果 `.cache/releases.json` 不存在，页面会以「暂无发布」的状态渲染，仅适合调试界面。

本地没有 GitHub 令牌时，取数走 REST 的 `releases/latest`，未认证额度为每小时 60 次，收录几十个应用足够用。

## 构建

```bash
npm run build        # 有 GITHUB_TOKEN 时走 GraphQL 单次请求
npm run build:local  # 无令牌时走 REST，适合本机验证
npm run preview      # 预览构建产物
```

构建顺序：取数 → 合并数据 → 打包 → 生成详情页静态壳与 `404.html`。

## 新增一个应用

1. 打开 `docs/candidates.md`，找到要收录的仓库。
2. 在 `app/apps.json` 的 `apps` 数组末尾追加一条。
3. 把图标放进 `app/icons/`，配置里写 `"icon": "文件名.png"`；图标可以省略。
4. 运行 `npm run data:local` 验证产物检索结果。

最小条目：

```json
{
  "repository": "https://github.com/Mr-XiaoLiang/MediaFlow",
  "name": "Media Flow",
  "summary": "本地视频、图片与音频的一体化浏览与播放",
  "description": "第一段说明。\n\n第二段说明。",
  "platform": ["Android"],
  "tags": ["播放器", "图库"],
  "emoji": "🎬",
  "icon": "mediaflow.png"
}
```

安装包不写规则：构建时按 `platform` 自动从最新一次发布里检索，Android 与 WearOS 取 `apk`，Windows 取 `msi` / `exe` / `msix` / `zip`，macOS 取 `dmg` / `pkg` / `zip`，Linux 取 `AppImage` / `deb` / `rpm` / `tar.gz` / `zip`。

- 某个平台检索不到产物，该平台不展示；
- 所有平台都检索不到，该应用不收录；
- 桌面应用同时提供安装程序与磁盘映像时，平台写在一起即可：`"platform": ["Windows", "MacOS"]`，详情页会先选平台再下载。

字段说明见 `docs/config.md`，取值约束见 `apps.schema.json`（编辑器会据此提示）。

## 数据与失败处理

- 每个仓库只取最新一次发布，历史版本通过「全部版本」跳转到 GitHub Releases。
- 单个仓库取不到（不存在、私有无权、接口报错）只跳过该应用，其余应用照常生成。
- 全部应用都取不到时构建以非零状态退出，GitHub Pages 不会部署，线上继续保留上一次成功的产物。
- 仓库没有发布记录时没有安装包，该应用不收录。

## 私有仓库

构建时能否读到私有仓库，取决于使用的令牌：

| 令牌 | 能否读取私有仓库 |
| --- | --- |
| `secrets.GITHUB_TOKEN`（默认） | 不能。它只对当前工作流所在的仓库有效，访问其它仓库一律返回 404 |
| `secrets.RELEASES_TOKEN`（需自行配置） | 能。经典 PAT 需勾选 `repo`，细粒度 PAT 需对目标仓库授予 `Contents: Read` |

工作流已经优先使用 `RELEASES_TOKEN`，未配置时自动回退到 `GITHUB_TOKEN`，因此公开仓库不需要任何额外设置。本地调试可以直接把 PAT 放进环境变量：`GITHUB_TOKEN=ghp_xxx npm run data`。

但取数只是前半段。GitHub 私有仓库的 Release 资源下载链接需要鉴权，匿名访客访问会得到 404，因此私有仓库的安装包无法通过本站分发。要让访客能下载，需要满足下面任一条件：

- 仓库改为公开；
- 把安装包上传到公开仓库的 Release，`repository` 指向那个公开仓库；
- 安装包另行托管，本站只做跳转（当前实现不包含这种方式）。

## 部署

推送到 `main` 触发构建；也可以在 Actions 页面手动运行 `Deploy to GitHub Pages`。工作流没有配置定时任务，因此发布了新版本但未推送本仓库时，需要手动运行一次，页面上的版本号与产物信息才会更新。

首次部署需要在仓库的 Settings → Pages 里把来源设为 GitHub Actions，并确认仓库根目录的 `CNAME` 内容为 `m.looly.top`（构建时会复制一份进产物），同时在域名服务商处添加指向 `Mr-XiaoLiang.github.io` 的 CNAME 记录。

若站点将来挂在子路径下，在仓库 Variables 里设置 `STORE_BASE=/子路径/` 即可，不需要改代码。

## 目录

```
app/apps.json          唯一的人工配置
app/icons/             应用图标，配置里写文件名
apps.schema.json       配置的 JSON Schema
scripts/               取数、数据合并、预渲染
src/data/faces.js      颜文字词表（复用品牌站）
src/composables/       表情、视线、主题、标题（复用品牌站）
src/components/        字标、卡片、筛选、安装向导等
src/views/             目录、详情、关于
docs/                  API、配置、候选清单
```

## 与品牌站的关系

颜文字语法、动效曲线与主题存储键与 `looly.top` 共用，两个站点的字标行为一致；配色与卡片形制独立，商店取中性炭黑与琥珀，不使用入口牌墙的紫粉渐变与扑克花色。
