const THREE = require('three');

const Storyboard = require('./storyboard');
const Controller = require('./controller');
const Renderer = require('./renderer');

let storyboard = new Storyboard();
let controller = new Controller();
let renderer = new Renderer();
renderer.setStoryboard(storyboard);
renderer.setController(controller);
controller.setRenderer(renderer);
