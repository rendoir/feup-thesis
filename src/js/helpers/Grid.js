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
            side: THREE.DoubleSide
        } );
        
        let step = size / divisions;
        let halfSize = size / 2;
    
        let vertices = [];
    
        for ( let i = 0, j = 0, k = - halfSize + step; i < divisions - 1; i ++, k += step ) {
    
            vertices.push( - halfSize, k, 0, halfSize, k, 0 );
            vertices.push( k, - halfSize, 0, k, halfSize, 0 );

            // Y-axis
            this.drawText(-halfSize, k, font, matLite, false);
            
            // X-axis
            this.drawText(k, halfSize, font, matLite, true);
            
        }
    
        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    
        let material = new THREE.LineBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.25 } );
    
        this.add ( new THREE.LineSegments( geometry, material ) );
    }


    drawText(x, y, font, mat, xAxis) {
        // TODO: SIZE RELATIVE TO AABB SIZE
        // TODO: SHAPE CACHE
        // TODO: ADJUST MESSAGE TO TRANSLATION (ADD CENTER)
        let message = xAxis ? x.toFixed(2).toString() : y.toFixed(2).toString();
    
        let shapes = font.generateShapes( message, 50 );
    
        let geometry = new THREE.ShapeBufferGeometry( shapes );
    
        geometry.computeBoundingBox();
    
        let yMid = !xAxis ? 0 : - ( geometry.boundingBox.max.y - geometry.boundingBox.min.y );
    
        geometry.translate( 0, yMid, 0 );
    
        let text = new THREE.Mesh( geometry, mat );
        text.position.set(x, y, 0);
        this.add( text );
    }
}



module.exports = Grid;
