class Frame {
    constructor() {
        this.childFrames = [];
        this.id = Frame.count;
        Frame.count += 1;
    }
}

Frame.count = 0;

module.exports = Frame;
