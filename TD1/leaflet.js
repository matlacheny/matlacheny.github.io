document.addEventListener('DOMContentLoaded', () => {

    // =====================
    // --- Fonds de carte ---
    // =====================
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    });

    const cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    });

    const watercolor = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=eed6a6b4-d171-43e4-8215-e5f8490b4245', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        minZoom: 1,
        maxZoom: 16,
        subdomains: "abcd"
    });

    // =====================
    // --- Initialisation ---
    // =====================
    const map = L.map('map', {
        center: [43.7, 7.3], // Alpes-Maritimes
        zoom: 9,
        layers: [osm]
    });

    // =====================
    // --- Toggle fonds ---
    // =====================
    const toggleBtn = document.getElementById('toggleBtn');
    const baseLayers = [osm, cartoLight, watercolor];
    const baseNames = ["OpenStreetMap", "Carto Light", "Watercolor"];
    let currentIndex = 0;

    toggleBtn.addEventListener('click', () => {
        map.removeLayer(baseLayers[currentIndex]);
        currentIndex = (currentIndex + 1) % baseLayers.length;
        map.addLayer(baseLayers[currentIndex]);
        toggleBtn.textContent = `Basculer vers autre carte (actuelle : ${baseNames[currentIndex]})`;
    });

    // =====================
    // --- Marqueurs Nice/Marseille ---
    // =====================
    const niceCoords = [43.7019183, 7.2666753];
    const marseilleCoords = [43.296482, 5.36978];

    const niceMarker = L.marker(niceCoords).addTo(map).bindPopup("Nice");
    const marseilleMarker = L.marker(marseilleCoords).addTo(map).bindPopup("Marseille");

    const mnLine = L.polyline([marseilleCoords, niceCoords], {
        color: "green",
        weight: 3,
        opacity: 0.8
    }).addTo(map);

    // =====================
    // --- Triangle des Bermudes ---
    // =====================
    const bermudaCoords = [
        [25.7617, -80.1918],
        [32.3078, -64.7505],
        [18.4663, -66.1057]
    ];

    const bermudaTriangle = L.polygon(bermudaCoords, {
        color: '#ff0000',
        weight: 2,
        opacity: 0.8,
        fillColor: '#ff6666',
        fillOpacity: 0.2
    }).addTo(map);

    bermudaTriangle.bindPopup('<strong>Triangle des Bermudes</strong><br>Miami — Bermudes — San Juan');

    // =====================
    // --- Contrôle fonds ---
    // =====================
    const overlayMaps = {
        "Triangle des Bermudes": bermudaTriangle,
        "Marseille - Nice": mnLine
    };

    L.control.layers({
        "OpenStreetMap": osm,
        "Carto Light": cartoLight,
        "Watercolor": watercolor
    }, overlayMaps, { position: 'topright' }).addTo(map);

    // =====================
    // --- Fonction Haversine ---
    // =====================
    function haversineDistance(coord1, coord2) {
        const R = 6371e3;
        const lat1 = coord1[0] * Math.PI / 180;
        const lat2 = coord2[0] * Math.PI / 180;
        const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
        const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    // =====================
    // --- Géolocalisation ---
    // =====================
    let userMarker = L.marker([48.8566, 2.3522]).addTo(map).bindPopup("Position par défaut");
    let accuracyCircle;

    function updatePosition(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        map.setView([lat, lon], 10);

        userMarker.setLatLng([lat, lon])
            .setPopupContent(`Vous êtes ici<br>Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}<br>Précision: ${accuracy.toFixed(1)} m`)
            .openPopup();

        if (accuracyCircle) map.removeLayer(accuracyCircle);

        accuracyCircle = L.circle([lat, lon], {
            radius: accuracy,
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.2,
            weight: 2
        }).addTo(map);

        const distance = haversineDistance(marseilleCoords, [lat, lon]) / 1000;
        marseilleMarker.bindPopup(`Marseille<br>Distance jusqu'à vous : ${distance.toFixed(2)} km`).openPopup();

        const infoDiv = document.getElementById("distanceInfo");
        if (infoDiv) infoDiv.textContent = `Distance entre Marseille et votre position : ${distance.toFixed(2)} km`;
    }

    function handleError(error) {
        alert("Erreur de géolocalisation : " + error.message);
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updatePosition, handleError);
        navigator.geolocation.watchPosition(updatePosition, handleError);
    }

    // =====================
    // --- Contours communes Alpes-Maritimes ---
    // =====================
    const departementCode = "06";
    const communesUrl = `https://geo.api.gouv.fr/departements/${departementCode}/communes?fields=nom,centre,contour&format=geojson&geometry=contour`;

    fetch(communesUrl)
        .then(resp => resp.json())
        .then(geojson => {
            L.geoJSON(geojson, {
                style: {
                    color: '#0077cc',
                    weight: 2,
                    fillColor: '#99ccff',
                    fillOpacity: 0.3
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties && feature.properties.nom) {
                        layer.bindPopup(`<strong>${feature.properties.nom}</strong>`);
                    }
                }
            }).addTo(map);
        })
        .catch(err => console.error("Erreur chargement communes:", err));

});
