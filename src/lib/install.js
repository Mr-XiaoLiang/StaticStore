/**
 * 安装计划：把「平台 + 安装包类型」翻译成页面可直接渲染的结构。
 *
 * 一个应用可能提供多个平台的产物，页面先选定平台（variant），
 * 再据此生成下载文案与安装向导。平台差异全部收敛在这里。
 */

export function formatLabel(variant) {
  const format = variant?.format || ''
  return format ? format.toUpperCase() : ''
}

/** 主按钮文案：手机说 APK，桌面说安装包类型，避免把产物文件名端给用户 */
export function downloadLabel(app, variant) {
  const platform = variant?.platform || app?.platforms?.[0] || ''
  const format = formatLabel(variant)

  if (platform === 'wear') return '下载 WearOS 安装包'
  if (platform === 'android') return '下载 APK'
  if (platform === 'ios') return '下载 IPA'
  if (platform === 'windows') return format ? `下载 ${format} 安装包` : '下载安装程序'
  if (format) return `下载 ${format}`
  return '下载安装包'
}

/** 详情页「系统」一项的取值：没有单独配置时给出该平台的通用要求 */
export function platformRequirement(platform) {
  if (platform === 'android') return 'Android 8.0 及以上'
  if (platform === 'ios') return 'iOS 15 及以上'
  if (platform === 'wear') return 'WearOS 3 及以上'
  if (platform === 'windows') return 'Windows 10 及以上'
  if (platform === 'macos') return 'macOS 12 及以上'
  if (platform === 'linux') return 'x86_64 发行版'
  return ''
}

function fileName(variant, app) {
  return variant?.download?.fileName || `${app?.id}.apk`
}

function phoneTab(app, variant) {
  const file = fileName(variant, app)
  return {
    id: 'phone',
    label: 'Android 安装',
    prerequisites: [
      'Android 8.0 及以上',
      '允许浏览器或文件管理器安装未知来源应用',
      '覆盖安装会保留应用数据，卸载后数据不再保留'
    ],
    steps: [],
    commands: [{ label: '通过数据线安装', command: `adb install -r "${file}"` }],
    note: ''
  }
}

function wearTab(app, variant) {
  const file = fileName(variant, app)
  return {
    id: 'wear',
    label: 'WearOS 侧载',
    prerequisites: [
      'WearOS 设备与电脑处于同一网络，且已开启开发者选项与无线调试',
      '电脑已安装 Android SDK Platform Tools，adb 可用',
      '首次连接需在设备上确认调试授权'
    ],
    steps: [],
    commands: [
      { label: '确认设备已连接', command: 'adb devices' },
      { label: '安装或覆盖安装', command: `adb install -r "${file}"` },
      { label: '仅推送到指定设备', command: `adb -s <设备序列号> install -r "${file}"` }
    ],
    note: ''
  }
}

function iosTab(app, variant) {
  const file = fileName(variant, app)
  return {
    id: 'ios',
    label: 'iOS 安装',
    prerequisites: [
      'iOS 15 及以上',
      '需要一台装有 Finder 或 Apple Configurator 2 的 Mac，或可用的侧载工具',
      '应用使用开发者证书签名，首次运行需要在设备上信任该证书'
    ],
    steps: [
      `下载 ${file} 到本地`,
      '用侧载工具或 Apple Configurator 2 把安装包写入设备',
      '在设备上打开应用，按提示在「设置 → 通用 → VPN 与设备管理」中信任证书'
    ],
    commands: [],
    note: ''
  }
}

function windowsTab(app, variant) {
  const format = variant?.format || ''
  const file = fileName(variant, app)
  const portable = format === 'zip'

  return {
    id: 'windows',
    label: 'Windows 安装',
    prerequisites: [
      platformRequirement('windows'),
      portable ? '免安装压缩包，解压后即可运行' : `安装包为 ${format || 'exe'} 格式，双击运行`,
      '安装或覆盖前请先退出正在运行的旧版本'
    ],
    steps: portable
      ? [
          `下载 ${file} 到本地`,
          '解压压缩包，把解压后的目录移到需要的位置',
          '双击目录内的主程序启动，需要时可创建桌面快捷方式'
        ]
      : [
          `下载 ${file} 到本地`,
          '双击安装包，按提示完成安装',
          '安装完成后从开始菜单或桌面快捷方式启动'
        ],
    commands: [],
    note: ''
  }
}

function macosTab(app, variant) {
  const format = variant?.format || ''
  const file = fileName(variant, app)

  let steps
  if (format === 'pkg') {
    steps = [
      `下载 ${file} 到本地`,
      '双击安装包，按提示完成安装',
      '从「启动台」或「应用程序」文件夹打开'
    ]
  } else if (format === 'zip') {
    steps = [
      `下载 ${file} 到本地`,
      '解压压缩包，把应用拖入「应用程序」文件夹',
      '从「启动台」打开应用'
    ]
  } else {
    steps = [
      `下载 ${file} 到本地`,
      '打开磁盘映像，把应用图标拖入「应用程序」文件夹',
      '推出磁盘映像，从「启动台」或「应用程序」打开'
    ]
  }

  return {
    id: 'macos',
    label: 'macOS 安装',
    prerequisites: [
      platformRequirement('macos'),
      '首次打开从网络下载的应用时，需要在「系统设置 → 隐私与安全性」中允许',
      '覆盖安装会保留应用数据，删除应用后数据不再保留'
    ],
    steps,
    commands: [],
    note: ''
  }
}

function linuxTab(app, variant) {
  const format = variant?.format || ''
  const file = fileName(variant, app)

  let steps
  if (format === 'appimage') {
    steps = [
      `下载 ${file} 到本地`,
      '在文件属性中允许作为程序执行，或在终端执行 chmod +x',
      '双击运行，需要时可添加到应用菜单'
    ]
  } else if (format === 'deb') {
    steps = [`下载 ${file} 到本地`, '用软件中心打开安装，或执行 dpkg -i 安装', '从应用菜单启动']
  } else if (format === 'rpm') {
    steps = [`下载 ${file} 到本地`, '用包管理器安装，或执行 rpm -i 安装', '从应用菜单启动']
  } else {
    steps = [`下载 ${file} 到本地`, '解压压缩包', '运行目录内的可执行文件']
  }

  return {
    id: 'linux',
    label: 'Linux 安装',
    prerequisites: [
      platformRequirement('linux'),
      format ? `安装包为 ${format} 格式` : '按压缩包内的说明运行',
      '部分发行版需要先安装运行库'
    ],
    steps,
    commands: [],
    note: ''
  }
}

/** 返回安装向导的页签；空数组表示不显示向导（源码项目或没有产物） */
export function installPlan(app, variant) {
  if (!app || !variant) return []
  if (variant.platform === 'wear') return [wearTab(app, variant), phoneTab(app, variant)]
  if (variant.platform === 'android') return [phoneTab(app, variant)]
  if (variant.platform === 'ios') return [iosTab(app, variant)]
  if (variant.platform === 'windows') return [windowsTab(app, variant)]
  if (variant.platform === 'macos') return [macosTab(app, variant)]
  if (variant.platform === 'linux') return [linuxTab(app, variant)]
  return []
}
