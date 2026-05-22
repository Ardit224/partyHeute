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
    document.getElementById('countdownZiehenBtn').innerText = "Rad drehen! 🎡";
    
    statusUpdaten();
    zeichneRad();

    // Button Text anpassen, falls wir in der gemischten Runde sind
    const exitBtn = document.querySelector('#countdownBereich button[onclick="zurueckZumMenueAusCountdown()"]');
    if (exitBtn) {
        exitBtn.innerText = isGemischteRunde ? "Weiter im Mix 🚀" : "Zurück zur Spielauswahl";
    }
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
        ctx.arc(radius, radius, radius, startWinkel, endWinkel);
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
        if (spieler.emoji.includes('<img')) {
            const imgSrcMatch = spieler.emoji.match(/src=["']([^"']+)["']/);
            if (imgSrcMatch && imgSrcMatch[1]) {
                const img = new Image();
                img.src = imgSrcMatch[1];
                try {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(radius - 40, 0, 40, 0, Math.PI * 2); // Clip-Kreisradius auf 40 erhöht
                    ctx.clip();
                    ctx.drawImage(img, radius - 80, -40, 80, 80); // Bildgröße auf 80x80 erhöht
                    ctx.restore();
                } catch(e) {}
            }
        } else {
            // Name auch bei Emojis entfernt, dafür Emojis größer
            ctx.font = "30px Inter";
            ctx.fillText(spieler.emoji, radius - 25, 10);
        }
        ctx.restore();
    });
}

function getSpielerDisplayHtml(player) {
    const istFoto = player.emoji && player.emoji.includes('<img');
    return `
        <div style="display: flex; flex-direction: column; align-items: center; margin: 15px 0;">
            <div class="avatar-wrapper" style="width: 180px; height: 180px; font-size: 6rem;">
                ${player.emoji}
            </div>
            ${istFoto ? '' : `
                <span class="spieler-name-display" style="font-size: 1.2rem; font-weight: bold; margin-top: 8px;">${player.name}</span>
            `}
        </div>
    `;
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
    if (typeof stopBackgroundMusic === "function") stopBackgroundMusic();
    if (isGemischteRunde) {
        zeigeBereich('spielBereich');
        karteZiehen();
    } else {
        if (typeof zurueckZumHauptMenue === "function") {
            zurueckZumHauptMenue();
        }
    }
}