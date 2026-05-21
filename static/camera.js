let aktuellesFoto = null;

async function kameraStarten() {
    const video = document.getElementById('video');
    const startBtn = document.getElementById('startCameraBtn');
    const snapBtn = document.getElementById('snapBtn');

    try {
        // Fragt den Nutzer nach Erlaubnis für die Kamera
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        video.srcObject = stream;
        video.style.display = "inline-block";
        
        startBtn.style.display = "none";
        snapBtn.style.display = "inline-block";
    } catch (err) {
        console.error("Kamera-Fehler: ", err);
        alert("Kamera konnte nicht geöffnet werden. (Evtl. keine Berechtigung?)");
    }
}

function fotoMachen() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const preview = document.getElementById('photoPreview');
    const snapBtn = document.getElementById('snapBtn');
    const startBtn = document.getElementById('startCameraBtn');

    const context = canvas.getContext('2d');
    // Das aktuelle Videobild auf das Canvas zeichnen
    context.drawImage(video, 0, 0, 150, 150);

    // Das Bild aus dem Canvas als Text (Base64) extrahieren
    aktuellesFoto = canvas.toDataURL('image/png');

    // Vorschau anzeigen, Video stoppen
    preview.src = aktuellesFoto;
    preview.style.display = "inline-block";
    video.style.display = "none";
    snapBtn.style.display = "none";
    startBtn.style.display = "inline-block";
    startBtn.innerText = "🔄 Neues Foto";

    // Kamera-Stream stoppen, um Akku zu sparen
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    console.log("Foto wurde generiert:", aktuellesFoto.substring(0, 50) + "...");
}