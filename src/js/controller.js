const Renderer = require('./renderer');
const Storyboard = require('./storyboard');
const Loader = require('./loader');

/**
 * Handles input from user (zoom, navigation, parameters)
 */
class Controller {
    constructor() {
        this.visibleFramesInfo = [];
    }

    onDatasetChanged() {
        this.initVisibleFramesInfo();
    }

    initVisibleFramesInfo() {       
        // Initially only show a depth of 0
        // Starting at frame of index 0
        this.visibleFramesInfo = [];
        this.visibleFramesInfo.push({
            start: 0,
            zoomedFromFrame: -1
        });

        // Loading variables
        this.framesBeingLoaded = 0;
        this.clickedWhileLoading = false;

        Renderer.instance.setVisibleFramesInfo(this.visibleFramesInfo);
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
        let rowId = parseInt(row.getAttribute("data-row-id"));
        
        // Decrement and clamp to zero
        this.visibleFramesInfo[rowId].start = 
            Math.max(this.visibleFramesInfo[rowId].start - Controller.rowNavigationStep, 0);
        //console.log(`Row: ${rowId} | Start: ${this.visibleFramesInfo[rowId].start}`);
        Renderer.instance.setVisibleFramesInfo(this.visibleFramesInfo);
    }

    onNavigationClickRight() {
        // Get row from the button
        let row = event.target.closest(".storyboard-row");
        let rowId = parseInt(row.getAttribute("data-row-id"));
        
        // Increment and clamp to total number of frames
        this.visibleFramesInfo[rowId].start = Math.max(0, 
            Math.min(this.visibleFramesInfo[rowId].start + Controller.rowNavigationStep,
                this.getTotalNumberFramesInRow(rowId) - Renderer.instance.maxFramesPerPage)
        );
        //console.log(`Row: ${rowId} | Start: ${this.visibleFramesInfo[rowId].start}`);
        Renderer.instance.setVisibleFramesInfo(this.visibleFramesInfo);
    }

    setFrameDetailEvents(frameElement) {
        frameElement.onclick = this.onFrameClick.bind(this);
        frameElement.onmouseover = this.onFrameMouseOver.bind(this);
        frameElement.onmouseout = this.onFrameMouseOut.bind(this);
    }

    onFrameMouseOver(event) {
        let frame = event.target.closest(".storyboard-frame");
        let frameId = parseInt(frame.getAttribute("data-frame-id"));
        let rowContainer = frame.closest(".row-container");
        let frameTimeline = rowContainer.getElementsByClassName("frame-timeline")[0];
        let frameTimelineItem = frameTimeline.children[frameId];
        frameTimelineItem.classList.add("frame-hover");
    }

    onFrameMouseOut(event) {
        let frame = event.target.closest(".storyboard-frame");
        let frameId = parseInt(frame.getAttribute("data-frame-id"));
        let rowContainer = frame.closest(".row-container");
        let frameTimeline = rowContainer.getElementsByClassName("frame-timeline")[0];
        let frameTimelineItem = frameTimeline.children[frameId];
        frameTimelineItem.classList.remove("frame-hover");
    }

    onFrameClick(event) {
        // Get frame and row
        let frame = event.target.closest(".storyboard-frame");
        let frameId = parseInt(frame.getAttribute("data-frame-id"));
        let row = frame.closest(".storyboard-row");
        let rowId = parseInt(row.getAttribute("data-row-id"));
        //console.log(`Row: ${rowId} | Frame: ${frameId}`);

        // Make sure row is present in the visible frames
        let rowInfo = this.visibleFramesInfo[rowId];
        if( rowInfo !== undefined && rowInfo !== null ) {
            // Check if this frame is already zoomed
            let frameIsZoomed = rowId+1 < this.visibleFramesInfo.length && this.visibleFramesInfo[rowId+1].zoomedFromFrame === frameId;

            // Clear all content after (bellow) this row
            this.visibleFramesInfo = this.visibleFramesInfo.slice(0, rowId+1);

            if ( !frameIsZoomed ) {
                // Get frame object
                let frameObject = this.getFrameById(this.getRowById(rowId), frameId);

                // If the frame's child frames have not been loaded, request them
                if ( frameObject.childFrames === null ) {
                    
                    this.framesBeingLoaded++;
                    Loader.SendRequest((childFrames) => {
                            //console.log(childFrames);
                            
                            // Set frame's child frames
                            frameObject.childFrames = childFrames;
                            this.framesBeingLoaded--;

                            if ( this.framesBeingLoaded === 0 && !this.clickedWhileLoading ) {
                                // Add a new row
                                this.visibleFramesInfo.push({
                                    start: 0,
                                    zoomedFromFrame: frameId
                                });

                                Renderer.instance.setVisibleFramesInfo(this.visibleFramesInfo);
                            }
                        }, 
                        (error) => {
                            console.error(error);

                            this.framesBeingLoaded--;
                        }, rowId+1, frameObject.initialTimestamp, frameObject.finalTimestamp);

                    return;
                }
                
                this.clickedWhileLoading = this.framesBeingLoaded > 0;

                // Add a new row
                this.visibleFramesInfo.push({
                    start: 0,
                    zoomedFromFrame: frameId
                });
            }

            Renderer.instance.setVisibleFramesInfo(this.visibleFramesInfo);
        }
    }

    setFrameTimelineItemEvent(item) {
        item.onclick = this.onFrameTimelineItemClick.bind(this);
    }

    onFrameTimelineItemClick(event) {
        // Get frame and row
        let frameId = parseInt(event.target.getAttribute("data-frame-id"));
        let row = event.target.closest(".frame-timeline");
        let rowId = parseInt(row.getAttribute("data-row-id"));
        //console.log(`Row: ${rowId} | Frame: ${frameId}`);

        // Set start to the frame clicked
        
        this.visibleFramesInfo[rowId].start = Math.max(0, Math.min(frameId, this.getTotalNumberFramesInRow(rowId) - Renderer.instance.maxFramesPerPage));
        //console.log(`Row: ${rowId} | Start: ${this.visibleFramesInfo[rowId].start}`);
        Renderer.instance.setVisibleFramesInfo(this.visibleFramesInfo);
    }


    getFrameById(row, frameId) {
        return row[frameId];
    }

    getRowById(rowId) {
        // Loop Visible Frames Info
        let row = null;
        let i = 0;
        while (i <= rowId) {
            const info = this.visibleFramesInfo[i];

            if (i == 0)
                row = Storyboard.instance.frames; // Initial set of frames (depth = 0)
            else row = row[info.zoomedFromFrame].childFrames; // Access the element that got zoomed from the previous row
            i++;
        }
        return row;
    }

    getTotalNumberFramesInRow(rowId) {
        return this.getRowById(rowId).length;
    }


    /* --------------- Constants --------------- */
    
    // Number of frames incremented/decremented when navigating
    static get rowNavigationStep() { return 1; }
}

module.exports.instance = new Controller();
