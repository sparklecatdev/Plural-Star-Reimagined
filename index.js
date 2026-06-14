import {AppRegistry, Platform} from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';

if (Platform.OS === 'android') {
  notifee.onBackgroundEvent(async () => {});
  notifee.registerForegroundService(() => new Promise(() => {}));
}

AppRegistry.registerComponent(appName, () => App);
