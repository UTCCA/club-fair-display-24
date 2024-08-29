import * as THREE from 'three';
import terrainColours from "./colourConfig.json";
import { ImprovedNoise } from 'three/examples/jsm/Addons.js';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// Constants
const edgeSize = 1000;
const staticCameraHeight = 2.0;
const WATER_LEVEL = -10;
const GRAVITY = -0.3;
const g = 9.81;
const ROTATION_SMOOTHING = 0.1;
const COMPLEMENTARY_FILTER_ALPHA = 0.98;
const DRIFT_CORRECTION_FACTOR = 0.992;
const TILT_SENSITIVITY = 0.0005;
const GYRO_SENSITIVITY = 0.01;
const GYRO_THRESHOLD = 0.1;
const MIN_PITCH_ANGLE = 0.1;
const MAX_PITCH_ANGLE = Math.PI * 0.95;
const acceleration = 0.2;
const magicLightRadius = edgeSize / 2.5;

const API_CALL_INTERVAL = 10;

const maxSpeed = 5;

const underwaterFog = new THREE.FogExp2(0x000033, 0.05);
const regularFog = new THREE.FogExp2(0x111111, 0.002);

const socket = io('http://localhost:8080');

let controllerState = null;
let lastStateUpdateTime = Date.now();

let pitchSign = 1;

socket.on('connect', () => {
    console.log('Connected to WebSocket server');
});

socket.on('controller_state', (data) => {
    if(Date.now() - lastStateUpdateTime < API_CALL_INTERVAL){
        // console.log(lastStateUpdateTime - Date.now());
        return;
    }
    lastStateUpdateTime = Date.now();
    controllerState = data;
    // console.log(data);
});

const Terrain = (properties) => {

    // const [controllerState, setControllerState] = useState(null);

    // const [stateUpdateTime, setStateUpdateTime] = useState(Date.now());

    // useEffect(() => {

    // }, [controllerState, stateUpdateTime]);

    // const [WASDEnabled, setWASDEnabled] = useState(properties.usingWASDControls);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const terrainRef = useRef(null);
    const waterMeshRef = useRef(null);
    const particlesMeshRef = useRef(null);

    const isGroundedRef = useRef(null);
    const isSwimmingRef = useRef(null);
    const terrainHeightsRef = useRef(null);
    const currentWaterLevelRef = useRef(null);

    const noiseRef = useRef(new ImprovedNoise());

    isGroundedRef.current = false;
    isSwimmingRef.current = false;
    currentWaterLevelRef.current = WATER_LEVEL;

    const keys = useRef({ w: false, a: false, s: false, d: false, space: false });
    const buttons = useRef({ w: false, a: false, s: false, d: false, space: false });
    const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
    const isMouseDownRef = useRef(false);
    const previousMousePositionRef = useRef({ x: 0, y: 0 });
    const currentPitchRef = useRef(0);
    const currentYawRef = useRef(0);

    const directionalLightYellowRef = useRef(null);
    const directionalLightPinkRef = useRef(null);
    const pinkDDRef = useRef(null);


    const setupScene = useCallback(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 40, 0);
        camera.lookAt(0, 40, 0);

        directionalLightYellowRef.current = new THREE.DirectionalLight(0xffff00, 0.5);
        directionalLightYellowRef.current.position.set(magicLightRadius, 10, magicLightRadius);
        scene.add(directionalLightYellowRef.current);

        directionalLightPinkRef.current = new THREE.DirectionalLight(0xff00ff, 0.5);
        directionalLightPinkRef.current.position.set(-magicLightRadius, 10, -magicLightRadius);
        scene.add(directionalLightPinkRef.current);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 10, 0);
        scene.add(directionalLight);

        const dGeo = new THREE.DodecahedronGeometry(20);
        const emissiveColorPink = new THREE.Color(0xff0044);
        const ddMATPink = new THREE.MeshStandardMaterial({
            color: emissiveColorPink,
            emissive: emissiveColorPink,
            emissiveIntensity: 5,
        });

        pinkDDRef.current = new THREE.Mesh(dGeo, ddMATPink);
        pinkDDRef.current.position.set(-magicLightRadius, 400, -magicLightRadius);
        scene.add(pinkDDRef.current);

        return { scene, camera };
    }, []);

    const createRasterizedChunk = useCallback((tx, tz, waveSeed) => {
        
        terrainHeightsRef.current = [];

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
                    y += noiseRef.current.noise(x / octaveFactors[idx] / 2, z / octaveFactors[idx] /2, 0) * octaveFactors[idx];
                }

                y += (edgeSize/4 - distance)/5.2

                // Determine colors
                let OGcolmapValue = (y + 10)/octaveSum
                let noiseUpshift = (20 + noiseRef.current.noise(x/colourPerlinInfluence, z/colourPerlinInfluence, 100) * colourPerlinInfluence) / octaveSum
                let waveUpshift = (20 + noiseRef.current.noise(x/16, z/16, waveSeed) * colourPerlinInfluence/2) / octaveSum
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

            terrainHeightsRef.current.push(tHeightCol);
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
    }, []);

    const createParticleSystem = useCallback(() => {
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 2500;
        const posArray = new Float32Array(particleCount * 3);
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(particleCount), 1));

        const particlesMaterial = new THREE.ShaderMaterial({
            vertexShader: `
              attribute float size;
              varying float vSize;
              void main() {
                vSize = size;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
              }
            `,
            fragmentShader: `
              uniform vec3 color;
              varying float vSize;
              void main() {
                if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.5) discard;
                gl_FragColor = vec4(color, 1.0);
              }
            `,
            uniforms: {
              color: { value: new THREE.Color(0xffffff) }
            },
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
        });

        let OGParticlePositions = particlesGeometry.attributes.position.array;
        let phi = Math.PI * (Math.sqrt(5.0) - 1.0)
        const sphereRadius = edgeSize * 0.707;
        const randomInfluence = 100;

        for (let i = 0; i < particleCount; i++) {
            let y = (1 - (i / (particleCount - 1.0)) * 2.0)
            let radius = Math.sqrt(1 - y * y)

            let theta = phi * i

            let x = Math.cos(theta) * radius
            let z = Math.sin(theta) * radius

            const i3 = i * 3;
            OGParticlePositions[i3] = sphereRadius*x + (Math.random() - 0.5) * randomInfluence;
            OGParticlePositions[i3 + 1] = sphereRadius*y + (Math.random() - 0.5) * randomInfluence;
            OGParticlePositions[i3 + 2] = sphereRadius*z + (Math.random() - 0.5) * randomInfluence;
            
        }
        particlesGeometry.attributes.position.needsUpdate = true;
        OGParticlePositions = new Float32Array(particlesGeometry.attributes.position.array);

        return new THREE.Points(particlesGeometry, particlesMaterial);
    }, []);

    useEffect(() => {
        const { scene, camera } = setupScene();
        sceneRef.current = scene;
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const terrain = createRasterizedChunk(0, 0, 0);
        scene.add(terrain);
        terrainRef.current = terrain;

        const waterGeometry = new THREE.PlaneGeometry(edgeSize * 4, edgeSize * 4);
        const waterMaterial = new THREE.MeshPhongMaterial({
            color: 0x0000ff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        waterMesh.position.set(0, WATER_LEVEL, 0);
        waterMesh.rotation.x = -Math.PI / 2;
        scene.add(waterMesh);
        waterMeshRef.current = waterMesh;

        const particlesMesh = createParticleSystem();
        scene.add(particlesMesh);
        particlesMeshRef.current = particlesMesh;

        const animate = () => {
            requestAnimationFrame(animate);

            // if(Date.now() - stateUpdateTime > API_CALL_INTERVAL){
            //     setStateUpdateTime(Date.now());
            //     fetchData();
            // }

            // WASDEnabled = properties.usingWASDControls;

            updateScene();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            renderer.dispose();
            document.body.removeChild(renderer.domElement);
            scene.remove(terrain);
            scene.remove(waterMesh);
            scene.remove(particlesMesh);
            terrain.geometry.dispose();
            terrain.material.dispose();
            waterMesh.geometry.dispose();
            waterMesh.material.dispose();
            particlesMesh.geometry.dispose();
            particlesMesh.material.dispose();
        };
    }, [setupScene, createRasterizedChunk, createParticleSystem]);

    const handleKeyboardInput = useCallback((delta) => {
        const direction = new THREE.Vector3();
        const camera = cameraRef.current;
        const velocity = velocityRef.current;

        if(controllerState!=null && (Date.now() - lastStateUpdateTime < 5000)){
            // console.log(controllerState);
            // if (controllerState.jump)
            // {
            //     keys.current.space = true
            // } else {
            //     keys.current.space = false
            // }
            if (controllerState.left)
            {
                buttons.current.s = true
            } else {
                buttons.current.s = false
            }
            if (controllerState.right)
            {
                buttons.current.a = true
            } else {
                buttons.current.a = false
            }
            if (controllerState.backward)
            {
                buttons.current.w = true
            } else {
                buttons.current.w = false
            }
            if (controllerState.forward)
            {
                buttons.current.d = true
            } else {
                buttons.current.d = false
            }
            
            // Get the current camera rotation
            const currentRotation = new THREE.Euler().setFromQuaternion(cameraRef.current.quaternion);
            const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(currentRotation);

            // Transform gyroscope data to world space
            const worldGyro = new THREE.Vector3(
                pitchSign * controllerState.gyroscope.x,
                controllerState.gyroscope.z,
                controllerState.gyroscope.y
            );//.applyMatrix4(rotationMatrix);

            // Apply gyroscope rotation with improved thresholding and drift correction
            if (!controllerState.jump && Math.abs(worldGyro.x) > GYRO_THRESHOLD) {
                currentPitchRef.current += worldGyro.x * GYRO_SENSITIVITY * DRIFT_CORRECTION_FACTOR;
            } else if (!controllerState.jump && controllerState.accelerometer.z >= 8.0) {
                currentPitchRef.current *= DRIFT_CORRECTION_FACTOR; // Slowly reduce any accumulated error
            }

            if (!controllerState.jump && Math.abs(worldGyro.y) > GYRO_THRESHOLD) {
                currentYawRef.current += worldGyro.y * GYRO_SENSITIVITY;// * DRIFT_CORRECTION_FACTOR;
            }

            const pr = currentPitchRef.current
            currentPitchRef.current = Math.max(MIN_PITCH_ANGLE - Math.PI / 2, Math.min(MAX_PITCH_ANGLE - Math.PI / 2, currentPitchRef.current));
            if (pr !== currentPitchRef.current){
                // pitchSign *= -1;
            }

            const euler = new THREE.Euler(currentPitchRef.current, currentYawRef.current, 0, 'YXZ');
            cameraRef.current.quaternion.setFromEuler(euler);
            
        }
    
        // Forward/Backward
        if (keys.current.w || buttons.current.w) {
            direction.z -= 1;
        }
        if (keys.current.s || buttons.current.s) {
            direction.z += 1;
        }
    
        // Left/Right
        if (keys.current.a || buttons.current.a) {
            direction.x -= 1;
        }
        if (keys.current.d || buttons.current.d) {
            direction.x += 1;
        }
    
        // Normalize the direction vector
        if (direction.lengthSq() > 0) {
            direction.normalize();
        }
    
        // Apply the camera's current rotation to the movement direction
        direction.applyQuaternion(camera.quaternion);
    
        // Scale the direction by acceleration and delta time
        direction.multiplyScalar(acceleration * delta);
    
        // Add the calculated direction to the velocity
        velocity.add(direction);
    
        // Apply speed limit
        const speed = velocity.length();
        if (speed > maxSpeed) {
            velocity.multiplyScalar(maxSpeed / speed);
        }
    
        // Handle jump
        if ((keys.current.space || buttons.current.space) && isGroundedRef.current) {
            velocity.y = 1.7; // Initial jump velocity
            isGroundedRef.current = false;
        }
        if ((keys.current.space || buttons.current.space) && isSwimmingRef.current && camera.position.y <= currentWaterLevelRef.current) {
            velocity.y = 1;
            isSwimmingRef.current = false;
        }
    }, []);
    
    // Helper function to get terrain height
    const getTerrainHeight = useCallback((x, z) => {
        const terrainHeights = terrainHeightsRef.current;
        let height;
        
        try {
            height = terrainHeights[Math.floor(z) + edgeSize / 2][Math.floor(x) + edgeSize / 2];
        } catch (error) {
            // console.log(x, z);
            height = 0;
        }
        
        return height;
    }, []);

    const updateCameraPosition = useCallback((delta) => {
        const camera = cameraRef.current;
        const velocity = velocityRef.current;
    
        // Apply gravity if not grounded
        if (!isGroundedRef.current) {
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
            isGroundedRef.current = true;
        } else {
            isGroundedRef.current = false;
        }
    
        // Check if swimming
        if (camera.position.y <= currentWaterLevelRef.current) {
            sceneRef.current.fog = underwaterFog;
            camera.position.add(velocity.clone().multiplyScalar(delta * 0.3));
            isSwimmingRef.current = true;
        } else {
            sceneRef.current.fog = regularFog;
            camera.position.add(velocity.clone().multiplyScalar(delta));
            isSwimmingRef.current = false;
        }
    }, [getTerrainHeight]);
    
    
    const updateParticles = useCallback((elapsedTime) => {
        const particlesMesh = particlesMeshRef.current;
        const positions = particlesMesh.geometry.attributes.position.array;
        const sizes = particlesMesh.geometry.attributes.size.array;

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];

            sizes[i / 3] = noiseRef.current.noise(x / 250.0, z / 250.0, elapsedTime * 10) * 10 + 5.5;

            // positions[i] = x + Math.sin(elapsedTime);
            // positions[i + 1] = y + Math.cos(elapsedTime);
            // positions[i + 2] = z + Math.sin(elapsedTime) * Math.cos(elapsedTime);
        }

        // particlesMesh.geometry.attributes.position.needsUpdate = true;
        particlesMesh.geometry.attributes.size.needsUpdate = true;
    }, []);

    const updateScene = useCallback(() => {
        const delta = 0.2;
        const elapsedTime = Date.now() / 100000;

        handleKeyboardInput(delta);
        updateCameraPosition(delta);

        const currentWaterLevel = WATER_LEVEL + Math.sin(elapsedTime * 10);
        currentWaterLevelRef.current = currentWaterLevel;
        waterMeshRef.current.position.set(0, currentWaterLevel, 0);

        pinkDDRef.current.position.set(magicLightRadius * Math.sin(elapsedTime), 400, magicLightRadius * Math.cos(elapsedTime));
        directionalLightPinkRef.current.position.set(magicLightRadius * Math.sin(elapsedTime), 20, magicLightRadius * Math.cos(elapsedTime));

        const hslColor = new THREE.Color(directionalLightPinkRef.current.color);

        if(controllerState !== null && controllerState.potentiometer != 0){
            
            const hsl = {h: 0, s: 0, l: 0};
            hslColor.getHSL(hsl);
            
            console.log(controllerState.potentiometer/100, hsl.h);
            hslColor.setHSL(controllerState.potentiometer/100, hsl.s, hsl.l);
            directionalLightPinkRef.current.color.set(hslColor);
            pinkDDRef.current.material.color.set(hslColor);
            pinkDDRef.current.material.emissive.set(hslColor);


        }

        directionalLightYellowRef.current.position.set(-magicLightRadius * Math.sin(elapsedTime), 20, -magicLightRadius * Math.cos(elapsedTime));
        
        if(controllerState !== null && controllerState.potentiometer != 0){
            
            const hsl = {h: 0, s: 0, l: 0};
            hslColor.getHSL(hsl);
            
            console.log(1-controllerState.potentiometer/100, hsl.h);
            hslColor.setHSL(1-controllerState.potentiometer/100, hsl.s, hsl.l);
            directionalLightYellowRef.current.color.set(hslColor);

        }

        pinkDDRef.current.rotation.x += 0.0007;
        pinkDDRef.current.rotation.y += 0.0007;

        updateParticles(elapsedTime);
    }, [handleKeyboardInput, updateCameraPosition, updateParticles]);

    const handleKeyDown = useCallback((event) => {
        switch (event.code) {
            case 'KeyW': keys.current.w = true; break;
            case 'KeyA': keys.current.a = true; break;
            case 'KeyS': keys.current.s = true; break;
            case 'KeyD': keys.current.d = true; break;
            case 'Space': 
                keys.current.space = true; 
                event.preventDefault();
                break;
            default: break;
        }
    }, []);

    const handleKeyUp = useCallback((event) => {
        switch (event.code) {
            case 'KeyW': keys.current.w = false; break;
            case 'KeyA': keys.current.a = false; break;
            case 'KeyS': keys.current.s = false; break;
            case 'KeyD': keys.current.d = false; break;
            case 'Space': 
                keys.current.space = false; 
                event.preventDefault();
                break;
            default: break;
        }
    }, []);

    const handleMouseMove = useCallback((event) => {
        if (isMouseDownRef.current) {
            const rotationSpeed = 0.0225;
            const deltaMove = {
                x: event.clientX - previousMousePositionRef.current.x,
                y: event.clientY - previousMousePositionRef.current.y
            };

            currentYawRef.current -= deltaMove.x * rotationSpeed;
            currentPitchRef.current -= deltaMove.y * rotationSpeed;

            currentPitchRef.current = Math.max(MIN_PITCH_ANGLE - Math.PI / 2, Math.min(MAX_PITCH_ANGLE - Math.PI / 2, currentPitchRef.current));

            const euler = new THREE.Euler(currentPitchRef.current, currentYawRef.current, 0, 'YXZ');
            cameraRef.current.quaternion.setFromEuler(euler);
        }

        previousMousePositionRef.current = {
            x: event.clientX,
            y: event.clientY
        };
    }, []);

    const handleMouseDown = useCallback(() => {
        isMouseDownRef.current = true;
    }, []);

    const handleMouseUp = useCallback(() => {
        isMouseDownRef.current = false;
    }, []);

    const handleWindowResize = useCallback(() => {
        if (cameraRef.current && rendererRef.current) {
            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('resize', handleWindowResize);
        };
    }, [handleKeyDown, handleKeyUp, handleMouseMove, handleMouseDown, handleMouseUp, handleWindowResize]);

    // useEffect(() => {
    //     setWASDEnabled(properties.usingWASDControls);
    // }, [properties.usingWASDControls]);

    return null;
};

export default Terrain;