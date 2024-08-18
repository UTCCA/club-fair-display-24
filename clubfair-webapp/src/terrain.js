import * as THREE from 'three';

const Terrain = () => {
    // Init scene & camera
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.z = 5;

    // Init renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(w, h);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);

    // Generate points
    const edgeSize = 20;
    const offset = {x: -2.25, y: -2.25};
    const gap = 0.25;
    const pointSize = 0.3;
    const pointColor = 0x00ff00;
    const grid = [];
    let vertex;

    for (let row = 0; row < edgeSize; row++) {
        for (let col = 0; col < edgeSize; col++) {
            let x = offset.x + col * gap;
            let y = offset.y + row * gap;
            let z = 0;

            vertex = new THREE.Vector3(x, y, z);
            grid.push(x, y, z);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(grid, 3));
    const material = new THREE.PointsMaterial({size: pointSize, color: pointColor});
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    function animate() {
        renderer.render(scene, camera);
    }

    function handleWindowResize() {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    window.addEventListener("resize", handleWindowResize());
};
  
export default Terrain;