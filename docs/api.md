# 静态版本接口

站点在构建时把最新一次发布写成静态 JSON，客户端直接请求这些文件即可检查更新，不需要访问 GitHub API，因此不会受 GitHub 限流影响，也不会给每个用户带来额外的配额消耗。

所有接口都是只读的静态文件，返回 `Content-Type: application/json`，无需鉴权。

## 数据新鲜度

数据每天由定时构建更新一次，因此最长可能滞后约一天。每个响应都带 `updatedAt`，可以据此判断是否过期。

GitHub Pages 由 CDN 提供，边缘节点可能存在分钟级缓存。检查更新时建议附加时间戳查询参数绕过缓存：

```
GET https://m.looly.top/api/v1/apps/media-flow.json?t=1730000000
```

## 接口列表

### 全量索引

```
GET /api/v1/index.json
```

返回所有应用的摘要，适合客户端一次性拉取后在本地比对。

```json
{
  "schemaVersion": 2,
  "updatedAt": "2026-10-20T16:13:01.653Z",
  "apps": [
    {
      "id": "media-flow",
      "name": "Media Flow",
      "summary": "本地视频、图片与音频的一体化浏览与播放",
      "repository": "https://github.com/Mr-XiaoLiang/MediaFlow",
      "platforms": ["android"],
      "variants": [
        {
          "platform": "android",
          "format": "apk",
          "install": "direct",
          "size": 40298929,
          "fileName": "app-release.apk",
          "url": "https://github.com/Mr-XiaoLiang/MediaFlow/releases/download/V3.0.0/app-release.apk"
        }
      ],
      "tags": ["播放器", "图库", "音频"],
      "emoji": "🎬",
      "icon": "",
      "version": "3.0.0",
      "versionCode": null,
      "publishedAt": "2026-10-19T16:30:24Z",
      "page": "https://m.looly.top/apps/media-flow/",
      "releases": "https://github.com/Mr-XiaoLiang/MediaFlow/releases"
    }
  ]
}
```

### 单个应用

```
GET /api/v1/apps/<id>.json
```

在上面的字段之外，多了 `description`、`notes`（本次更新说明）与 `history`（全部版本的跳转地址）。

```json
{
  "schemaVersion": 2,
  "updatedAt": "2026-10-20T16:13:01.653Z",
  "app": {
    "id": "android-build-clear",
    "version": "1.0.0",
    "variants": [
      { "platform": "windows", "format": "msi", "install": "installer", "size": 47557845, "fileName": "BuildClean-1.0.0.msi", "url": "…" },
      { "platform": "macos", "format": "dmg", "install": "installer", "size": 58722083, "fileName": "BuildClean-1.0.0.dmg", "url": "…" }
    ],
    "description": "…",
    "notes": "…"
  }
}
```

### 最近更新

```
GET /api/v1/latest.json
```

按 `publishedAt` 倒序排列的摘要列表，字段与全量索引一致。

## 平台与产物

`platforms` 是该应用实际可下载的平台列表，取值为小写标识：`android`、`ios`、`wear`、`windows`、`macos`、`linux`。某个平台在最新发布里没有匹配到安装包时不会出现在该列表中。页面展示时使用对应的系统名（Android、iOS、WearOS、Windows、macOS、Linux）。

`variants` 是每个平台的产物，一个平台一项：

| 字段 | 说明 |
| --- | --- |
| `platform` | 平台标识，与 `platforms` 中的取值一致 |
| `format` | 安装包类型，小写扩展名：`apk`、`msi`、`exe`、`dmg`、`pkg`、`zip`、`deb` 等 |
| `install` | 安装方式：`direct`（Android 直装）、`ios-sideload`（iOS 侧载）、`wear-sideload`（WearOS 侧载）、`installer`（桌面安装程序）、`archive`（不提供安装包） |
| `size` | 字节数 |
| `fileName` | 产物文件名 |
| `url` | 下载直链 |

`icon` 是站内相对路径（例如 `icons/mediaflow.png`），与接口同源；为空字符串表示没有提供图标，客户端可自行降级。

## 版本比较

按以下顺序判断，任一步得出结论即停止：

1. `versionCode` 不为 `null` 时，比较两个整数，大者为新。
2. `versionCode` 为空时，把 `version` 按 `.` 拆段，逐段作为数值比较；缺位的段按 0 处理。例如 `3.0.0` 与 `3.0` 视为相同。
3. `version` 为空时视为无法比较，只提示「存在新版本」而不自动下载。

`version` 是去掉前导 `v` 的字符串，直接用于展示；比较时必须转成数值，不能按字符串比较，否则 `3.10.0` 会被判定为小于 `3.9.0`。

## 下载

`variants[].url` 是 GitHub Releases 的直链，可以直接交给下载器或浏览器。

`variants[].size` 为字节数，可用于提示安装包大小或在下载前校验剩余空间。

同一应用可能有多个平台产物，客户端应按自身平台选择对应 `variant`，例如 Windows 客户端取 `platform` 为 `windows` 的一项。

## 示例

Android 端检查更新（Kotlin）：

```kotlin
data class Variant(val platform: String, val size: Long, val url: String)
data class StoreApp(
    val id: String,
    val version: String,
    val versionCode: Int?,
    val variants: List<Variant>
)

// 每次检查都带时间戳，绕过 CDN 缓存
val url = "https://m.looly.top/api/v1/apps/media-flow.json?t=${System.currentTimeMillis()}"
```

拿到结果后取 `platform == "android"` 的产物，与本地 `versionCode`（或 `versionName` 分段比较）对比，大于本地值时提示更新。
