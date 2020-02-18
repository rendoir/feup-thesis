var THREE = require('three');

class VisualNarrative {
    constructor() {
        this.init();
        this.animate();
    }

    init() {
        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
        this.camera.position.z = 1;
    
        this.scene = new THREE.Scene();
    
        this.geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
        this.material = new THREE.MeshNormalMaterial();
    
        this.mesh = new THREE.Mesh( this.geometry, this.material );
        this.scene.add( this.mesh );
    
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.renderer.domElement );
    
        window.addEventListener( 'resize', this.onWindowResize.bind(this), false );
    }

    animate() {
        this.merda = 
        requestAnimationFrame( this.animate.bind(this) );
    
        this.mesh.rotation.x += 0.01;
        this.mesh.rotation.y += 0.02;
    
        this.renderer.render( this.scene, this.camera );
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
}

var visualNarrative = new VisualNarrative();
