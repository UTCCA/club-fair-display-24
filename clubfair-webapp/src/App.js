import * as THREE from 'three';
import './App.css';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    const app = document.querySelector('.App');
    app.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 50000;
    const posArray = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount*3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
      if (i % 3 === 2) {
        posArray[i] = Math.random() * 100;
      }
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x00ff87,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    const curveMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        void main() {
          float intensity = length(vPosition) * 0.1;
          gl_FragColor = vec4(0.0, 1.0, 0.5, 1.0) * intensity;  // Greenish glow
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

    camera.position.z = 15;

    const clock = new THREE.Clock();

    let frame = 0;

    function animate() {
      // if (frame > 0) return;
      requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      const positions = particlesGeometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const x = positions[i3];
        const y = positions[i3 + 1];
        const z = positions[i3 + 2];
        const speed = Math.sin(elapsedTime * 0.1);

        positions[i3] = ((x + Math.cos(elapsedTime * 0.1 + i * 0.00001) * speed * 0.05 + 10) % 20) - 10;
        positions[i3 + 1] = ((y + Math.sin(elapsedTime * 0.1 + i * 0.00001) * speed * 0.02 + 10) % 30) + 5;
        positions[i3 + 2] = z;
      }
      particlesGeometry.attributes.position.needsUpdate = true;

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

    animate();

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onWindowResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', onWindowResize);
      app.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="App">
    </div>
  );
}

export default App;
