const THREE = require('three');

class Renderer {
    constructor() {
        // Init canvas and renderer
        this.canvas = document.getElementById("canvas");
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setClearColor(0xffffff, 1);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // Visible Frames is an array of arrays of frames
        this.visibleFrames = [];
    }
}

module.exports = Renderer;
