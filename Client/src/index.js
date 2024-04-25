/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import TcpClientExample from './tcp';

AppRegistry.registerComponent(appName, () => TcpClientExample);
