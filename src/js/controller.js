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

    setNavigationEvents(row) {
        let leftButton = row.getElementsByClassName("btn-nav-left")[0];
        leftButton.onclick = this.onNavigationClickLeft.bind(this);
        let rightButton = row.getElementsByClassName("btn-nav-right")[0];
        rightButton.onclick = this.onNavigationClickRight.bind(this);
    }

    onNavigationClickLeft() {
        // TODO
        console.log("CLICK LEFT");
    }

    onNavigationClickRight() {
        // TODO
        console.log("CLICK RIGHT");
    }
}

module.exports = Controller;
