#!/usr/bin/env bash
# 星观台 · iOS TestFlight 构建脚本
#
# 前置条件：
#   1. 安装 Xcode 命令行工具
#   2. Apple Developer 账号（$99/年）
#   3. 在 Xcode 中登录 Apple ID：Settings → Accounts
#   4. 设置环境变量（见 .env.example）
#
# 用法：
#   ./scripts/build-ios-testflight.sh          # 仅构建 IPA
#   UPLOAD=1 ./scripts/build-ios-testflight.sh  # 构建并上传 TestFlight

set -euo pipefail
cd "$(dirname "$0")/.."

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔭 星观台 · iOS TestFlight Builder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 加载 .env（若存在）
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

TEAM_ID="${DEVELOPMENT_TEAM:-${TEAM_ID:-}}"
APPLE_ID="${APPLE_ID:-}"
SCHEME="${IOS_SCHEME:-App}"
WORKSPACE="ios/App/App.xcworkspace"
ARCHIVE_PATH="build/星观台.xcarchive"
EXPORT_DIR="build/export"
EXPORT_PLIST="build/ExportOptions.plist"
IPA_PATH="${EXPORT_DIR}/App.ipa"

# ── 1. Web 构建 + Capacitor sync ──
echo ""
echo "📦 Step 1/4 · Web 构建 + Capacitor sync"
if [[ ! -d node_modules ]]; then npm install; fi
npm run build
npx cap sync ios
node scripts/setup-native.js

if [[ ! -d ios/App/App.xcworkspace ]]; then
  echo "❌ 未找到 iOS 工程，请先运行: npx cap add ios"
  exit 1
fi

# ── 2. 检查签名配置 ──
echo ""
echo "🔐 Step 2/4 · 签名检查"
if [[ -z "$TEAM_ID" ]]; then
  echo "⚠️  未设置 DEVELOPMENT_TEAM / TEAM_ID"
  echo "   请在 .env 中设置，或在 Xcode 中手动选择 Team："
  echo "   open ios/App/App.xcworkspace"
  echo ""
  echo "   继续尝试自动签名（Xcode 已登录时通常可用）..."
else
  echo "   Team ID: $TEAM_ID"
fi

mkdir -p build

# 生成 ExportOptions（注入 Team ID）
cp ios/ExportOptions.plist "$EXPORT_PLIST"
if [[ -n "$TEAM_ID" ]]; then
  sed -i '' "s/TEAM_ID_PLACEHOLDER/$TEAM_ID/g" "$EXPORT_PLIST"
else
  sed -i '' "s/TEAM_ID_PLACEHOLDER//g" "$EXPORT_PLIST"
fi

# ── 3. Archive ──
echo ""
echo "🏗  Step 3/4 · xcodebuild archive"

XCODE_ARGS=(
  -workspace "$WORKSPACE"
  -scheme "$SCHEME"
  -configuration Release
  -archivePath "$ARCHIVE_PATH"
  -allowProvisioningUpdates
  CODE_SIGN_STYLE=Automatic
)

if [[ -n "$TEAM_ID" ]]; then
  XCODE_ARGS+=(DEVELOPMENT_TEAM="$TEAM_ID")
fi

xcodebuild archive "${XCODE_ARGS[@]}"

# ── 4. Export IPA ──
echo ""
echo "📲 Step 4/4 · 导出 App Store IPA"

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_PLIST" \
  -allowProvisioningUpdates

echo ""
echo "✅ IPA 已生成: $IPA_PATH"
ls -lh "$IPA_PATH" 2>/dev/null || ls -lh "$EXPORT_DIR/"

# ── 5. 可选：上传 TestFlight ──
if [[ "${UPLOAD:-0}" == "1" ]]; then
  echo ""
  echo "☁️  上传至 App Store Connect / TestFlight..."

  if [[ -z "$APPLE_ID" ]]; then
    echo "❌ 上传需要 APPLE_ID 环境变量"
    exit 1
  fi

  if [[ -n "${APP_STORE_CONNECT_API_KEY_ID:-}" && -n "${APP_STORE_CONNECT_API_KEY_PATH:-}" ]]; then
    xcrun altool --upload-app \
      --type ios \
      --file "$IPA_PATH" \
      --apiKey "$APP_STORE_CONNECT_API_KEY_ID" \
      --apiIssuer "${APP_STORE_CONNECT_API_ISSUER:-}"
  else
    echo "   使用 Apple ID 上传（需要 App 专用密码或 keychain 条目 AC_PASSWORD）"
    xcrun altool --upload-app \
      --type ios \
      --file "$IPA_PATH" \
      --username "$APPLE_ID" \
      --password "${APP_STORE_CONNECT_PASSWORD:-@keychain:AC_PASSWORD}"
  fi

  echo ""
  echo "✅ 已上传！请在 App Store Connect → TestFlight 中审核并分发给测试员。"
else
  echo ""
  echo "📋 下一步："
  echo "   方式 A · Xcode 上传："
  echo "     open ios/App/App.xcworkspace"
  echo "     Product → Archive → Distribute App → App Store Connect"
  echo ""
  echo "   方式 B · 命令行上传："
  echo "     UPLOAD=1 APPLE_ID=you@email.com ./scripts/build-ios-testflight.sh"
  echo ""
  echo "   方式 C · Transporter App："
  echo "     拖入 $IPA_PATH"
fi
