/**
 * virusspiel.js
 * Verwaltet die "Viren" - Regeln, die über mehrere Runden aktiv bleiben.
 */

let aktiveViren = [];

const virusTemplates = [
    "🦠 VIRUS: {p1} darf ab jetzt nicht mehr das Wort 'Ja' oder 'Nein' sagen. Bei Verstoß: {schlucke} Schlücke.",
    "🦠 INFEKTION: {p1} darf nur noch mit der linken Hand trinken. Bei Verstoß: {schlucke} Schlücke.",
    "🦠 SCHWEIGEPLICHT: Sobald {p1} eine Frage gestellt wird, muss {p2} stattdessen antworten. Sonst: {schlucke} Schlücke.",
    "🦠 ECHO: {p1} muss jedes Mal das letzte Wort der Person wiederholen, die gerade gesprochen hat. Sonst: {schlucke} Schlücke.",
    "🦠 T-REX: {p1} muss beim Trinken die Ellbogen am Körper lassen (kurze Arme). Sonst: {schlucke} Schlücke.",
    "🦠 BLINZEL-STOPP: {p1} darf beim Trinken nicht blinzeln. Sonst: {schlucke} Schlücke.",
    "🦠 PARANOIA-VIRUS: {p1} muss nach jedem Satz misstrauisch hinter sich schauen. Sonst: {schlucke} Schlücke.",
    "🦠 KOMPLIMENT-ZWANG: Jedes Mal wenn {p1} trinkt, muss er/sie {p2} ein Kompliment machen. Sonst: {schlucke} Schlücke."
];

function starteVirusSpiel() {
    zeigeBereich('virusBereich');
    updateVirusUI();
}

/**
 * Erstellt einen neuen Virus.
 * @param {boolean} isMixed - Wenn true, hat der Virus eine begrenzte Rundenzahl.
 */
function neuerVirus(isMixed = false) {
    const spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    const aktiveSpieler = spielerListe.filter(s => s.aktiv !== false);
    
    if (aktiveSpieler.length < 2) {
        if(!isMixed) customAlert("Zu wenig Spieler für ein Virus-Labor! ☣️");
        return null;
    }

    const template = virusTemplates[Math.floor(Math.random() * virusTemplates.length)];
    const p1 = aktiveSpieler[Math.floor(Math.random() * aktiveSpieler.length)];
    let p2 = aktiveSpieler[Math.floor(Math.random() * aktiveSpieler.length)];
    while(p2.name === p1.name) {
        p2 = aktiveSpieler[Math.floor(Math.random() * aktiveSpieler.length)];
    }
    
    const schlucke = Math.floor(Math.random() * 3) + 2;
    // Im Mixed-Modus halten Viren 5-10 Runden, im Einzelmodus unbegrenzt (-1)
    const runden = isMixed ? Math.floor(Math.random() * 6) + 5 : -1;

    const renderName = (n) => `<span style="color: #22c55e; font-weight: bold;">${n}</span>`;
    
    const plainText = template
        .replace(/{p1}/g, p1.name)
        .replace(/{p2}/g, p2.name)
        .replace(/{schlucke}/g, schlucke);

    const styledText = template
        .replace(/{p1}/g, renderName(p1.name))
        .replace(/{p2}/g, renderName(p2.name))
        .replace(/{schlucke}/g, `<strong>${schlucke}</strong>`);

    const virus = {
        id: Date.now(),
        text: styledText,
        plainText: plainText,
        runden: runden
    };

    aktiveViren.push(virus);
    if (!isMixed) updateVirusUI();
    updateVirusStatusBar();
    return virus;
}

function virusHeilen(id) {
    aktiveViren = aktiveViren.filter(v => v.id !== id);
    updateVirusUI();
    updateVirusStatusBar();
}

function updateVirusUI() {
    const container = document.getElementById('aktiveVirenListe');
    if(!container) return;
    container.innerHTML = aktiveViren.filter(v => v.runden === -1).length === 0 ? "<p style='opacity:0.5;'>Keine permanenten Viren aktiv.</p>" : "";
    
    aktiveViren.forEach(v => {
        if(v.runden === -1) {
             container.innerHTML += `
                <div class="virus-card">
                    <p>${v.text}</p>
                    <button class="heal-btn" onclick="virusHeilen(${v.id})">💉 Heilen</button>
                </div>
            `;
        }
    });
}

function virusTick() {
    aktiveViren.forEach(v => {
        if (v.runden > 0) v.runden--;
    });
    aktiveViren = aktiveViren.filter(v => v.runden !== 0);
    updateVirusStatusBar();
}

function updateVirusStatusBar() {
    const bar = document.getElementById('activeVirusBar');
    if(!bar) return;
    const mixedViren = aktiveViren.filter(v => v.runden > 0);
    if (mixedViren.length === 0) {
        bar.style.display = 'none';
        return;
    }
    bar.style.display = 'block';
    bar.innerHTML = "☣️ AKTIVE VIREN: " + mixedViren.map(v => `${v.plainText} (${v.runden}R)`).join(" | ");
}