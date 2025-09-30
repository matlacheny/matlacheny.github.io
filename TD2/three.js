import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// --- Scène, caméra, renderer ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lumière ---
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 0, 5);
scene.add(light);

// --- Sphère ---
const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
const sphereMat = new THREE.MeshStandardMaterial({
    map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg')
});
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
sphere.position.x = -2;
scene.add(sphere);

// --- Missile ---
let missile = null;
const loader = new OBJLoader();
loader.load(
    './matra-magic-2.obj',
    (obj) => {
        obj.scale.set(0.1, 0.1, 0.1);
        obj.position.x = 2;
        scene.add(obj);
        missile = obj;
    },
    undefined,
    (err) => console.error(err)
);

// --- Fumée derrière missile ---
const smokeParticles = [];
const smokeGeo = new THREE.SphereGeometry(0.05, 8, 8);
const smokeMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.6 });

function spawnSmoke() {
    if (!missile) return;
    const p = new THREE.Mesh(smokeGeo, smokeMat.clone());
    p.position.copy(missile.position);
    scene.add(p);
    smokeParticles.push({ mesh: p, life: 1.0 });
}

// --- Pluie ---
const rainParticles = [];
const rainGeo = new THREE.SphereGeometry(0.02, 6, 6);
const rainMat = new THREE.MeshBasicMaterial({ color: 0x3399ff, transparent: true, opacity: 0.8 });
const rainCount = 200; // nombre de gouttes

for (let i = 0; i < rainCount; i++) {
    const p = new THREE.Mesh(rainGeo, rainMat.clone());
    p.position.set(
        (Math.random() - 0.5) * 10,
        Math.random() * 10,
        (Math.random() - 0.5) * 10
    );
    scene.add(p);
    rainParticles.push(p);
}

// --- DeviceOrientation ---
window.addEventListener('deviceorientation', (event) => {
    if (!missile) return;
    const alpha = event.alpha ? THREE.MathUtils.degToRad(event.alpha) : 0;
    const beta  = event.beta  ? THREE.MathUtils.degToRad(event.beta)  : 0;
    const gamma = event.gamma ? THREE.MathUtils.degToRad(event.gamma) : 0;
    missile.rotation.set(beta, gamma, alpha);
}, true);

// --- Animation ---
function animate() {
    requestAnimationFrame(animate);

    sphere.rotation.y += 0.01;
    sphere.rotation.x += 0.005;

    // --- Update fumée ---
    spawnSmoke();
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
        const p = smokeParticles[i];
        p.mesh.position.y += 0.01;
        p.mesh.position.z -= 0.02;
        p.mesh.material.opacity -= 0.01;
        p.life -= 0.01;
        if (p.life <= 0) {
            scene.remove(p.mesh);
            smokeParticles.splice(i, 1);
        }
    }

    // --- Update pluie ---
    rainParticles.forEach(p => {
        p.position.y -= 0.2; // vitesse de chute
        if (p.position.y < -5) { // réinitialiser en haut
            p.position.y = Math.random() * 5 + 5;
            p.position.x = (Math.random() - 0.5) * 10;
            p.position.z = (Math.random() - 0.5) * 10;
        }
    });

    renderer.render(scene, camera);
}

animate();
