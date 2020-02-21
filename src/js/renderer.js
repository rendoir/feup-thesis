const THREE = require('three');

class Renderer {
    constructor() {
        // Init canvas and renderer
        this.canvas = document.getElementById("canvas");
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setClearColor(0xffffff, 1);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Visible Frame Info is an array of objects
        // The index in the array is the depth
        // Each entry has the start frame (index in the storyboard row)
        // and the index of the frame it's zooming from the previous row (-1 otherwise)
        this.visibleFramesInfo = [];

        // Init content and template
        this.frameTemplate = document.getElementById("template_frame").text;
        this.contentElement = document.getElementById("content");

        // Hold the scenes currently visible
        this.scenes = [];

        this.shouldRender = false;
        this.renderLoop();
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
        this.shouldRender = false;

        // Clear content
        this.scenes = [];
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

            // Retrieve the frames for the row
            // From info start to the minimum between the total number of frames of the row and the start plus the frames per page
            let frames = row.slice(info.start, Math.min(info.start + Renderer.maxFramesPerPage, row.length));

            // Create the frame elements
            frames.forEach(frame => {
                let scene = new THREE.Scene();
        
                // Create a frame HTML element from the template
                let frameElement = document.createElement("div");
                frameElement.classList.add("storyboard-frame");
                frameElement.innerHTML = this.frameTemplate.replace('$', frame.id);
        
                // Save the scene element in the scene object and append the element
                scene.userData.element = frameElement.getElementsByClassName("scene")[0];
                rowElement.appendChild(frameElement);
        
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
                let geometry = geometries[geometries.length * Math.random() | 0];
                let material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color().setHSL(Math.random(), 1, 0.75),
                    roughness: 0.5,
                    metalness: 0,
                    flatShading: true
                });
                scene.add(new THREE.Mesh(geometry, material));
                scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444));
                var light = new THREE.DirectionalLight(0xffffff, 0.5);
                light.position.set(1, 1, 1);
                scene.add(light);

                // Add scene
                this.scenes.push(scene);
            });
            
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

        // Update canvas transform with the scroll
        this.canvas.style.transform = `translate(${window.scrollX}px, ${window.scrollY}px)`;

        // Clear values
        this.renderer.setClearColor(0xffffff);
        this.renderer.setScissorTest(false);
        this.renderer.clear();
    
        this.renderer.setClearColor(0xe0e0e0);
        this.renderer.setScissorTest(true);

        if (!this.shouldRender)
            return;
    
        // Render each scene
        this.scenes.forEach(scene => {
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
        });
    }

    updateSize() {
        let width = this.canvas.clientWidth;
        let height = this.canvas.clientHeight;
    
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.renderer.setSize(width, height, false);
        }
    }


    /* --------------- Constants --------------- */

    // Pagination: the maximum number of frames per page
    static get maxFramesPerPage() { return 3; }

    // Name of the class HTML attribute for the storyboard rows
    static get storyboardRowClassName() { return 'storyboard-row'; }
}

module.exports = Renderer;
