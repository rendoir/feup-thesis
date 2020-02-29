const THREE = require('three');
const { Object, ObjectState } = require('./object');

const ARROW_DEPTH = 1;

/**
 * Abstract class for an object transformation in a frame
 */
class Transformation {
    constructor() { }

    static getName() { throw "Abstract method getName not implemented" }

    getDetails() { throw "Abstract method getDetails not implemented" }
    
    setupScene(scene, object) { 
        this.scene = scene;
        this.object = object;
        this.sceneBoundingBox = null;
    }

    setupSceneCamera() {
        // Setup camera to fit geometry
        let boundingBoxCenter = new THREE.Vector3(); 
        let boundingBoxSize = new THREE.Vector3();
        this.sceneBoundingBox.getCenter(boundingBoxCenter);
        this.sceneBoundingBox.getSize(boundingBoxSize);

        let cameraPlaneOffset = 0.1 * Math.max(boundingBoxSize.x, boundingBoxSize.y);
        let cameraLeft = Math.min(this.sceneBoundingBox.min.x, boundingBoxCenter.x - boundingBoxSize.y / 2) - cameraPlaneOffset;
        let cameraRight = Math.max(this.sceneBoundingBox.max.x, boundingBoxCenter.x + boundingBoxSize.y / 2) + cameraPlaneOffset;
        let cameraBottom = Math.min(this.sceneBoundingBox.min.y, boundingBoxCenter.y - boundingBoxSize.x / 2) - cameraPlaneOffset;
        let cameraTop = Math.max(this.sceneBoundingBox.max.y, boundingBoxCenter.y + boundingBoxSize.x / 2) + cameraPlaneOffset;

        let camera = new THREE.OrthographicCamera(cameraLeft, cameraRight, cameraTop, cameraBottom, -1000000, 1000000);
        
        // Save objects inside scene
        this.scene.userData.camera = camera;
    }

    setupOnionSkinning() {
        // Loop object states
        for(let i = 0; i < this.object.states.length; i++) {
            let state = this.object.states[i];

            // Setup shape, geometry, material and mesh
            let shape = new THREE.Shape( state.vertices );
            let geometry = new THREE.ShapeBufferGeometry( shape );
            geometry.computeBoundingBox();
            let color = new THREE.Color().setHSL(i / this.object.states.length, 1, 0.75)
            let mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: color, side: THREE.DoubleSide, transparent: true, opacity: 1 } ) );
            this.object.states[i].boundingBox = new THREE.Box3().copy(geometry.boundingBox);
            this.scene.add( mesh );

            // Expand bounding box
            if (this.sceneBoundingBox === null)
                this.sceneBoundingBox = new THREE.Box3().copy(geometry.boundingBox);
            else this.sceneBoundingBox.expandByObject(mesh);

            // Setup lines
            let shapePoints = shape.getPoints();
            let geometryPoints = new THREE.BufferGeometry().setFromPoints( shapePoints );
            let line = new THREE.Line( geometryPoints, new THREE.LineBasicMaterial( { color: 0x000000, transparent: true, opacity: 1 } ) );
            this.scene.add( line );

            // Setup points
            let points = new THREE.Points( geometryPoints, new THREE.PointsMaterial( { color: 0x000000, size: 2, transparent: true, opacity: 1 } ) );
            this.scene.add( points );
        }
    }
}

class Translation extends Transformation {
    constructor(translationVector) {
        super();
        this.translationVector = translationVector;
    }

    static getName() { return "Translation" }

    setupScene(scene, object) {
        super.setupScene(scene, object);
        this.setupOnionSkinning();
        this.setupArrow();
        this.setupSceneCamera();
    }

    setupArrow() {
        // Draw an arrow from the centroid of the object in the first state to it on the final state
        let origin = new THREE.Vector3();
        let destination = new THREE.Vector3();
        this.object.states[0].boundingBox.getCenter(origin);
        this.object.states[this.object.states.length-1].boundingBox.getCenter(destination);
        let direction = new THREE.Vector3().copy(destination).sub(origin);
        let length = direction.length();
        direction.normalize();
        origin.z = ARROW_DEPTH;

        // let geometryPoints = new THREE.BufferGeometry().setFromPoints( [origin, destination] );
        // let points = new THREE.Points( geometryPoints, new THREE.PointsMaterial( { color: 0x000000, size: 2, transparent: true, opacity: 1 } ) );
        // this.scene.add( points );

        let arrow = new THREE.ArrowHelper( direction, origin, length, 0x000000, 0.25 * length, 0.2 * length);
        this.scene.add( arrow );
    }
}

module.exports = {
    Transformation : Transformation,
    Translation : Translation
}
