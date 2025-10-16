const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('locPowerSearch', {
  version: require('./package.json').version
});
