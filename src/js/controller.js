/**
 * Handles input from user (zoom, navigation, parameters)
 */
class Controller {
    constructor() {
        
    }

    setRenderer(renderer) {
        this.renderer = renderer;
        this.initVisibleFramesInfo();
    }

    initVisibleFramesInfo() {       
        // Initially only show a depth of 0
        // Starting at frame of index 0
        let visibleFramesInfo = [];
        visibleFramesInfo.push({
            start: 0,
            zoomedFromFrame: -1
        });
        // TODO: Remove. This is just for testing
        visibleFramesInfo.push({
            start: 2,
            zoomedFromFrame: 1,
        })

        this.renderer.setVisibleFramesInfo(visibleFramesInfo);
    }
}

module.exports = Controller;
