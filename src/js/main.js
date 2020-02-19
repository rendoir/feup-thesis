var THREE = require('three');

var canvas, renderer;
const FRAMES_PER_ROW = 5;
const LEVELS_OF_DETAIL = 2;

// Storyboard is an array of rows (levels-of-detail)
// Each row is an array of frames (which have a scene)
var storyboard = [];

init();
animate();

function init() {

    canvas = document.getElementById("canvas");

    var geometries = [
        new THREE.BoxBufferGeometry(1, 1, 1),
        new THREE.SphereBufferGeometry(0.5, 12, 8),
        new THREE.DodecahedronBufferGeometry(0.5),
        new THREE.CylinderBufferGeometry(0.5, 0.5, 1, 12)
    ];

    var template_frame = document.getElementById("template_frame").text;
    var content = document.getElementById("content");

    for (var i = 0; i < LEVELS_OF_DETAIL; i++) {
        // make a row item
        var row_element = document.createElement("div");
        row_element.classList.add('storyboard-row', 'd-flex', 'justify-content-center');
        content.appendChild(row_element);
        storyboard[i] = [];

        for (var j = 0; j < FRAMES_PER_ROW; j++) {
            var scene = new THREE.Scene();
    
            // make a list item
            var element = document.createElement("div");
            element.className = "list-item";
            element.innerHTML = template_frame.replace('$', j + 1);
    
            // Look up the element that represents the area
            // we want to render the scene
            scene.userData.element = element.querySelector(".scene");
            row_element.appendChild(element);
    
            var camera = new THREE.PerspectiveCamera(50, 1, 1, 10);
            camera.position.z = 2;
            scene.userData.camera = camera;
    
            // add one random mesh to each scene
            var geometry = geometries[geometries.length * Math.random() | 0];
    
            var material = new THREE.MeshStandardMaterial({
    
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
    
            storyboard[i].push(scene);
        }
    }
    


    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(window.devicePixelRatio);

}

function updateSize() {

    var width = canvas.clientWidth;
    var height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {

        renderer.setSize(width, height, false);

    }

}

function animate() {

    render();
    requestAnimationFrame(animate);

}

function render() {

    updateSize();

    canvas.style.transform = `translateY(${window.scrollY}px)`;

    renderer.setClearColor(0xffffff);
    renderer.setScissorTest(false);
    renderer.clear();

    renderer.setClearColor(0xe0e0e0);
    renderer.setScissorTest(true);

    for(var i = 0; i < storyboard.length; i++) {
        storyboard[i].forEach(function (scene) {

            // so something moves
            scene.children[0].rotation.y = Date.now() * 0.001;
    
            // get the element that is a place holder for where we want to
            // draw the scene
            var element = scene.userData.element;
    
            // get its position relative to the page's viewport
            var rect = element.getBoundingClientRect();
    
            // check if it's offscreen. If so skip it
            if (rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
                rect.right < 0 || rect.left > renderer.domElement.clientWidth) {
    
                return; // it's off screen
    
            }
    
            // set the viewport
            var width = rect.right - rect.left;
            var height = rect.bottom - rect.top;
            var left = rect.left;
            var bottom = renderer.domElement.clientHeight - rect.bottom;
    
            renderer.setViewport(left, bottom, width, height);
            renderer.setScissor(left, bottom, width, height);
    
            var camera = scene.userData.camera;
    
            //camera.aspect = width / height; // not changing in this example
            //camera.updateProjectionMatrix();
    
            //scene.userData.controls.update();
    
            renderer.render(scene, camera);
    
        });
    }
}