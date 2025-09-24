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
