// Initialisation de la carte centrée sur l'Europe par défaut
const map = L.map('map').setView([48.8566, 2.3522], 6); // Paris par défaut

// Ajouter la couche OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Marqueur par défaut (Paris)
let marker = L.marker([48.8566, 2.3522]).addTo(map).bindPopup("Position par défaut").openPopup();

// ➕ Marqueur statique pour Nice
const niceMarker = L.marker([43.7019183, 7.2666753]).addTo(map);
niceMarker.bindPopup("Nice").openPopup();

// Fonction pour mettre à jour la position utilisateur
function updatePosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Déplacer la carte et le marqueur utilisateur
    map.setView([lat, lon], 13);
    marker.setLatLng([lat, lon])
        .setPopupContent(`Vous êtes ici<br>Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`)
        .openPopup();
}

// --- Triangle des Bermudes ---
const bermudaTriangleCoords = [
    [25.7617, -80.1918],   // Miami, FL
    [32.3078, -64.7505],   // Bermuda
    [18.4663, -66.1057]    // San Juan, Puerto Rico
];

// Dessiner le polygone (triangle)
const bermudaTriangle = L.polygon(bermudaTriangleCoords, {
    color: '#ff0000',      // bordure
    weight: 2,
    opacity: 0.8,
    fillColor: '#ff6666',  // remplissage
    fillOpacity: 0.2
}).addTo(map);

// Popup sur le polygone
bermudaTriangle.bindPopup('<strong>Triangle des Bermudes</strong><br>Miami — Bermudes — San Juan');

// Ajuster la vue pour montrer tout le triangle
map.fitBounds(bermudaTriangle.getBounds());

// Optionnel : afficher les sommets avec des markers étiquetés
L.marker(bermudaTriangleCoords[0]).addTo(map).bindPopup('Miami');
L.marker(bermudaTriangleCoords[1]).addTo(map).bindPopup('Bermuda');
L.marker(bermudaTriangleCoords[2]).addTo(map).bindPopup('San Juan');

// Gestion des erreurs
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
