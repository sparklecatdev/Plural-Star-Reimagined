#!/usr/bin/env node
const {spawnSync} = require('child_process');
const fs = require('fs');

const BUNDLE_ID = 'com.pluralstar.app';
const LEGACY_BUNDLE_IDS = ['org.reactjs.native.example.PluralSpace'];
const DEFAULT_SIMULATOR = 'iPhone 17 Pro Max';
const DEFAULT_MODE = 'Release';

const args = process.argv.slice(2);
const simulatorName = process.env.IOS_SIMULATOR || (args[0] && !args[0].startsWith('-') ? args[0] : DEFAULT_SIMULATOR);
const passthrough = args[0] && !args[0].startsWith('-') ? args.slice(1) : args;
const hasModeArg = passthrough.includes('--mode');
const launchArgs = hasModeArg ? passthrough : ['--mode', DEFAULT_MODE, ...passthrough];

const die = (msg) => {
  console.error(`\n${msg}\n`);
  process.exit(1);
};

const run = (cmd, cmdArgs, opts = {}) => {
  const result = spawnSync(cmd, cmdArgs, {
    encoding: 'utf8',
    stdio: opts.stdio || 'pipe',
    ...opts,
  });
  if (result.error) die(`Failed to run ${cmd}: ${result.error.message}`);
  return result;
};

const tryRun = (cmd, cmdArgs, opts = {}) =>
  spawnSync(cmd, cmdArgs, {
    encoding: 'utf8',
    stdio: opts.stdio || 'pipe',
    ...opts,
  });

const requestedMode = (() => {
  const modeIndex = launchArgs.indexOf('--mode');
  return modeIndex >= 0 ? launchArgs[modeIndex + 1] || DEFAULT_MODE : DEFAULT_MODE;
})();

const findNewestBuiltApp = () => {
  const productsDir = `${requestedMode}-iphonesimulator`;
  const result = tryRun('sh', [
    '-lc',
    `find ~/Library/Developer/Xcode/DerivedData -path "*Build/Products/${productsDir}/PluralSpace.app" -print`,
  ]);
  const candidates = result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((appPath) => {
      try {
        return {appPath, mtimeMs: fs.statSync(appPath).mtimeMs};
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0]?.appPath || '';
};

const plistValue = (plistPath, key) => {
  const result = tryRun('/usr/libexec/PlistBuddy', ['-c', `Print :${key}`, plistPath]);
  return result.status === 0 ? result.stdout.trim() : '';
};

const findSimulator = (name) => {
  const result = run('xcrun', ['simctl', 'list', 'devices', 'available', '--json']);
  if (result.status !== 0) die(result.stderr || 'Unable to list simulators.');
  const parsed = JSON.parse(result.stdout);
  const devices = Object.values(parsed.devices || {}).flat();
  const matches = devices.filter((device) => device.isAvailable && device.name === name);
  if (matches.length === 0) die(`Simulator not found: ${name}`);
  return matches.find((device) => device.state === 'Booted') || matches[matches.length - 1];
};

const simulator = findSimulator(simulatorName);

console.log(`Using simulator: ${simulator.name} (${simulator.udid})`);
for (const id of [BUNDLE_ID, ...LEGACY_BUNDLE_IDS]) {
  console.log(`Uninstalling ${id}...`);
  run('xcrun', ['simctl', 'uninstall', simulator.udid, id], {stdio: 'inherit'});
}

console.log('Building, installing, and launching fresh...');
const launch = spawnSync(
  'npx',
  ['react-native', 'run-ios', '--simulator', simulator.name, ...launchArgs],
  {stdio: 'inherit'},
);

if (launch.error) die(`Failed to run react-native: ${launch.error.message}`);
if (launch.status !== 0) {
  console.log('\nReact Native CLI did not finish cleanly. Trying simulator install fallback...');
  const appPath = findNewestBuiltApp();
  if (!appPath) die(`Fresh iOS run failed with exit ${launch.status}. No built app found for fallback install.`);
  const builtBundleId = plistValue(`${appPath}/Info.plist`, 'CFBundleIdentifier') || BUNDLE_ID;
  const install = run('xcrun', ['simctl', 'install', simulator.udid, appPath], {stdio: 'inherit'});
  if (install.status !== 0) die(`Fresh iOS run failed with exit ${launch.status}. Fallback install failed.`);
  const appInfo = tryRun('xcrun', ['simctl', 'appinfo', simulator.udid, builtBundleId]);
  if (appInfo.status !== 0) die(`Installed fallback app at ${appPath}, but ${builtBundleId} is still unavailable.`);
  const appLaunch = run('xcrun', ['simctl', 'launch', simulator.udid, builtBundleId], {stdio: 'inherit'});
  if (appLaunch.status !== 0) die(`Fallback launch failed for ${BUNDLE_ID}.`);
}

console.log('\nFresh install complete.');
