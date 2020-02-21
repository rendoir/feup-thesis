const Frame = require('./frame');

class Storyboard {
    constructor() {
        this._initFrames();
    }

    _initFrames() {
        // Array of initial frames (depth = 0)
        // Each frame contains its child frames
        this.frames = [];

        // Mock frames
        // TODO: Change to actual request
        let frame1 = new Frame(); this.frames.push(frame1);
        let frame2 = new Frame(); this.frames.push(frame2);
        let frame3 = new Frame(); this.frames.push(frame3);
        let frame4 = new Frame(); this.frames.push(frame4);
        let frame5 = new Frame(); this.frames.push(frame5);

        let frame2_1 = new Frame(); frame2.childFrames.push(frame2_1);
        let frame2_2 = new Frame(); frame2.childFrames.push(frame2_2);
        let frame2_3 = new Frame(); frame2.childFrames.push(frame2_3);
        let frame2_4 = new Frame(); frame2.childFrames.push(frame2_4);
    }
}

module.exports = Storyboard;
