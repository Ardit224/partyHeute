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
    const listenBereich = document.getElementById('spielerListe');
    if (!listenBereich) return;
    listenBereich.innerHTML = ""; 

    let gespeicherteSpieler = JSON.parse(localStorage.getItem('partySpieler')) || [];
    
    // Prüfen, ob wir uns in der Garderobe befinden
    const istGarderobe = document.getElementById('editor-box') && document.getElementById('editor-box').style.display !== 'none';
    // Prüfen, ob wir in einem aktiven Spielmodus sind
    const istImSpiel = ['spielBereich', 'countdownBereich', 'paranoiaBereich'].includes(
        document.querySelector('.container > div[style*="display: block"]')?.id);

    gespeicherteSpieler.forEach((spieler, index) => {
        let extraKlasse = (spieler.aktiv !== false) ? "" : "spieler-inaktiv";

        // Buttons nur anzeigen, wenn wir in der Garderobe sind
        const actionButtons = istGarderobe ? `
            <div class="charakter-actions">
                <button class="action-btn edit" onclick="event.stopPropagation(); charakterBearbeiten(${index})">✏️</button>
                <button class="action-btn delete" onclick="event.stopPropagation(); charakterLoeschen(${index})">🗑️</button>
            </div>` : "";

        // Getränke-Plus-Button nur im Spiel anzeigen
        const drinkPlusBtn = istImSpiel ? `
            <button class="drink-plus-btn" onclick="event.stopPropagation(); window.getraenkHinzufuegen(${index})">
                +🍺
            </button>` : "";

        listenBereich.innerHTML += `
            <div class="spieler-karte ${extraKlasse}" onclick="spielerTogglen(${index})">
                ${actionButtons}
                <div class="avatar-wrapper">
                    ${spieler.emoji}
                </div>
                <span class="spieler-name">${spieler.name}</span>
                ${drinkPlusBtn}
                <span class="schluck-anzahl">${spieler.schluecke || 0} 🍺</span>
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
    customConfirm("Alle Schlücke auf 0 setzen? Seid ihr wieder nüchtern? 🍺", () => {
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