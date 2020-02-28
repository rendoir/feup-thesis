const THREE = require('three');
const Frame = require('../frame');
const { Object, ObjectState } = require('../object');
const { Translation } = require('../transformation');


/* ----- OBJECT ----- */
let object = new Object();

let vertices1 = [];
vertices1.push( new THREE.Vector2( 610, 320 ) );
vertices1.push( new THREE.Vector2( 450, 300 ) );
vertices1.push( new THREE.Vector2( 392, 392 ) );
vertices1.push( new THREE.Vector2( 266, 438 ) );
vertices1.push( new THREE.Vector2( 190, 570 ) );
vertices1.push( new THREE.Vector2( 190, 600 ) );
vertices1.push( new THREE.Vector2( 160, 620 ) );
vertices1.push( new THREE.Vector2( 160, 650 ) );
vertices1.push( new THREE.Vector2( 180, 640 ) );
vertices1.push( new THREE.Vector2( 165, 680 ) );
vertices1.push( new THREE.Vector2( 150, 670 ) );
vertices1.push( new THREE.Vector2( 90, 737 ) );
vertices1.push( new THREE.Vector2( 80, 795 ) );
vertices1.push( new THREE.Vector2( 50, 835 ) );
vertices1.push( new THREE.Vector2( 64, 870 ) );
vertices1.push( new THREE.Vector2( 60, 945 ) );
vertices1.push( new THREE.Vector2( 300, 945 ) );
vertices1.push( new THREE.Vector2( 300, 743 ) );
vertices1.push( new THREE.Vector2( 600, 473 ) );
vertices1.push( new THREE.Vector2( 626, 425 ) );
vertices1.push( new THREE.Vector2( 600, 370 ) );
vertices1.push( new THREE.Vector2( 610, 320 ) );

let vertices2 = [];
vertices1.forEach(vertex => {
    let newVertex = new THREE.Vector2(vertex.x, vertex.y);
    newVertex.add(new THREE.Vector2(50, 100));
    vertices2.push(newVertex);
});

let vertices3 = [];
vertices2.forEach(vertex => {
    let newVertex = new THREE.Vector2(vertex.x, vertex.y);
    newVertex.add(new THREE.Vector2(20, 50));
    vertices3.push(newVertex);
});


let objectState1 = new ObjectState(0, vertices1);
let objectState2 = new ObjectState(1, vertices2);
let objectState3 = new ObjectState(2, vertices3);
object.setStates([objectState1, objectState2, objectState3]);


/* ----- TRANSFORMATIONS ----- */
let translation = new Translation([70, 150]);


/* ----- FRAMES ----- */
let frames = [];

let frame0_0 = new Frame(object, translation); frames.push(frame0_0);
let frame0_1 = new Frame(object, translation); frames.push(frame0_1);
let frame0_2 = new Frame(object, translation); frames.push(frame0_2);
let frame0_3 = new Frame(object, translation); frames.push(frame0_3);
let frame0_4 = new Frame(object, translation); frames.push(frame0_4);

let frame1_0 = new Frame(object, translation); frame0_3.childFrames.push(frame1_0);
let frame1_1 = new Frame(object, translation); frame0_3.childFrames.push(frame1_1);
let frame1_2 = new Frame(object, translation); frame0_3.childFrames.push(frame1_2);
let frame1_3 = new Frame(object, translation); frame0_3.childFrames.push(frame1_3);

let frame2_0 = new Frame(object, translation); frame1_0.childFrames.push(frame2_0);
let frame2_1 = new Frame(object, translation); frame1_0.childFrames.push(frame2_1);
let frame2_2 = new Frame(object, translation); frame1_0.childFrames.push(frame2_2);

let frame3_0 = new Frame(object, translation); frame2_0.childFrames.push(frame3_0);





module.exports = frames;
