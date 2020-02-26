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
        let frame0_0 = new Frame(); this.frames.push(frame0_0);
        let frame0_1 = new Frame(); this.frames.push(frame0_1);
        let frame0_2 = new Frame(); this.frames.push(frame0_2);
        let frame0_3 = new Frame(); this.frames.push(frame0_3);
        let frame0_4 = new Frame(); this.frames.push(frame0_4);

        let frame1_0 = new Frame(); frame0_1.childFrames.push(frame1_0);
        let frame1_1 = new Frame(); frame0_1.childFrames.push(frame1_1);
        let frame1_2 = new Frame(); frame0_1.childFrames.push(frame1_2);
        let frame1_3 = new Frame(); frame0_1.childFrames.push(frame1_3);

        let frame2_0 = new Frame(); frame1_0.childFrames.push(frame2_0);
        let frame2_1 = new Frame(); frame1_0.childFrames.push(frame2_1);
        let frame2_2 = new Frame(); frame1_0.childFrames.push(frame2_2);

        let frame3_0 = new Frame(); frame2_0.childFrames.push(frame3_0);
    }
}

module.exports = Storyboard;
