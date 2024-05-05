/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import TcpClientExample from './__tests__/tcp';
import App from './App';

AppRegistry.registerComponent(appName, () => App);
