const THREE = require("three");

class EllipseArc extends THREE.Object3D {
    constructor(center, vertex1, vertex2, maxBoxSize, depth, angle) {
        super();

        let clockwise = angle < 0;

        // Get distances to center
        let centerDistanceVertex1 = vertex1.distanceTo(center);
        let centerDistanceVertex2 = vertex2.distanceTo(center);
        
        // Translate vectors to origin
        let modifiedVertex1 = vertex1.clone().sub(center);
        let modifiedVertex2 = vertex2.clone().sub(center);

        // Angle between vectors
        let theta = Math.acos(modifiedVertex1.dot(modifiedVertex2) / (modifiedVertex1.length() * modifiedVertex2.length()));
        let isVertex1Larger = centerDistanceVertex1 > centerDistanceVertex2;
        if ((isVertex1Larger && clockwise) || (!isVertex1Larger && !clockwise))
            theta *= -1;
        let startAngle = isVertex1Larger ? 0 : theta;
        let endAngle = isVertex1Larger ? theta : 0;

        // Rotate vectors to align with axis
        let alpha = isVertex1Larger ? modifiedVertex1.angle() : modifiedVertex2.angle();
        let origin = new THREE.Vector2(0,0);
        modifiedVertex1.rotateAround(origin, -alpha);
        modifiedVertex2.rotateAround(origin, -alpha);

        // Find radiuses (solve system of two equations by substitution)
        let radiusX = (Math.pow(modifiedVertex1.x,2) - Math.pow(modifiedVertex2.x,2)) / 
            (-1 * Math.pow(modifiedVertex2.x,2) * Math.pow(modifiedVertex1.y,2) + Math.pow(modifiedVertex2.y,2) * Math.pow(modifiedVertex1.x,2));
    
        let radiusY = (1 - Math.pow(modifiedVertex1.y,2) * radiusX) / Math.pow(modifiedVertex1.x,2);

        radiusX = Math.sqrt(1/radiusX);
        radiusY = Math.sqrt(1/radiusY);

        // Arc
        let curve = new THREE.EllipseCurve(
            0, 0,
            radiusX, radiusY,
            startAngle, endAngle,
            clockwise,
            0
        );

        let points = curve.getPoints( 100 );
        let geometry = new THREE.BufferGeometry().setFromPoints( points );
        geometry.computeBoundingBox();
        let material = new THREE.LineDashedMaterial( {
                color: 0x000000,
                dashSize: 0.04 * maxBoxSize,
                gapSize: 0.04 * maxBoxSize,
            } );
        let ellipse = new THREE.Line( geometry, material );
        ellipse.rotation.z = alpha;
        ellipse.position.x = center.x;
        ellipse.position.y = center.y;
        ellipse.position.z = depth;
        ellipse.computeLineDistances();
        this.add(ellipse);
    }
}

module.exports = EllipseArc;
