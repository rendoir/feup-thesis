const THREE = require('three');

/**
 * A Frame holds the Object which suffers a transformation 
 * in the time the frame represents 
 */
class Frame {
    constructor(object, transformation) {
        this.object = object;
        this.transformation = transformation;
        this.childFrames = [];
        this.uid = Frame.count;
        Frame.count += 1;

        this.setupScene();
    }

    setupScene() {
        this.scene = new THREE.Scene();

        // The transformation class initializes the objects in the scene
        this.transformation.setupScene(this.scene, this.object);
    }
}

Frame.count = 0;

module.exports = Frame;
