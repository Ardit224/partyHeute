// --- LOGIK FÜR DAS ROULETTE-SPIEL ---

let countdownPot = [];
let aktuelleCountdownSchluecke = 0;
let aktuellerWinkel = 0; // Merkt sich, wie das Rad gerade steht
const farben = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function starteCountdownSpiel() {
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
    zeichneRad();
}

function statusUpdaten() {
    document.getElementById('countdownStatus').innerText = `Noch ${countdownPot.length} Spieler im Pot. Das Opfer trinkt ${aktuelleCountdownSchluecke} 🍺!`;
}

function zeichneRad() {
    const canvas = document.getElementById('rouletteWheel');
    if (!canvas) return;
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    const radius = canvas.width / 2;
    const winkelProSegment = (2 * Math.PI) / countdownPot.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    countdownPot.forEach((spieler, i) => {
        const startWinkel = i * winkelProSegment;
        const endWinkel = startWinkel + winkelProSegment;

        // Segment zeichnen
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius - 5, startWinkel, endWinkel);
        ctx.fillStyle = farben[i % farben.length];
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Name/Emoji zeichnen
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(startWinkel + winkelProSegment / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Inter";
        const nameText = spieler.name.length > 8 ? spieler.name.substring(0, 7) + ".." : spieler.name;
        const displayStr = spieler.emoji.includes('<img') ? "📸" : `${spieler.emoji} ${nameText}`;
        ctx.fillText(displayStr, radius - 20, 5);
        ctx.restore();
    });
}

function getSpielerDisplayHtml(player) {
    if (player.emoji && player.emoji.includes('<img')) {
        return `<span class="spieler-anzeige">${player.emoji}</span>`;
    }
    return `<span class="spieler-anzeige"><span class="emoji-display">${player.emoji}</span> <span class="spieler-name-display">${player.name}</span></span>`;
}

function radDrehen() {
    if (countdownPot.length === 0) return;

    let opferIndex = Math.floor(Math.random() * countdownPot.length);
    let opfer = countdownPot[opferIndex];

    const canvas = document.getElementById('rouletteWheel');
    const winkelProSegment = 360 / countdownPot.length;
    
    // Wir berechnen den Winkel so, dass der Pfeil (oben, also 270 Grad) auf das Segment zeigt
    const extraDrehungen = 5 + Math.random() * 5; 
    const zielWinkel = (extraDrehungen * 360) + (270 - (opferIndex * winkelProSegment) - (winkelProSegment / 2));
    
    aktuellerWinkel = zielWinkel;
    canvas.style.transition = "transform 4s cubic-bezier(0.15, 0, 0.15, 1)";
    canvas.style.transform = `rotate(${aktuellerWinkel}deg)`;

    document.getElementById('countdownZiehenBtn').style.display = 'none';
    document.getElementById('countdownErgebnis').innerText = "Das Rad entscheidet...";

    playSound('click'); 

    setTimeout(() => {
        playSound('win');
        document.getElementById('countdownErgebnis').innerHTML = `🎯 ${getSpielerDisplayHtml(opfer)} muss trinken!`;
        document.getElementById('countdownErgebnis').style.color = "#ef4444";
        
        // Schlucke buchen
        bucheSchluecke(opfer);

        countdownPot.splice(opferIndex, 1);
        
        aktuelleCountdownSchluecke = Math.min(countdownPot.length, 8);

        if (countdownPot.length === 1) {
            let gewinner = countdownPot[0];
            document.getElementById('countdownStatus').innerText = "Spiel vorbei!";
            
            if (typeof feierKonfetti === "function") {
                feierKonfetti();
                playSound('win');
            }
            document.getElementById('countdownErgebnis').innerHTML = `🏆 ${getSpielerDisplayHtml(gewinner)} hat überlebt!`;
            document.getElementById('countdownErgebnis').style.color = "#10b981";
        } else {
            statusUpdaten();
            document.getElementById('countdownZiehenBtn').style.display = 'inline-block';
            setTimeout(zeichneRad, 500); // Rad neu zeichnen ohne die ausgeschiedene Person
        }
    }, 4100);
}

function bucheSchluecke(opfer) {
    let alleSpieler = JSON.parse(localStorage.getItem('partySpieler'));
    let echterSpieler = alleSpieler.find(s => s.name === opfer.name && s.emoji === opfer.emoji);
    if(echterSpieler) {
        echterSpieler.schluecke += aktuelleCountdownSchluecke;
        echterSpieler.ausgewaehltCount = (echterSpieler.ausgewaehltCount || 0) + 1;
        localStorage.setItem('partySpieler', JSON.stringify(alleSpieler));
        listeAnzeigen(); 
    }
}

function zurueckZumMenueAusCountdown() {
    if (typeof zurueckZumHauptMenue === "function") {
        if (typeof stopBackgroundMusic === "function") stopBackgroundMusic();
        zurueckZumHauptMenue();
    }
}