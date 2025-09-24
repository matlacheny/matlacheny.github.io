// Initialisation de la carte centrée sur l'Europe par défaut
const map = L.map('map').setView([48.8566, 2.3522], 6); // Paris par défaut

// Ajouter la couche OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Marqueur par défaut
let marker = L.marker([48.8566, 2.3522]).addTo(map).bindPopup("Position par défaut").openPopup();

// Fonction pour mettre à jour la position
function updatePosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Déplacer la carte et le marqueur
    map.setView([lat, lon], 13);
    marker.setLatLng([lat, lon])
        .setPopupContent(`Vous êtes ici<br>Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`)
        .openPopup();
}

// Gestion des erreurs
function handleError(error) {
    alert("Erreur de géolocalisation : " + error.message);
}

// Demande la position courante
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(updatePosition, handleError);

    // Suivi en temps réel
    navigator.geolocation.watchPosition(updatePosition, handleError);
} else {
    alert("La géolocalisation n'est pas supportée par ce navigateur.");
}
