const THREE = require('three');

class Renderer {
    constructor() {
        // Init canvas and renderer
        this.canvas = document.getElementById("canvas");
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setClearColor(0xffffff, 1);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Visible Frames is an array of arrays of frames (TODO: Remove if not needed)
        // this.visibleFrames = [];

        // Visible Frame Info is an array of objects
        // The index in the array is the depth
        // Each entry has the start frame (index in the storyboard row)
        // and the index of the frame it's zooming from the previous row (-1 otherwise)
        this.visibleFramesInfo = [];

        // Init content and template
        this.frameTemplate = document.getElementById("template_frame").text;
        this.contentElement = document.getElementById("content");
    }

    setStoryboard(storyboard) {
        this.storyboard = storyboard;
    }

    setVisibleFramesInfo(info) {
        this.visibleFramesInfo = info;
        this.onVisibleFramesInfoSet();
    }

    onVisibleFramesInfoSet() {
        // When new frame info is set, clear all the content and write new
        console.log('onVisibleFramesUpdate');

        // Clear content
        let rows = document.getElementsByClassName(Renderer.storyboardRowClassName);
        for(let i = 0; i < rows.length; i++){
            rows[i].parentNode.removeChild(rows[i]);
        }

        // Write new content
        // Loop Visible Frames Info
        let previousRow = null;
        for (let infoIndex = 0; infoIndex < this.visibleFramesInfo.length; infoIndex++) {
            const info = this.visibleFramesInfo[infoIndex];
            
            // Create a new row
            let rowElement = document.createElement("div");
            rowElement.classList.add('storyboard-row');
            this.contentElement.appendChild(rowElement);

            // Retrieve the correct row
            let row;
            if (infoIndex == 0)
                row = this.storyboard.frames; // Initial set of frames (depth = 0)
            else row = previousRow[info.zoomedFromFrame].childFrames; // Access the element that got zoomed from the previous row
            console.log(row);

            // Retrieve the frames for the row
            // From info start to the minimum between the total number of frames of the row and the start plus the frames per page
            let frames = row.slice(info.start, Math.min(info.start + Renderer.maxFramesPerPage, row.length));
            console.log(frames);

            // TODO: Create the HTML Elements
            
            previousRow = row;
        }
    }


    /* --------------- Constants --------------- */

    // Pagination: the maximum number of frames per page
    static get maxFramesPerPage() { return 3; }

    // Name of the class HTML attribute for the storyboard rows
    static get storyboardRowClassName() { return 'storyboard-row'; }
}

module.exports = Renderer;
