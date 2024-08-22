import * as THREE from 'three';
import terrainColours from "./colourConfig.json"
import { ImprovedNoise } from 'three/examples/jsm/Addons.js';

// Chunk params
const CHUNK_SIZE = 80;
const CHUNK_COUNT = 16;
const POINT_GAP = 0.021;
const CHUNK_RADIUS = CHUNK_COUNT * CHUNK_SIZE * POINT_GAP / 2;

const Terrain = () => {
    // Init scene & camera
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    const cameraQuaternion = new THREE.Quaternion();
    camera.quaternion.copy(cameraQuaternion);
    camera.position.set(0, 40, 0);
    camera.lookAt(0, 0, 0);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    // Init renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(w, h);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);

    

    // Add chunks
    const chunks = new Map();
    const noise = new ImprovedNoise();
    const mountainClump = 0.1;
    const mountainHeight = 15;

    function updateChunks() {
        const cx = Math.floor(camera.position.x / (CHUNK_SIZE * POINT_GAP));
        const cz = Math.floor(camera.position.z / (CHUNK_SIZE * POINT_GAP));
        console.log("camY: %f", camera.position.y);

        // // Add new chunks
        // for (let dx = -CHUNK_COUNT / 2; dx < CHUNK_COUNT / 2; dx++) {
        //     for (let dz = -CHUNK_COUNT / 2; dz < CHUNK_COUNT / 2; dz++) {
        //         const key = `${cx + dx}-${cz + dz}`;

        //         if (!chunks.has(key)) {
        //             const chunk = createChunk(cx + dx, cz + dz);
        //             chunks.set(key, chunk);
        //             scene.add(chunk);
        //         }
        //     }
        // }

        // // Remove old chunks
        // chunks.forEach((chunk, key) => {
        //     const [chunkX, chunkZ] = key.split('-').map(Number);
        //     const distance = Math.sqrt(Math.pow(chunkX - cx, 2) + Math.pow(chunkZ - cz, 2));
        //     if (distance > CHUNK_RADIUS) {
        //         scene.remove(chunk);
        //         chunks.delete(key);
        //     }
        // });
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

    function createRasterizedChunk(tx, tz) {
        const edgeSize = 1000;
        const sampleFidelity = 1; // (0,1]
        const gap = Math.floor(1 / sampleFidelity);
        const octaveFactors = [1,8,16];
        const octaveSum = 25
        const octaves = 3;
        const offset = {
          x: tx * edgeSize,
          y: 0,
          z: tz * edgeSize,
        };
      
        const vertices = [];
        const indices = [];
        const normals = [];
        const colors = [];

        for (let row = 0; row < edgeSize; row++) {
            for (let col = 0; col < edgeSize; col++) {
            let x = offset.x + col * gap;
            let z = offset.z + row * gap;
            let y = 0;
            
            for (let idx = 0; idx < octaves; idx++) {
                y += noise.noise(x / octaveFactors[idx] / 2, z / octaveFactors[idx] /2, 0) * octaveFactors[idx];
            }

            // Determine colors
            let colmapValue = y/10
            let r, g, b;
            let idx = 9;
            while (idx >= 0){
                r = terrainColours[idx].r;
                g = terrainColours[idx].g;
                b = terrainColours[idx].b;
                
                if (colmapValue > terrainColours[idx].lower_echelon){
                    break;
                }

                idx--;
            }
            colors.push(r, g, b);

            vertices.push(x, y, z);

            // Calculate normals
            let normal = new THREE.Vector3(0, 1, 0);
            normals.push(normal.x, normal.y, normal.z);


            // Create indices for the mesh
            if (row < edgeSize - 1 && col < edgeSize - 1) {
                let topLeft = row * edgeSize + col;
                let bottomLeft = topLeft + edgeSize;
                let bottomRight = bottomLeft + 1;
                let topRight = topLeft + 1;

                indices.push(topLeft, bottomLeft, bottomRight);
                indices.push(bottomRight, topRight, topLeft);
            }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
        geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3));
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            vertexColors: true,
            flatShading: true,
        });

        return new THREE.Mesh(geometry, material);
    }

    // Add a rasterized chunk
    const tMesh = createRasterizedChunk(0,0);
    scene.add(tMesh)

    // Movement
    const keys = {w: false, a: false, s: false, d: false, space: false, shift: false};
    const velocity = new THREE.Vector3(0, 0, 0);
    const acceleration = 0.2;
    const maxSpeed = 5;
    let isMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };

    // Animate function
    function animate() {
        const delta = 0.2;
        handleKeyboardInput(delta);
        updateCameraPosition(delta);
        // updateChunks();
        renderer.render(scene, camera);
    }

    // Handle keyboard input
    function handleKeyboardInput(delta) {
        const direction = new THREE.Vector3();
    
        // Forward/Backward
        if (keys.w) {
            direction.z -= acceleration * delta;
        }
        if (keys.s) {
            direction.z += acceleration * delta;
        }
    
        // Left/Right
        if (keys.a) {
            direction.x -= acceleration * delta;
        }
        if (keys.d) {
            direction.x += acceleration * delta;
        }
    
        // Apply the camera's current rotation to the movement direction
        direction.applyQuaternion(camera.quaternion);
    
        // Add the calculated direction to the velocity
        velocity.add(direction);
        
        // Up/Down
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
    
        const terrainHeight = getTerrainHeight(camera.position.x, camera.position.z);
    
        // Prevent camera from going into terrain
        if (camera.position.y < terrainHeight + 2) {
            camera.position.y = terrainHeight + 2;
            velocity.y = 0;
        }
    }
    
    // Get terrain height at a point
    function getTerrainHeight(x, z) {
        const ns = noise.noise(x * mountainClump, z * mountainClump, 0);  
        const height = 7 + ns * mountainHeight;
    
        return height;
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
            const rotationSpeed = 0.04;
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };
    
            const pitchQuaternion = new THREE.Quaternion();
            pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -deltaMove.y * rotationSpeed);
            const yawQuaternion = new THREE.Quaternion();
            yawQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -deltaMove.x * rotationSpeed);
    
            cameraQuaternion.multiplyQuaternions(yawQuaternion, cameraQuaternion);
            cameraQuaternion.multiplyQuaternions(cameraQuaternion, pitchQuaternion);
    
            camera.quaternion.copy(cameraQuaternion);
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