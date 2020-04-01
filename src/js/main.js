const Storyboard = require('./storyboard');
const Controller = require('./controller');
const Renderer = require('./renderer');
const Loader = require('./loader');
const { SettingsManager } = require('./settings');

let settings = new SettingsManager();
let storyboard = new Storyboard();
let controller = new Controller();
let renderer = new Renderer();

Loader.LoadFramesDemo1(storyboard);
renderer.setStoryboard(storyboard);
renderer.setController(controller);
controller.setStoryboard(storyboard);
controller.setRenderer(renderer);
settings.setRenderer(renderer);
