const THREE = require('three');
const CurvedArrow = require('./helpers/CurvedArrow');

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
        // Setup all the states
        this._setupObjectStates(this.object.states);
    }

    setupInitialFinalStates() {
        // Setup only the first and final states
        let initialState = this.object.states[0];
        let finalState = this.object.states[this.object.states.length-1];

        if ( initialState && finalState ) {
            let states = [initialState, finalState];
            this._setupObjectStates(states);
        }
    }

    _setupObjectStates(states) {
        for(let i = 0; i < states.length; i++) {
            let state = states[i];

            // Setup group
            let group = new THREE.Group();
            group.position.z = i;

            // Setup shape, geometry, material and mesh
            let shape = new THREE.Shape( state.vertices );
            let geometry = new THREE.ShapeBufferGeometry( shape );
            geometry.computeBoundingBox();
            let mesh = new THREE.Mesh( geometry, 
                new THREE.MeshBasicMaterial( { color: this._getColor(i, states.length), side: THREE.DoubleSide, 
                    transparent: true, opacity: this._getOpacity(i, states.length) } ) );
            state.boundingBox = new THREE.Box3().copy(geometry.boundingBox);
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

    setupLinearVertexMapping() {
        // Draw dashed lines from each vertex of the initial state to the final state
        let initialState = this.object.states[0];
        let finalState = this.object.states[this.object.states.length-1];

        if ( initialState && finalState ) {
            // Assume same number of vertices and same order
            for (let i = 0; i < initialState.vertices.length; i++) {
                const initialVertex = initialState.vertices[i];
                const finalVertex = finalState.vertices[i];

                let boxSize = new THREE.Vector3();
                this.sceneBoundingBox.getSize(boxSize);
                let dashScale = Math.max(boxSize.x, boxSize.y);

                let geometryPoints = new THREE.BufferGeometry().setFromPoints( [initialVertex, finalVertex] );
                let line = new THREE.Line( geometryPoints, 
                    new THREE.LineDashedMaterial( {
                    color: 0x000000,
                    dashSize: 0.03 * dashScale,
                    gapSize: 0.03 * dashScale,
                } ) );
                line.position.z = MAPPING_DEPTH;
                line.computeLineDistances();
                this.scene.add( line );

                // Triangle
                if ( this.drawArrowsInVertexMapping ) {
                    let triangleGeometry = new THREE.Geometry();
                    triangleGeometry.vertices.push(new THREE.Vector3(0,0,0));
                    triangleGeometry.vertices.push(new THREE.Vector3(-0.5,-1,0));
                    triangleGeometry.vertices.push(new THREE.Vector3(0.5,-1,0));
                    triangleGeometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
                    let triangleMesh = new THREE.Mesh( triangleGeometry, new THREE.MeshBasicMaterial( { color: 0x000000 } ) );
                    
                    triangleMesh.scale.set(dashScale / 30, dashScale / 30, 1);
                    let direction = finalVertex.clone().sub(initialVertex);
                    triangleMesh.rotation.set(0,0, - (Math.PI / 2 - direction.angle()));
                    triangleMesh.position.set(finalVertex.x, finalVertex.y, MAPPING_DEPTH);
                    this.scene.add(triangleMesh);
                }
            }
        }
    }

    _getColor(i, nStates) {
        return OBJECT_COLOR;  
    }

    _getOpacity(i, nStates) {
        // Linear interpolation between min (0.2) and max (0.8)
        return 0.2 + (i / (nStates - 1)) * (0.8 - 0.2);
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

        let boxSize = new THREE.Vector3();
        this.sceneBoundingBox.getSize(boxSize);
        let dashScale = Math.max(boxSize.x, boxSize.y);

        let arrow = new THREE.ArrowHelper( direction, origin, length, 0x000000, 0.06 * dashScale, 0.075 * dashScale);
        this.scene.add( arrow );
    }
}

class Orientation extends Transformation {
    constructor(orientationAngle) {
        super();
        this.orientationAngle = orientationAngle;
    }

    getName() { return "Orientation" }

    getDetails() {
        return "Orientation Angle: " + this.orientationAngle + "º";
    }

    setupScene(scene, object) {
        super.setupScene(scene, object);
        this.setupInitialFinalStates();
        this.setupRoundArrow();
        this.setupArcVertexMapping();
        this.setupSceneCamera();
    }

    setupRoundArrow() {
        let center = new THREE.Vector3();
        this.sceneBoundingBox.getCenter(center);
        let topRightCorner = new THREE.Vector3(this.sceneBoundingBox.max.x, this.sceneBoundingBox.max.y, center.z);
        let radius = topRightCorner.sub(center).length();
        radius += radius * 0.1;

        let curvedArrow = new CurvedArrow(0, 0, radius, radius, 0, THREE.Math.degToRad(this.orientationAngle), false, 0, 100, 0x000000, 1, 0.1);
        curvedArrow.position.x = center.x;
        curvedArrow.position.y = center.y;
        curvedArrow.position.z = ARROW_DEPTH;

        this.sceneBoundingBox.expandByObject(curvedArrow);
        this.scene.add(curvedArrow);
    }

    setupArcVertexMapping() {
        let initialState = this.object.states[0];
        let finalState = this.object.states[this.object.states.length-1];

        if ( initialState && finalState ) {
            // Consider the center to be the mid point between the center of the two bounding boxes
            let initialStateCenter = new THREE.Vector3(); 
            initialState.boundingBox.getCenter(initialStateCenter);
            let finalStateCenter = new THREE.Vector3(); 
            finalState.boundingBox.getCenter(finalStateCenter);
            let c = new THREE.Vector2((initialStateCenter.x + finalStateCenter.x)/2, (initialStateCenter.y + finalStateCenter.y)/2);

            // Loop all vertices
            for (let i = 0; i < initialState.vertices.length; i++) {                
                let v1 = initialState.vertices[i];
                let v2 = finalState.vertices[i];
                let l1 = v1.distanceTo(c);
                let l2 = v2.distanceTo(c);
                
                // Translate vectors to origin
                let v1m = new THREE.Vector2(v1.x, v1.y).sub(c);
                let v2m = new THREE.Vector2(v2.x, v2.y).sub(c);

                // Angle between vectors
                let theta = Math.acos(v1m.dot(v2m) / (v1m.length() * v2m.length()));
                let startsAtVertex1 = l1 > l2;
                if (!startsAtVertex1)
                    theta *= -1;

                // Rotate vectors to align with axis
                let alpha = startsAtVertex1 ? v1m.angle() : v2m.angle();
                let origin = new THREE.Vector2(0,0);
                v1m.rotateAround(origin, -alpha);
                v2m.rotateAround(origin, -alpha);

                // Find radiuses
                let n = (Math.pow(v1m.x,2) - Math.pow(v2m.x,2)) / 
                    (-1 * Math.pow(v2m.x,2) * Math.pow(v1m.y,2) + Math.pow(v2m.y,2) * Math.pow(v1m.x,2));
            
                let m = (1 - Math.pow(v1m.y,2) * n) / Math.pow(v1m.x,2);

                let a = Math.sqrt(1/m);
                let b = Math.sqrt(1/n);

                // Arc
                let curve = new THREE.EllipseCurve(
                    0, 0,
                    a, b,
                    0, theta,
                    !startsAtVertex1,
                    0
                );
                
                let boxSize = new THREE.Vector3();
                this.sceneBoundingBox.getSize(boxSize);
                let dashScale = Math.max(boxSize.x, boxSize.y);

                let points = curve.getPoints( 100 );
                let geometry = new THREE.BufferGeometry().setFromPoints( points );
                geometry.computeBoundingBox();
                let material = new THREE.LineDashedMaterial( {
                        color: 0x000000,
                        dashSize: 0.04 * dashScale,
                        gapSize: 0.04 * dashScale,
                    } );
                let ellipse = new THREE.Line( geometry, material );
                ellipse.rotation.z = alpha;
                ellipse.position.x = c.x;
                ellipse.position.y = c.y;
                ellipse.position.z = MAPPING_DEPTH;
                ellipse.computeLineDistances();
                this.scene.add( ellipse );
                
            }
        }
    }
}

class Scale extends Transformation {
    constructor(scaleVector) {
        super();
        this.scaleVector = scaleVector;
    }

    getName() { return "Scale" }

    getDetails() {
        return "Scale Vector: (" + this.scaleVector.x + ", " + this.scaleVector.y + ")";
    }

    setupScene(scene, object) {
        super.setupScene(scene, object);
        this.drawArrowsInVertexMapping = true;
        this.setupOnionSkinning();
        this.setupLinearVertexMapping();
        this.setupSceneCamera();
    }

    _getColor(i, nStates) {
        let h = (120.0 / 360.0) - (i / (nStates - 1)) * (120.0 / 360.0);
        return new THREE.Color().setHSL(h, 0.8, 0.5);
    }

    _getOpacity(i, nStates) {
        return 0.6;
    }

    _setupObjectStates(states) {
        for(let i = 0; i < states.length; i++) {
            let state = states[i];

            // Setup group
            let group = new THREE.Group();

            // Setup shape, geometry, material and mesh
            let shape = new THREE.Shape( state.vertices );
            let geometry = new THREE.ShapeBufferGeometry( shape );
            geometry.computeBoundingBox();
            let mesh = new THREE.Mesh( geometry, 
                new THREE.MeshBasicMaterial( { color: this._getColor(i, states.length), side: THREE.DoubleSide, 
                    transparent: true, opacity: this._getOpacity(i, states.length) } ) );
            state.boundingBox = new THREE.Box3().copy(geometry.boundingBox);
            group.add( mesh );

            // Compare bounding box to first state
            let firstStateContainsBox = states[0].boundingBox.containsBox(state.boundingBox);

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

            group.position.z = firstStateContainsBox ? i : -i;
            group.renderOrder = firstStateContainsBox ? -i : i;
            this.scene.add( group );
        }
    }
}

class Immutability extends Transformation {
    getName() { return "Immutability" }

    getDetails() { return "The object had no substantial transformations" }
    
    setupScene(scene, object) { 
        super.setupScene(scene, object);
        this.setupInitialState();
        this.setupSceneCamera();
    }

    setupInitialState() {
        // Setup only the first state
        let initialState = this.object.states[0];

        if ( initialState ) {
            let states = [initialState];
            this._setupObjectStates(states);
        }
    }

    _getOpacity(i, nStates) {
        return 0.8;
    }
}

class Unknown extends Transformation {
    getName() { return "Unknown" }

    getDetails() { return "The object suffered an unknown transformation" }
    
    setupScene(scene, object) { 
        super.setupScene(scene, object);
        this.setupOnionSkinning();
        this.setupSceneCamera();
    }
}

module.exports = {
    Transformation : Transformation,
    Translation : Translation,
    Orientation : Orientation,
    Scale : Scale,
    Immutability : Immutability,
    Unknown : Unknown
}
