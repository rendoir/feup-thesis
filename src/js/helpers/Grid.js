const THREE = require("three");

const fontJson = require('three/examples/fonts/helvetiker_regular.typeface.json');
var font = null;

class Grid extends THREE.Object3D {
    constructor(size, divisions) {
        super();

        // Text
        if( font == null )
            font = new THREE.Font( fontJson );
    
        let textColor = 0x006699;

        let matLite = new THREE.MeshBasicMaterial( {
            color: textColor,
            transparent: false,
            side: THREE.DoubleSide
        } );
        
        let step = size / divisions;
        let halfSize = size / 2;
    
        let vertices = [];
    
        for ( let i = 0, j = 0, k = - halfSize + step; i < divisions - 1; i ++, k += step ) {
    
            vertices.push( - halfSize, 0, k, halfSize, 0, k );
            vertices.push( k, 0, - halfSize, k, 0, halfSize );

            drawText(-halfSize, k, this, font, matLite);
            //drawText(halfSize, k, this, font, matLite);
            drawText(k, -halfSize, this, font, matLite); 
            //drawText(k, halfSize, this, font, matLite); 
            
        }
    
        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    
        let material = new THREE.LineBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.5 } );
    
        this.add ( new THREE.LineSegments( geometry, material ) );
    }
}

function drawText(x, z, thisObject, font, mat) {
    // TODO: SIZE RELATIVE TO AABB SIZE
    // TODO: SHAPE CACHE
    // TODO: DISPLAY ONLY 1 COORDINATE
    // TODO: ADJUST GEOMETRY TRANSLATION
    // TODO: ADJUST MESSAGE TO TRANSLATION
	let message = x.toFixed(2).toString() + "  " + z.toFixed(2).toString();

	let shapes = font.generateShapes( message, 50 );

	let geometry = new THREE.ShapeBufferGeometry( shapes );

	geometry.computeBoundingBox();

	let xMid = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
	let yMid = - 0.5 * ( geometry.boundingBox.max.y - geometry.boundingBox.min.y );

	geometry.translate( xMid, yMid, 0 );

	let text = new THREE.Mesh( geometry, mat );
	text.rotation.x = - Math.PI / 2;
	text.position.set(x, 0, z);
	thisObject.add( text );
}

module.exports = Grid;
