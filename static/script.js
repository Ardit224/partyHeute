let aktuelleKategorie = ""; 
let aktuelleSchluecke = 0; 
let aktuellerSpielerIndex = -1; 

// 1. SPIEL STARTEN
function spielStarten() {
    let spieler = JSON.parse(localStorage.getItem('partySpieler')) || [];
    let aktiveSpieler = spieler.filter(s => s.aktiv !== false);
    
    if (aktiveSpieler.length < 2) {
        alert("Es müssen mindestens 2 Spieler aktiv sein!");
        return;
    }

    document.querySelector('.editor-box').style.display = 'none';
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('levelInput').style.display = 'none';
    document.getElementById('hauptMenue').style.display = 'block';
}

function kategorieWaehlen(kategorie) {
    aktuelleKategorie = kategorie; 
    document.getElementById('hauptMenue').style.display = 'none';
    document.getElementById('spielBereich').style.display = 'block';
    karteZiehen();
}

// 2. KARTEN LOGIK
async function karteZiehen() {
    document.getElementById('entscheidungsBereich').style.display = 'flex';
    document.getElementById('naechsteKarteBtn').style.display = 'none';
    document.getElementById('werTrinktBereich').style.display = 'none';

    const gewähltesLevel = document.getElementById('levelInput').value;
    const antwort = await fetch(`/neue_karte?level=${gewähltesLevel}&kategorie=${aktuelleKategorie}`);
    const daten = await antwort.json();

    aktuelleSchluecke = daten.schluecke;
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
    
    let aktiveIndizes = [];
    spielerListe.forEach((spieler, index) => {
        if (spieler.aktiv !== false) aktiveIndizes.push(index);
    });

    let zufallsTreffer = Math.floor(Math.random() * aktiveIndizes.length);
    aktuellerSpielerIndex = aktiveIndizes[zufallsTreffer]; 
    
    let zufallsSpieler = spielerListe[aktuellerSpielerIndex];

    // HTML-Struktur für die Anzeige im Text (Bild/Emoji oben, Name unten)
    let spielerHtml = `<span class="spieler-anzeige">`;
    if (zufallsSpieler.emoji.includes('<img')) {
        spielerHtml += zufallsSpieler.emoji;
    } else {
        spielerHtml += `<span class="emoji-display">${zufallsSpieler.emoji}</span>`;
    }
    spielerHtml += `<span class="spieler-name-display">${zufallsSpieler.name}</span></span>`;

    let fertigeFrage = daten.frage.replace("[SPIELER]", spielerHtml);

    const frageElement = document.getElementById('frageText');
    frageElement.innerHTML = fertigeFrage;
    
    // Animation kurz neu triggern
    frageElement.classList.remove('karten-animation');
    void frageElement.offsetWidth; 
    frageElement.classList.add('karten-animation');

    document.getElementById('failBtn').innerText = `🍻 Jemand trinkt (+${aktuelleSchluecke} 🍺)`;
    document.getElementById('strafeText').innerText = `Einsatz: ${aktuelleSchluecke} Schlücke!`;
}

function niemandTrinkt() {
    document.getElementById('entscheidungsBereich').style.display = 'none';
    document.getElementById('naechsteKarteBtn').style.display = 'block';
}

function werMussTrinkenZeigen() {
    document.getElementById('entscheidungsBereich').style.display = 'none';
    document.getElementById('werTrinktBereich').style.display = 'block';
    
    const auswahlBereich = document.getElementById('auswahlListe');
    auswahlBereich.innerHTML = ""; 
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
    
    spielerListe.forEach((spieler, index) => {
        if (spieler.aktiv !== false) {
            auswahlBereich.innerHTML += `
                <button class="strafe-btn btn-fail" onclick="strafSchluckeVerteilen(${index})">
                    ${spieler.emoji} ${spieler.name}
                </button>`;
        }
    });
}

function strafSchluckeVerteilen(gewaehlterIndex) {
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
    spielerListe[gewaehlterIndex].schluecke += aktuelleSchluecke;
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
    
    // WICHTIG: listeAnzeigen() wird hier aufgerufen, kommt aber aus storage.js!
    listeAnzeigen(); 
    
    document.getElementById('werTrinktBereich').style.display = 'none';
    document.getElementById('naechsteKarteBtn').style.display = 'block';
}

// 3. NAVIGATION
function zurueckZumMenue() {
    document.getElementById('spielBereich').style.display = 'none';
    document.getElementById('hauptMenue').style.display = 'block';
}

function zurueckZurGarderobe() {
    document.getElementById('hauptMenue').style.display = 'none';
    document.querySelector('.editor-box').style.display = 'block';
    document.getElementById('levelInput').style.display = 'block';
    document.getElementById('startBtn').style.display = 'block';
}

// Startet die Anzeige beim Laden (Funktion aus storage.js)
window.onload = listeAnzeigen;