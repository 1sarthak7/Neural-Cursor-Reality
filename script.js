import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// --- Scene Setup ---
const canvas = document.querySelector("#webgl");
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.1);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 4;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;

// --- Post-Processing (Bloom) ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 2.0, 0.4, 0.1);
composer.addPass(bloomPass);

// --- Custom Shader Material (Fresnel + Audio Noise) ---
const geometry = new THREE.IcosahedronGeometry(0.8, 64); 

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uAudioFrequency: { value: 0 },
    color1: { value: new THREE.Color(0x00d2ff) }, // Cyan
    color2: { value: new THREE.Color(0x3a7bd5) }  // Deep Blue
  },
  vertexShader: `
    uniform float uTime;
    uniform float uAudioFrequency;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vDisplacement;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      // Calculate noise based on position and time
      float noise = sin(position.x * 5.0 + uTime) * sin(position.y * 5.0 + uTime) * sin(position.z * 5.0 + uTime);
      
      // Displace vertices outward along their normal, scaled by audio
      float displacement = noise * (uAudioFrequency * 0.5);
      vec3 newPosition = position + normal * displacement;
      vDisplacement = displacement;

      vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float uAudioFrequency;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vDisplacement;

    void main() {
      // Fresnel Effect (Edge Glow)
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = dot(viewDir, normal);
      fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
      fresnel = pow(fresnel, 3.0);

      // Base color mix based on audio displacement
      vec3 baseColor = mix(color2, color1, vDisplacement * 2.0 + 0.5);
      
      // Add intense glowing edge
      vec3 finalColor = baseColor + (color1 * fresnel * (1.0 + uAudioFrequency));
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
  wireframe: true, 
  transparent: true,
  blending: THREE.AdditiveBlending
});

const orb = new THREE.Mesh(geometry, material);
scene.add(orb);

// --- Background Particles ---
const particlesGeo = new THREE.BufferGeometry();
const particleCount = 1000;
const posArray = new Float32Array(particleCount * 3);
for(let i = 0; i < particleCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 15;
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMat = new THREE.PointsMaterial({
    size: 0.02,
    color: 0x88ccff,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending
});
const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particlesMesh);

// --- Interaction & Lerping Utilities ---
const mouse = new THREE.Vector2(0, 0);
const targetMouse = new THREE.Vector2(0, 0);
const lerp = (start, end, factor) => start + (end - start) * factor;

window.addEventListener("mousemove", (e) => {
  targetMouse.x = (e.clientX / innerWidth) * 2 - 1;
  targetMouse.y = -(e.clientY / innerHeight) * 2 + 1;
});

// --- Smooth Magnetic UI ---
const magnets = document.querySelectorAll(".magnetic");

magnets.forEach(btn => {
  btn.tx = 0; btn.ty = 0;
  btn.cx = 0; btn.cy = 0;

  btn.addEventListener("mousemove", (e) => {
    const rect = btn.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = e.clientY - rect.top - rect.height / 2;
    
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 100) {
      btn.tx = dx * 0.4;
      btn.ty = dy * 0.4;
    } else {
      btn.tx = 0;
      btn.ty = 0;
    }
  });

  btn.addEventListener("mouseleave", () => {
    btn.tx = 0;
    btn.ty = 0;
  });
});

// --- Audio Setup ---
let audioCtx, analyser, dataArray;
let isAudioActive = false;

document.getElementById('start-btn').addEventListener('click', async () => {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        isAudioActive = true;
        
        const overlay = document.getElementById('start-overlay');
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 700);
        
    } catch (err) {
        console.error("Audio initialization failed. Using visual only.", err);
        const overlay = document.getElementById('start-overlay');
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 700);
    }
});

// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();

  // Process Audio Data
  let audioFreq = 0;
  if (isAudioActive && analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for(let i = 0; i < 20; i++) sum += dataArray[i];
    audioFreq = (sum / 20) / 256; 
  }

  // Update Shader Uniforms
  material.uniforms.uTime.value = elapsed;
  material.uniforms.uAudioFrequency.value = lerp(material.uniforms.uAudioFrequency.value, audioFreq, 0.1);

  // Smoothly interpolate cursor position
  mouse.x = lerp(mouse.x, targetMouse.x, 0.05);
  mouse.y = lerp(mouse.y, targetMouse.y, 0.05);

  // Rotate and move orb
  orb.position.x = mouse.x * 3;
  orb.position.y = mouse.y * 2;
  orb.rotation.y = elapsed * 0.2;
  orb.rotation.x = elapsed * 0.1;

  // Slowly rotate background particles
  particlesMesh.rotation.y = elapsed * 0.05;

  // Update Magnetic Buttons Smoothly
  magnets.forEach(btn => {
    btn.cx = lerp(btn.cx, btn.tx, 0.1);
    btn.cy = lerp(btn.cy, btn.ty, 0.1);
    btn.style.transform = `translate(${btn.cx}px, ${btn.cy}px)`;
  });

  composer.render();
  requestAnimationFrame(animate);
}

animate();

// --- Window Resize Handling ---
window.addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});