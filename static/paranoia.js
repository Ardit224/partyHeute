// --- LOGIK FÜR DAS PARANOIA-SPIEL ---

let paranoiaSchluecke = 0;

function starteParanoia() {
    zeigeBereich('paranoiaBereich');
    naechsteParanoiaRunde();

    // UI Button für das Verlassen anpassen
    const exitBtn = document.querySelector('#paranoiaBereich button[onclick="zurueckZumHauptMenue()"]');
    if (exitBtn) exitBtn.innerText = "Zurück zur Auswahl";
}

function naechsteParanoiaRunde() {
    // UI Phasen zurücksetzen
    document.getElementById('paranoiaStart').style.display = "block";
    document.getElementById('paranoiaFrageAnsicht').style.display = "none";
    document.getElementById('paranoiaTrinkAuswahl').style.display = "none";

    // Zufälligen Spieler auswählen, der dran ist
    const spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    const aktiveSpieler = spielerListe.filter(s => s.aktiv !== false);
    
    const zufallsIndex = Math.floor(Math.random() * aktiveSpieler.length);
    const gewaehlterSpieler = aktiveSpieler[zufallsIndex];

    const anzeige = document.getElementById('paranoiaAktiverSpielerAnzeige');
    
    let avatarHtml = gewaehlterSpieler.emoji.includes('<img') 
        ? gewaehlterSpieler.emoji 
        : `<span style="font-size: 80px;">${gewaehlterSpieler.emoji}</span>`;

    anzeige.innerHTML = `
        <div class="spieler-anzeige">
            ${avatarHtml}
            <div class="spieler-name-display" style="font-size: 1.5em; margin-top: 10px;">
                ${gewaehlterSpieler.name}
            </div>
        </div>
    `;
    
    if (typeof playSound === "function") playSound('card');
}

async function paranoiaFrageLaden() {
    const level = document.getElementById('levelInput').value || '2';
    
    // Frage vom Server holen
    const antwort = await fetch(`/neue_karte?level=${level}&kategorie=paranoia`); 
    const daten = await antwort.json();
    paranoiaSchluecke = daten.schluecke;

    // Einen ZWEITEN zufälligen Spieler für den Platzhalter in der Frage finden
    const spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    const aktiveSpieler = spielerListe.filter(s => s.aktiv !== false);
    const zielSpieler = aktiveSpieler[Math.floor(Math.random() * aktiveSpieler.length)];

    // [SPIELER] Platzhalter ersetzen
    let avatar = zielSpieler.emoji.includes('<img') ? zielSpieler.emoji : `<span class="emoji-display">${zielSpieler.emoji}</span>`;
    let fertigeFrage = daten.frage.replace("[SPIELER]", `<span class="spieler-anzeige">${avatar} <span class="spieler-name-display">${zielSpieler.name}</span></span>`);

    // Spezielle Anzeige für Paranoia-Einsatz (Preis für die Antwort)
    if (isCounterEnabled) {
        fertigeFrage = `
            <div style="background: rgba(16, 185, 129, 0.15); border-radius: 12px; padding: 10px; margin-bottom: 20px; font-weight: bold; font-size: 1.2rem; color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">
                🕵️ Preis für die Antwort: ${paranoiaSchluecke} Schlücke
            </div>
            ${fertigeFrage}`;
    }

    document.getElementById('paranoiaText').innerHTML = fertigeFrage;
    
    // Wechsel zur Frage-Ansicht
    document.getElementById('paranoiaStart').style.display = "none";
    document.getElementById('paranoiaFrageAnsicht').style.display = "block";

    // Im Zen-Modus (Counter aus) den "Jemand trinkt" Button verstecken und "Weiter" anpassen
    const drinkBtn = document.getElementById('paranoiaDrinkBtn');
    const skipBtn = document.getElementById('paranoiaSkipBtn');
    
    if (!isCounterEnabled) {
        if (drinkBtn) drinkBtn.style.display = 'none';
        if (skipBtn) {
            skipBtn.innerText = "Weiter";
        }
    } else {
        drinkBtn.style.display = 'inline-block';
        drinkBtn.innerHTML = `🔍 Frage verraten <br><small>+${paranoiaSchluecke} Schlücke</small>`;
        skipBtn.style.display = 'inline-block';
        skipBtn.innerText = "🤫 Geheimnis behalten";
    }
    
    if (typeof playSound === "function") playSound('click');
}

function paranoiaTrinkenAuswaehlen() {
    document.getElementById('paranoiaFrageAnsicht').style.display = "none";
    document.getElementById('paranoiaTrinkAuswahl').style.display = "block";

    const auswahlListe = document.getElementById('paranoiaSpielerListe');
    auswahlListe.innerHTML = "";

    const spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    
    spielerListe.forEach((spieler, index) => {
        if (spieler.aktiv !== false) {
            // Wir nutzen die existierende CSS Klasse spieler-karte für ein einheitliches Bild
            const btn = document.createElement('div');
            btn.className = "spieler-karte";
            btn.innerHTML = `
                <div class="avatar-wrapper">${spieler.emoji}</div>
                <span class="spieler-name">${spieler.name}</span>
            `;
            btn.onclick = () => paranoiaSchluckeVerteilen(index);
            auswahlListe.appendChild(btn);
        }
    });
}

function paranoiaSchluckeVerteilen(index) {
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    
    // Schlücke hinzufügen
    spielerListe[index].schluecke = (spielerListe[index].schluecke || 0) + paranoiaSchluecke;
    
    // Statistik: Wer getrunken hat, wurde auch "gewählt"
    spielerListe[index].ausgewaehltCount = (spielerListe[index].ausgewaehltCount || 0) + 1;
    
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));

    // Sound-Feedback
    if (typeof playSound === "function") playSound('win');
    
    // UI aktualisieren (Globale Liste unten)
    if (typeof listeAnzeigen === "function") listeAnzeigen();

    // Im gemischten Modus den "Nächste Frage" Knopf unterdrücken und nur "Weiter im Mix" erlauben
    if (isGemischteRunde) {
        document.getElementById('paranoiaSpielerListe').innerHTML = `
            <div style="text-align:center; width:100%; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center;">
                <h3 style="color:#10b981; margin-bottom: 20px;">Schlücke gebucht! ✅</h3>
                <button class="nav-btn" onclick="geheZurueckZumMix()">Weiter</button>
            </div>
        `;
    } else {
        naechsteParanoiaRunde();
    }
}

function paranoiaNiemandTrinkt() {
    if (isGemischteRunde) {
        geheZurueckZumMix();
    } else {
        naechsteParanoiaRunde();
    }
}