/**
 * shot_roulette.js
 * Logik für das kartenbasierte Shot-Roulette unter Berücksichtigung der Sitzordnung.
 */

let sr_aktuelleSchluecke = 0;

function starteShotRoulette() {
    const spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    const aktiveSpieler = spielerListe.filter(s => s.aktiv !== false);

    if (aktiveSpieler.length < 2) {
        customAlert("Halt! 🛑 Für das Shot-Roulette müssen mindestens 2 Spieler aktiv sein!");
        return;
    }

    zeigeBereich('shotRouletteBereich');
    
    // Selector robuster machen, da sich das onclick Attribut im Mix ändern kann
    let exitBtn = document.querySelector('#shotRouletteBereich .nav-btn[onclick*="zurueckZumHauptMenue"]');
    if (!exitBtn) exitBtn = document.querySelector('#shotRouletteBereich .nav-btn[onclick*="geheZurueckZumMix"]');
    
    const nextBtn = document.getElementById('shotNextBtn');
    
    if (isGemischteRunde) {
        if (nextBtn) nextBtn.style.display = 'none'; // Verstecke "Nächste Runde" im Mix
        if (exitBtn) {
            exitBtn.innerText = "Weiter";
            exitBtn.setAttribute('onclick', 'geheZurueckZumMix()');
        }
    } else {
        if (nextBtn) nextBtn.style.display = 'block';
        if (exitBtn) {
            exitBtn.innerText = "Zurück zur Auswahl";
            exitBtn.onclick = () => zurueckZumHauptMenue();
        }
    }

    // UI Reset
    document.getElementById('shotSelectionArea').style.display = 'none';
    naechsteShotRunde();
}

function naechsteShotRunde() {
    const spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    const pool = spielerListe.filter(s => s.aktiv !== false);
    
    if (pool.length < 2) return;

    // 1. Zufällige Werte generieren (Index-Logik bleibt für P1/P2 intern)
    const p1Idx = Math.floor(Math.random() * pool.length);
    sr_aktuelleSchluecke = Math.floor(Math.random() * 5) + 1;

    let p2Idx = Math.floor(Math.random() * pool.length);
    while (p2Idx === p1Idx) {
        p2Idx = Math.floor(Math.random() * pool.length);
    }

    const schlucke = Math.floor(Math.random() * 5) + 1;

    // 2. Spieler-Objekte (links/rechts werden nicht mehr namentlich gerendert)
    const p1 = pool[p1Idx];
    const p2 = pool[p2Idx];

    // 3. Aufgaben-Templates ohne die Namen von Nachbarn
    const templates = [
        "{p1} trinkt {schlucke} Schlücke.",
        "Der links neben {p1} muss {schlucke} Schlücke trinken!",
        "Der rechts neben {p1} muss {schlucke} Schlücke trinken!",
        "Glück gehabt! In dieser Runde trinkt niemand. Atmet kurz durch.",
        "{p1} und {p2} trinken beide {schlucke} Schlücke.",
        "Alle trinken 2 Schlücke, außer {p1} – der darf zuschauen.",
        "Schicksalswahl: {p1} wählt jemanden, der {schlucke} Schlücke trinken muss.",
        "Die beiden Nachbarn von {p1} trinken {schlucke} Schlücke.",
        "Die Person gegenüber von {p1} trinkt {schlucke} Schlücke.",
        "Alle außer {p1} trinken {schlucke} Schlücke."
    ];

    const zufallsTemplate = templates[Math.floor(Math.random() * templates.length)];
    const istNiemandRunde = zufallsTemplate.includes("niemand");

    // 4. Platzhalter ersetzen (mit Styling)
    const renderName = (s) => `<span style="color: #ef4444; font-weight: bold;">${s.name}</span>`;
    
    let aufgabe = zufallsTemplate
        .replace(/{p1}/g, renderName(p1))
        .replace(/{p2}/g, renderName(p2))
        .replace(/{schlucke}/g, `<b>${sr_aktuelleSchluecke}</b>`);

    // 5. UI Update
    const textEl = document.getElementById('shotTaskText');
    const selectionArea = document.getElementById('shotSelectionArea');
    textEl.style.opacity = 0;
    
    setTimeout(() => {
        textEl.innerHTML = aufgabe;
        textEl.style.opacity = 1;
        if (typeof playSound === 'function') playSound('card');
        
        // Zeige Auswahl-Grid nur, wenn getrunken werden muss
        if (istNiemandRunde) {
            if (isGemischteRunde) {
                selectionArea.style.display = 'block';
                document.getElementById('shotPlayerGrid').innerHTML = `
                    <button class="nav-btn" style="grid-column: 1 / -1; margin: 20px auto; padding: 15px;" onclick="geheZurueckZumMix()">Weiter</button>
                `;
            } else {
                selectionArea.style.display = 'none';
            }
        } else if (!isCounterEnabled) {
            selectionArea.style.display = 'block';
            document.getElementById('shotPlayerGrid').innerHTML = `
                <button class="nav-btn" style="grid-column: 1 / -1; margin: 20px auto; padding: 15px;" onclick="${isGemischteRunde ? 'geheZurueckZumMix()' : 'naechsteShotRunde()'}">Weiter</button>
            `;
        } else {
            selectionArea.style.display = 'block';
            sr_zeichneTrinkerAuswahl(pool);
        }
    }, 150);

    sr_registriereAktion(p1.name);
}

function sr_zeichneTrinkerAuswahl(pool) {
    const grid = document.getElementById('shotPlayerGrid');
    grid.innerHTML = "";
    
    pool.forEach(spieler => {
        const btn = document.createElement('button');
        btn.className = "strafe-btn";

        btn.innerHTML = `
            <div class="strafe-avatar-container">
                ${spieler.emoji}
            </div>
        `;

        btn.onclick = (e) => {
            sr_bucheSchlückeManuell(spieler.name, e.currentTarget);
        };
        grid.appendChild(btn);
    });

    // "Fertig" Button zum Bestätigen der Auswahl hinzufügen
    const fertigBtn = document.createElement('button');
    fertigBtn.innerHTML = "FERTIG 🚀";
    fertigBtn.className = "nav-btn btn-cyber-purple";
    fertigBtn.style.gridColumn = "1 / -1";
    fertigBtn.style.marginTop = "15px";
    fertigBtn.onclick = () => {
        if (isGemischteRunde) {
            geheZurueckZumMix();
        } else {
            naechsteShotRunde();
        }
    };
    grid.appendChild(fertigBtn);
}

function sr_bucheSchlückeManuell(playerName, btn) {
    if (btn.classList.contains('selected-for-drink')) return;

    let alleSpieler = JSON.parse(localStorage.getItem('partySpieler')) || [];
    let spieler = alleSpieler.find(s => s.name === playerName);
    if (spieler) {
        spieler.schluecke += sr_aktuelleSchluecke;
        localStorage.setItem('partySpieler', JSON.stringify(alleSpieler));
        if (typeof playSound === 'function') playSound('click');
        
        // Spieler als ausgewählt markieren (ausgrauen)
        btn.classList.add('selected-for-drink');
        
        if (typeof listeAnzeigen === 'function') listeAnzeigen();
    }
}

function sr_registriereAktion(playerName) {
    let alleSpieler = JSON.parse(localStorage.getItem('partySpieler')) || [];
    let spieler = alleSpieler.find(s => s.name === playerName);
    if (spieler) {
        spieler.ausgewaehltCount = (spieler.ausgewaehltCount || 0) + 1;
        localStorage.setItem('partySpieler', JSON.stringify(alleSpieler));
        if (typeof listeAnzeigen === 'function') listeAnzeigen();
    }
}