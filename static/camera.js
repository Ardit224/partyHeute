// Globales Foto-Objekt initialisieren, falls noch nicht geschehen
if (!window.aktuellesFoto) window.aktuellesFoto = null;
// Globales Stream-Objekt, um den Kamerastream zu verwalten
if (!window.currentCameraStream) window.currentCameraStream = null;

async function kameraStarten() {
    const video = document.getElementById('video');
    const startBtn = document.getElementById('startCameraBtn');
    const snapBtn = document.getElementById('snapBtn');

    console.log("kameraStarten() aufgerufen."); // Debug-Log

    try {
        // Prüfen, ob wir in einem sicheren Kontext sind (HTTPS, localhost oder 127.0.0.1)
        if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            alert("Kamera benötigt eine sichere Verbindung (HTTPS oder Localhost).");
            return;
        }

        // Aggressiver Cleanup vor dem Neustart
        if (video.srcObject) {
            console.log("Vorhandener video.srcObject gefunden, stoppe Tracks."); // Debug-Log
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        window.currentCameraStream = null;

        console.log("Versuche, Kamerastream anzufordern..."); // Debug-Log
        // Fragt den Nutzer nach Erlaubnis für die Kamera
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "user",
                width: { ideal: 400 },
                height: { ideal: 400 }
            }, 
            audio: false 
        });
        
        console.log("Kamerastream erfolgreich angefordert."); // Debug-Log
        window.currentCameraStream = stream; // Den neuen Stream global speichern
        video.srcObject = stream;
        
        // Erst einblenden, dann abspielen
        video.style.display = "inline-block"; 
        startBtn.style.display = "none"; 
        snapBtn.style.display = "inline-block"; 

        video.onloadedmetadata = () => {
            console.log("onloadedmetadata gefeuert."); // Debug-Log
            video.play().catch(e => {
                console.warn("Autoplay blockiert oder fehlgeschlagen:", e);
            });
        };

        // Fallback, falls onloadedmetadata nicht feuert
        if (video.readyState >= video.HAVE_METADATA) {
            console.log("Video bereits bereit, lade manuell."); 
            video.onloadedmetadata();
        }
    } catch (err) {
        console.error("Detaillierter Kamera-Fehler: ", err.name, err.message);
        alert(`Kamera-Fehler: ${err.name === 'NotAllowedError' ? 'Zugriff verweigert. Bitte Einstellungen prüfen.' : err.message}`);
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
    window.aktuellesFoto = canvas.toDataURL('image/png');

    // Vorschau anzeigen, Video stoppen
    preview.src = window.aktuellesFoto;
    preview.style.display = "inline-block";
    video.style.display = "none";
    snapBtn.style.display = "none";
    startBtn.style.display = "inline-block";
    startBtn.innerText = "🔄 Neues Foto";

    // Kamera-Stream stoppen, um Akku zu sparen
    if (window.currentCameraStream) { 
        window.currentCameraStream.getTracks().forEach(track => track.stop());
        window.currentCameraStream = null; 
    }
    video.srcObject = null; 
    console.log("Foto wurde generiert und global gespeichert.");
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
    const startBtn = document.getElementById('startCameraBtn');
    const snapBtn = document.getElementById('snapBtn');

    if (preview) preview.style.display = "none";
    if (snapBtn) snapBtn.style.display = "none";
    if (startBtn) { 
        startBtn.style.display = "inline-block"; 
        startBtn.innerText = "📸 Kamera öffnen"; 
    }
    window.aktuellesFoto = null; 
    console.log("Kamerastream gestoppt und UI zurückgesetzt.");
}