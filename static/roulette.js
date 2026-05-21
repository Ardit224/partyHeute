// --- LOGIK FÜR DAS ROULETTE-SPIEL ---

let countdownPot = [];
let aktuelleCountdownSchluecke = 0;
let aktuellerWinkel = 0; // Merkt sich, wie das Rad gerade steht
// preloadedPlayerAvatars ist nicht mehr direkt für das Rad nötig, aber die Avatare müssen geladen sein für die Kugel
const farben = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

async function starteCountdownSpiel() { // Funktion ist jetzt asynchron
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    countdownPot = spielerListe.filter(s => s.aktiv !== false);

    if (countdownPot.length < 2) {
        customAlert("Roulette braucht mindestens 2 Spieler! 🎰");
        return;
    }

    // Schlücke berechnen: Max 8, sonst so viele wie Spieler da sind
    aktuelleCountdownSchluecke = Math.min(countdownPot.length, 8);
    
    if (typeof zeigeBereich === "function") {
        zeigeBereich('countdownBereich');
    }
    
    document.getElementById('countdownErgebnis').innerText = "";
    document.getElementById('countdownZiehenBtn').style.display = 'inline-block';
    
    statusUpdaten();
    // Sicherstellen, dass das Canvas-Element versteckt ist
    const canvas = document.getElementById('rouletteWheel');
    if (canvas) canvas.style.display = 'none';
}

function statusUpdaten() {
    document.getElementById('countdownStatus').innerText = `Noch ${countdownPot.length} Spieler im Pot. Das Opfer trinkt ${aktuelleCountdownSchluecke} 🍺!`;
}

// Dreht das Rad
// Helper function to get a displayable avatar for text content (not HTML)
function getAvatarForTextDisplay(player) {
    if (player.emoji && player.emoji.startsWith('<img src="')) {
        return "📸"; // Use a camera emoji as a placeholder for images in text
    }
    return player.emoji || "❓"; // Return the emoji itself, or a default if none
}

function radDrehen() {
    // 1. Opfer per Zufall bestimmen
    let opferIndex = Math.floor(Math.random() * countdownPot.length);
    let opfer = countdownPot[opferIndex];

    // UI-Updates
    document.getElementById('countdownZiehenBtn').style.display = 'none'; // Button während des Drehens verstecken
    document.getElementById('countdownErgebnis').innerText = "Spannung...";
    document.getElementById('countdownErgebnis').style.color = "white";

    // Sicherstellen, dass das Canvas-Element versteckt ist
    const canvas = document.getElementById('rouletteWheel');
    if (canvas) canvas.style.display = 'none';

    // Gesamtzeit für die Animation (Drumroll + Schuss)
    const totalAnimationDuration = 3000; // Gesamtzeit auf 3 Sekunden
    const cannonStartDelay = 400; // Revolver erscheint nach 0.4 Sekunden
    const targetPlayerAppearDelay = 200; // Zielspieler erscheint 0.2s nach Revolver

    if (typeof playBackgroundMusic === "function") {
        // Spannende Musik (Drumroll/Spannungs-Sound) starten
        playBackgroundMusic('https://assets.mixkit.co/active_storage/sfx/514/514-preview.mp3', 0.6); 
    }

    // Start der Revolver-Animation nach einer Verzögerung innerhalb der Gesamtzeit
    setTimeout(() => {
        // --- SCHUSS ANIMATION START ---
        const overlay = document.getElementById('shotOverlay');
        const revolver = document.getElementById('revolver');
        const bullet = document.getElementById('bullet');
        const targetPlayerAvatar = document.getElementById('targetPlayerAvatar');

        // Zielspieler-Avatar setzen und einblenden
        targetPlayerAvatar.innerHTML = opfer.emoji.includes('<img') ? opfer.emoji : `<span class="emoji-display">${opfer.emoji}</span>`;
        targetPlayerAvatar.style.opacity = 1;
        
        overlay.style.display = 'block';
        revolver.classList.add('active');

        // Kurze Verzögerung, dann Schuss
        setTimeout(() => {
            // Trigger Screen Shake
            document.querySelector('.container').classList.add('screen-shake');
            playSound('shot');
            bullet.classList.add('fly');

            // Treffer-Effekt auf dem Spieler-Avatar, wenn die Kugel ankommt
            setTimeout(() => {
                targetPlayerAvatar.classList.add('hit');
                setTimeout(() => stopBackgroundMusic(), 200)
            }, 400); // bulletFly Dauer

        }, targetPlayerAppearDelay); // Zielspieler erscheint, dann Schuss

    }, cannonStartDelay); // Revolver-Animation startet nach cannonStartDelay

    // Ergebnis anzeigen und aufräumen
    // Dieser Timeout wird nach der gesamten Animation + einer kleinen Pufferzeit ausgelöst
    setTimeout(() => {
        // Hintergrundmusik stoppen
        

        // --- ERGEBNIS ANZEIGEN ---
        // Ergebnis anzeigen
        document.getElementById('countdownErgebnis').innerText = `💥 ${getAvatarForTextDisplay(opfer)} ${opfer.name} trinkt ${aktuelleCountdownSchluecke} 🍺!`;
        document.getElementById('countdownErgebnis').style.color = "#ef4444";
        document.getElementById('countdownErgebnis').style.opacity = 0; // Startet unsichtbar für Pop-In
        document.getElementById('countdownErgebnis').classList.add('result-pop-in'); // Animation für Ergebnis

        // Schlücke buchen
        let alleSpieler = JSON.parse(localStorage.getItem('partySpieler'));
        let echterSpieler = alleSpieler.find(s => s.name === opfer.name && s.emoji === opfer.emoji);
        if(echterSpieler) {
            echterSpieler.schluecke += aktuelleCountdownSchluecke;
            echterSpieler.ausgewaehltCount = (echterSpieler.ausgewaehltCount || 0) + 1;
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
            
            if (typeof feierKonfetti === "function") {
                feierKonfetti();
                playSound('win');
            }
            document.getElementById('countdownErgebnis').innerText = `🏆 ${getAvatarForTextDisplay(gewinner)} ${gewinner.name} hat überlebt!`;
            document.getElementById('countdownErgebnis').style.color = "#10b981";
            document.getElementById('countdownErgebnis').classList.add('result-pop-in'); // Animation für Ergebnis
        } else {
            statusUpdaten();
            document.getElementById('countdownZiehenBtn').style.display = 'inline-block';
        }
        
        // --- CLEANUP ANIMATION ---
        const overlay = document.getElementById('shotOverlay');
        const revolver = document.getElementById('revolver');
        const bullet = document.getElementById('bullet');
        const targetPlayerAvatar = document.getElementById('targetPlayerAvatar');
        
        document.querySelector('.container').classList.remove('screen-shake'); // Shake entfernen
        document.getElementById('countdownErgebnis').classList.remove('result-pop-in'); // Animation zurücksetzen
        overlay.style.display = 'none';
        revolver.classList.remove('active');
        bullet.classList.remove('fly');
        targetPlayerAvatar.classList.remove('hit'); // Hit-Effekt zurücksetzen
        targetPlayerAvatar.style.opacity = 0; // Zielspieler wieder unsichtbar machen

    }, totalAnimationDuration); // Dies ist der Haupt-Timeout für die gesamte Sequenz
}

function zurueckZumMenueAusCountdown() {
    if (typeof zurueckZumHauptMenue === "function") {
        if (typeof stopBackgroundMusic === "function") stopBackgroundMusic();
        zurueckZumHauptMenue();
    }
}