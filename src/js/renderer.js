const THREE = require('three');

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
        // Each entry has the frame content (storyboard), frame element and scene elements
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
        this.onVisibleFramesInfoSet();
    }

    onVisibleFramesInfoSet() {
        // When new frame info is set, clear all the content and write new
        this.shouldRender = false;

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
            
            // Retrieve the correct row from the storyboard
            let row;
            if (infoIndex == 0)
                row = this.storyboard.frames; // Initial set of frames (depth = 0)
            else row = previousRow[info.zoomedFromFrame].childFrames; // Access the element that got zoomed from the previous row

            // Retrieve the frames for the row
            // From info start to the minimum between the total number of frames of the row and the start plus the frames per page
            let frames = row.slice(info.start, Math.min(info.start + this.maxFramesPerPage, row.length));

            // Exit if there are no frames
            if (frames.length === 0) continue;

            // Init visible frames
            let visibleFramesInRow = {
                frameObjects: [],
                frameElements: [],
                scenes: []
            };

            // Create a new row element
            let rowElement = this.rowTemplate.content.cloneNode(true).firstElementChild;
            rowElement.setAttribute("data-row-id", infoIndex);
            this.contentElement.appendChild(rowElement);
            this.controller.setNavigationEvents(rowElement);

            // Create the frame elements
            let frameId = info.start;
            frames.forEach(frame => {
                let scene = new THREE.Scene();
        
                // Create a frame HTML element from the template
                let frameElement = this.frameTemplate.content.cloneNode(true).firstElementChild;
                frameElement.innerHTML = frameElement.innerHTML.replace('$', frame.id);
                this.controller.setFrameDetailEvents(frameElement);
                frameElement.setAttribute("data-frame-id", frameId);
                rowElement.getElementsByClassName('row-frames')[0].appendChild(frameElement);
        
                // Save the scene element in the scene object and append the element
                scene.userData.element = frameElement.getElementsByClassName("scene")[0];
        
                // Setup the scene camera
                let camera = new THREE.PerspectiveCamera(50, 1, 1, 10);
                camera.position.z = 2;
                scene.userData.camera = camera;
        
                // Add a random mesh and material to the scene and lights
                let geometries = [
                    new THREE.BoxBufferGeometry(1, 1, 1),
                    new THREE.SphereBufferGeometry(0.5, 12, 8),
                    new THREE.DodecahedronBufferGeometry(0.5),
                    new THREE.CylinderBufferGeometry(0.5, 0.5, 1, 12)
                ];
                let geometry = geometries[frameId % geometries.length];
                let material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color().setHSL(infoIndex / 10, 1, 0.75),
                    roughness: 0.5,
                    metalness: 0,
                    flatShading: true
                });
                scene.add(new THREE.Mesh(geometry, material));
                scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444));
                var light = new THREE.DirectionalLight(0xffffff, 0.5);
                light.position.set(1, 1, 1);
                scene.add(light);

                // Add to visible frame
                visibleFramesInRow.scenes.push(scene);
                visibleFramesInRow.frameObjects.push(frame);
                visibleFramesInRow.frameElements.push(frameElement);

                // Increment frameId
                frameId++;
            });

            // Add to visible frames
            this.visibleFrames.push(visibleFramesInRow);
            
            // Update the previous row with the current
            previousRow = row;
        }

        this.shouldRender = true;
    }

    renderLoop() {
        this.render();
        requestAnimationFrame(this.renderLoop.bind(this));
    }

    render() {
        // Update canvas size
        this.updateSize();

        // Update elements
        this.updateElements();

        // Update canvas transform with the scroll
        this.canvas.style.transform = `translate(${window.scrollX}px, ${window.scrollY}px)`;
        this.canvasFullscreen.style.transform = `translate(${window.scrollX}px, ${window.scrollY}px)`;

        // Clear values
        this.renderer.setClearColor(0xffffff);
        this.renderer.setScissorTest(false);
        this.renderer.clear();
    
        this.renderer.setClearColor(0xe0e0e0);
        this.renderer.setScissorTest(true);

        // Clear fullscreen canvas
        this.contextFullscreen.clearRect(0, 0, this.canvasFullscreen.width, this.canvasFullscreen.height);

        if (!this.shouldRender)
            return;
    
        // Render each scene and dashed lines
        for (let i = 0; i < this.visibleFrames.length; i++) {
            const visibleFramesInRow = this.visibleFrames[i];
            const rowInfo = this.visibleFramesInfo[i];

            // Render scenes
            for (let j = 0; j < visibleFramesInRow.scenes.length; j++) {
                const scene = visibleFramesInRow.scenes[j];
                this.renderScene(scene);
            }

            // Render dashed lines
            this.renderDashedLines(i, rowInfo, visibleFramesInRow);
        }
    }

    renderScene(scene) {
        // Rotate object
        scene.children[0].rotation.y = Date.now() * 0.001;
                
        // Get the position of the scene element relative to the page's viewport
        var rect = scene.userData.element.getBoundingClientRect();

        // Check if it's offscreen. If so skip it.
        if (rect.bottom < 0 || rect.top > this.renderer.domElement.clientHeight ||
            rect.right < 0 || rect.left > this.renderer.domElement.clientWidth) {
            return;
        }

        // Set the viewport
        var width = rect.right - rect.left;
        var height = rect.bottom - rect.top;
        var left = rect.left;
        var bottom = this.renderer.domElement.clientHeight - rect.bottom;

        this.renderer.setViewport(left, bottom, width, height);
        this.renderer.setScissor(left, bottom, width, height);

        let camera = scene.userData.camera;
        this.renderer.render(scene, camera);
    }

    renderDashedLines(i, rowInfo, visibleFramesInRow) {
        // Skip the first row
        if (i > 0) {
            // Check if the frame that got zoomed is visible
            let previousRowInfo = this.visibleFramesInfo[i-1];
            let previousRowFrames = this.visibleFrames[i-1];
            if(rowInfo.zoomedFromFrame >= previousRowInfo.start && 
                rowInfo.zoomedFromFrame <= previousRowFrames.frameElements.length + previousRowInfo.start - 1) {
                    // The frame is visible -> Draw the two lines from it to the next row

                    // Information of the frame that was zoomed
                    let previousFrameElement = previousRowFrames.frameElements[rowInfo.zoomedFromFrame - previousRowInfo.start];
                    let previousFrameElementRect = previousFrameElement.getBoundingClientRect();

                    // Get information of the first frame in the zoomed row
                    let firstFrameRect = visibleFramesInRow.frameElements[0].getBoundingClientRect();
                    // Draw left line
                    this.drawDashedLine(previousFrameElementRect.left, previousFrameElementRect.bottom,
                        firstFrameRect.left, firstFrameRect.top);
                    
                    // Get information of the last frame in the zoomed row
                    let lastFrameRect = visibleFramesInRow.frameElements[visibleFramesInRow.frameElements.length-1].getBoundingClientRect();
                    // Draw left line
                    this.drawDashedLine(previousFrameElementRect.right, previousFrameElementRect.bottom,
                        lastFrameRect.right, firstFrameRect.top);
                } else {
                    // The frame is not visible -> Draw from the nearest point to the next row

                    if (rowInfo.zoomedFromFrame < previousRowInfo.start) {
                        // Select the left-most frame
                        let previousFrameElement = previousRowFrames.frameElements[0];
                        let previousFrameElementRect = previousFrameElement.getBoundingClientRect();

                        // Get information of the first frame in the zoomed row
                        let firstFrameRect = visibleFramesInRow.frameElements[0].getBoundingClientRect();
                        // Draw left line
                        this.drawDashedLine(previousFrameElementRect.left, previousFrameElementRect.bottom,
                            firstFrameRect.left, firstFrameRect.top);
                        
                        // Get information of the last frame in the zoomed row
                        let lastFrameRect = visibleFramesInRow.frameElements[visibleFramesInRow.frameElements.length-1].getBoundingClientRect();
                        // Draw left line
                        this.drawDashedLine(previousFrameElementRect.left, previousFrameElementRect.bottom,
                            lastFrameRect.right, firstFrameRect.top);
                    } else {
                        // Select the right-most frame
                        let previousFrameElement = previousRowFrames.frameElements[previousRowFrames.frameElements.length-1];
                        let previousFrameElementRect = previousFrameElement.getBoundingClientRect();

                        // Get information of the first frame in the zoomed row
                        let firstFrameRect = visibleFramesInRow.frameElements[0].getBoundingClientRect();
                        // Draw left line
                        this.drawDashedLine(previousFrameElementRect.right, previousFrameElementRect.bottom,
                            firstFrameRect.left, firstFrameRect.top);
                        
                        // Get information of the last frame in the zoomed row
                        let lastFrameRect = visibleFramesInRow.frameElements[visibleFramesInRow.frameElements.length-1].getBoundingClientRect();
                        // Draw left line
                        this.drawDashedLine(previousFrameElementRect.right, previousFrameElementRect.bottom,
                            lastFrameRect.right, firstFrameRect.top);
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

    updateSize() {
        let width = this.canvas.clientWidth;
        let height = this.canvas.clientHeight;
    
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvasFullscreen.width = width;
            this.canvasFullscreen.height = height;
            this.renderer.setSize(width, height, false);
            let newMaxFramesPerPage = Math.max(Math.floor(width / 200) - 1, 1); // Each frame has 200 pixels
            if (newMaxFramesPerPage !== this.maxFramesPerPage) {
                this.maxFramesPerPage = newMaxFramesPerPage;
                this.needsUpdate = true;
            }
        }
    }

    updateElements() {
        if( this.needsUpdate ) {
            this.onVisibleFramesInfoSet();
            this.needsUpdate = false;
        }
    }
}

module.exports = Renderer;
