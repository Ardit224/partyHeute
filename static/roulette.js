// --- LOGIK FÜR DAS ROULETTE-SPIEL ---

let countdownPot = [];
let aktuelleCountdownSchluecke = 0;
let aktuellerWinkel = 0; // Merkt sich, wie das Rad gerade steht
let preloadedPlayerAvatars = []; // Speichert geladene Bilder oder Emojis
const farben = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

async function starteCountdownSpiel() { // Funktion ist jetzt asynchron
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    countdownPot = spielerListe.filter(s => s.aktiv !== false);

    if (countdownPot.length < 2) {
        customAlert("Roulette braucht mindestens 2 Spieler! 🎰");
        return;
    }

    // Avatare vorab laden (Bilder oder Emojis speichern)
    preloadedPlayerAvatars = await Promise.all(countdownPot.map(async (spieler) => {
        if (spieler.emoji.startsWith('<img src="')) {
            const srcMatch = spieler.emoji.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1]) {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => {
                        console.error("Fehler beim Laden des Spielerbildes:", spieler.name);
                        resolve(null); // Bei Fehler null zurückgeben
                    };
                    img.src = srcMatch[1];
                });
            }
        }
        return spieler.emoji; // Wenn es ein Emoji-String ist, direkt zurückgeben
    }));

    // Schlücke berechnen: Max 8, sonst so viele wie Spieler da sind
    aktuelleCountdownSchluecke = Math.min(countdownPot.length, 8);
    
    if (typeof zeigeBereich === "function") {
        zeigeBereich('countdownBereich');
    }
    
    document.getElementById('countdownErgebnis').innerText = "";
    document.getElementById('countdownZiehenBtn').style.display = 'inline-block';
    
    statusUpdaten();
    radZeichnen();
}

function statusUpdaten() {
    document.getElementById('countdownStatus').innerText = `Noch ${countdownPot.length} Spieler im Pot. Das Opfer trinkt ${aktuelleCountdownSchluecke} 🍺!`;
}

// Malt das Rad auf das Canvas
function radZeichnen() {
    const canvas = document.getElementById('rouletteWheel');
    const ctx = canvas.getContext('2d');
    const mitte = canvas.width / 2;
    const radius = mitte;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Rad säubern
    
    let stueckWinkel = (2 * Math.PI) / countdownPot.length;
    
    for (let i = 0; i < countdownPot.length; i++) {
        ctx.beginPath();
        ctx.fillStyle = farben[i % farben.length]; // Farbe abwechselnd wählen
        ctx.moveTo(mitte, mitte);
        // Stücke so malen, dass das erste Stück oben in der Mitte (bei -90 Grad) beginnt
        ctx.arc(mitte, mitte, radius, i * stueckWinkel - Math.PI/2, (i + 1) * stueckWinkel - Math.PI/2);
        ctx.fill();
        ctx.stroke();
        
        // Text (Name) in das Stück schreiben
        ctx.save();
        ctx.translate(mitte, mitte);
        ctx.rotate(i * stueckWinkel + stueckWinkel / 2 - Math.PI/2);
        
        ctx.textAlign = "center"; // Text/Bild horizontal zentrieren
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        
        const avatarContent = preloadedPlayerAvatars[i];

        const avatarSize = 55; // Deutlich größer für bessere Sichtbarkeit
        const xPos = radius * 0.65; // Positionierung im äußeren Drittel des Rads

        if (avatarContent instanceof Image && avatarContent.complete && avatarContent.naturalHeight !== 0) {
            // Bild rund zeichnen mittels Maskierung (Clipping)
            ctx.save();
            ctx.beginPath();
            ctx.arc(xPos, 0, avatarSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatarContent, xPos - avatarSize / 2, -avatarSize / 2, avatarSize, avatarSize);
            ctx.restore();

            // Weißer Rahmen um das runde Bild für "Sauberkeit"
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(xPos, 0, avatarSize / 2, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Emojis ebenfalls deutlich größer darstellen
            ctx.font = "50px Arial";
            ctx.fillText(avatarContent || "❓", xPos, 0);
        }
        ctx.restore();
    }
}

// Dreht das Rad
function radDrehen() {
    // 1. Opfer per Zufall bestimmen
    let opferIndex = Math.floor(Math.random() * countdownPot.length);
    let opfer = countdownPot[opferIndex];

    // 2. Berechnen, wo das Rad anhalten muss, damit das Opfer unter dem Pfeil steht (Pfeil ist oben, also 0 Grad)
    let stueckGrad = 360 / countdownPot.length;
    // Die exakte Gradzahl für die Mitte des Opfer-Tortenstücks
    // Der Pfeil ist oben (0 Grad). Die Segmente sind von -90 Grad bis ...
    // Wenn das erste Segment bei -90 bis -90 + stueckWinkel ist,
    // dann ist die Mitte des ersten Segments bei -90 + stueckWinkel/2.
    // Um das Segment unter den Pfeil zu bekommen, muss der Mittelpunkt des Segments auf 0 Grad zeigen.
    let zielGrad = 360 - (opferIndex * stueckGrad) - (stueckGrad / 2);
    
    // Wir fügen 5 volle Umdrehungen (1800 Grad) als Show-Effekt hinzu
    let drehWinkel = zielGrad + 1800;
    aktuellerWinkel += drehWinkel;

    // 3. CSS-Animation starten
    document.getElementById('countdownZiehenBtn').style.display = 'none'; // Button während des Drehens verstecken
    document.getElementById('countdownErgebnis').innerText = "Spannung...";
    document.getElementById('countdownErgebnis').style.color = "white";

    const canvas = document.getElementById('rouletteWheel');
    canvas.style.transition = 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)'; // Wird am Ende langsamer
    canvas.style.transform = `rotate(${aktuellerWinkel}deg)`;

    // 4. Warten, bis das Rad steht (4 Sekunden), dann Ergebnis verarbeiten
    setTimeout(() => {
        // Ergebnis anzeigen
        document.getElementById('countdownErgebnis').innerText = `💥 ${opfer.emoji} ${opfer.name} trinkt ${aktuelleCountdownSchluecke} 🍺!`;
        document.getElementById('countdownErgebnis').style.color = "#ef4444";

        // Schlücke buchen
        let alleSpieler = JSON.parse(localStorage.getItem('partySpieler'));
        let echterSpieler = alleSpieler.find(s => s.name === opfer.name && s.emoji === opfer.emoji);
        if(echterSpieler) {
            echterSpieler.schluecke += aktuelleCountdownSchluecke;
            localStorage.setItem('partySpieler', JSON.stringify(alleSpieler));
            listeAnzeigen(); 
        }

        // Opfer aus dem Pot werfen
        countdownPot.splice(opferIndex, 1);
        
        // Schlücke für nächste Runde senken (aber nie unter 1)
        aktuelleCountdownSchluecke = Math.min(countdownPot.length, 8);

        // Prüfen, ob das Spiel vorbei ist
        if (countdownPot.length === 1) {
            let gewinner = countdownPot[0];
            document.getElementById('countdownStatus').innerText = "Spiel vorbei!";
            document.getElementById('countdownErgebnis').innerText = `🏆 ${gewinner.emoji} ${gewinner.name} hat überlebt!`;
            document.getElementById('countdownErgebnis').style.color = "#10b981";
            radZeichnen(); // Letztes Rad malen (ein einziges riesiges Tortenstück)
        } else {
            statusUpdaten();
            radZeichnen(); // Rad mit den verbleibenden Spielern neu malen
            document.getElementById('countdownZiehenBtn').style.display = 'inline-block';
        }
        
        // Rotation für das nächste Mal zurücksetzen (ohne Animation), damit es nicht unendlich hochzählt
        canvas.style.transition = 'none';
        aktuellerWinkel = zielGrad;
        canvas.style.transform = `rotate(${aktuellerWinkel}deg)`;
        
    }, 4000); // 4000 Millisekunden = 4 Sekunden Wartezeit
}

function zurueckZumMenueAusCountdown() {
    if (typeof zurueckZumHauptMenue === "function") {
        zurueckZumHauptMenue();
    }
}