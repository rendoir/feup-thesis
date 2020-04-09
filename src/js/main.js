const Storyboard = require('./storyboard');
const Controller = require('./controller');
const Renderer = require('./renderer');
const Loader = require('./loader');
const SettingsManager = require('./settings');

Loader.LoadRealTest1(Storyboard.instance);
setTimeout(function(){ Loader.LoadFramesDemo1(Storyboard.instance); }, 3000);
