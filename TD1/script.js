function formatPosition(pos) {
    const coords = pos.coords;
    return `
    Longitude : ${coords.longitude}<br>
    Latitude : ${coords.latitude}<br>
    Altitude : ${coords.altitude !== null ? coords.altitude + " m" : "Non disponible"}<br>
    Précision : ${coords.accuracy} m<br>
    Vitesse : ${coords.speed !== null ? coords.speed + " m/s" : "Non disponible"}<br>
    Date : ${new Date(pos.timestamp).toLocaleString()}
  `;
}

// --- getCurrentPosition ---
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            document.getElementById("current").innerHTML = formatPosition(pos);
        },
        (err) => {
            document.getElementById("current").innerHTML = "Erreur : " + err.message;
        }
    );

    // --- watchPosition ---
    navigator.geolocation.watchPosition(
        (pos) => {
            document.getElementById("watch").innerHTML = formatPosition(pos);
        },
        (err) => {
            document.getElementById("watch").innerHTML = "Erreur : " + err.message;
        }
    );
} else {
    document.getElementById("current").innerHTML = "La géolocalisation n'est pas supportée.";
    document.getElementById("watch").innerHTML = "La géolocalisation n'est pas supportée.";
}
