import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// --- Scène ---
const scene = new THREE.Scene();

// --- Caméra ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lumière venant de devant (direction caméra → scène) ---
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 0, 5); // devant la scène
scene.add(light);

// --- Sphère de test ---
const geometry = new THREE.SphereGeometry(1, 32, 32);
const texture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg');
const material = new THREE.MeshStandardMaterial({ map: texture });
const sphere = new THREE.Mesh(geometry, material);
sphere.position.x = -2;
scene.add(sphere);

// --- Missile ---
let missile = null;
const loader = new OBJLoader();
loader.load(
    './matra-magic-2.obj',
    function (obj) {
        obj.scale.set(0.1, 0.1, 0.1);
        obj.position.x = 2;
        scene.add(obj);
        missile = obj;
    },
    undefined,
    function (error) {
        console.error('Erreur chargement OBJ:', error);
    }
);

// --- Gestion DeviceOrientation ---
window.addEventListener('deviceorientation', (event) => {
    if (!missile) return;

    // Récupère les angles (alpha, beta, gamma)
    const alpha = event.alpha ? THREE.MathUtils.degToRad(event.alpha) : 0; // Z
    const beta  = event.beta  ? THREE.MathUtils.degToRad(event.beta)  : 0; // X
    const gamma = event.gamma ? THREE.MathUtils.degToRad(event.gamma) : 0; // Y

    // Applique orientation
    missile.rotation.set(beta, gamma, alpha);
}, true);

// --- Animation ---
function animate() {
    requestAnimationFrame(animate);

    // Sphère qui tourne toute seule
    sphere.rotation.y += 0.01;
    sphere.rotation.x += 0.005;

    renderer.render(scene, camera);
}
animate();
