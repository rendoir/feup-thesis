/**
 * Handles input from user (zoom, navigation, parameters)
 */
class Controller {
    constructor() {
        this.visibleFramesInfo = [];
    }

    setRenderer(renderer) {
        this.renderer = renderer;
        this.initVisibleFramesInfo();
    }

    setStoryboard(storyboard) {
        this.storyboard = storyboard;
    }

    initVisibleFramesInfo() {       
        // Initially only show a depth of 0
        // Starting at frame of index 0
        this.visibleFramesInfo = [];
        this.visibleFramesInfo.push({
            start: 0,
            zoomedFromFrame: -1
        });

        this.renderer.setVisibleFramesInfo(this.visibleFramesInfo);
    }

    setNavigationEvents(row) {
        let leftButton = row.getElementsByClassName("btn-nav-left")[0];
        leftButton.onclick = this.onNavigationClickLeft.bind(this);
        let rightButton = row.getElementsByClassName("btn-nav-right")[0];
        rightButton.onclick = this.onNavigationClickRight.bind(this);
    }

    onNavigationClickLeft(event) {
        // Get row from the button
        let row = event.srcElement.parentElement;
        let rowId = row.getAttribute("data-row-id");
        
        // Decrement and clamp to zero
        this.visibleFramesInfo[rowId].start = 
            Math.max(this.visibleFramesInfo[rowId].start - Controller.rowNavigationStep, 0);
        //console.log(`Row: ${rowId} | Start: ${this.visibleFramesInfo[rowId].start}`);
        this.renderer.setVisibleFramesInfo(this.visibleFramesInfo); // TODO: Optimization: Develop an update function in the renderer
    }

    onNavigationClickRight() {
        // Get row from the button
        let row = event.target.closest(".storyboard-row");
        let rowId = row.getAttribute("data-row-id");
        
        // Increment and clamp to total number of frames
        this.visibleFramesInfo[rowId].start = 
            Math.min(this.visibleFramesInfo[rowId].start + Controller.rowNavigationStep,
            this.getTotalNumberFramesInRow(rowId) - 1);
        //console.log(`Row: ${rowId} | Start: ${this.visibleFramesInfo[rowId].start}`);
        this.renderer.setVisibleFramesInfo(this.visibleFramesInfo); // TODO: Optimization: Develop an update function in the renderer
    }

    setFrameDetailEvents(frameElement) {
        frameElement.onclick = this.onFrameClick.bind(this);
    }

    onFrameClick(event) {
        // Get frame and row
        let frame = event.target.closest(".storyboard-frame");
        let frameId = frame.getAttribute("data-frame-id");
        let row = frame.closest(".storyboard-row");
        let rowId = row.getAttribute("data-row-id");
        //console.log(`Row: ${rowId} | Frame: ${frameId}`);

        // Make sure row is present in the visible frames
        let rowInfo = this.visibleFramesInfo[rowId];
        if( rowInfo !== undefined && rowInfo !== null ) {
            // Clear all content after (bellow) this row
            this.visibleFramesInfo = this.visibleFramesInfo.slice(0, parseInt(rowId)+1);

            // Add a new row
            this.visibleFramesInfo.push({
                start: 0,
                zoomedFromFrame: frameId
            });
            this.renderer.setVisibleFramesInfo(this.visibleFramesInfo); // TODO: Optimization: Develop an update function in the renderer
        }
    }

    setTimelineItemEvent(item) {
        item.onclick = this.onTimelineItemClick.bind(this);
    }

    onTimelineItemClick(event) {
        // Get frame and row
        let frameId = event.target.getAttribute("data-frame-id");
        let row = event.target.closest(".timeline");
        let rowId = row.getAttribute("data-row-id");
        //console.log(`Row: ${rowId} | Frame: ${frameId}`);

        // Set start to the frame clicked
        this.visibleFramesInfo[rowId].start = parseInt(frameId);
        //console.log(`Row: ${rowId} | Start: ${this.visibleFramesInfo[rowId].start}`);
        this.renderer.setVisibleFramesInfo(this.visibleFramesInfo); // TODO: Optimization: Develop an update function in the renderer
    }

    getTotalNumberFramesInRow(rowId) {
        // Loop Visible Frames Info
        let row = null;
        let i = 0;
        while (i <= rowId) {
            const info = this.visibleFramesInfo[i];

            if (i == 0)
                row = this.storyboard.frames; // Initial set of frames (depth = 0)
            else row = row[info.zoomedFromFrame].childFrames; // Access the element that got zoomed from the previous row
            i++;
        }
        return row.length;
    }


    /* --------------- Constants --------------- */
    
    // Number of frames incremented/decremented when navigating
    static get rowNavigationStep() { return 1; }
}

module.exports = Controller;
