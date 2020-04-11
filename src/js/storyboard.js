const Controller = require('./controller');

class Storyboard {
    constructor() {
        // Array of initial frames (depth = 0)
        // Each frame contains its child frames
        this.frames = [];
    }

    setFrames(frames) {
        this.frames = frames;
        Controller.instance.onDatasetChanged();
    }

    traverseFrames(callback) {
        let queue = this.frames.slice();
        while( queue.length !== 0 ) {
            let frame = queue.shift();
            callback(frame);
            if ( frame.childFrames !== null )
                queue.push(...frame.childFrames);
        }
    }
}

module.exports.instance = new Storyboard();
