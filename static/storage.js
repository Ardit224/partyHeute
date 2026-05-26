// Globale Variablen sicher deklarieren
if (typeof aktuellesFoto === 'undefined') {
    window.aktuellesFoto = null;
}
let aktuellEditIndex = -1;

function erstelleCharakter() {
    const nameInput = document.getElementById('nameInput');
    const emojiInput = document.getElementById('emojiInput');
    const name = nameInput.value;
    const emoji = emojiInput.value;

    if (name.trim() === "") {
        customAlert("Wer bist du? Bitte gib einen Namen ein! ✍️");
        return;
    }

    // Entscheidung: Foto oder Emoji?
    let bildOderEmoji;
    if (window.aktuellesFoto) {
        // Bild hat Priorität
        bildOderEmoji = `<img src="${window.aktuellesFoto}">`;
    } else {
        // Emoji ist der Fallback
        bildOderEmoji = emoji || "👤"; 
    }

    const neuerSpieler = {
        name: name,
        emoji: bildOderEmoji,
        schluecke: 0,
        aktiv: true,
        ausgewaehltCount: 0,
        getraenkeCount: 0
    };

    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    
    if (aktuellEditIndex > -1) {
        // Bestehenden Spieler aktualisieren statt neu erstellen
        spielerListe[aktuellEditIndex] = neuerSpieler;
        aktuellEditIndex = -1; 
    } else {
        spielerListe.push(neuerSpieler);
    }
    
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));

    // Felder leeren
    nameInput.value = "";
    
    // Kamera zurücksetzen
    if (typeof stopCameraStream === 'function') {
        stopCameraStream(); // Stoppt den Stream und setzt die UI zurück
    }
    listeAnzeigen();
}

function listeAnzeigen() {
    const miniGrid = document.getElementById('miniCharGrid');
    const listenBereich = document.getElementById('spielerListe');
    const uebersichtGrid = document.getElementById('gaesteGrid');
    
    let gespeicherteSpieler = JSON.parse(localStorage.getItem('partySpieler')) || [];
    const istGarderobe = document.getElementById('editor-box') && document.getElementById('editor-box').style.display !== 'none';

    // Spezielles Rendering für das Garderoben-Grid
    if (istGarderobe && miniGrid) {
        miniGrid.innerHTML = "";
        gespeicherteSpieler.forEach((spieler, index) => {
            const content = spieler.emoji.includes('<img') ? spieler.emoji : '';
            miniGrid.innerHTML += `
                <div class="mini-char-card" style="position: relative;">
                    <div class="charakter-actions" style="opacity: 1; top: 5px; right: 5px;">
                        <button class="action-btn edit" style="padding: 2px 5px;" onclick="event.stopPropagation(); charakterBearbeiten(${index})">✏️</button>
                        <button class="action-btn delete" style="padding: 2px 5px;" onclick="event.stopPropagation(); charakterLoeschen(${index})">🗑️</button>
                    </div>
                    <div class="initial-circle">${content}</div>
                    <span style="color: var(--neon-purple); font-size: 0.6rem; font-weight: bold; text-transform: uppercase;">${spieler.name}</span>
                </div>
            `;
        });
    }

    // Rendering für den neuen Gäste-Übersicht Screen (Manueller Edit-Modus)
    if (uebersichtGrid && document.getElementById('gaesteUebersicht').style.display === 'block') {
        uebersichtGrid.innerHTML = "";
        gespeicherteSpieler.forEach((spieler, index) => {
            if (spieler.aktiv === false) return;
            
            uebersichtGrid.innerHTML += `
                <div class="gaeste-card">
                    <div class="avatar-wrapper" style="width: 60px; height: 60px;">${spieler.emoji}</div>
                    <div style="font-size: 0.7rem; font-weight: 900; margin-top: 8px; letter-spacing: 1px;">${spieler.name}</div>
                    
                    <div style="width: 100%; margin-top: 15px;">
                        <div class="control-row">
                            <button class="cyber-mini-btn" onclick="window.schluckAbziehen(${index})">-</button>
                            <span class="val-display">${spieler.schluecke || 0} 🥤</span>
                            <button class="cyber-mini-btn plus" onclick="window.schluckHinzufuegen(${index})">+</button>
                        </div>
                        <div class="control-row">
                            <button class="cyber-mini-btn" onclick="window.getraenkAbziehen(${index})">-</button>
                            <span class="val-display">${spieler.getraenkeCount || 0} 🍹</span>
                            <button class="cyber-mini-btn plus" onclick="window.getraenkHinzufuegen(${index})">+</button>
                        </div>
                    </div>
                </div>
            `;
        });
        return;
    }

    if (listenBereich) {
        listenBereich.innerHTML = "";
        gespeicherteSpieler.forEach((spieler, index) => {
            let extraKlasse = (spieler.aktiv !== false) ? "" : "spieler-inaktiv";
            const actionButtons = istGarderobe ? `
                <div class="charakter-actions">
                    <button class="action-btn edit" onclick="event.stopPropagation(); charakterBearbeiten(${index})">✏️</button>
                    <button class="action-btn delete" onclick="event.stopPropagation(); charakterLoeschen(${index})">🗑️</button>
                </div>` : "";

            listenBereich.innerHTML += `
                <div class="spieler-karte ${extraKlasse}" onclick="spielerTogglen(${index})">
                    ${actionButtons}
                    <div class="avatar-wrapper">
                        ${spieler.emoji}
                    </div>
                    ${spieler.emoji.includes('<img') ? '' : `<span class="spieler-name">${spieler.name}</span>`}
                </div>
            `;
        });
    }
}

window.schluckHinzufuegen = function(index) {
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    spielerListe[index].schluecke = (spielerListe[index].schluecke || 0) + 1;
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
    playSound('click');
    listeAnzeigen();
};

window.schluckAbziehen = function(index) {
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    if (spielerListe[index].schluecke > 0) {
        spielerListe[index].schluecke -= 1;
    }
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
    playSound('click');
    listeAnzeigen();
};

function geheZurueckVonUebersicht() {
    const last = window.lastBereich || 'hauptMenue';
    zeigeBereich(last);
}

function initialisiereGaesteUebersicht() {
    const container = document.getElementById('gaesteUebersicht');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 class="cyber-title glow-purple" style="font-size: 2rem; margin-bottom: 5px;">GÄSTE ÜBERSICHT</h1>
                <p style="font-size: 0.8rem; letter-spacing: 3px; opacity: 0.7;">MANUELLE SYSTEM-KONTROLLE</p>
                <button class="nav-btn btn-cyber-green" style="margin-top: 20px; width: 100%; box-shadow: 0 0 15px var(--neon-green);" onclick="geheZurueckVonUebersicht()">ZURÜCK ZUM SPIEL</button>
            </div>
            <div id="gaesteGrid" class="gaeste-grid"></div>
            <div style="margin-top: 40px; padding: 20px; border-top: 1px dashed rgba(255,255,255,0.1);">
                <button class="nav-btn btn-cyber-red" style="width: 100%; opacity: 0.6; font-size: 0.8rem;" onclick="punkteResetten()">🚨 SYSTEM-RESET (PUNKTE AUF NULL)</button>
            </div>
        `;
    }
}

function spielerTogglen(index) {
    if (document.getElementById('editor-box') && document.getElementById('editor-box').style.display === 'none') return;

    let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
    spielerListe[index].aktiv = !spielerListe[index].aktiv;
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
    listeAnzeigen();
}

function charakterLoeschen(index) {
    
         customConfirm("Soll dieser Charakter wirklich gelöscht werden? 🗑️", () => {
        let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
        spielerListe.splice(index, 1);
        localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
        listeAnzeigen();
    
    });
}

function charakterBearbeiten(index) {
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
    let spieler = spielerListe[index];

    document.getElementById('nameInput').value = spieler.name;
    
    if (!spieler.emoji.includes('<img')) {
        document.getElementById('emojiInput').value = spieler.emoji;
    }

    aktuellEditIndex = index; 
    window.scrollTo({ top: 0, behavior: 'smooth' });
    listeAnzeigen();
}

function punkteResetten() {
    customConfirm("Alle Schlücke auf 0 setzen? Seid ihr wieder nüchtern? 🍹", () => {
        let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
        spielerListe.forEach(s => {
            s.schluecke = 0;
            s.ausgewaehltCount = 0;
            s.getraenkeCount = 0;
        });
        localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
        listeAnzeigen();
      });
}