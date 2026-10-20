# 配置说明

全站只有 `app/apps.json` 需要人工维护。新增或移除应用只改这一个文件，构建脚本会读取它并从 GitHub 取回最新一次发布。

图标统一放在 `app/icons/`，配置里只写文件名，构建时复制到 `public/icons/`，页面按 `/icons/<文件名>` 引用。每个应用一个图标即可，不需要准备截图。

字段的取值约束同时写在 `apps.schema.json` 里。编辑器关联该文件后，悬停可以看到字段说明，取值越界会立即标红。VS Code 默认支持 `$schema` 字段，不需要额外插件。

## 顶层结构

```json
{
  "$schema": "../apps.schema.json",
  "site": {
    "title": "Lollipop Store",
    "domain": "m.looly.top",
    "about": "POP的软件小店"
  },
  "apps": [
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
  ]
}
```

`apps` 是数组，新增应用直接追加一条，不涉及键名。页面标识（用于路由与接口路径）由仓库名自动生成，例如 `MediaFlow` 生成 `media-flow`，`LQR` 生成 `lqr`。

## site

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 站点标题，用于顶栏、页脚与页面标题 |
| `domain` | 是 | 部署域名，用于生成分享链接与接口里的页面地址 |
| `about` | 否 | 关于页的一段说明 |

## 应用条目

| 字段 | 必填 | 类型 | 说明 |
| --- | --- | --- | --- |
| `repository` | 是 | 字符串 | 仓库完整地址，例如 `https://github.com/Mr-XiaoLiang/MediaFlow` |
| `name` | 是 | 字符串 | 显示名称 |
| `summary` | 是 | 字符串 | 一句话说明，显示在卡片上 |
| `description` | 否 | 字符串 | 详情页的功能说明，用换行符分段 |
| `platform` | 是 | 字符串数组 | `Android` / `iOS` / `WearOS` / `Windows` / `MacOS` / `Linux`，可写多个 |
| `tags` | 是 | 字符串数组 | 用途标签，用于首页筛选与搜索 |
| `emoji` | 否 | 字符串 | 没有图标时的降级符号 |
| `icon` | 否 | 字符串 | 图标文件名，文件放在 `app/icons/`，只写文件名 |

`repository` 同时用于三件事：取数、生成 Releases 链接、页面上的仓库入口。账号主页也由它推导，因此不再单独维护用户名。

## 平台与安装包

安装包不需要手写规则。构建时按 `platform` 里声明的平台，在最新一次发布的附件中检索对应扩展名：

| 平台 | 检索的扩展名（按顺序） |
| --- | --- |
| `Android` | `apk` |
| `iOS` | `ipa` |
| `WearOS` | `apk` |
| `Windows` | `msi`、`exe`、`msix`、`zip` |
| `MacOS` | `dmg`、`pkg`、`zip` |
| `Linux` | `AppImage`、`deb`、`rpm`、`tar.gz`、`zip` |

平台一律写具体系统名。`Android` 与 `iOS` 分开列出，不使用「手机」这类统称；`WearOS` 也不写成「手表」。

同一扩展名有多个附件时取体积最大的一个；文件名包含 `debug`、`mapping`、`symbols`、`checksum` 的附件会被忽略。

- 某个平台检索不到产物：该平台不展示，其余平台照常展示。
- 所有平台都检索不到：该应用不收录，不进入页面与接口。
- 发布标签里的版本号自动提取，`V3.0.0`、`FileBrowser-1.0.0` 都会显示为 `v1.0.0` 或 `v3.0.0`。

多个平台写在同一个数组里，一次发布同时提供安装程序与磁盘映像时会各自匹配：

```json
{
  "repository": "https://github.com/Mr-XiaoLiang/AndroidBuildClear",
  "name": "BuildClean",
  "summary": "批量查找并清理 Android 工程的构建产物",
  "platform": ["Windows", "MacOS"],
  "tags": ["开发", "工具"],
  "emoji": "🧹"
}
```

详情页会先让访客选择平台，再给出对应的下载按钮、体积与安装步骤。

## 图标

```json
"icon": "mediaflow.png"
```

文件放在 `app/icons/mediaflow.png` 即可，不必写路径。构建时会校验文件是否存在，缺失会让构建失败并指出具体是哪个应用缺图标。

三个降级顺序：配置的图标 → `emoji` → 名称首字。没有准备图标时删掉 `icon` 字段即可。

## 取数与失败处理

- 单个仓库取不到（不存在、私有无权、接口报错）：跳过该应用并输出原因，其余应用照常生成。
- 全部仓库都取不到：构建以非零状态退出，GitHub Pages 不会部署，线上保留上一次成功的产物。
- 仓库存在但没有发布记录：没有安装包，不收录。

## 私有仓库

工作流默认使用的 `secrets.GITHUB_TOKEN` 只对当前仓库有效，读不到其它仓库。私有仓库需要在仓库设置里添加一个具备 `Contents: Read` 权限的 `RELEASES_TOKEN`，工作流会优先使用它。

需要注意，私有仓库的 Release 资源链接对匿名访客不可用，安装包无法通过本站下载。私有仓库的条目最多只能展示版本信息，不能作为分发来源。

## 常见错误

**`apps[i].repository` 必须是 GitHub 仓库地址**

必须写完整的 `https://github.com/owner/repo`，不接受只写仓库名。

**`apps[i].platform` 取值非法**

只接受 `Android`、`iOS`、`WearOS`、`Windows`、`MacOS`、`Linux` 六个值，大小写不敏感，数组内不能重复。

**`apps[i].icon` 指向的文件不存在**

图标必须真实放在 `app/icons/` 下，配置里只写文件名。暂时没有图标就删掉该字段。

**页面上的某个平台没有出现**

说明该平台在最新一次发布里没有匹配到安装包。检查附件扩展名是否在平台的检索范围内，例如 macOS 只认 `dmg`、`pkg`、`zip`。

## 收录范围

`docs/candidates.md` 列出了账号下全部非 fork 仓库，可以逐项勾选后补进 `app/apps.json`。该文件只作为挑选手册，构建不会读取它。
