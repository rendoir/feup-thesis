const THREE = require("three");

const FONT_JSON = require('three/examples/fonts/helvetiker_regular.typeface.json');
var FONT = null;

const SIZE_SCALE = 0.025;
const TEXT_COLOR = 0x808080;

const MIN_DIVISIONS = 3;
const MAX_DIVISIONS = 10;
const DIV_MODULE = MAX_DIVISIONS - MIN_DIVISIONS + 1;

let matLite = new THREE.MeshBasicMaterial( {
    color: TEXT_COLOR,
    side: THREE.DoubleSide
} );

function getDivisions(x) {
    let orderMagnitude = Math.pow(10, Math.floor(Math.log10(x)));
    return Math.floor(x / orderMagnitude) % DIV_MODULE + MIN_DIVISIONS;
}

class Grid extends THREE.Object3D {
    constructor(size, center) {
        super();

        this.center = center;
        this.size = size;

        // Text
        if( FONT == null )
            FONT = new THREE.Font( FONT_JSON );
     
        let divisions = getDivisions(size);
        let step = size / divisions;
        let halfSize = size / 2;
    
        let vertices = [];
    
        for ( let i = 0, k = - halfSize + step; i < divisions - 1; i ++, k += step ) {
    
            vertices.push( - halfSize, k, 0, halfSize, k, 0 );
            vertices.push( k, - halfSize, 0, k, halfSize, 0 );

            // Y-axis
            this.drawText(-halfSize, k, matLite, false);
            
            // X-axis
            this.drawText(k, halfSize, matLite, true);
            
        }
    
        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    
        let material = new THREE.LineBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.25 } );
    
        let lineSegments = new THREE.LineSegments( geometry, material );
        lineSegments.position.set(center.x, center.y, center.z);
        this.add ( lineSegments );
    }


    drawText(x, y, mat, xAxis) {
        let wx = x + this.center.x;
        let wy = y + this.center.y;

        let message = xAxis ? wx.toFixed(2).toString() : wy.toFixed(2).toString();
    
        let shapes = FONT.generateShapes( message, this.size * SIZE_SCALE );
    
        let geometry = new THREE.ShapeBufferGeometry( shapes );
    
        geometry.computeBoundingBox();
    
        let yMid = !xAxis ? 0 : - ( geometry.boundingBox.max.y - geometry.boundingBox.min.y );
    
        geometry.translate( 0, yMid, 0 );
    
        let text = new THREE.Mesh( geometry, mat );
        text.position.set(wx, wy, this.center.z);
        this.add( text );
    }
}



module.exports = Grid;
