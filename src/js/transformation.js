const THREE = require('three');

const ARROW_DEPTH = 250;
const MAPPING_DEPTH = -1;
const OBJECT_COLOR = 0xff0000;

/**
 * Abstract class for an object transformation in a frame
 */
class Transformation {
    constructor() { }

    getName() { throw "Abstract method getName not implemented" }

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

        let camera = new THREE.OrthographicCamera(cameraLeft, cameraRight, cameraTop, cameraBottom, -500, 500);
        
        // Save objects inside scene
        this.scene.userData.camera = camera;
    }

    setupOnionSkinning() {
        // Loop object states
        for(let i = 0; i < this.object.states.length; i++) {
            let state = this.object.states[i];
            
            // Setup group
            let group = new THREE.Group();
            group.position.z = i;

            // Setup shape, geometry, material and mesh
            let shape = new THREE.Shape( state.vertices );
            let geometry = new THREE.ShapeBufferGeometry( shape );
            geometry.computeBoundingBox();
            let opacity = 0.2 + (i / (this.object.states.length - 1)) * (0.8 - 0.2);
            let mesh = new THREE.Mesh( geometry, 
                new THREE.MeshBasicMaterial( { color: OBJECT_COLOR, side: THREE.DoubleSide, transparent: true, opacity: opacity } ) );
            this.object.states[i].boundingBox = new THREE.Box3().copy(geometry.boundingBox);
            group.add( mesh );

            // Expand bounding box
            if (this.sceneBoundingBox === null)
                this.sceneBoundingBox = new THREE.Box3().copy(geometry.boundingBox);
            else this.sceneBoundingBox.expandByObject(mesh);

            // Setup lines
            let shapePoints = shape.getPoints();
            let geometryPoints = new THREE.BufferGeometry().setFromPoints( shapePoints );
            let line = new THREE.Line( geometryPoints, 
                new THREE.LineBasicMaterial( { color: 0x000000, transparent: true, opacity: 1 } ) );
            group.add( line );

            // Setup points
            let points = new THREE.Points( geometryPoints, 
                new THREE.PointsMaterial( { color: 0x000000, size: 2, transparent: true, opacity: 1 } ) );
            group.add( points );

            this.scene.add( group );
        }
    }
}

class Translation extends Transformation {
    constructor(translationVector) {
        super();
        this.translationVector = translationVector;
    }

    getName() { return "Translation" }

    getDetails() {
        return "Translation Vector: (" + this.translationVector.x + ", " + this.translationVector.y + ")";
    }

    setupScene(scene, object) {
        super.setupScene(scene, object);
        this.setupOnionSkinning();
        this.setupTranslationArrow();
        this.setupLinearVertexMapping();
        this.setupSceneCamera();
    }

    setupTranslationArrow() {
        // Draw an arrow from the centroid of the object in the first state to it on the final state
        let origin = new THREE.Vector3();
        let destination = new THREE.Vector3();
        this.object.states[0].boundingBox.getCenter(origin);
        this.object.states[this.object.states.length-1].boundingBox.getCenter(destination);
        let direction = new THREE.Vector3().copy(destination).sub(origin);
        let length = direction.length();
        direction.normalize();
        origin.z = ARROW_DEPTH;

        let arrow = new THREE.ArrowHelper( direction, origin, length, 0x000000, 0.25 * length, 0.2 * length);
        this.scene.add( arrow );
    }

    setupLinearVertexMapping() {
        // Draw dashed lines from each vertex of the initial state to the final state
        let initialState = this.object.states[0];
        let finalState = this.object.states[this.object.states.length-1];

        if ( initialState && finalState ) {
            // Assume same number of vertices and same order
            for (let i = 0; i < initialState.vertices.length; i++) {
                const initialVertex = initialState.vertices[i];
                const finalVertex = finalState.vertices[i];

                let geometryPoints = new THREE.BufferGeometry().setFromPoints( [initialVertex, finalVertex] );
                let line = new THREE.Line( geometryPoints, 
                    new THREE.LineDashedMaterial( {
                    color: 0x000000,
                    dashSize: 1,
                    gapSize: 1,
                } ) );
                line.position.z = MAPPING_DEPTH;
                line.computeLineDistances();
                this.scene.add( line );
            }
        }
    }
}

module.exports = {
    Transformation : Transformation,
    Translation : Translation
}
