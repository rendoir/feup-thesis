const THREE = require("three");

class Grid extends THREE.Object3D {
    constructor(size, divisions) {
        super();
    
        let color = new THREE.Color( 0x000000 );
    
        let center = divisions / 2;
        let step = size / divisions;
        let halfSize = size / 2;
    
        let vertices = [], colors = [];
    
        for ( let i = 0, j = 0, k = - halfSize + step; i < divisions - 1; i ++, k += step ) {
    
            vertices.push( - halfSize, 0, k, halfSize, 0, k );
            vertices.push( k, 0, - halfSize, k, 0, halfSize );
        
            color.toArray( colors, j ); j += 3;
            color.toArray( colors, j ); j += 3;
            color.toArray( colors, j ); j += 3;
            color.toArray( colors, j ); j += 3;
    
        }
    
        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
        geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    
        let material = new THREE.LineBasicMaterial( { vertexColors: true, transparent: true, opacity: 0.5 } );
    
        this.add ( new THREE.LineSegments( geometry, material ) );
    
        let thisObject = this;
    }
}

module.exports = Grid;
