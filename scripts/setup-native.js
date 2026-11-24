#!/usr/bin/env node
/**
 * Capacitor sync 后配置 iOS / Android 原生权限与 Info.plist
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');

const IOS_PLIST = join(ROOT, 'ios/App/App/Info.plist');
const ANDROID_MANIFEST = join(ROOT, 'android/app/src/main/AndroidManifest.xml');

const IOS_KEYS = {
  CFBundleDisplayName: '星观台',
  NSLocationWhenInUseUsageDescription: '需要您的位置来推荐最近的天文台',
  NSLocationAlwaysAndWhenInUseUsageDescription: '需要您的位置来推荐最近的天文台',
  NSMotionUsageDescription: '用于智能戒指和智能手杖的体感交互',
  NSMicrophoneUsageDescription: '用于语音提问功能',
  NSSpeechRecognitionUsageDescription: '用于语音提问和智能眼镜语音控制',
  UIBackgroundModes: ['audio'],
};

const ANDROID_PERMS = [
  'android.permission.INTERNET',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.RECORD_AUDIO',
];

function patchIosPlist() {
  if (!existsSync(IOS_PLIST)) {
    console.log('  ⏭ iOS 未初始化，跳过 Info.plist');
    return;
  }
  let xml = readFileSync(IOS_PLIST, 'utf8');

  for (const [key, value] of Object.entries(IOS_KEYS)) {
    if (typeof value === 'string') {
      const re = new RegExp(`<key>${key}</key>\\s*<string>[^<]*</string>`);
      const entry = `<key>${key}</key>\n\t<string>${value}</string>`;
      if (re.test(xml)) {
        xml = xml.replace(re, entry);
      } else {
        xml = xml.replace('</dict>\n</plist>', `\t${entry}\n</dict>\n</plist>`);
      }
    } else if (Array.isArray(value)) {
      const items = value.map((v) => `\t\t<string>${v}</string>`).join('\n');
      const entry = `<key>${key}</key>\n\t<array>\n${items}\n\t</array>`;
      const re = new RegExp(`<key>${key}</key>\\s*<array>[\\s\\S]*?</array>`);
      if (re.test(xml)) {
        xml = xml.replace(re, entry);
      } else {
        xml = xml.replace('</dict>\n</plist>', `\t${entry}\n</dict>\n</plist>`);
      }
    }
  }

  writeFileSync(IOS_PLIST, xml);
  console.log('  ✓ iOS Info.plist 已配置（定位/语音/体感权限）');
}

function patchAndroidManifest() {
  if (!existsSync(ANDROID_MANIFEST)) {
    console.log('  ⏭ Android 未初始化，跳过 AndroidManifest');
    return;
  }
  let xml = readFileSync(ANDROID_MANIFEST, 'utf8');

  for (const perm of ANDROID_PERMS) {
    if (!xml.includes(perm)) {
      xml = xml.replace(
        '<!-- Permissions -->',
        `<!-- Permissions -->\n    <uses-permission android:name="${perm}" />`
      );
    }
  }

  if (!xml.includes('usesCleartextTraffic')) {
    xml = xml.replace(
      'android:supportsRtl="true"',
      'android:supportsRtl="true"\n        android:usesCleartextTraffic="true"'
    );
  }

  writeFileSync(ANDROID_MANIFEST, xml);
  console.log('  ✓ Android Manifest 已配置（定位/麦克风/网络）');
}

console.log('🔧 原生平台配置\n');
patchIosPlist();
patchAndroidManifest();
console.log('');
