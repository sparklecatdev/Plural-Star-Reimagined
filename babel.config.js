module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // No reanimated/worklets plugin needed — the codebase no longer uses
  // reanimated. The dependency was only present to feed @gorhom/bottom-sheet,
  // which has been replaced by @lodev09/react-native-true-sheet (a native
  // sheet that animates via the OS, not via JS worklets).
};
