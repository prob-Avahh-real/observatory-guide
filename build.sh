#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔭 星观台 · Native App Builder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/Cellar/openjdk@17/17.0.19/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

if [[ ! -d node_modules ]]; then
  echo "📦 安装依赖..."
  npm install
fi

npm run build

if [[ ! -d ios ]]; then
  echo "🍎 初始化 iOS 平台..."
  npx cap add ios
fi
if [[ ! -d android ]]; then
  echo "🤖 初始化 Android 平台..."
  npx cap add android
fi

echo "🔄 Capacitor sync..."
npx cap sync

echo "🔧 配置原生权限..."
node scripts/setup-native.js

echo ""
echo "✅ 构建完成！"
echo ""
echo "  🍎 iOS IPA:"
echo "     open ios/App/App.xcworkspace"
echo "     Xcode → Product → Archive"
echo ""
echo "  🤖 Android APK:"
echo "     cd android && ./gradlew assembleDebug"
echo "     输出: android/app/build/outputs/apk/debug/app-debug.apk"
