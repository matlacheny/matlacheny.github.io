// =====================
// --- Fonds de carte ---
// =====================
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
});

const watercolor = L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
        '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

// =====================
// --- Initialisation de la carte ---
// =====================
const map = L.map('map', {
    center: [48.8566, 2.3522], // Paris par défaut
    zoom: 6,
    layers: [osm]               // couche par défaut
});

// =====================
// --- Marqueurs ---
// =====================
// Marqueur dynamique (position utilisateur)
let userMarker = L.marker([48.8566, 2.3522]).addTo(map)
    .bindPopup("Position par défaut")
    .openPopup();

// Marqueur statique pour Nice
const niceMarker = L.marker([43.7019183, 7.2666753]).addTo(map)
    .bindPopup("Nice");

// =====================
// --- Triangle des Bermudes ---
// =====================
const bermudaCoords = [
    [25.7617, -80.1918],   // Miami
    [32.3078, -64.7505],   // Bermuda
    [18.4663, -66.1057]    // San Juan
];

const bermudaTriangle = L.polygon(bermudaCoords, {
    color: '#ff0000',
    weight: 2,
    opacity: 0.8,
    fillColor: '#ff6666',
    fillOpacity: 0.2
}).addTo(map);

bermudaTriangle.bindPopup('<strong>Triangle des Bermudes</strong><br>Miami — Bermudes — San Juan');

// Markers pour les sommets
L.marker(bermudaCoords[0]).addTo(map).bindPopup('Miami');
L.marker(bermudaCoords[1]).addTo(map).bindPopup('Bermuda');
L.marker(bermudaCoords[2]).addTo(map).bindPopup('San Juan');

// Ajuster la vue pour montrer tout le triangle
map.fitBounds(bermudaTriangle.getBounds());

// =====================
// --- Contrôle des fonds ---
// =====================
const baseMaps = {
    "OpenStreetMap": osm,
    "Stamen Watercolor": watercolor
};

const overlayMaps = {
    "Triangle des Bermudes": bermudaTriangle
};

L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(map);

// =====================
// --- Gestion de la géolocalisation ---
// =====================
function updatePosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    map.setView([lat, lon], 13); // Déplacer la vue
    userMarker.setLatLng([lat, lon])
        .setPopupContent(`Vous êtes ici<br>Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`)
        .openPopup();
}

function handleError(error) {
    alert("Erreur de géolocalisation : " + error.message);
}

// Demande la position courante + suivi en temps réel
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(updatePosition, handleError);
    navigator.geolocation.watchPosition(updatePosition, handleError);
} else {
    alert("La géolocalisation n'est pas supportée par ce navigateur.");
}
