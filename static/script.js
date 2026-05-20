let aktuelleKategorie = ""; 
let aktuelleSchluecke = 0; 
let aktuellerSpielerIndex = -1; 

// 1. ANZEIGEN & TOGGLEN
function listeAnzeigen() {
    const listenBereich = document.getElementById('spielerListe');
    listenBereich.innerHTML = ""; 

    let gespeicherteSpieler = JSON.parse(localStorage.getItem('partySpieler')) || [];

    gespeicherteSpieler.forEach((spieler, index) => {
        if (spieler.schluecke === undefined) spieler.schluecke = 0;
        // Standardmäßig macht jeder mit, außer er wurde explizit pausiert
        if (spieler.aktiv === undefined) spieler.aktiv = true;

        // Wenn inaktiv, bekommt die Karte die ausgegraute CSS-Klasse
        let extraKlasse = spieler.aktiv ? "" : "spieler-inaktiv";

        // onclick="spielerTogglen()" macht die Karte zum Button
        listenBereich.innerHTML += `
            <div class="spieler-karte ${extraKlasse}" onclick="spielerTogglen(${index})" title="Klicken für Pause/Mitspielen">
                ${spieler.emoji} ${spieler.name} 
                <span class="schluck-anzahl">${spieler.schluecke} 🍺</span>
            </div>
        `;
    });
}

// NEU: Setzt einen Spieler auf aktiv/inaktiv
function spielerTogglen(index) {
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
    spielerListe[index].aktiv = !spielerListe[index].aktiv; // Dreht den Schalter um
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
    listeAnzeigen();
}

function erstelleCharakter() {
    const name = document.getElementById('nameInput').value;
    const emoji = document.getElementById('emojiInput').value;

    if (name.trim() === "") {
        alert("Bitte gib einen Namen ein!");
        return;
    }

    const neuerSpieler = {
        name: name,
        emoji: emoji,
        schluecke: 0,
        aktiv: true // Neue Spieler sind direkt am Start
    };

    let gespeicherteSpieler = JSON.parse(localStorage.getItem('partySpieler')) || [];
    gespeicherteSpieler.push(neuerSpieler);
    localStorage.setItem('partySpieler', JSON.stringify(gespeicherteSpieler));

    document.getElementById('nameInput').value = "";
    listeAnzeigen();
}

// 2. SPIEL STARTEN (Prüfen auf aktive Spieler)
function spielStarten() {
    let spieler = JSON.parse(localStorage.getItem('partySpieler')) || [];
    
    // Zählen, wie viele WIRKLICH mitspielen
    let aktiveSpieler = spieler.filter(s => s.aktiv !== false);
    
    if (aktiveSpieler.length < 2) {
        alert("Es müssen mindestens 2 Spieler aktiv sein (nicht ausgegraut)!");
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

// 3. KARTEN ZIEHEN (Nur aus aktiven Spielern)
async function karteZiehen() {
    document.getElementById('entscheidungsBereich').style.display = 'flex';
    document.getElementById('naechsteKarteBtn').style.display = 'none';
    document.getElementById('werTrinktBereich').style.display = 'none';

    const gewähltesLevel = document.getElementById('levelInput').value;
    const antwort = await fetch(`/neue_karte?level=${gewähltesLevel}&kategorie=${aktuelleKategorie}`);
    const daten = await antwort.json();

    aktuelleSchluecke = daten.schluecke;

    let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
    
    // Finde heraus, an welchen Positionen in der Liste die AKTIVEN Spieler stehen
    let aktiveIndizes = [];
    spielerListe.forEach((spieler, index) => {
        if (spieler.aktiv !== false) {
            aktiveIndizes.push(index);
        }
    });

    // Einen zufälligen Index aus dem Pool der AKTIVEN Spieler ziehen
    let zufallsTreffer = Math.floor(Math.random() * aktiveIndizes.length);
    aktuellerSpielerIndex = aktiveIndizes[zufallsTreffer]; // Das ist wichtig für die spätere Punktevergabe
    
    let zufallsSpieler = spielerListe[aktuellerSpielerIndex];
    let formatierterName = `${zufallsSpieler.emoji} ${zufallsSpieler.name}`;

    let fertigeFrage = daten.frage.replace("[SPIELER]", formatierterName);

    const frageElement = document.getElementById('frageText');
    frageElement.innerText = fertigeFrage;
    
    frageElement.classList.remove('karten-animation');
    void frageElement.offsetWidth; 
    frageElement.classList.add('karten-animation');

    document.getElementById('failBtn').innerText = `🍻 Jemand trinkt (+${aktuelleSchluecke} 🍺)`;
    document.getElementById('strafeText').innerText = `Einsatz für diese Runde: ${aktuelleSchluecke} Schlücke!`;
}

function niemandTrinkt() {
    document.getElementById('entscheidungsBereich').style.display = 'none';
    document.getElementById('naechsteKarteBtn').style.display = 'block';
}

// 4. STRAFEN VERTEILEN (Nur aktive Spieler anzeigen)
function werMussTrinkenZeigen() {
    document.getElementById('entscheidungsBereich').style.display = 'none';
    document.getElementById('werTrinktBereich').style.display = 'block';
    
    const auswahlBereich = document.getElementById('auswahlListe');
    auswahlBereich.innerHTML = ""; 
    
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
    
    spielerListe.forEach((spieler, index) => {
        // Nur Buttons für Spieler generieren, die auch aktiv mitspielen
        if (spieler.aktiv !== false) {
            auswahlBereich.innerHTML += `
                <button onclick="strafSchluckeVerteilen(${index})" style="background-color: #ef4444; margin: 5px; width: auto; padding: 10px 15px;">
                    ${spieler.emoji} ${spieler.name}
                </button>
            `;
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

// 5. MENÜ NAVIGATION & RESET
function zurueckZumMenue() {
    document.getElementById('spielBereich').style.display = 'none';
    document.getElementById('hauptMenue').style.display = 'block';
}

function punkteResetten() {
    if (confirm("Möchtet ihr wirklich alle Schlücke auf 0 zurücksetzen?")) {
        let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
        spielerListe.forEach(spieler => {
            spieler.schluecke = 0;
        });
        localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
        listeAnzeigen();
    }
}

function zurueckZurGarderobe() {
    document.getElementById('hauptMenue').style.display = 'none';
    document.querySelector('.editor-box').style.display = 'block';
    document.getElementById('levelInput').style.display = 'block';
    document.getElementById('startBtn').style.display = 'block';
}

window.onload = listeAnzeigen;