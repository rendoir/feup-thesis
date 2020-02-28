class Loader {
    static LoadFramesDemo1(storyboard) {
        const frames = require('./demos/demo1');
        storyboard.setFrames(frames);
    }
}

module.exports = Loader;
