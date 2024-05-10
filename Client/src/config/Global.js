import config from './config.json';

global.port = config.server.port;
global.host = config.server.use_REAL ? config.server.ip_REAL : config.server.ip_EUM;
global.maxRetries = config.connection.maxRetries;
global.retryDelay = config.connection.retryDelay;
global.userIcon = config.userIcon;

global.gUsername = '';
global.gPassword = '';
global.sessionToken = '';
global.gSaveAccount = 'false';