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
        geometry.computeBoundingBox();
        let material = new THREE.LineBasicMaterial( { color : color } );
        let ellipse = new THREE.Line( geometry, material );
        this.add( ellipse );

        // Head
        let _coneGeometry = new THREE.CylinderBufferGeometry( 0, 0.5, 1, 5, 1 );
        let _headLength = headLength * Math.max(radiusX, radiusY);
        let _headWidth = headWidth * _headLength;
        this.cone = new THREE.Mesh( _coneGeometry, new THREE.MeshBasicMaterial( { color: color } ) );
        this.cone.scale.set( _headWidth, _headLength, _headWidth );

        let lastPoint = points[points.length-1];
        this.cone.rotation.set(0, 0, endAngle);
        this.cone.position.set(lastPoint.x, lastPoint.y, 0);
        this.cone.updateMatrix();
        this.add( this.cone );
    }
}

module.exports = CurvedArrow;
