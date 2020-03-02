const THREE = require("three");

class CurvedArrow extends THREE.Object3D {
    constructor(centerX, centerY, radiusX, radiusY, startAngle, endAngle, clockwise, rotation, lineDivisions, color, headWidth, headLength) {
        super();

        // Arc
        let curve = new THREE.EllipseCurve(
            centerX, centerY,
            radiusX, radiusY,
            startAngle, endAngle,
            clockwise,
            rotation
        );
        
        let points = curve.getPoints( lineDivisions );
        let geometry = new THREE.BufferGeometry().setFromPoints( points );
        let material = new THREE.LineBasicMaterial( { color : color } );
        let ellipse = new THREE.Line( geometry, material );
        this.add( ellipse );

        // Head
        let _coneGeometry = new THREE.CylinderBufferGeometry( 0, 0.5, 1, 5, 1 );
        _coneGeometry.translate( 0, - 0.5, 0 );
        let _headLength = headLength * curve.getLength();
        let _headWidth = headWidth * _headLength;
        this.cone = new THREE.Mesh( _coneGeometry, new THREE.MeshBasicMaterial( { color: color } ) );
        this.cone.scale.set( _headWidth, _headLength, _headWidth );
        this.cone.updateMatrix();
        this.add( this.cone );

        // TODO: Place head in last point and orient it using the second-to-last and last points
    }
}

module.exports = CurvedArrow;
