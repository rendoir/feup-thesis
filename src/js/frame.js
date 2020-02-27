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
    }
}

Frame.count = 0;

module.exports = Frame;
