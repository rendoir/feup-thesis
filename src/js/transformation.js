const THREE = require('three');
const CurvedArrow = require('./helpers/CurvedArrow');
const Arc = require('./helpers/Arc');
const Grid = require('./helpers/Grid');
const SettingsManager = require('./settings');
const { simplify } = require('./utils');

const ARROW_DEPTH = 250;
const MAPPING_DEPTH = -1;
const GRID_DEPTH = -250;

const CAMERA_PADDING = 0.25;

/**
 * Abstract class for an object transformation in a frame
 */
class Transformation {
    constructor() { }

    getName() { throw "Abstract method getName not implemented" }

    getDetails() { throw "Abstract method getDetails not implemented" }

    getOverlayDetails() { throw "Abstract method getOverlayDetails not implemented" }
    
    setupScene(scene, object) { 
        this.scene = scene;
        this.object = object;
        this.sceneBoundingBox = null;
        
        // Init settings
        this.colorHue = SettingsManager.instance.getSettingValue("s-color") / 360.0;
        this.defaultColor = new THREE.Color().setHSL(this.colorHue, 1, 0.5); 
        this.shouldUseVertexMapping = SettingsManager.instance.getSettingValue("s-vertex-mapping");
        this.shouldUseArrows = SettingsManager.instance.getSettingValue("s-arrow");
        this.shouldDisplayGrid = SettingsManager.instance.getSettingValue("s-grid");
        this.shouldDisplayOverlay = SettingsManager.instance.getSettingValue("s-overlay");
        this.shouldSimplifyVertices = SettingsManager.instance.getSettingValue("s-simplification");
        this.maximumNumberStates = SettingsManager.instance.getSettingValue("s-intermediate-states");
    }

    setupSceneCamera() {
        // Setup camera to fit geometry
        let boundingBoxCenter = new THREE.Vector3(); 
        let boundingBoxSize = new THREE.Vector3();
        this.sceneBoundingBox.getCenter(boundingBoxCenter);
        this.sceneBoundingBox.getSize(boundingBoxSize);

        let cameraPlaneOffset = CAMERA_PADDING * Math.max(boundingBoxSize.x, boundingBoxSize.y);
        let cameraLeft = Math.min(this.sceneBoundingBox.min.x, boundingBoxCenter.x - boundingBoxSize.y / 2) - cameraPlaneOffset;
        let cameraRight = Math.max(this.sceneBoundingBox.max.x, boundingBoxCenter.x + boundingBoxSize.y / 2) + cameraPlaneOffset;
        let cameraBottom = Math.min(this.sceneBoundingBox.min.y, boundingBoxCenter.y - boundingBoxSize.x / 2) - cameraPlaneOffset;
        let cameraTop = Math.max(this.sceneBoundingBox.max.y, boundingBoxCenter.y + boundingBoxSize.x / 2) + cameraPlaneOffset;

        let camera = new THREE.OrthographicCamera(cameraLeft, cameraRight, cameraTop, cameraBottom, -500, 500);
        if ( this.shouldDisplayOverlay )
            camera.position.y += cameraPlaneOffset / 2; // Compensate for the overlay
        
        // Save objects inside scene
        this.scene.userData.camera = camera;
    }

    setupGrid() {
        if ( !this.shouldDisplayGrid ) return;

        let center = new THREE.Vector3(); 
        this.sceneBoundingBox.getCenter(center);
        
        // Grid size proportional to scene bounding box
        // Keep divisions constant
        let boxSize = this.getMaxSceneBoxSize();
        let gridSize = boxSize + boxSize*CAMERA_PADDING*2;
        let gridCenter = new THREE.Vector3(center.x, this.shouldDisplayOverlay ? center.y - boxSize*CAMERA_PADDING/2 : center.y, GRID_DEPTH)
        let grid = new Grid(gridSize, gridCenter);

        this.scene.add(grid);
    }

    setupOnionSkinning() {
        if ( this.maximumNumberStates == 0 ) {

            // Setup only the first and final states
            this.setupInitialFinalStates();

        } else if ( this.maximumNumberStates < 0 || this.maximumNumberStates+2 >= this.object.states.length) {

            // Setup all the states
            this._setupObjectStates(this.object.states);

        } else {

            // Get largest factor of length-1 smaller or equal to x-1
            let x = this.maximumNumberStates + 2;
            while((this.object.states.length-1) % (x-1) != 0)
                x -= 1;

            // Get all x evenly spaced states
            let step = (this.object.states.length-1) / (x-1);
            let states = [];
            for (let i = 0; i < x; i++)
                states.push(this.object.states[i*step]);

            // Setup at most maximumNumberStates intermediate states
            this._setupObjectStates(states);

        }
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

            if ( this.isochronMap ) {
                // Compare bounding box to first state
                let firstStateContainsBox = states[0].boundingBox.containsBox(state.boundingBox);
                group.position.z = firstStateContainsBox ? i : -i;
                group.renderOrder = firstStateContainsBox ? -i : i;
            }

            this.scene.add( group );
        }
    }

    setupLinearVertexMapping() {
        if ( !this.shouldUseVertexMapping ) return;

        // Draw dashed lines from each vertex of the initial state to the final state
        let initialState = this.object.states[0];
        let finalState = this.object.states[this.object.states.length-1];

        if ( initialState && finalState ) {
            let sceneScale = this.getMaxSceneBoxSize();

            if ( this.shouldSimplifyVertices ) this.simplifyVertices();

            // Assume same number of vertices and same order
            let nVertices = Math.min(initialState.vertices.length, finalState.vertices.length);
            for (let i = 0; i < nVertices; i++) {
                const initialVertex = initialState.vertices[i];
                const finalVertex = finalState.vertices[i];

                if ( this.shouldSimplifyVertices && !initialVertex.shouldBeVisible ) continue;

                // Line
                let geometryPoints = new THREE.BufferGeometry().setFromPoints( [initialVertex, finalVertex] );
                let line = new THREE.Line( geometryPoints, 
                    new THREE.LineDashedMaterial( {
                    color: 0x000000,
                    dashSize: 0.03 * sceneScale,
                    gapSize: 0.03 * sceneScale,
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
                    
                    triangleMesh.scale.set(sceneScale / 30, sceneScale / 30, 1);
                    let direction = finalVertex.clone().sub(initialVertex);
                    triangleMesh.rotation.set(0,0, - (Math.PI / 2 - direction.angle()));
                    triangleMesh.position.set(finalVertex.x, finalVertex.y, MAPPING_DEPTH);
                    this.scene.add(triangleMesh);
                }
            }
        }
    }

    simplifyVertices() {
        // Simplify initial state
        let initialState = this.object.states[0];
        let boxSize = new THREE.Vector3();
        initialState.boundingBox.getSize(boxSize);
        let maxSize = Math.max(boxSize.x, boxSize.y);
        let tolerance = 0.04 * maxSize;
        simplify(initialState.vertices, tolerance, false);
    }

    _getColor(i, nStates) {
        return this.defaultColor;
    }

    _getOpacity(i, nStates) {
        // Linear interpolation between min (0.2) and max (0.8)
        return 0.2 + (i / (nStates - 1)) * (0.8 - 0.2);
    }

    getMaxSceneBoxSize() {
        let boxSize = new THREE.Vector3();
        this.sceneBoundingBox.getSize(boxSize);
        return Math.max(boxSize.x, boxSize.y);
    }
}

class Translation extends Transformation {
    constructor(translationVector) {
        super();
        this.translationVector = translationVector;
    }

    getName() { return "Translation" }

    getDetails() {
        return "Translation Vector: (" + this.translationVector.x.toFixed(2) + ", " + this.translationVector.y.toFixed(2) + ")";
    }

    getOverlayDetails() {
        return "T: (" + this.translationVector.x.toFixed(2) + ", " + this.translationVector.y.toFixed(2) + ")";
    }

    setupScene(scene, object) {
        super.setupScene(scene, object);
        this.setupOnionSkinning();
        this.setupTranslationArrow();
        this.setupLinearVertexMapping();
        this.setupSceneCamera();
        this.setupGrid();
    }

    setupTranslationArrow() {
        if ( !this.shouldUseArrows ) return;

        // Draw an arrow from the centroid of the object in the first state to it on the final state
        let origin = new THREE.Vector3();
        let destination = new THREE.Vector3();
        this.object.states[0].boundingBox.getCenter(origin);
        this.object.states[this.object.states.length-1].boundingBox.getCenter(destination);
        let direction = new THREE.Vector3().copy(destination).sub(origin);
        let length = direction.length();
        direction.normalize();
        origin.z = ARROW_DEPTH;

        let sceneScale = this.getMaxSceneBoxSize();

        let arrow = new THREE.ArrowHelper( direction, origin, length, 0x000000, 0.06 * sceneScale, 0.075 * sceneScale);
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
        return "Orientation Angle: " + THREE.MathUtils.radToDeg(this.orientationAngle).toFixed(2) + "º";
    }

    getOverlayDetails() {
        return "O: " + THREE.MathUtils.radToDeg(this.orientationAngle).toFixed(2) + "º";
    }

    setupScene(scene, object) {
        super.setupScene(scene, object);
        this.setupInitialFinalStates();
        this.setupRoundArrow();
        this.setupArcVertexMapping();
        this.setupSceneCamera();
        this.setupGrid();
    }

    setupRoundArrow() {
        if ( !this.shouldUseArrows ) return;

        let center = new THREE.Vector3();
        this.sceneBoundingBox.getCenter(center);
        let topRightCorner = new THREE.Vector3(this.sceneBoundingBox.max.x, this.sceneBoundingBox.max.y, center.z);
        let radius = topRightCorner.sub(center).length();
        radius += radius * 0.1;

        let clockwise = this.orientationAngle < 0;
        let curvedArrow = new CurvedArrow(0, 0, radius, radius, 0, this.orientationAngle, 
            clockwise, 0, 100, 0x000000, 1, 0.1);
        curvedArrow.position.x = center.x;
        curvedArrow.position.y = center.y;
        curvedArrow.position.z = ARROW_DEPTH;

        this.sceneBoundingBox.expandByObject(curvedArrow);
        this.scene.add(curvedArrow);
    }

    setupArcVertexMapping() {
        if ( !this.shouldUseVertexMapping ) return;

        let initialState = this.object.states[0];
        let finalState = this.object.states[this.object.states.length-1];

        if ( initialState && finalState ) {
            if ( this.shouldSimplifyVertices ) this.simplifyVertices();
            
            // Consider the center to be the mid point between the center of the two bounding boxes
            let initialStateCenter = new THREE.Vector3(); 
            initialState.boundingBox.getCenter(initialStateCenter);
            let finalStateCenter = new THREE.Vector3(); 
            finalState.boundingBox.getCenter(finalStateCenter);
            let center = new THREE.Vector3().lerpVectors(initialStateCenter, finalStateCenter, 0.5);

            // Get bounding box size
            let sceneScale = this.getMaxSceneBoxSize();

            // Loop all vertices
            let nVertices = Math.min(initialState.vertices.length, finalState.vertices.length);
            for (let i = 0; i < nVertices; i++) {   
                if ( this.shouldSimplifyVertices && !initialState.vertices[i].shouldBeVisible ) continue;

                let start = new THREE.Vector3(initialState.vertices[i].x, initialState.vertices[i].y, 0);
                let end = new THREE.Vector3(finalState.vertices[i].x, finalState.vertices[i].y, 0);       

                let arc = new Arc(center, start, end, sceneScale, MAPPING_DEPTH);
                this.scene.add( arc );
            }
        }
    }
}

class Rotation extends Transformation {
    constructor(pivot, rotationAngle) {
        super();
        this.pivot = pivot;
        this.rotationAngle = rotationAngle;
    }

    getName() { return "Rotation" }

    getDetails() {
        return "Rotation Pivot: (" + this.pivot.x.toFixed(2) + ", " + this.pivot.y.toFixed(2) + ")\nRotation Angle: " + THREE.MathUtils.radToDeg(this.rotationAngle).toFixed(2) + "º";
    }

    getOverlayDetails() {
        return "R: " + THREE.MathUtils.radToDeg(this.rotationAngle).toFixed(2) + "º @ (" +
            this.pivot.x.toFixed(2) + ", " + this.pivot.y.toFixed(2) + ")";
    }

    setupScene(scene, object) {
        super.setupScene(scene, object);
        this.setupOnionSkinning();
        this.setupPivotArrow();
        this.setupArcVertexMapping();
        this.setupSceneCamera();
        this.setupGrid();
    }

    setupPivotArrow() {
        let group = new THREE.Group();
        group.position.z = ARROW_DEPTH;

        // Draw pivot
        let dotGeometry = new THREE.Geometry().setFromPoints([this.pivot]);
        let dotMaterial = new THREE.PointsMaterial( { size: 5, color: 0x000000 } );
        let dot = new THREE.Points( dotGeometry, dotMaterial );
        group.add( dot );
        this.sceneBoundingBox.expandByPoint(this.pivot);

        if ( this.shouldUseArrows ) {

            let initialState = this.object.states[0];
            let finalState = this.object.states[this.object.states.length-1];
            if (initialState && finalState ) {
                // Draw lines from pivot to state centroid
                let pivotLineInitial = this._setupPivotLine(initialState, group);
                let pivotLineFinal = this._setupPivotLine(finalState, group);
                let minimumDistance = Math.min(pivotLineInitial.halfwayDistance, pivotLineFinal.halfwayDistance);
                
                // Draw curved arrow from one line to the other
                let angleInitial = pivotLineInitial.lineVector.angle();
                let angleFinal = pivotLineFinal.lineVector.angle();
                let clockwise = angleFinal < angleInitial;
                let curvedArrow = new CurvedArrow(0, 0, minimumDistance, minimumDistance, 
                    angleInitial, angleFinal, clockwise, 0, 100, 0x000000, 1, 0.4);
                curvedArrow.position.x = this.pivot.x;
                curvedArrow.position.y = this.pivot.y;
                group.add(curvedArrow);
            }
        }

        this.scene.add( group );
    }

    setupArcVertexMapping() {
        if ( !this.shouldUseVertexMapping ) return;
        
        let initialState = this.object.states[0];
        let finalState = this.object.states[this.object.states.length-1];

        if ( initialState && finalState ) {
            if ( this.shouldSimplifyVertices ) this.simplifyVertices();

            // Get bounding box size
            let sceneScale = this.getMaxSceneBoxSize();

            let center = new THREE.Vector3(this.pivot.x, this.pivot.y, 0);

            // Loop all vertices
            let nVertices = Math.min(initialState.vertices.length, finalState.vertices.length);
            for (let i = 0; i < nVertices; i++) {                
                if ( this.shouldSimplifyVertices && !initialState.vertices[i].shouldBeVisible ) continue;

                let start = new THREE.Vector3(initialState.vertices[i].x, initialState.vertices[i].y, 0);
                let end = new THREE.Vector3(finalState.vertices[i].x, finalState.vertices[i].y, 0);

                let arc = new Arc(center, start, end, sceneScale, MAPPING_DEPTH);
                this.scene.add( arc );
            }
        }
    }

    _setupPivotLine(state, group) {
        const percentageOfLine = 0.4; // Draw only a percentage of the line

        let center = new THREE.Vector3(); 
        state.boundingBox.getCenter(center);

        let lineVector = new THREE.Vector2(center.x, center.y).sub(this.pivot);
        let halfwayDistance = lineVector.clone().multiplyScalar(percentageOfLine/2).length();
        let lineEnd = lineVector.clone().multiplyScalar(percentageOfLine).add(this.pivot);
        let geometryPoints = new THREE.BufferGeometry().setFromPoints( [this.pivot, lineEnd] );
        let line = new THREE.Line( geometryPoints, 
            new THREE.LineBasicMaterial( { color: 0x000000, transparent: true, opacity: 1 } ) );
        group.add( line );

        return { 
            halfwayDistance: halfwayDistance,
            lineVector: lineVector 
        };
    }
}

class Scale extends Transformation {
    constructor(scaleVector) {
        super();
        this.scaleVector = scaleVector;
        this.drawArrowsInVertexMapping = true;
        this.isochronMap = true;
    }

    getName() { return "Scale" }

    getDetails() {
        return "Scale Vector: (" + this.scaleVector.x.toFixed(2) + ", " + this.scaleVector.y.toFixed(2) + ")";
    }

    getOverlayDetails() {
        return "S: (" + this.scaleVector.x.toFixed(2) + ", " + this.scaleVector.y.toFixed(2) + ")";
    }

    setupScene(scene, object) {
        super.setupScene(scene, object);
        this.setupOnionSkinning();
        this.setupLinearVertexMapping();
        this.setupSceneCamera();
        this.setupGrid();
    }

    _getColor(i, nStates) {
        let l = 1 - (0.2 + (i / (nStates - 1)) * 0.3);
        return new THREE.Color().setHSL(this.colorHue, 1, l);
    }

    _getOpacity(i, nStates) {
        return 0.6;
    }
}

class Immutability extends Transformation {
    getName() { return "Immutability" }

    getDetails() { return "The object had no substantial transformations" }

    getOverlayDetails() { return "No changes" }
    
    setupScene(scene, object) { 
        super.setupScene(scene, object);
        this.setupInitialState();
        this.setupSceneCamera();
        this.setupGrid();
    }

    setupInitialState() {
        // Setup only the first state
        let initialState = this.object.states[0];

        if ( initialState ) {
            let states = [initialState];
            this._setupObjectStates(states);
        }
    }

    _getColor(i, nStates) {
        return new THREE.Color().setHSL(0, 0, 0.5);
    }

    _getOpacity(i, nStates) {
        return 0.8;
    }
}

class Unknown extends Transformation {
    getName() { return "Unknown" }

    getDetails() { return "The object suffered an unknown transformation" }

    getOverlayDetails() { return "Unknown changes" }
    
    setupScene(scene, object) { 
        super.setupScene(scene, object);
        this.setupOnionSkinning();
        this.setupSceneCamera();
        this.setupGrid();
    }

    _getColor(i, nStates) {
        return new THREE.Color().setHSL(0, 0, 0.5);
    }
}

class Multiple extends Transformation {
    constructor(transformations) {
        super();
        this.transformations = transformations;
    }

    getName() { return "Multiple" }

    getDetails() { 
        let details = "The object suffered multiple transformations:\n";
        this.transformations.forEach(transformation => {
            details += transformation.getDetails() + '\n';
        });
        return details;
    }

    getOverlayDetails() {
        let details = "";
        this.transformations.forEach(transformation => {
            details += transformation.getOverlayDetails() + '<br>';
        });
        return details;
    }

    setupScene(scene, object) { 
        super.setupScene(scene, object);
        this.setupOnionSkinning();
        this.setupSceneCamera();
        this.setupGrid();
    }
}

module.exports = {
    Transformation : Transformation,
    Translation : Translation,
    Orientation : Orientation,
    Rotation : Rotation,
    Scale : Scale,
    Immutability : Immutability,
    Unknown : Unknown,
    Multiple : Multiple
}
