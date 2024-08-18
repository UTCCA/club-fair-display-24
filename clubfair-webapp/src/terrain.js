import * as THREE from 'three';
import { ImprovedNoise } from 'three/examples/jsm/Addons.js';

const Terrain = () => {
    // Init scene & camera
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.z = 5;

    // // Init renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(w, h);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);

    // Add grid to scene
    const size = 10;
    const divisions = 10;
    const gridHelper = new THREE.GridHelper( size, divisions );
    scene.add( gridHelper );

    // Add points to scene
    const edgeSize = 160;
    const offset = {x: -2.25, y: 0.5, z: -2.25};
    const gap = 0.03125;
    const pointSize = 0.04;
    const noiseFactor = 0.8;
    
    const noise = new ImprovedNoise();
    const grid = [];
    const colors = [];
    let ns;
    //let vertex;

    for (let row = 0; row < edgeSize; row++) {
        for (let col = 0; col < edgeSize; col++) {
            
            // Generate z coord with noise
            let x = offset.x + col * gap;
            let y = 0;
            let z = offset.z + row * gap;
            ns = noise.noise(x * noiseFactor, z * noiseFactor, 0);  
            y = offset.y + ns;    

            // Pick colors
            let r = 0;
            let g = Math.random();
            let b = ns;

            //vertex = new THREE.Vector3(x, y, z);
            grid.push(x, y, z);
            colors.push(r, g, b);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(grid, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({size: pointSize, vertexColors: true});
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Movement
    const keys = {w: false, a: false, s: false, d: false, space: false, shift: false};
    const velocity = new THREE.Vector3(0, 0, 0);
    const acceleration = 0.05;
    const maxSpeed = 1;
    let isMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };

    // Animate function
    function animate() {
        const delta = 0.2;
        handleKeyboardInput(delta);
        updateCameraPosition(delta);
        renderer.render(scene, camera);
    }

    // Handle keyboard input
    function handleKeyboardInput(delta) {
        if (keys.w) {
            velocity.z -= acceleration * delta;
        }
        if (keys.s) {
            velocity.z += acceleration * delta;
        }
        if (keys.a) {
            velocity.x -= acceleration * delta;
        }
        if (keys.d) {
            velocity.x += acceleration * delta;
        }
        if (keys.space) {
            velocity.y += acceleration * delta;
        }
        if (keys.shift) {
            velocity.y -= acceleration * delta;
        }

        velocity.clampScalar(-maxSpeed, maxSpeed);
    }

    // Update camera position based on velocity
    function updateCameraPosition(delta) {
        camera.position.add(velocity.clone().multiplyScalar(delta));
        velocity.multiplyScalar(0.95);
    }

    // Event listener for keydown
    function onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                keys.w = true;
                break;
            case 'KeyA':
                keys.a = true;
                break;
            case 'KeyS':
                keys.s = true;
                break;
            case 'KeyD':
                keys.d = true;
                break;
            case 'Space':
                keys.space = true;
                event.preventDefault();
                break;
            case 'ShiftLeft':
                keys.shift = true;
                event.preventDefault();
                break;
        }
    }

    // Event listener for keyup
    function onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                keys.w = false;
                break;
            case 'KeyA':
                keys.a = false;
                break;
            case 'KeyS':
                keys.s = false;
                break;
            case 'KeyD':
                keys.d = false;
                break;
            case 'Space':
                keys.space = false;
                event.preventDefault();
                break;
            case 'ShiftLeft':
                keys.shift = false;
                event.preventDefault();
                break;
        }
    }

    // Event listener for mouse movement
    function onMouseMove(event) {
        if (isMouseDown) {
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            const rotationSpeed = 0.005;
            camera.rotation.y -= deltaMove.x * rotationSpeed;
            camera.rotation.x -= deltaMove.y * rotationSpeed;
        }

        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    function onMouseDown(event) {
        isMouseDown = true;
    }

    function onMouseUp(event) {
        isMouseDown = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    // Handle window resize
    function handleWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", handleWindowResize);
};
  
export default Terrain;