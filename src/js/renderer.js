const THREE = require('three');
const RowWrapper = require('./row');
const Utils = require('./utils');
const SettingsManager = require('./settings');

const FRAME_WIDTH = 256;

class Renderer {
    constructor() {
        // Init canvas and renderer
        this.canvas = document.getElementById("canvas");
        this.canvasFullscreen = document.getElementById("canvas-fullscreen");
        this.contextFullscreen = this.canvasFullscreen.getContext("2d");
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setClearColor(0xffffff, 1);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Visible Frame Info is an array of objects
        // The index in the array is the depth
        // Each entry has the start frame (index in the storyboard row)
        // and the index of the frame it's zooming from the previous row (-1 otherwise)
        this.visibleFramesInfo = [];

        // Visible Frames is an array of objects
        // The index in the array is the depth
        // Each entry has the frame content (storyboard), and a row wrapper
        this.visibleFrames = [];

        // Init content and template
        this.frameTemplate = document.getElementById("frame_template");
        this.rowTemplate = document.getElementById('row_template');
        this.contentElement = document.getElementById("content");

        this.maxFramesPerPage = 1;
        this.needsUpdate = false;
        this.shouldRender = false;
        this.renderLoop();
    }

    setStoryboard(storyboard) {
        this.storyboard = storyboard;
    }

    setController(controller) {
        this.controller = controller;
    }

    setVisibleFramesInfo(info) {
        this.visibleFramesInfo = info;
        this.update();
    }

    update() {
        // When new frame info is set, clear all the content and write new
        this.shouldRender = false;

        // Clear all tooltips
        let tooltips = document.getElementsByClassName("tooltip");
        for (let i = 0; i < tooltips.length; i++) {
            tooltips[i].parentElement.removeChild(tooltips[i]);
        }

        // Clear content
        this.visibleFrames = [];
        while (this.contentElement.firstChild) {
            this.contentElement.removeChild(this.contentElement.firstChild);
        }

        // Write new content
        // Loop Visible Frames Info
        let previousRow = null;
        for (let infoIndex = 0; infoIndex < this.visibleFramesInfo.length; infoIndex++) {
            const info = this.visibleFramesInfo[infoIndex];
            const nextInfo = this.visibleFramesInfo[infoIndex+1];
            
            // Retrieve the correct row from the storyboard
            let row;
            if (infoIndex == 0)
                row = this.storyboard.frames; // Initial set of frames (depth = 0)
            else row = previousRow[info.zoomedFromFrame].childFrames; // Access the element that got zoomed from the previous row

            // Exit if there are no frames
            if (row.length === 0) continue;

            // Create a new row element
            let rowWrapper = this.initRow(infoIndex);

            // Init visible frames
            let visibleFramesInRow = {
                frameObjects: [],
                rowWrapper: rowWrapper
            };

            // Create the frame elements and frame timeline
            let rowDuration = row[row.length-1].finalTimestamp - row[0].initialTimestamp;
            let end = Math.min(info.start + this.maxFramesPerPage, row.length);
            for(let frameIndex = 0; frameIndex < row.length; frameIndex++) {        
                let frame = row[frameIndex];

                // Create frame timeline item
                let frameTimelineItem = this.initFrameTimelineItem(frame, rowWrapper, frameIndex, rowDuration);

                // Check if frame is visible
                if (frameIndex >= info.start && frameIndex < end) {
                    // Create new frame element
                    this.initFrame(frame, frameIndex, rowWrapper);

                    // Add to visible frame
                    frameTimelineItem.classList.add("frame-visible");
                    visibleFramesInRow.frameObjects.push(frame);
                }

                // Check if frame is zoomed
                if (nextInfo !== undefined && frameIndex === nextInfo.zoomedFromFrame) {
                    // Set zoom highlight
                    frameTimelineItem.classList.add("frame-zoom");
                }
            }

            // Init timeline
            this.initTimeline(visibleFramesInRow.rowWrapper, row);

            // Add to visible frames
            this.visibleFrames.push(visibleFramesInRow);
            
            // Update the previous row with the current
            previousRow = row;
        }

        this.shouldRender = true;
    }

    initRow(infoIndex) {
        let rowWrapper = new RowWrapper();
        rowWrapper.rowContainer = this.rowTemplate.content.cloneNode(true).firstElementChild;
        rowWrapper.rowElement = rowWrapper.rowContainer.getElementsByClassName("storyboard-row")[0];
        rowWrapper.rowFrameTimeline = rowWrapper.rowContainer.getElementsByClassName("frame-timeline")[0];
        rowWrapper.rowTimeline = rowWrapper.rowContainer.getElementsByClassName("timeline")[0];
        rowWrapper.rowFramesElement = rowWrapper.rowElement.getElementsByClassName('row-frames')[0];

        rowWrapper.rowElement.setAttribute("data-row-id", infoIndex);
        rowWrapper.rowFrameTimeline.setAttribute("data-row-id", infoIndex);
        this.contentElement.appendChild(rowWrapper.rowContainer);
        this.controller.setNavigationEvents(rowWrapper.rowElement);
        
        return rowWrapper;
    }

    initFrame(frame, frameIndex, rowWrapper) {
        // Create a frame HTML element from the template
        frame.frameElement = this.frameTemplate.content.cloneNode(true).firstElementChild;
        frame.overlayElement = frame.frameElement.getElementsByClassName("overlay")[0];
        frame.descriptionElement = frame.frameElement.getElementsByClassName("description")[0];
        frame.sceneElement = frame.frameElement.getElementsByClassName("scene")[0];
        
        frame.overlayElement.innerHTML = frame.getOverlayDetails();
        frame.descriptionElement.innerHTML = frame.transformation.getName();
        frame.descriptionElement.title = frame.transformation.getDetails();
        $(frame.descriptionElement).tooltip();

        this.controller.setFrameDetailEvents(frame.frameElement);
        frame.frameElement.setAttribute("data-frame-id", frameIndex);
        rowWrapper.rowFramesElement.appendChild(frame.frameElement);

        if ( !SettingsManager.instance.getSettingValue("s-overlay") )
            frame.overlayElement.style.display = 'none';

        if ( !SettingsManager.instance.getSettingValue("s-description") )
            frame.descriptionElement.style.display = 'none';
    }

    initFrameTimelineItem(frame, rowWrapper, frameId, rowDuration) {
        // Create the div and set its width in relation to its duration
        let frameDuration = frame.finalTimestamp - frame.initialTimestamp;
        let frameTimelineItem = document.createElement("div");
        frameTimelineItem.setAttribute("type", "button");
        frameTimelineItem.classList.add("frame-timeline-item");
        frameTimelineItem.setAttribute("data-frame-id", frameId);
        frameTimelineItem.style.width = (frameDuration / rowDuration) * 100 + '%';
        rowWrapper.rowFrameTimeline.appendChild(frameTimelineItem);
        this.controller.setFrameTimelineItemEvent(frameTimelineItem);

        return frameTimelineItem;
    }

    initTimeline(rowWrapper, row) {
        let rowTimeline = rowWrapper.rowTimeline;
        let fullWidth = rowWrapper.rowFramesElement.getBoundingClientRect().width;
        let minWidth = 30; // Minimum width to display a number

        let firstFrame = row[0];
        let lastFrame = row[row.length-1];
        let firstDate = new Date(firstFrame.initialTimestamp);
        let lastDate = new Date(lastFrame.finalTimestamp);

        let unit = Utils.getUnit(firstFrame.initialTimestamp, lastFrame.finalTimestamp);
        let nrDivisions = Utils.getNumberUnits(unit, firstFrame.initialTimestamp, lastFrame.finalTimestamp);

        let secondTime = Utils.getNextTimeByUnit(unit, Utils.getFloorTimeByUnit(unit, firstFrame.initialTimestamp));
        let firstWidth = (secondTime.timestamp - firstFrame.initialTimestamp) * 100 / (lastFrame.finalTimestamp - firstFrame.initialTimestamp);
        let penultimateTime = Utils.getCurrentTimeByUnit(unit, Utils.getFloorTimeByUnit(unit, lastFrame.finalTimestamp));
        let lastWidth = (lastFrame.finalTimestamp - penultimateTime.timestamp) * 100 / (lastFrame.finalTimestamp - firstFrame.initialTimestamp);
        
        let width = (100.0-firstWidth-lastWidth) / (nrDivisions-1);
        let widthInPixels = fullWidth * width / 100;
        width += "%";

        // First div - Initial time
        this.initTimelineItem(rowTimeline, firstWidth + "%", Utils.getDateString(firstDate));

        // Second div - Next time closest to unit
        this.initTimelineItem(rowTimeline, width, secondTime.value);

        let widthAccumulator = widthInPixels;
        let lastTime = secondTime;
        for(let i = 0; i < nrDivisions - 2; i++) {
            lastTime = Utils.getNextTimeByUnit(unit, lastTime.timestamp);
            let shouldHide = true;
            if (widthAccumulator >= minWidth) {
                shouldHide = false;
                widthAccumulator = 0;
            }
            this.initTimelineItem(rowTimeline, width, lastTime.value, shouldHide);
            widthAccumulator += widthInPixels;
        }

        // Penultimate div - Previous time closest to unit
        this.initTimelineItem(rowTimeline, lastWidth + "%", penultimateTime.value, widthAccumulator < minWidth);

        // Last div - Final time
        this.initTimelineItem(rowTimeline, 0, Utils.getDateString(lastDate));
    }

    initTimelineItem(rowTimeline, width, text, shouldHide) {
        let timelineItem = document.createElement("div");
        timelineItem.classList.add("timeline-item");
        timelineItem.style.width = width;
        rowTimeline.appendChild(timelineItem);
        
        let itemLabel = document.createElement("span");
        itemLabel.innerHTML = text;
        timelineItem.appendChild(itemLabel);

        if (shouldHide)
            itemLabel.style.display = 'none';
    }

    rebuildScenes() {
        this.storyboard.traverseFrames((frame) => {
            frame.setupScene();
        });
    }

    renderLoop() {
        this.render();
        requestAnimationFrame(this.renderLoop.bind(this));
    }

    render() {
        // Update canvas size
        this.updateSize();

        // Update if needed
        this.checkUpdate();

        // Update canvas transform with the scroll
        this.canvas.style.transform = `translate(${window.scrollX}px, ${window.scrollY}px)`;
        this.canvasFullscreen.style.transform = `translate(${window.scrollX}px, ${window.scrollY}px)`;

        // Clear value fullscreen
        this.renderer.setClearColor(0xfafafa);
        this.renderer.setScissorTest(false);
        this.renderer.clear();
    
        // Clear value for each scene
        this.renderer.setClearColor(0xffffff);
        this.renderer.setScissorTest(true);

        // Clear fullscreen canvas
        this.contextFullscreen.clearRect(0, 0, this.canvasFullscreen.width, this.canvasFullscreen.height);

        if (!this.shouldRender)
            return;

        let hierarchySettings = SettingsManager.instance.getSettingValue("s-hierarchy");
    
        // Render each scene and dashed lines
        for (let i = 0; i < this.visibleFrames.length; i++) {
            const visibleFramesInRow = this.visibleFrames[i];
            const rowInfo = this.visibleFramesInfo[i];

            // Adjust frame timeline
            let rowFramesRect = visibleFramesInRow.rowWrapper.rowFramesElement.getBoundingClientRect();
            visibleFramesInRow.rowWrapper.rowFrameTimeline.style.width = rowFramesRect.width + "px";
            visibleFramesInRow.rowWrapper.rowFrameTimeline.style.marginLeft = rowFramesRect.x + "px";
            visibleFramesInRow.rowWrapper.rowFrameTimeline.style.transform = `translateX(${window.scrollX}px)`;

            // Adjust timeline
            visibleFramesInRow.rowWrapper.rowTimeline.style.width = rowFramesRect.width + "px";
            visibleFramesInRow.rowWrapper.rowTimeline.style.marginLeft = rowFramesRect.x + "px";
            visibleFramesInRow.rowWrapper.rowTimeline.style.transform = `translateX(${window.scrollX}px)`;

            // Render scenes
            for (let j = 0; j < visibleFramesInRow.frameObjects.length; j++) {
                const frame = visibleFramesInRow.frameObjects[j];
                this.renderScene(frame);
            }

            // Render dashed lines
            this.renderHierarchy(i, rowInfo, visibleFramesInRow, hierarchySettings);
        }
    }

    renderScene(frame) {
        // Get the position of the scene element relative to the page's viewport
        let rect = frame.sceneElement.getBoundingClientRect();

        // Check if it's offscreen. If so skip it.
        if (rect.bottom < 0 || rect.top > this.renderer.domElement.clientHeight ||
            rect.right < 0 || rect.left > this.renderer.domElement.clientWidth) {
            return;
        }

        // Set the viewport
        let width = rect.right - rect.left;
        let height = rect.bottom - rect.top;
        let left = rect.left;
        let bottom = this.renderer.domElement.clientHeight - rect.bottom;

        this.renderer.setViewport(left, bottom, width, height);
        this.renderer.setScissor(left, bottom, width, height);

        let camera = frame.scene.userData.camera;
        this.renderer.render(frame.scene, camera);
    }

    renderHierarchy(i, rowInfo, visibleFramesInRow, hierarchySettings) {
        // Skip the first row
        if (i > 0) {
            // Get rectangle of the frame timeline in the zoomed row
            let frameTimelineRect = visibleFramesInRow.rowWrapper.rowFrameTimeline.getBoundingClientRect();

            // Check if the frame that got zoomed is visible
            let previousRowInfo = this.visibleFramesInfo[i-1];
            let previousRowFrames = this.visibleFrames[i-1];
            if(rowInfo.zoomedFromFrame >= previousRowInfo.start && 
                rowInfo.zoomedFromFrame <= previousRowFrames.frameObjects.length + previousRowInfo.start - 1) {
                    // The frame is visible -> Draw the two lines from it to the next row

                    // Information of the frame that was zoomed
                    let previousFrameElement = previousRowFrames.frameObjects[rowInfo.zoomedFromFrame - previousRowInfo.start].frameElement;
                    let previousFrameElementRect = previousFrameElement.getBoundingClientRect();

                    if ( hierarchySettings === "fill" ) {
                        this.drawPolygon(previousFrameElementRect.left, previousFrameElementRect.bottom, previousFrameElementRect.right, previousFrameElementRect.bottom, 
                            frameTimelineRect.left, frameTimelineRect.top, frameTimelineRect.right, frameTimelineRect.top);
                    } else if ( hierarchySettings === "line" ) {
                        // Draw left line
                        this.drawDashedLine(previousFrameElementRect.left, previousFrameElementRect.bottom,
                            frameTimelineRect.left, frameTimelineRect.top);
                        // Draw left line
                        this.drawDashedLine(previousFrameElementRect.right, previousFrameElementRect.bottom,
                            frameTimelineRect.right, frameTimelineRect.top);
                    }

                } else {
                    // The frame is not visible -> Draw from the nearest point to the next row

                    if (rowInfo.zoomedFromFrame < previousRowInfo.start) {
                        // Select the left-most frame
                        let previousFrameElement = previousRowFrames.frameObjects[0].frameElement;
                        let previousFrameElementRect = previousFrameElement.getBoundingClientRect();

                        if ( hierarchySettings === "fill" ) {
                            this.drawPolygon(previousFrameElementRect.left, previousFrameElementRect.bottom, previousFrameElementRect.left, previousFrameElementRect.bottom, 
                                frameTimelineRect.left, frameTimelineRect.top, frameTimelineRect.right, frameTimelineRect.top);
                        } else if ( hierarchySettings === "line" ) {
                            // Draw left line
                            this.drawDashedLine(previousFrameElementRect.left, previousFrameElementRect.bottom,
                                frameTimelineRect.left, frameTimelineRect.top);
                            // Draw left line
                            this.drawDashedLine(previousFrameElementRect.left, previousFrameElementRect.bottom,
                                frameTimelineRect.right, frameTimelineRect.top);
                        }

                    } else {
                        // Select the right-most frame
                        let previousFrameElement = previousRowFrames.frameObjects[previousRowFrames.frameObjects.length-1].frameElement;
                        let previousFrameElementRect = previousFrameElement.getBoundingClientRect();

                        if ( hierarchySettings === "fill" ) {
                            this.drawPolygon(previousFrameElementRect.right, previousFrameElementRect.bottom, previousFrameElementRect.right, previousFrameElementRect.bottom, 
                                frameTimelineRect.left, frameTimelineRect.top, frameTimelineRect.right, frameTimelineRect.top);
                        } else if ( hierarchySettings === "line" ) {
                            // Draw left line
                            this.drawDashedLine(previousFrameElementRect.right, previousFrameElementRect.bottom,
                                frameTimelineRect.left, frameTimelineRect.top);
                            // Draw left line
                            this.drawDashedLine(previousFrameElementRect.right, previousFrameElementRect.bottom,
                                frameTimelineRect.right, frameTimelineRect.top);
                        }
                    }
                }
        }
    }

    drawDashedLine(fromX, fromY, toX, toY) {
        this.contextFullscreen.beginPath();
        this.contextFullscreen.setLineDash([5, 15]);
        this.contextFullscreen.moveTo(fromX, fromY);
        this.contextFullscreen.lineTo(toX, toY);
        this.contextFullscreen.stroke();
    }

    drawPolygon(upperLeftX, upperLeftY, upperRightX, upperRightY, 
        bottomLeftX, bottomLeftY, bottomRightX, bottomRightY) {
        this.contextFullscreen.fillStyle = '#00000040';
        this.contextFullscreen.beginPath();
        this.contextFullscreen.moveTo(upperLeftX, upperLeftY);
        this.contextFullscreen.lineTo(bottomLeftX, bottomLeftY);
        this.contextFullscreen.lineTo(bottomRightX, bottomRightY);
        this.contextFullscreen.lineTo(upperRightX, upperRightY);
        this.contextFullscreen.closePath();
        this.contextFullscreen.fill();
    }

    updateSize() {
        let width = this.canvas.clientWidth;
        let height = this.canvas.clientHeight;
    
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvasFullscreen.width = width;
            this.canvasFullscreen.height = height;
            this.renderer.setSize(width, height, false);
            let newMaxFramesPerPage = Math.max(Math.floor(width / FRAME_WIDTH) - 1, 1);
            if (newMaxFramesPerPage !== this.maxFramesPerPage) {
                this.maxFramesPerPage = newMaxFramesPerPage;
                this.needsUpdate = true;
            }
        }
    }

    checkUpdate() {
        if( this.needsUpdate ) {
            this.update();
            this.needsUpdate = false;
        }
    }
}

module.exports = Renderer;
