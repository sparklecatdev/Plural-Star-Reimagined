#!/usr/bin/env node
/**
 * Replacement for `react-native run-android` that:
 *   1. Refuses to auto-launch an Android emulator.
 *      `run-android` runs `emulator -avd ...` when `adb devices` is empty.
 *      That's noisy and pops a window we never asked for. This script just
 *      uses whatever device adb already sees and errors clearly if none.
 *   2. Starts Metro in a new console window so HMR works.
 *   3. Runs `gradlew installDebug` which installs onto the first attached
 *      device — never spawns an emulator on its own.
 *   4. Calls `adb shell am start` to launch the app after install.
 *
 * Usage: `npm run android` (or `node scripts/run-android.js`).
 */
const {spawn, spawnSync} = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ANDROID_DIR = path.join(ROOT, 'android');
const PACKAGE = 'com.pluralspace.app';
const ACTIVITY = `${PACKAGE}/.MainActivity`;
const IS_WIN = process.platform === 'win32';
const GRADLE = IS_WIN ? 'gradlew.bat' : './gradlew';

// Resolve adb from ANDROID_HOME / ANDROID_SDK_ROOT, falling back to PATH.
const ADB = (() => {
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (sdk) return path.join(sdk, 'platform-tools', IS_WIN ? 'adb.exe' : 'adb');
  return 'adb';
})();

const die = msg => { console.error(`\n❌ ${msg}\n`); process.exit(1); };

// ── Step 1: must have an attached device ────────────────────────────────────
console.log('Checking adb for attached devices…');
const r = spawnSync(ADB, ['devices'], {encoding: 'utf8'});
if (r.error) die(`Could not run adb (${ADB}). Set ANDROID_HOME or put platform-tools on PATH.`);
const devices = r.stdout
  .split('\n').slice(1)
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('*') && l.includes('\t'))
  .map(l => {
    const [serial, state] = l.split('\t');
    return {serial, state};
  });
const ready = devices.filter(d => d.state === 'device');
if (ready.length === 0) {
  console.error('\nadb devices output:');
  console.error(r.stdout);
  die(
    'No attached device/emulator found.\n' +
    '  • If an emulator IS running, ADB lost track of it. Try:\n' +
    `      ${ADB} kill-server\n` +
    `      ${ADB} start-server\n` +
    `      ${ADB} devices\n` +
    '  • Or plug in a phone with USB debugging enabled.\n' +
    'This script will NOT launch an emulator for you — by design.'
  );
}
console.log(`Targeting: ${ready.map(d => d.serial).join(', ')}`);

// ── Step 2: start Metro in a new console window (background; user can close) ─
console.log('Starting Metro in a new window…');
if (IS_WIN) {
  // `start "Metro" cmd /k npx react-native start` opens a titled console,
  // launches Metro, keeps the window open so it survives this script exiting.
  spawn('cmd.exe', ['/c', 'start', '"Metro"', 'cmd', '/k', 'npx react-native start'], {
    detached: true, stdio: 'ignore',
  }).unref();
} else {
  // macOS/Linux: detach + ignore stdio so this script can exit independently.
  const child = spawn('npx', ['react-native', 'start'], {detached: true, stdio: 'ignore'});
  child.unref();
}

// ── Step 3: build + install via gradle (does NOT launch emulators) ──────────
console.log('Building + installing debug APK…');
const g = spawnSync(GRADLE, ['installDebug'], {cwd: ANDROID_DIR, stdio: 'inherit', shell: IS_WIN});
if (g.status !== 0) die(`Gradle install failed (exit ${g.status}).`);

// ── Step 4: launch the app on every connected device ────────────────────────
for (const d of ready) {
  console.log(`Launching app on ${d.serial}…`);
  spawnSync(ADB, ['-s', d.serial, 'shell', 'am', 'start', '-n', ACTIVITY], {stdio: 'inherit'});
}

console.log('\n✓ App installed and launched. Metro is running in a separate window.');
