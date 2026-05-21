let aktuelleKategorie = ""; 
let aktuelleSchluecke = 0; 
let aktuellerSpielerIndex = -1; 

function zeigeBereich(bereichId) {
    const bereiche = ['startMenue', 'editor-box', 'hauptMenue', 'spielBereich', 'countdownBereich'];
    bereiche.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Nutze 'flex' oder 'block' je nach Bedarf, hier ist 'block' sicher
            el.style.display = (id === bereichId) ? 'block' : 'none';
        }
    });
    
    // Aktualisiere die Spielerliste bei jedem Bereichswechsel
    if (typeof window.listeAnzeigen === "function") {
        listeAnzeigen();
    }
}

/**
 * Erstellt ein schönes Overlay für Benachrichtigungen
 */
function customAlert(nachricht) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
        <div class="custom-modal">
            <p>${nachricht}</p>
            <button onclick="this.parentElement.parentElement.remove()">OK</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

/**
 * Erstellt ein Bestätigungs-Modal (Ja/Nein)
 */
function customConfirm(nachricht, jaCallback) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
        <div class="custom-modal">
            <p>${nachricht}</p>
            <div class="modal-buttons">
                <button class="btn-confirm" id="modalJa">Ja</button>
                <button class="btn-cancel" id="modalNein">Abbrechen</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('modalJa').onclick = () => {
        jaCallback();
        overlay.remove();
    };
    document.getElementById('modalNein').onclick = () => overlay.remove();
}

// CSS für die Modale dynamisch hinzufügen (damit es sofort funktioniert)
const style = document.createElement('style');
style.innerHTML = `
    .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(5px); }
    .custom-modal { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); padding: 25px; border-radius: 20px; text-align: center; color: white; max-width: 80%; box-shadow: 0 8px 32px rgba(0,0,0,0.3); backdrop-filter: blur(15px); }
    .custom-modal p { font-size: 1.2rem; margin-bottom: 20px; }
    .custom-modal button { background: #3b82f6; border: none; color: white; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 1rem; margin: 5px; }
    .modal-buttons { display: flex; justify-content: center; gap: 10px; }
    .btn-confirm { background: #ef4444 !important; }
    .btn-cancel { background: #6b7280 !important; }
    .custom-modal button:hover { opacity: 0.8; }
`;
document.head.appendChild(style);

function initialisiereApp() {
    console.log("App wird initialisiert...");
    // Stelle sicher, dass beim Start alle Spiel-UI-Elemente versteckt sind
    if (document.getElementById('naechsteKarteBtn')) {
        document.getElementById('naechsteKarteBtn').style.display = 'none';
    }
    zeigeBereich('startMenue');
}

function geheZuStartMenue() {
    aktuellerSpielerIndex = -1; // Reset des aktuellen Spielers
    zeigeBereich('startMenue');
}

function geheZuGarderobe() {
    zeigeBereich('editor-box');
}

function geheZuSpiele() { 
    const spielerRaw = localStorage.getItem('partySpieler');
    let spieler = spielerRaw ? JSON.parse(spielerRaw) : [];
    let aktiveSpieler = spieler.filter(s => s.aktiv !== false);
    
    if (aktiveSpieler.length < 2) {
        customAlert("Halt! 🛑 Es müssen mindestens 2 Spieler aktiv sein!");
        return;
    }
    zeigeBereich('hauptMenue');
}

// Alias für den Aufruf aus HTML
const geheZuHauptMenue = geheZuSpiele;

function kategorieWaehlen(kategorie) {
    aktuelleKategorie = kategorie; 
    zeigeBereich('spielBereich');
    karteZiehen();
}

function zurueckZumHauptMenue() {
    // Falls wir aus einem Spiel kommen, setzen wir die UI-Zustände zurück
    document.getElementById('werTrinktBereich').style.display = 'none';
    zeigeBereich('hauptMenue');
}

async function karteZiehen() {
    const entscheidung = document.getElementById('entscheidungsBereich');
    const naechsteBtn = document.getElementById('naechsteKarteBtn');
    document.getElementById('werTrinktBereich').style.display = 'none';

    const gewähltesLevel = document.getElementById('levelInput').value;
    const antwort = await fetch(`/neue_karte?level=${gewähltesLevel}&kategorie=${aktuelleKategorie}`); 
    const daten = await antwort.json();

    aktuelleSchluecke = daten.schluecke;
    
    // Sichtbarkeit anpassen
    if (entscheidung) entscheidung.style.display = 'flex';
    if (naechsteBtn) naechsteBtn.style.display = 'none';

    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    
    let aktiveIndizes = [];
    spielerListe.forEach((spieler, index) => {
        if (spieler.aktiv !== false) aktiveIndizes.push(index);
    });

    let zufallsTreffer = Math.floor(Math.random() * aktiveIndizes.length);
    aktuellerSpielerIndex = aktiveIndizes[zufallsTreffer]; 
    
    if (aktuellerSpielerIndex === undefined) {
        customAlert("Fehler: Keine aktiven Spieler gefunden!");
        return;
    }
    
    let zufallsSpieler = spielerListe[aktuellerSpielerIndex];

    let spielerHtml = `<span class="spieler-anzeige">`;
    if (zufallsSpieler.emoji.includes('<img')) {
        spielerHtml += zufallsSpieler.emoji;
    } else {
        spielerHtml += `<span class="emoji-display">${zufallsSpieler.emoji}</span>`;
    }
    spielerHtml += `</span>`;

    let fertigeFrage = daten.frage.replace("[SPIELER]", spielerHtml);

    const frageElement = document.getElementById('frageText');
    frageElement.innerHTML = fertigeFrage;
    
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
                    ${spieler.emoji}
                </button>`;
        }
    });
}

function strafSchluckeVerteilen(gewaehlterIndex) {
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
    spielerListe[gewaehlterIndex].schluecke += aktuelleSchluecke;
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
    
    listeAnzeigen(); 
    
    document.getElementById('werTrinktBereich').style.display = 'none';
    document.getElementById('naechsteKarteBtn').style.display = 'block';
}

window.onload = initialisiereApp;