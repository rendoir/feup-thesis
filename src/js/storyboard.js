const Frame = require('./frame');

class Storyboard {
    constructor() {
        // Array of initial frames (depth = 0)
        // Each frame contains its child frames
        this.frames = [];
    }

    setFrames(frames) {
        this.frames = frames;
    }
}

module.exports = Storyboard;
