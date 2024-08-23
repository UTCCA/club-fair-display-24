import * as THREE from 'three';
import terrainColours from "./colourConfig.json"
import { ImprovedNoise } from 'three/examples/jsm/Addons.js';

// Chunk params
const edgeSize = 1000;
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
    camera.lookAt(-1, 40, 0);

    // Add lights
    const magicLightRadius = edgeSize/2.5
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
    pinkDD.position.set(-magicLightRadius, 400, -magicLightRadius);
    scene.add(pinkDD);

    // const yellowDD = new THREE.Mesh(dGeo, ddMATYellow);
    // yellowDD.position.set(magicLightRadius, 400, magicLightRadius);
    // scene.add(yellowDD);

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
    const regularFog = new THREE.FogExp2(0x111111, 0.002);

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

        // if (currentWaterLevel)
        
    
        const terrainHeight = getTerrainHeight(camera.position.x, camera.position.z);
    
        // Prevent camera from going into terrain
        if (camera.position.y < terrainHeight + staticCameraHeight) {
            camera.position.y = terrainHeight + staticCameraHeight;
            velocity.y = 0;
        }

        if (camera.position.y <= currentWaterLevel) {
            scene.fog = underwaterFog
            velocity.multiplyScalar(0.5);
        } else {
            scene.fog = regularFog
            velocity.multiplyScalar(0.9);
        }
    }
    
    // Get terrain height at a point
    function getTerrainHeight(x, z) {
        
        let height;
        
        try {

            height = terrainHeights[Math.floor(z)+edgeSize/2][Math.floor(x)+edgeSize/2];

        } catch (error) {

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

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 2500;
    const posArray = new Float32Array(particleCount * 3);
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(particleCount), 1));

    // const particlesMaterial = new THREE.PointsMaterial({
    //   color: 0xffffff,
    //   transparent: true,
    //   opacity: 0.8,
    //   blending: THREE.AdditiveBlending,
    //   sizeAttenuation: true
    // });

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
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    const curveMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vPosition;
            varying float vSize;
            
            void main() {
                vPosition = position;
                vSize = size;
            }
        `,
        fragmentShader: `
            varying vec3 vPosition;
            varying float vSize;
            
            void main() {
                float intensity = length(vPosition) * 0.1;
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0) * intensity; // Greenish glow
            }
        `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    let curveIndices = {};
    const positions = particlesGeometry.attributes.position.array;
    const linesCount = 0;

    for (let i = 0; i < linesCount; i++) {
      const index1 = Math.floor(Math.random() * particleCount) * 3;
      const index2 = Math.floor(Math.random() * particleCount) * 3;
      curveIndices[i] = [index1, index2];

      const point1 = new THREE.Vector3(positions[index1], positions[index1 + 1], positions[index1 + 2]);
      const point2 = new THREE.Vector3(positions[index2], positions[index2 + 1], positions[index2 + 2]);

      const curve = new THREE.CatmullRomCurve3([point1, point2]);
      const curveGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
      const curveLine = new THREE.Line(curveGeometry, curveMaterial);
      scene.add(curveLine);
    }

    let frame = 0;

    // Fibboniaci sphere algo to init. Particles

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

    // Animate function
    function animate() {
        const delta = 0.2;
        const elapsedTime = Date.now();
        const useTime = elapsedTime / 100000;

        handleKeyboardInput(delta);
        updateCameraPosition(delta);
        currentWaterLevel = WATER_LEVEL + Math.sin(useTime * 10);
        waterMesh.position.set(0, currentWaterLevel, 0);
        // updateChunks();
        
        pinkDD.position.set(magicLightRadius * Math.sin(useTime), 400, magicLightRadius * Math.cos(useTime));
        directionalLightPink.position.set(magicLightRadius * Math.sin(useTime), 20, magicLightRadius * Math.cos(useTime));
        // yellowDD.position.set(-magicLightRadius * Math.sin(useTime), 400, -magicLightRadius * Math.cos(useTime));
        directionalLightYellow.position.set(-magicLightRadius * Math.sin(useTime), 20, -magicLightRadius * Math.cos(useTime));
        
        pinkDD.rotation.x += 0.0007;
        pinkDD.rotation.y += 0.0007;
        // yellowDD.rotation.x += 0.0007;
        // yellowDD.rotation.y += 0.0007;

        const positions = particlesGeometry.attributes.position.array;
        const sizes = particlesGeometry.attributes.size.array;
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const x = OGParticlePositions[i3];
            const y = OGParticlePositions[i3 + 1];
            const z = OGParticlePositions[i3 + 2];

            const adj = 4 * Math.sin(useTime);

            sizes[i] = noise.noise(x/250.0, z/250.0, useTime * 10)*10 + 5.5;
            // sizes[i] = Math.random()*10;
            // sizes[i] = 100;

            positions[i3] = x + Math.sin(useTime);
            positions[i3 + 1] = y + Math.cos(useTime);
            positions[i3 + 2] = z + Math.sin(useTime) * Math.cos(useTime);
        }
        particlesGeometry.attributes.position.needsUpdate = true;
        particlesGeometry.attributes.size.needsUpdate = true;

        const curves = scene.children.filter(child => child.isLine);
        curves.forEach((curve, index) => {
            const curveGeometry = curve.geometry;
            const indicies = curveIndices[index];
            const point1 = new THREE.Vector3(positions[indicies[0]], positions[indicies[0] + 1], positions[indicies[0] + 2]);
            const point2 = new THREE.Vector3(positions[indicies[1]], positions[indicies[1] + 1], positions[indicies[1] + 2]);
            const newCurve = new THREE.CatmullRomCurve3([point1, point2]);
            curveGeometry.setFromPoints(newCurve.getPoints(50));
        });

        frame++;

        renderer.render(scene, camera);
    }

};
  
export default Terrain;