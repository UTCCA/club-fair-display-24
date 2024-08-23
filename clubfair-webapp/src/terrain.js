import * as THREE from 'three';
import terrainColours from "./colourConfig.json"
import { ImprovedNoise } from 'three/examples/jsm/Addons.js';

// Chunk params
const edgeSize = 800;
const staticCameraHeight = 2.0;

const Terrain = () => {
    // Init scene & camera
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    const cameraQuaternion = new THREE.Quaternion();
    camera.quaternion.copy(cameraQuaternion);
    camera.position.set(0, 40, 0);
    camera.lookAt(0, 40, 0);

    // Add lights

    const magicLightRadius = edgeSize/2
    const directionalLightYellow = new THREE.DirectionalLight(0xffff00, 0.5);
    directionalLightYellow.position.set(magicLightRadius, 10, magicLightRadius);
    scene.add(directionalLightYellow);

    const directionalLightPink = new THREE.DirectionalLight(0xff00ff, 0.5);
    directionalLightPink.position.set(-magicLightRadius, 10, -magicLightRadius);
    scene.add(directionalLightPink);

    const dGeo = new THREE.DodecahedronGeometry(20); // radius of 20

    // Define the emissive colors
    const emissiveColorPink = new THREE.Color(0xff0044); // Pink color
    const emissiveColorYellow = new THREE.Color(0x664400); // Yellow color

    // Create materials with emissive properties
    const ddMATPink = new THREE.MeshStandardMaterial({
        // color: 0xffffff,
        emissive: emissiveColorPink,
        emissiveIntensity: 5, // Adjust this value to control the strength of the glow
        // flatShading: true,
    });

    const ddMATYellow = new THREE.MeshStandardMaterial({
        // color: 0xffffff,
        emissive: emissiveColorYellow,
        emissiveIntensity: 5, // Adjust this value to control the strength of the glow
        // flatShading: true,
    });

    // Create meshes with the materials
    const pinkDD = new THREE.Mesh(dGeo, ddMATPink);
    pinkDD.position.set(-magicLightRadius, 140, -magicLightRadius);
    scene.add(pinkDD);

    const yellowDD = new THREE.Mesh(dGeo, ddMATYellow);
    yellowDD.position.set(magicLightRadius, 140, magicLightRadius);
    scene.add(yellowDD);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    // Init renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(w, h);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);

    const noise = new ImprovedNoise();

    let terrainHeights = []

    function createRasterizedChunk(tx, tz, waveSeed) {
        const sampleFidelity = 0.5; // (0,1]
        const gap = Math.floor(1 / sampleFidelity);
        const octaveFactors = [1,12,48];
        const octaveSum = 80
        const octaves = 3;

        const colourPerlinInfluence = 8

        const offset = {
          x: tx-edgeSize/2,
          y: 0,
          z: tz-edgeSize/2,
        };
      
        const vertices = [];
        const indices = [];
        const normals = [];
        const colors = [];

        for (let row = 0; row < edgeSize; row++) {

            // if (row % gap != 0) {continue;}
            let tHeightCol = [];

            for (let col = 0; col < edgeSize; col++) {

                // if (col % gap != 0) {continue;}
                let x = offset.x + col;
                let z = offset.z + row;

                let distance = Math.sqrt(x*x + z*z)
                let y = 0;
                
                for (let idx = 0; idx < octaves; idx++) {
                    y += noise.noise(x / octaveFactors[idx] / 2, z / octaveFactors[idx] /2, 0) * octaveFactors[idx];
                }

                y += (edgeSize/4 - distance)/5.2

                // Determine colors
                let OGcolmapValue = (y + 10)/octaveSum
                let noiseUpshift = (20 + noise.noise(x/colourPerlinInfluence, z/colourPerlinInfluence, 100) * colourPerlinInfluence) / octaveSum
                let waveUpshift = (20 + noise.noise(x/16, z/16, waveSeed) * colourPerlinInfluence/2) / octaveSum
                let colmapValue = OGcolmapValue + noiseUpshift;
                let r, g, b;
                let idx = 9;
                while (idx >= 0){

                    // if (idx <=1) {y=(terrainColours[2].lower_echelon - waveUpshift)*octaveSum - 10;}
                    r = terrainColours[idx].r;
                    g = terrainColours[idx].g;
                    b = terrainColours[idx].b;
                    
                    if (colmapValue > terrainColours[idx].lower_echelon){
                        break;
                    }

                    idx--;
                }
                tHeightCol.push(y);

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

            terrainHeights.push(tHeightCol);
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

    const underwaterFog = new THREE.FogExp2(0x000033, 0.05);
    const regularFog = new THREE.FogExp2(0x111111, 0.00);

    scene.fog = regularFog

    const WATER_LEVEL = -10;
    let currentWaterLevel = -10;

    // Add a rasterized chunk
    const tMesh = createRasterizedChunk(0,0,0);
    scene.add(tMesh)

    // Add some water
    const waterGeometry = new THREE.PlaneGeometry(edgeSize, edgeSize);
    const material = new THREE.MeshPhongMaterial({
    color: 0x0000ff,  // Blue color
    transparent: true,
    opacity: 0.5,     // 50% opacity
    side: THREE.DoubleSide  // Render both sides of the plane
    });

    const waterMesh = new THREE.Mesh(waterGeometry, material);
    waterMesh.position.set(0, WATER_LEVEL, 0);
    waterMesh.rotation.x = -Math.PI / 2;
    scene.add(waterMesh);

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
        const useTime = Date.now() / 100000;

        handleKeyboardInput(delta);
        updateCameraPosition(delta);
        currentWaterLevel = WATER_LEVEL + Math.sin(useTime * 10);
        waterMesh.position.set(0, currentWaterLevel, 0);
        // updateChunks();
        
        pinkDD.position.set(magicLightRadius * Math.sin(useTime), 140, magicLightRadius * Math.cos(useTime));
        directionalLightPink.position.set(magicLightRadius * Math.sin(useTime), 20, magicLightRadius * Math.cos(useTime));
        yellowDD.position.set(-magicLightRadius * Math.sin(useTime), 140, -magicLightRadius * Math.cos(useTime));
        directionalLightYellow.position.set(-magicLightRadius * Math.sin(useTime), 20, -magicLightRadius * Math.cos(useTime));
        
        pinkDD.rotation.x += 0.0007;
        pinkDD.rotation.y += 0.0007;
        yellowDD.rotation.x += 0.0007;
        yellowDD.rotation.y += 0.0007;

        renderer.render(scene, camera);
    }

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
        console.log("camera y: %f", camera.position.y);
    
        // Spacebar
        if (keys.space && isGrounded) {
            velocity.y = 1.7; // Initial jump velocity
            isGrounded = false;            
        }
        if (keys.space && isSwimming && camera.position.y <= currentWaterLevel) {
            velocity.y = 1;
            isSwimming = false;            
        }
    
        velocity.clampScalar(-maxSpeed, maxSpeed);
    }
    
    // Add gravity
    const GRAVITY = -0.3;
    let isGrounded = false;
    let isSwimming = false;

    function updateCameraPosition(delta) {

        // Apply gravity if not grounded
        if (!isGrounded) {
            velocity.y += GRAVITY * delta;
        }

        // Apply friction to horizontal movement
        velocity.x *= 0.95;
        velocity.z *= 0.95;

        const terrainHeight = getTerrainHeight(camera.position.x, camera.position.z);

        // Check if grounded
        if (camera.position.y <= terrainHeight + staticCameraHeight) {
            camera.position.y = terrainHeight + staticCameraHeight;
            velocity.y = 0;
            isGrounded = true;
        } 
        else {
            isGrounded = false;
        }

        // Check if swimming
        if (camera.position.y <= currentWaterLevel) {
            scene.fog = underwaterFog;
            camera.position.add(velocity.clone().multiplyScalar(delta * 0.3));
            isSwimming = true;
        } 
        else {
            scene.fog = regularFog;
            camera.position.add(velocity.clone().multiplyScalar(delta));
            isSwimming = false
        }
    }
    
    // Get terrain height at a point
    function getTerrainHeight(x, z) {
        
        let height;
        
        try {
            height = terrainHeights[Math.floor(z)+edgeSize/2][Math.floor(x)+edgeSize/2];
        } 
        catch (error) {
            console.log(x,z)
            height = 0;  
        }
        
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
        }
    }

    // Handle mouse movement
    const MIN_PITCH_ANGLE = 0.1;
    const MAX_PITCH_ANGLE = Math.PI * 0.95;
    let currentPitch = 0;
    let currentYaw = 0;

    function onMouseMove(event) {
        if (isMouseDown) {
            const rotationSpeed = 0.0225;
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            currentYaw -= deltaMove.x * rotationSpeed;
            currentPitch -= deltaMove.y * rotationSpeed;

            // Restrict pitch
            currentPitch = Math.max(MIN_PITCH_ANGLE - Math.PI / 2, Math.min(MAX_PITCH_ANGLE - Math.PI / 2, currentPitch));

            // Create a new quaternion from calculated angles
            const euler = new THREE.Euler(currentPitch, currentYaw, 0, 'YXZ');
            cameraQuaternion.setFromEuler(euler);

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