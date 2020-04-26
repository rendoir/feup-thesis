const THREE = require('three');
const Utils = require('../utils');
const Frame = require('../frame');
const { Object, ObjectState } = require('../object');
const { Translation, Orientation, Scale, Immutability, Unknown, Multiple, Rotation } = require('../transformation');


class Transform {
    constructor() {
        this.position = new THREE.Vector3(0,0,0);
        this.rotation = 0;
        this.scale = new THREE.Vector3(1,1,1);
    }
}

class DemoObject {
    constructor(vertices) {
        this.transform = new Transform();
        this.vertices = vertices;
    }
}


let timestamp = Date.now();

/* ----- OBJECT ----- */
let vertices = [];
vertices.push( new THREE.Vector2( 610, 320 ) );
vertices.push( new THREE.Vector2( 450, 300 ) );
vertices.push( new THREE.Vector2( 392, 392 ) );
vertices.push( new THREE.Vector2( 266, 438 ) );
vertices.push( new THREE.Vector2( 190, 570 ) );
vertices.push( new THREE.Vector2( 190, 600 ) );
vertices.push( new THREE.Vector2( 160, 620 ) );
vertices.push( new THREE.Vector2( 160, 650 ) );
vertices.push( new THREE.Vector2( 180, 640 ) );
vertices.push( new THREE.Vector2( 165, 680 ) );
vertices.push( new THREE.Vector2( 150, 670 ) );
vertices.push( new THREE.Vector2( 90, 737 ) );
vertices.push( new THREE.Vector2( 80, 795 ) );
vertices.push( new THREE.Vector2( 50, 835 ) );
vertices.push( new THREE.Vector2( 64, 870 ) );
vertices.push( new THREE.Vector2( 60, 945 ) );
vertices.push( new THREE.Vector2( 300, 945 ) );
vertices.push( new THREE.Vector2( 300, 743 ) );
vertices.push( new THREE.Vector2( 600, 473 ) );
vertices.push( new THREE.Vector2( 626, 425 ) );
vertices.push( new THREE.Vector2( 600, 370 ) );
vertices.push( new THREE.Vector2( 610, 320 ) );

let centroid = new THREE.Vector2(338, 622.5);
let origin = new THREE.Vector2(0,0);

vertices.forEach(vertex => {
    vertex.sub(centroid);
});

function translate(object, vector) {
    object.transform.position.add(vector);
}

function rotate(object, angle) {
    object.transform.rotation += angle;
}

function scale(object, vector) {
    object.transform.scale.multiply(vector);
}

function applyTransform(object) {
    let newVertices = [];
    object.vertices.forEach(vertex => {
        let newVertex = new THREE.Vector3(vertex.x, vertex.y, 0);
        let matrix = new THREE.Matrix4();
        matrix.compose(object.transform.position, 
            new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), object.transform.rotation), 
            object.transform.scale);
        newVertex.applyMatrix4(matrix);
        newVertices.push(new THREE.Vector2(newVertex.x, newVertex.y));
    });
    return newVertices;
}


/* ----- FRAMES ----- */
let objects = [];
let object = new DemoObject(vertices);
let finalVertices;
let verticesLog = [];

verticesLog.push(object.vertices);

/* SPRING - 1 */
translate(object, new THREE.Vector3(70,150,0));
scale(object, new THREE.Vector3(0.95,0.95,0));
rotate(object, THREE.MathUtils.degToRad(5));
objects.push(new Object());
objects[0].setStates([
    new ObjectState(0, object.vertices),
    new ObjectState(1, (finalVertices = applyTransform(object)))
]);

verticesLog.push(finalVertices);

/* SPRING - 2 */
translate(object, new THREE.Vector3(-10,50,0));
scale(object, new THREE.Vector3(0.9,0.9,0));
rotate(object, THREE.MathUtils.degToRad(10));
objects.push(new Object());
objects[1].setStates([
    new ObjectState(0, object.vertices),
    new ObjectState(1, (finalVertices = applyTransform(object)))
]);

verticesLog.push(finalVertices);

/* SUMMER - 1 */
translate(object, new THREE.Vector3(5,20,0));
scale(object, new THREE.Vector3(0.6,0.6,0));
rotate(object, THREE.MathUtils.degToRad(25));
objects.push(new Object());
objects[2].setStates([
    new ObjectState(0, finalVertices),
    new ObjectState(1, (finalVertices = applyTransform(object)))
]);

verticesLog.push(finalVertices);

/* SUMMER - 2 */
translate(object, new THREE.Vector3(0,5,0));
scale(object, new THREE.Vector3(0.9,0.9,0));
rotate(object, THREE.MathUtils.degToRad(-20));
objects.push(new Object());
objects[3].setStates([
    new ObjectState(0, finalVertices),
    new ObjectState(1, (finalVertices = applyTransform(object)))
]);

verticesLog.push(finalVertices);

/* AUTUMN - 1 */
translate(object, new THREE.Vector3(0,0,0));
scale(object, new THREE.Vector3(1,1,0));
rotate(object, THREE.MathUtils.degToRad(0));
objects.push(new Object());
objects[4].setStates([
    new ObjectState(0, finalVertices),
    new ObjectState(1, (finalVertices = applyTransform(object)))
]);

verticesLog.push(finalVertices);

/* AUTUMN - 2 */
translate(object, new THREE.Vector3(25,-20,0));
scale(object, new THREE.Vector3(1.1,1.1,0));
rotate(object, THREE.MathUtils.degToRad(-5));
objects.push(new Object());
objects[5].setStates([
    new ObjectState(0, finalVertices),
    new ObjectState(1, (finalVertices = applyTransform(object)))
]);

verticesLog.push(finalVertices);

/* WINTER - 1 */
translate(object, new THREE.Vector3(0,0,0));
scale(object, new THREE.Vector3(1.8,1.8,0));
rotate(object, THREE.MathUtils.degToRad(0));
objects.push(new Object());
objects[6].setStates([
    new ObjectState(0, finalVertices),
    new ObjectState(1, (finalVertices = applyTransform(object)))
]);

verticesLog.push(finalVertices);

/* WINTER - 2 */
translate(object, new THREE.Vector3(25,-20,0));
scale(object, new THREE.Vector3(1.2,1.2,0));
rotate(object, THREE.MathUtils.degToRad(-5));
objects.push(new Object());
objects[7].setStates([
    new ObjectState(0, finalVertices),
    new ObjectState(1, (finalVertices = applyTransform(object)))
]);

verticesLog.push(finalVertices);

console.log(JSON.stringify(verticesLog));

/* Init frames */
let frames = [];
let frameTransformation = new Unknown();

let timeDuration = getYearDuration();
let step = Math.round(timeDuration / objects.length);

for(let i = 0; i < objects.length; i++) {
    frames.push(new Frame(objects[i], frameTransformation, timestamp, stepTime(step)));
}


/* UTILS */
function getYearDuration() {
    return Math.ceil(Utils.Milliseconds.YEAR);
}

function stepTime(div) {
    timestamp += div;
    return timestamp;
}


module.exports = frames;
