const THREE = require('three');

const Storyboard = require('./storyboard');
const Controller = require('./controller');
const Renderer = require('./renderer');

let s = new Storyboard();
let c = new Controller();
let r = new Renderer();
r.setStoryboard(s);
c.setRenderer(r);
