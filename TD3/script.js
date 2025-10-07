const canvas = document.getElementById("renderCanvas");
const info = document.getElementById("info");
const engine = new BABYLON.Engine(canvas, true);

const createScene = () => {
    const scene = new BABYLON.Scene(engine);
    const earthRadius = 1;
    const cameraDistance = 3;

    // --- Camera initially over Europe (Paris) ---
    const europeLat = 48.8566;
    const europeLon = 2.3522;
    const phiEurope = BABYLON.Tools.ToRadians(90 - europeLat);
    const thetaEurope = BABYLON.Tools.ToRadians(europeLon + 180);

    const camX = cameraDistance * Math.sin(phiEurope) * Math.cos(thetaEurope);
    const camY = cameraDistance * Math.cos(phiEurope);
    const camZ = cameraDistance * Math.sin(phiEurope) * Math.sin(thetaEurope);

    const camera = new BABYLON.ArcRotateCamera(
        "Camera",
        0,
        0,
        cameraDistance,
        BABYLON.Vector3.Zero(),
        scene
    );
    camera.setPosition(new BABYLON.Vector3(camX, camY, camZ));
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = earthRadius + 0.001;
    camera.upperRadiusLimit = 10;
    camera.wheelDeltaPercentage = 0.005;
    camera.minZ = 0.001;

    // --- Light ---
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
    light.intensity = 1.2;

    // --- Earth ---
    const earth = BABYLON.MeshBuilder.CreateSphere("earth", { diameter: earthRadius * 2, segments: 64 }, scene);
    const earthMat = new BABYLON.StandardMaterial("earthMat", scene);
    const earthTexture = new BABYLON.Texture("earth.png", scene, false, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    earthTexture.vScale = 1;
    earthTexture.uScale = -1; // flip horizontal
    earthMat.diffuseTexture = earthTexture;
    earthMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    earth.material = earthMat;
    scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    // --- Lat/Lon to Cartesian ---
    function latLonToCartesian(lat, lon, radius) {
        const phi = BABYLON.Tools.ToRadians(90 - lat);
        const theta = BABYLON.Tools.ToRadians(lon + 180);
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        return new BABYLON.Vector3(x, y, z);
    }

    // --- Marker ---
    let marker = null;
    const placeMarker = (lat, lon) => {
        const pos = latLonToCartesian(lat, lon, earthRadius + 0.02); // slightly above surface
        if (marker) marker.dispose();
        marker = BABYLON.MeshBuilder.CreateSphere("marker", { diameter: 0.02 }, scene);
        const mat = new BABYLON.StandardMaterial("markerMat", scene);
        mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
        marker.material = mat;
        marker.position = pos;

        // Always face the camera
        marker.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        return pos;
    };

    // --- Smooth camera fly to target ---
    const flyToLocation = (lat, lon) => {
        const targetPos = latLonToCartesian(lat, lon, cameraDistance);
        const target = latLonToCartesian(lat, lon, 0); // point at Earth's center
        BABYLON.Animation.CreateAndStartAnimation(
            "camPos",
            camera,
            "position",
            60,
            120,
            camera.position,
            targetPos,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        BABYLON.Animation.CreateAndStartAnimation(
            "camTarget",
            camera,
            "target",
            60,
            120,
            camera.target,
            target,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
    };

    // --- Geolocation ---
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                info.textContent = `Votre position : ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                placeMarker(lat, lon);
                flyToLocation(lat, lon);
            },
            (err) => {
                console.error(err);
                info.textContent = "Position non disponible, fallback à Paris.";
                placeMarker(48.8566, 2.3522);
                flyToLocation(48.8566, 2.3522);
            }
        );
    } else {
        info.textContent = "Géolocalisation non supportée, fallback à Paris.";
        placeMarker(48.8566, 2.3522);
        flyToLocation(48.8566, 2.3522);
    }

    // --- Dynamic marker scaling based on distance to camera ---
    scene.registerBeforeRender(() => {
        if (marker) {
            const distance = BABYLON.Vector3.Distance(camera.position, marker.position);
            const scale = Math.min(2, Math.max(0.005, distance)); // proportional, always visible
            marker.scaling.set(scale, scale, scale);
        }
    });

    return scene;
};

const scene = createScene();

// --- Render loop ---
engine.runRenderLoop(() => {
    scene.render();
});

// --- Resize ---
window.addEventListener("resize", () => engine.resize());
