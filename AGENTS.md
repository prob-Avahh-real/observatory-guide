# 星观台 (Observatory Guide)

全国天文台汇总、交互式地图与音视频导览，面向天文爱好者。

## 目标平台

| 平台 | 方式 | 产出 |
|------|------|------|
| iOS | Capacitor → Xcode | IPA |
| Android | Capacitor → Gradle | APK |
| 手表 | 窄屏自适应 | 同 APK |
| 智能眼镜 | 窄FOV + 语音控制 | 同 APK |
| 智能戒指 | DeviceOrientation 倾角 | 左右→切换台站，摇晃→讲解 |
| 智能手杖 | DeviceMotion 加速度 | 敲击→视频导览，挥动→切换 |

## 功能

- 28 个全国天文台站数据（国家/高校/公众开放）
- Canvas 交互中国地图（缩放、平移、标记点击）
- 真实视频导览（NASA/Mixkit 公有域素材 + Canvas 兜底）
- 分类筛选 + 列表面板 + GPS 定位最近
- 语音导览（TTS）+ 视频导览（Canvas 动画 + 同步语音）
- 语音提问（海拔、设备、参观、历史等）

## 语音命令（眼镜模式）

| 命令 | 动作 |
|------|------|
| 下一个 / 上一个 | 切换天文台 |
| 讲解 / 介绍 | 语音导览 |
| 视频 / 导览 | 视频导览 |
| 定位 / 最近 | GPS 最近台站 |
| 关闭 / 返回 | 关闭当前面板 |

## 命令

```bash
npm install
npm run dev          # 开发 http://localhost:5188
npm test             # 数据测试
npm run ios          # 打开 Xcode
npm run setup-native # iOS/Android 权限配置
./build.sh           # 完整原生构建
```

## Harness / Loop（助手）

- 遵循根 `/Users/skat/AGENTS.md`：**Harness Engineering** + **Loop Engineering**
- Guide = 本文件；Sensor = 下方验证命令；同类失误第二次须沉淀规则或测试（棘轮）
- 开干前写清 **Done**；每切片过验证环；显式停止（成功 / 上限 / 无进展 / 人审）
- 详解：`docs/HARNESS_ENGINEERING.md`、`docs/LOOP_ENGINEERING.md`

## 验证环 / Done

```bash
npm install
npm test          # 若有
npm run build     # 或 build:web
npx cap sync android   # 若有 android/
# 可选：JAVA_HOME=…/openjdk@17 npm run apk:debug
```

**Done 示例**：测试通过（若有）+ web 产物进 `www/`/`dist/` + `cap sync` 无报错。可选穿戴未做可搁置，不纳入强制 Done。
