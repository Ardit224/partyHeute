// Globales Foto-Objekt initialisieren
if (!window.aktuellesFoto) window.aktuellesFoto = null;
if (!window.currentCameraStream) window.currentCameraStream = null;

async function kameraStarten() {
    const video = document.getElementById('video');
    const cameraPlusIcon = document.getElementById('cameraPlusIcon');
    const snapBtn = document.getElementById('snapBtn');
    const photoPreview = document.getElementById('photoPreview');

    console.log("kameraStarten() aufgerufen.");

    try {
        // Aggressiver Cleanup vor dem Neustart
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        window.currentCameraStream = null;

        // Fragt den Nutzer nach Erlaubnis für die Kamera
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user", width: { ideal: 400 }, height: { ideal: 400 } }, 
            audio: false 
        });
        
        window.currentCameraStream = stream; 
        video.srcObject = stream;
        
        // --- UI UPDATE: An das neue HTML angepasst ---
        if (photoPreview) photoPreview.style.display = "none"; // Alte Vorschau verstecken
        if (cameraPlusIcon) cameraPlusIcon.style.display = "none"; // Das 📸 Icon verstecken
        if (video) video.style.display = "block"; // Live-Bild zeigen
        if (snapBtn) snapBtn.style.display = "block"; // FOTO SCHIESSEN Button zeigen

        video.onloadedmetadata = () => {
            video.play().catch(e => {
                console.warn("Autoplay blockiert:", e);
            });
        };

    } catch (err) {
        console.error("Detaillierter Kamera-Fehler: ", err);
        alert(`Kamera-Fehler: Der Browser blockiert den Zugriff. Lade die Seite neu und erlaube die Kamera.`);
    }
}

function fotoMachen() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const preview = document.getElementById('photoPreview');
    const snapBtn = document.getElementById('snapBtn');
    const cameraPlusIcon = document.getElementById('cameraPlusIcon');

    // Canvas genau auf ein quadratisches Format für unsere Kreise einstellen
    canvas.width = 300;
    canvas.height = 300;
    const context = canvas.getContext('2d');
    
    // Das Bild zentriert und quadratisch ausschneiden
    const minDim = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - minDim) / 2;
    const startY = (video.videoHeight - minDim) / 2;
    context.drawImage(video, startX, startY, minDim, minDim, 0, 0, 300, 300);

    // Das Bild aus dem Canvas als Text (Base64) speichern
    window.aktuellesFoto = canvas.toDataURL('image/png');

    // --- UI UPDATE ---
    preview.src = window.aktuellesFoto;
    preview.style.display = "block"; // Zeige das fertige Foto
    video.style.display = "none"; // Verstecke das Live-Video
    snapBtn.style.display = "none"; // Verstecke den Auslöser-Knopf
    
    // Kamera-Stream beenden, um Akku zu sparen
    if (window.currentCameraStream) { 
        window.currentCameraStream.getTracks().forEach(track => track.stop());
        window.currentCameraStream = null; 
    }
    video.srcObject = null; 
    console.log("Foto wurde generiert.");
}

function stopCameraStream() {
    if (window.currentCameraStream) {
        window.currentCameraStream.getTracks().forEach(track => track.stop());
        window.currentCameraStream = null;
    }
    
    const video = document.getElementById('video');
    if (video) {
        video.pause();
        video.srcObject = null; 
        video.style.display = "none";
    }

    const preview = document.getElementById('photoPreview');
    const snapBtn = document.getElementById('snapBtn');
    const cameraPlusIcon = document.getElementById('cameraPlusIcon');

    if (preview) preview.style.display = "none";
    if (snapBtn) snapBtn.style.display = "none";
    if (cameraPlusIcon) cameraPlusIcon.style.display = "block"; // Zeige wieder das 📸 an
    
    window.aktuellesFoto = null; 
}