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
    
    let gespeicherteSpieler = JSON.parse(localStorage.getItem('partySpieler')) || [];
    const istGarderobe = document.getElementById('editor-box') && document.getElementById('editor-box').style.display !== 'none';

    // Spezielles Rendering für das Garderoben-Grid
    if (istGarderobe && miniGrid) {
        miniGrid.innerHTML = "";
        gespeicherteSpieler.slice(-3).forEach(spieler => {
            const content = spieler.emoji.includes('<img') ? spieler.emoji : '';
            miniGrid.innerHTML += `
                <div class="mini-char-card">
                    <div class="initial-circle">${content}</div>
                    <span style="color: var(--neon-purple); font-size: 0.6rem; font-weight: bold; text-transform: uppercase;">${spieler.name}</span>
                </div>
            `;
        });
    }

    if (!listenBereich) return;
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
                ${isCounterEnabled ? `
                    <div class="drink-controls">
                        <button class="drink-btn minus" onclick="event.stopPropagation(); window.getraenkAbziehen(${index})">-</button>
                        <button class="drink-btn plus" onclick="event.stopPropagation(); window.getraenkHinzufuegen(${index})">+🍹</button>
                    </div>
                    <div style="display: flex; justify-content: center; gap: 4px; margin-top: 5px;">
                        <span class="schluck-anzahl" title="Schlücke">${spieler.schluecke || 0} 🥤</span>
                        <span class="getraenke-anzahl" title="Getränke">${spieler.getraenkeCount || 0} 🍹</span>
                    </div>
                ` : `
                    <div style="height: 40px;"></div> <!-- Abstandhalter -->
                `}
            </div>
        `;
    });
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