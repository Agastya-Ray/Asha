// Wires Asha's own Android code into the Capacitor project in ./android.
// Safe to run many times. Run after `npx cap add android` (the GitHub build does this for you).
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const android = join(root, "android");
if (!existsSync(android)) {
  console.error("No android/ folder yet. Run: npx cap add android");
  process.exit(1);
}

const pkgDir = join(android, "app/src/main/java/com/agastyaray/asha");
mkdirSync(pkgDir, { recursive: true });

// 1. Copy the native Java files.
for (const f of readdirSync(join(root, "native/android"))) {
  if (f.endsWith(".java")) copyFileSync(join(root, "native/android", f), join(pkgDir, f));
}

// 2. MainActivity registers the AshaNative plugin.
writeFileSync(
  join(pkgDir, "MainActivity.java"),
  `package com.agastyaray.asha;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AshaNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`,
);

// 3. AndroidManifest: permissions, receivers, service, queries.
const manifestPath = join(android, "app/src/main/AndroidManifest.xml");
let manifest = readFileSync(manifestPath, "utf8");
const MARK = "<!-- asha:native -->";
if (!manifest.includes(MARK)) {
  const perms = [
    "android.permission.INTERNET",
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.SCHEDULE_EXACT_ALARM",
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.WAKE_LOCK",
    "android.permission.VIBRATE",
    "android.permission.FOREGROUND_SERVICE",
    "android.permission.RECORD_AUDIO",
    "android.permission.SEND_SMS",
    "android.permission.CALL_PHONE",
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.ACCESS_FINE_LOCATION",
  ].filter((p) => !manifest.includes(`"${p}"`));
  const permXml =
    `    ${MARK}\n` +
    perms.map((p) => `    <uses-permission android:name="${p}" />`).join("\n") +
    `\n    <uses-feature android:name="android.hardware.telephony" android:required="false" />` +
    `\n    <uses-feature android:name="android.hardware.location.gps" android:required="false" />` +
    `\n    <uses-feature android:name="android.hardware.microphone" android:required="false" />\n`;
  const components = `
        ${MARK}
        <receiver android:name=".ReminderReceiver" android:exported="false" />
        <receiver android:name=".ActionReceiver" android:exported="false" />
        <receiver android:name=".BootReceiver" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
                <action android:name="android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED" />
            </intent-filter>
        </receiver>
        <service android:name=".ReminderService" android:exported="false" android:foregroundServiceType="shortService" />
`;
  const queries = `
    <queries>
        <intent><action android:name="android.speech.RecognitionService" /></intent>
        <intent><action android:name="android.intent.action.TTS_SERVICE" /></intent>
    </queries>
`;
  manifest = manifest
    .replace(/(\s*<application)/, `\n${permXml}$1`)
    .replace(/(\s*<\/application>)/, `${components}$1`)
    .replace(/(\s*<\/manifest>)/, `${queries}$1`);
  writeFileSync(manifestPath, manifest);
}

// 4. app/build.gradle: version numbers + optional release signing from environment variables.
const gradlePath = join(android, "app/build.gradle");
let gradle = readFileSync(gradlePath, "utf8");
if (!gradle.includes("ASHA_VERSION_CODE")) {
  gradle = gradle
    .replace(/versionCode\s+\d+/, `versionCode Integer.parseInt(System.getenv("ASHA_VERSION_CODE") ?: "1")`)
    .replace(/versionName\s+"[^"]*"/, `versionName (System.getenv("ASHA_VERSION_NAME") ?: "1.0")`);
}
if (!gradle.includes("ASHA_KEYSTORE_FILE")) {
  gradle = gradle.replace(
    /(\n\s*buildTypes\s*\{)/,
    `
    signingConfigs {
        debug {
            // Same test key on every build, so a new APK installs over the old one without losing data.
            storeFile file("../../native/android/debug.keystore")
            storePassword "android"
            keyAlias "androiddebugkey"
            keyPassword "android"
        }
        release {
            if (System.getenv("ASHA_KEYSTORE_FILE")) {
                storeFile file(System.getenv("ASHA_KEYSTORE_FILE"))
                storePassword System.getenv("ASHA_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ASHA_KEY_ALIAS")
                keyPassword System.getenv("ASHA_KEY_PASSWORD")
            }
        }
    }$1`,
  );
  gradle = gradle.replace(
    /(buildTypes\s*\{\s*release\s*\{)/,
    `$1\n            if (System.getenv("ASHA_KEYSTORE_FILE")) { signingConfig signingConfigs.release }`,
  );
}
writeFileSync(gradlePath, gradle);

console.log("Asha native code wired into android/ ✔");
