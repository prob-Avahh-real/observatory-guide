# 星观台 (Observatory Guide)

全国天文台汇总信息、交互式地图展示与音视频导览，面向天文爱好者。支持移动端与智能可穿戴设备。

## 功能

- **全国汇总** — 收录 28 个国家级/高校/公众开放天文台站
- **交互地图** — Canvas 中国地图，点击标记查看详情，支持缩放平移
- **分类筛选** — 国家台站 / 高校台站 / 公众开放
- **语音导览** — 中文 TTS 朗读台站介绍、设备与参观信息
- **视频导览** — NASA/Mixkit 真实视频 + 同步语音，失败时 Canvas 兜底
- **离线缓存** — 导览视频 Cache API 预下载，无网可看（⬇️ 按钮 / 启动后台缓存）
- **语音提问** — 问海拔、设备、参观方式、历史等
- **定位最近** — GPS 定位，自动推荐最近的天文台
- **移动端** — Capacitor 打包 iOS/Android APK
- **智能硬件** — 戒指/手杖/眼镜/手表全支持

## 目标平台

| 平台 | 方式 | 命令 |
|------|------|------|
| iOS | Capacitor → Xcode | `npm run ios` |
| iOS TestFlight | xcodebuild archive | `npm run ios:testflight` |
| Android | Capacitor → Gradle | `./build.sh` → `cd android && ./gradlew assembleDebug` |
| 手表 | 窄屏自适应 CSS | 同 APK |
| 智能眼镜 | 窄 FOV + 语音控制 | 同 APK |
| 智能戒指 | DeviceOrientation | 左右倾斜→切换台站，摇晃→语音讲解 |
| 智能手杖 | DeviceMotion | 敲击→视频导览，挥动→切换台站 |
| Web | Vite 开发服务器 | `npm run dev` |

## 开发

```bash
npm install
npm run dev        # http://localhost:5188
npm test           # 数据完整性测试
./serve.sh         # 构建 + 预览
./build.sh         # 构建 + Capacitor sync
npm run ios:testflight  # 构建 TestFlight IPA（需 .env 配置 Team ID）
cp .env.example .env    # 首次 TestFlight 构建前配置
```

## 语音命令（眼镜模式）

| 命令 | 动作 |
|------|------|
| 下一个 / 上一个 | 切换天文台 |
| 讲解 / 介绍 | 语音导览 |
| 视频 / 导览 | 视频导览 |
| 定位 / 最近 | GPS 找最近台站 |
| 关闭 / 返回 | 关闭面板 |
| 暂停 / 停 | 停止语音 |

## 收录台站

国家天文台（北京、兴隆、阿里、德令哈、长春、青海、洪河、三亚）、紫金山/上海/云南/新疆天文台、FAST 中国天眼、冷湖基地、羊八井、授时中心、盱眙站、北京天文馆、上海天文馆、佘山公众体验、武大天问台、北师大/南大/中科大/山大威海天文台、塞罕坝/天荒坪/敦煌星空营地等。

## TestFlight 发布

1. `cp .env.example .env`，填入 `DEVELOPMENT_TEAM`（Apple Developer Team ID）
2. 在 [App Store Connect](https://appstoreconnect.apple.com) 创建 App（Bundle ID: `com.skat.observatoryguide`）
3. 运行 `npm run ios:testflight` 生成 IPA
4. 上传：`UPLOAD=1 APPLE_ID=you@email.com npm run ios:testflight`
5. App Store Connect → TestFlight → 添加内部测试员

## 离线视频缓存

- 启动后自动后台预缓存（去重约 8 个源视频，覆盖全部 112 个导览场景）
- 点击 HUD 右上角 ⬇️ 手动触发全量下载
- 缓存完成后显示「✓ 离线」，断网仍可播放视频导览
- 桌面端右键 ⬇️ 按钮可清除缓存


- Canvas 2D — 交互地图 + 视频导览动画
- Web Speech API — TTS 语音合成 + 语音识别
- Vite — 模块化构建
- Capacitor — iOS/Android 原生包装
