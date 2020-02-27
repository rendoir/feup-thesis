const Storyboard = require('./storyboard');
const Controller = require('./controller');
const Renderer = require('./renderer');
const { Object, ObjectState } = require('./object');
const { Transformation, Translation } = require('./transformation');

let storyboard = new Storyboard();
let controller = new Controller();
let renderer = new Renderer();
renderer.setStoryboard(storyboard);
renderer.setController(controller);
controller.setStoryboard(storyboard);
controller.setRenderer(renderer);
