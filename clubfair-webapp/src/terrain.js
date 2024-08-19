import * as THREE from 'three';
import { ImprovedNoise } from 'three/examples/jsm/Addons.js';

// Chunk params
const CHUNK_SIZE = 160;
const CHUNK_COUNT = 8;
const POINT_GAP = 0.02;
const CHUNK_RADIUS = CHUNK_COUNT * CHUNK_SIZE * POINT_GAP / 2;

const Terrain = () => {
    // Init scene & camera
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.set(0, 40, 0);
    camera.lookAt(0, 0, 0);

    // Init renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(w, h);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);

    // Add chunks
    const chunks = new Map(); // Store loaded chunks by their coordinates
    const noise = new ImprovedNoise();
    const mountainClump = 0.1;
    const mountainHeight = 15;

    function updateChunks() {
        const cx = Math.floor(camera.position.x / (CHUNK_SIZE * POINT_GAP));
        const cz = Math.floor(camera.position.z / (CHUNK_SIZE * POINT_GAP));
        console.log("camY: %f", camera.position.y);

        // Add new chunks
        for (let dx = -CHUNK_COUNT / 2; dx < CHUNK_COUNT / 2; dx++) {
            for (let dz = -CHUNK_COUNT / 2; dz < CHUNK_COUNT / 2; dz++) {
                const key = `${cx + dx}-${cz + dz}`;

                if (!chunks.has(key)) {
                    const chunk = createChunk(cx + dx, cz + dz);
                    chunks.set(key, chunk);
                    scene.add(chunk);
                }
            }
        }

        // Remove old chunks
        chunks.forEach((chunk, key) => {
            const [chunkX, chunkZ] = key.split('-').map(Number);
            const distance = Math.sqrt(Math.pow(chunkX - cx, 2) + Math.pow(chunkZ - cz, 2));
            if (distance > CHUNK_RADIUS) {
                scene.remove(chunk);
                chunks.delete(key);
            }
        });
    }

    function createChunk(cx, cz) {
        const edgeSize = CHUNK_SIZE;
        const gap = POINT_GAP;
        const offset = {
            x: cx * edgeSize * gap,
            y: 7,
            z: cz * edgeSize * gap
        };

        const grid = [];
        const colors = [];

        for (let row = 0; row < edgeSize; row++) {
            for (let col = 0; col < edgeSize; col++) {
                let x = offset.x + col * gap;
                let z = offset.z + row * gap;
                let ns = noise.noise(x * mountainClump, z * mountainClump, 0);  
                let y = offset.y + ns * mountainHeight;    

                // Determine colors
                let snowThreshold = 13;
                let grassThreshold = 2;
                let r, g, b;

                if (y > snowThreshold) {
                    r = Math.random() * 0.1 + 0.9;
                    g = Math.random() * 0.1 + 0.9;
                    b = Math.random() * 0.1 + 0.9;
                } 
                
                else if (y < grassThreshold) {
                    r = 0;
                    g = Math.random() * 0.3 + 0.2;
                    b = 0;
                } 
                
                else {
                    let terrainFactor = y * 0.03;
                    let baseGray = Math.random() * 0.3;
                    r = baseGray + terrainFactor;
                    g = baseGray + terrainFactor; 
                    b = baseGray + terrainFactor; 
                }

                grid.push(x, y, z);
                colors.push(r, g, b);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(grid, 3));
        geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        return new THREE.Points(geometry, new THREE.PointsMaterial({size: 0.075, vertexColors: true}));
    }

    // Movement
    const keys = {w: false, a: false, s: false, d: false, space: false, shift: false};
    const velocity = new THREE.Vector3(0, 0, 0);
    const acceleration = 0.1;
    const maxSpeed = 5;
    let isMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };

    // Animate function
    function animate() {
        const delta = 0.2;
        handleKeyboardInput(delta);
        updateCameraPosition(delta);
        updateChunks();
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