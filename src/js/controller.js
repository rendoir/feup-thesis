class Controller {
    constructor() {
        
    }

    setRenderer(renderer) {
        this.renderer = renderer;
        this.initVisibleFramesInfo();
    }

    initVisibleFramesInfo() {
        console.log('initVisibleFramesInfo');
        
        // Initially only show a depth of 0
        // Starting at frame of index 0
        let visibleFramesInfo = [];
        visibleFramesInfo.push({
            start: 0,
            zoomedFromFrame: -1
        });

        this.renderer.setVisibleFramesInfo(visibleFramesInfo);
    }
}

module.exports = Controller;
