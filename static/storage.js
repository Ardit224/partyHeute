// Variable für das Kamera-Foto (wird von camera.js befüllt)

function erstelleCharakter() {
    const nameInput = document.getElementById('nameInput');
    const emojiInput = document.getElementById('emojiInput');
    const name = nameInput.value;
    const emoji = emojiInput.value;

    if (name.trim() === "") {
        alert("Bitte gib einen Namen ein!");
        return;
    }

    // Entscheidung: Foto oder Emoji?
    let bildOderEmoji = emoji;
    if (aktuellesFoto) {
        bildOderEmoji = `<img src="${aktuellesFoto}">`;
    }

    const neuerSpieler = {
        name: name,
        emoji: bildOderEmoji,
        schluecke: 0,
        aktiv: true
    };

    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    spielerListe.push(neuerSpieler);
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));

    // Felder leeren
    nameInput.value = "";
    
    // Kamera zurücksetzen
    aktuellesFoto = null;
    if(document.getElementById('photoPreview')) document.getElementById('photoPreview').style.display = "none";
    if(document.getElementById('video')) document.getElementById('video').style.display = "none";
    if(document.getElementById('startCameraBtn')) document.getElementById('startCameraBtn').innerText = "📸 Kamera öffnen";

    listeAnzeigen();
}

function listeAnzeigen() {
    const listenBereich = document.getElementById('spielerListe');
    if (!listenBereich) return;
    listenBereich.innerHTML = ""; 

    let gespeicherteSpieler = JSON.parse(localStorage.getItem('partySpieler')) || [];

    gespeicherteSpieler.forEach((spieler, index) => {
        let extraKlasse = (spieler.aktiv !== false) ? "" : "spieler-inaktiv";

        listenBereich.innerHTML += `
            <div class="spieler-karte ${extraKlasse}" onclick="spielerTogglen(${index})">
                <div class="charakter-actions">
                    <button class="action-btn edit" onclick="event.stopPropagation(); charakterBearbeiten(${index})">✏️</button>
                    <button class="action-btn delete" onclick="event.stopPropagation(); charakterLoeschen(${index})">🗑️</button>
                </div>
                <div class="avatar-wrapper">
                    ${spieler.emoji}
                </div>
                <span class="spieler-name">${spieler.name}</span>
                <span class="schluck-anzahl">${spieler.schluecke || 0} 🍺</span>
            </div>
        `;
    });
}

function spielerTogglen(index) {
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
    spielerListe[index].aktiv = !spielerListe[index].aktiv;
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
    listeAnzeigen();
}

function charakterLoeschen(index) {
    if (confirm("Charakter wirklich löschen?")) {
        let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
        spielerListe.splice(index, 1);
        localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
        listeAnzeigen();
    }
}

function charakterBearbeiten(index) {
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
    let spieler = spielerListe[index];

    document.getElementById('nameInput').value = spieler.name;
    
    // Wir löschen ihn aus der Liste, damit er beim "Speichern" neu angelegt wird
    spielerListe.splice(index, 1);
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    listeAnzeigen();
}

function punkteResetten() {
    if (confirm("Alle Schlücke auf 0 setzen?")) {
        let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
        spielerListe.forEach(s => s.schluecke = 0);
        localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
        listeAnzeigen();
    }
}