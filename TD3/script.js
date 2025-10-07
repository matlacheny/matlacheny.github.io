const canvas = document.getElementById("renderCanvas");
const info = document.getElementById("info");
const engine = new BABYLON.Engine(canvas, true);

// --- Leaflet map setup ---
const mapDiv = document.createElement("div");
mapDiv.id = "map";
mapDiv.style.position = "absolute";
mapDiv.style.top = "10px";
mapDiv.style.right = "10px";
mapDiv.style.width = "200px";
mapDiv.style.height = "200px";
mapDiv.style.zIndex = "10";
document.body.appendChild(mapDiv);

const map = L.map("map", { zoomControl: false }).setView([48.8566, 2.3522], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Map data © OpenStreetMap contributors",
}).addTo(map);

const createScene = async () => {
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
        0, 0,
        cameraDistance,
        BABYLON.Vector3.Zero(),
        scene
    );
    camera.setPosition(new BABYLON.Vector3(camX, camY, camZ));
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = earthRadius + 0.001; // original zoom
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
    earthTexture.uScale = -1; // original texture
    earthMat.diffuseTexture = earthTexture;
    earthMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    earth.material = earthMat;
    scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    // --- Lat/Lon to Cartesian ---
    const latLonToCartesian = (lat, lon, radius) => {
        const phi = BABYLON.Tools.ToRadians(90 - lat);
        const theta = BABYLON.Tools.ToRadians(lon + 180);
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        return new BABYLON.Vector3(x, y, z);
    };

    // --- User Marker ---
    let userMarker = null;
    const placeUserMarker = (lat, lon) => {
        const pos = latLonToCartesian(lat, lon, earthRadius + 0.02);
        if (userMarker) userMarker.dispose();
        userMarker = BABYLON.MeshBuilder.CreateSphere("userMarker", { diameter: 0.03 }, scene);
        const mat = new BABYLON.StandardMaterial("userMat", scene);
        mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
        userMarker.material = mat;
        userMarker.position = pos;
        userMarker.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    };

    // --- Flag Markers ---
    const flagMarkers = [];
    const createFlagMarker = (lat, lon, flagURL) => {
        const pos = latLonToCartesian(lat, lon, earthRadius + 0.02);
        const plane = BABYLON.MeshBuilder.CreatePlane("flag", { size: 0.05 }, scene);
        const mat = new BABYLON.StandardMaterial("flagMat", scene);
        mat.diffuseTexture = new BABYLON.Texture(flagURL, scene);
        mat.diffuseTexture.hasAlpha = true;
        mat.backFaceCulling = false;
        plane.material = mat;
        plane.position = pos;
        plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        flagMarkers.push(plane);
    };

    // --- Fetch countries ---
    const loadCountryMarkers = async () => {
        try {
            const res = await fetch("https://restcountries.com/v3.1/all?fields=name,latlng,flags");
            const countries = await res.json();
            countries.forEach(country => {
                if (country.latlng && country.latlng.length === 2 && country.flags && country.flags.png) {
                    createFlagMarker(country.latlng[0], country.latlng[1], country.flags.png);
                }
            });
            info.textContent = "Countries loaded!";
        } catch (err) {
            console.error("Error fetching countries:", err);
            info.textContent = "Failed to load countries.";
        }
    };
    await loadCountryMarkers();

    // --- Draw country borders ---
    const drawCountryBorders = async () => {
        try {
            const res = await fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json");
            const geojson = await res.json();
            geojson.features.forEach(feature => {
                const coordsList = feature.geometry.coordinates;
                const polygons = feature.geometry.type === "Polygon" ? [coordsList] : coordsList;
                polygons.forEach(polygon => {
                    polygon.forEach(ring => {
                        const path = ring.map(([lon, lat]) => {
                            const phi = BABYLON.Tools.ToRadians(90 - lat);
                            const theta = BABYLON.Tools.ToRadians(lon + 180);
                            const x = (earthRadius + 0.001) * Math.sin(phi) * Math.cos(theta);
                            const y = (earthRadius + 0.001) * Math.cos(phi);
                            const z = (earthRadius + 0.001) * Math.sin(phi) * Math.sin(theta);
                            return new BABYLON.Vector3(x, y, z);
                        });
                        path.push(path[0].clone()); // close loop
                        BABYLON.MeshBuilder.CreateLines("border", { points: path, updatable: false }, scene);
                    });
                });
            });
        } catch (err) {
            console.error("Error fetching country borders:", err);
        }
    };
    await drawCountryBorders();

    // --- Get user location ---
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                info.textContent = `Your position: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                placeUserMarker(lat, lon);
            },
            err => {
                console.warn("User location unavailable, fallback to Paris.");
                placeUserMarker(48.8566, 2.3522);
            }
        );
    } else {
        console.warn("Geolocation not supported, fallback to Paris.");
        placeUserMarker(48.8566, 2.3522);
    }

    // --- Dynamic scaling ---
    scene.registerBeforeRender(() => {
        if (userMarker) {
            const distance = BABYLON.Vector3.Distance(camera.position, userMarker.position);
            const scale = Math.min(2, Math.max(0.005, distance));
            userMarker.scaling.set(scale, scale, scale);
        }
        flagMarkers.forEach(flag => {
            const distance = BABYLON.Vector3.Distance(camera.position, flag.position);
            const scale = Math.min(2, Math.max(0.005, distance));
            flag.scaling.set(scale, scale, scale);
        });

        // --- CAMERA -> LEAFLET synchronization ---
        const camTarget = camera.target.subtract(BABYLON.Vector3.Zero());
        const r = camTarget.length();
        if (r > 0.0001) { // avoid division by zero
            const lat = 90 - BABYLON.Tools.ToDegrees(Math.acos(camTarget.y / r));
            const lon = BABYLON.Tools.ToDegrees(Math.atan2(camTarget.z, camTarget.x)) - 180;

            // Map zoom mapping (logarithmic)
            const minRadius = earthRadius + 0.005;
            const maxRadius = 10;
            const zoomFactor = 1 - Math.log2(camera.radius - minRadius + 1) / Math.log2(maxRadius - minRadius + 1);
            const minZoom = map.getMinZoom();
            const maxZoom = map.getMaxZoom();
            const newZoom = Math.round(minZoom + zoomFactor * (maxZoom - minZoom));

            map.setView([lat, lon], newZoom, { animate: false });
        }

    });

    // --- Leaflet click -> move 3D camera ---
    map.on("click", (e) => {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        // --- Recenter sphere ---
        const targetPos = latLonToCartesian(lat, lon, camera.radius);
        const target = latLonToCartesian(lat, lon, 0); // Earth's center

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

        // --- Map zoom → sphere zoom ---
        const minRadius = earthRadius + 0.005; // cannot go inside Earth
        const maxRadius = 10;
        const mapZoom = map.getZoom();
        const minZoom = map.getMinZoom();
        const maxEffectiveZoom = minZoom + 10;  // cap after 6 zoom levels
        const clampedZoom = Math.min(mapZoom, maxEffectiveZoom);
        const zoomFactor = Math.log2(clampedZoom - minZoom + 1) / Math.log2(maxEffectiveZoom - minZoom + 1);
        const newRadius = maxRadius - (maxRadius - minRadius) * zoomFactor;

        BABYLON.Animation.CreateAndStartAnimation(
            "camRadius",
            camera,
            "radius",
            60,
            120,
            camera.radius,
            newRadius,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
    });

    return scene;
};

// --- Initialize ---
(async () => {
    const scene = await createScene();
    engine.runRenderLoop(() => scene.render());
})();

window.addEventListener("resize", () => engine.resize());
