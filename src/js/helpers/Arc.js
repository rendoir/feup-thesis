const THREE = require("three");

class Arc extends THREE.Object3D {
    constructor(center, start, end, sceneScale, depth) {
        super();

        let vM = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        let dir = new THREE.Vector3().subVectors(end, start).normalize();

        let c = new THREE.Vector3().subVectors(vM, center);
        let d = c.dot(dir);
        c.copy(dir).multiplyScalar(d).add(center); // get a center of an arc

        let vS = new THREE.Vector3().subVectors(start, c);
        let vE = new THREE.Vector3().subVectors(end, c);
        let a = vS.angleTo(vE); // angle between start and end, relatively to the new center

        let divisions = 100;
        let aStep = a / divisions;
        let pts = [];
        let vecTemp = new THREE.Vector3();
        let tri = new THREE.Triangle(start, c, end);
        let axis = new THREE.Vector3();
        tri.getNormal(axis); // get the axis to rotate around
        for (let i = 0; i <= divisions; i++) {

            vecTemp.copy(vE);
            vecTemp.applyAxisAngle(axis, aStep * i);
            pts.push(vecTemp.clone());

        }

        let g = new THREE.BufferGeometry().setFromPoints(pts);
        let m = new THREE.LineDashedMaterial({
            color: 0x000000,
            dashSize: 0.04 * sceneScale,
            gapSize: 0.04 * sceneScale,
        });
        let l = new THREE.Line(g, m);
        l.computeLineDistances();
        l.position.copy(c);
        l.position.z = depth;

        this.add(l)
    }
}

module.exports = Arc;
