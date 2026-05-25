let aktuelleKategorie = ""; 
let aktuelleSchluecke = 0; 
let aktuellerSpielerIndex = -1; 
let backgroundMusic = null; // Globale Variable für die Hintergrundmusik
let isMuted = localStorage.getItem('partyMuted') === 'true';
let isGemischteRunde = false;
let aktiveRundenAufgaben = [];
let taskIndexForDrinkSelection = -1; // Trackt, für welche laufende Regel gerade Schlücke verteilt werden
let mixedModePool = []; // Der Stapel für die gemischte Runde
let isCounterEnabled = true; 

const suddenEvents = [
    "🚨 EX UND HOPP! Alle Spieler leeren sofort ihr aktuelles Getränk ohne Ausnahme!",
    "💀 KRIEGSERKLÄRUNG! {p1} muss ein neues, volles Getränk auf Ex leeren ODER eine Person bestimmen, die stattdessen 2 Shots trinkt.",
    "⚡ BLITZ-KRIEG! Der Letzte, der aufsteht und strammsteht, muss 5 Schlücke trinken!",
    "🔄 GLÄSER-TAUSCH! Alle müssen ihr Getränk sofort mit der Person zu ihrer Linken tauschen und dieses in den nächsten 3 Runden trinken.",
    "💣 BOMBEN-ALARM! {p1} ist die Bombe. Die Person muss 2 Runden lang schweigen. Wer sie zum Reden bringt, darf 10 Schlücke verteilen!",
    "🤴 KÖNIGSWORT! {p1} ist für die nächsten 5 Runden der König. Alle müssen bei Antworten 'Eure Majestät' sagen, sonst: 2 Schlücke!",
    "🎭 MIME-MEISTER! {p1} darf ab jetzt 3 Runden lang nicht mehr sprechen. Alles muss mit Händen und Füßen erklärt werden. Wer ihn anspricht, trinkt 2 Schlücke!",
    "📵 HANDY-VERBOT! Alle Handys müssen in die Mitte. Wer seins als Erster berührt, bevor 4 Runden um sind, leert sein Glas!",
    "🤫 FLÜSTER-POST! Ab jetzt darf für 4 Runden nur noch geflüstert werden. Wer laut spricht: 3 Schlücke!",
    "👯 ZWILLINGS-FLUCH! {p1} wählt einen Zwilling. Wann immer einer von beiden trinkt, muss der andere auch trinken (für 5 Runden)!",
    "🧊 EISZEIT! Alle müssen einfrieren (Freeze), sobald {p1} das Wort 'Eis' sagt. Der Letzte, der sich bewegt, trinkt 4 Schlücke (3 Runden aktiv)!",
    "👺 BELEIDIGUNGS-MODUS! {p1} muss 3 Runden lang jeden Satz mit einer netten Beleidigung gegen die Gruppe beenden, sonst: 2 Schlücke!",
    "🕺 TANZZWANG! {p1} muss jedes Mal, wenn jemand 'Prost' sagt, kurz aufstehen und tanzen (für 4 Runden). Versäumnis: 3 Schlücke!",
    "🧐 DER PROFESSOR! {p1} darf 3 Runden lang keine Fragen mehr beantworten. Wer ihn trotzdem fragt, trinkt 2 Schlücke!"
];

function zeigeBereich(bereichId) {
    const bereiche = ['startMenue', 'editor-box', 'hauptMenue', 'spielBereich', 'countdownBereich', 'statistikBereich', 'paranoiaBereich', 'shotRouletteBereich', 'virusBereich', 'tribunalBereich', 'zeitbombeBereich', 'handyWechselBereich', 'counterSelection', 'charakterSelection', 'gaesteUebersicht'];

    // Vorherigen Bereich merken für die Rückkehr aus der Übersicht
    const aktuellSichtbar = bereiche.find(id => {
        const el = document.getElementById(id);
        return el && el.style.display === 'block';
    });
    if (aktuellSichtbar && aktuellSichtbar !== 'gaesteUebersicht') {
        window.lastBereich = aktuellSichtbar;
    }
    
    // Musik stoppen, sobald der Bereich gewechselt wird (Knopf gedrückt)
    stopBackgroundMusic();

    bereiche.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Nutze 'flex' oder 'block' je nach Bedarf, hier ist 'block' sicher
            // Wenn der Editor-Bereich ausgeblendet wird, Kamera stoppen
            if (id === 'editor-box' && bereichId !== 'editor-box') {
                if (typeof stopCameraStream === 'function') { // Sicherstellen, dass die Funktion existiert
                    stopCameraStream();
                }
            }
            el.style.display = (id === bereichId) ? 'block' : 'none';
        }
    });
    
    // Floating Button Sichtbarkeit steuern
    const floatBtn = document.getElementById('floatingGaesteBtn');
    if (floatBtn) {
        const versteckt = ['startMenue', 'editor-box', 'charakterSelection', 'counterSelection', 'gaesteUebersicht', 'statistikBereich'];
        floatBtn.style.display = versteckt.includes(bereichId) ? 'none' : 'flex';
    }

    // Aktualisiere die Spielerliste bei jedem Bereichswechsel
    if (typeof window.listeAnzeigen === "function") {
        listeAnzeigen();
    }
}

/**
 * Spielt kurze Soundeffekte ab
 */
function playSound(type) {
    const sounds = {
        'click': 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
        'win': 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
        'card': 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
        'shot': 'https://assets.mixkit.co/active_storage/sfx/1655/1655-preview.mp3'
    };
    if (sounds[type] && !isMuted) {
        const audio = new Audio(sounds[type]);
        audio.volume = 0.4; // Lautstärke für Effekte reduziert
        audio.play().catch(() => {});
        
        // Haptisches Feedback für mobile Geräte
        if ("vibrate" in navigator) {
            if (type === 'shot') navigator.vibrate([100, 50, 100]); // Doppel-Vibration
            else if (type === 'win') navigator.vibrate(50);         // Kurzer Stoß
            else if (type === 'card') navigator.vibrate(20);        // Fast unmerklich
        }
    }
}

/**
 * Spielt Hintergrundmusik ab.
 */
function playBackgroundMusic(url, volume = 0.15) {
    if (isMuted) return;
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    backgroundMusic = new Audio(url);
    backgroundMusic.loop = true; // Musik soll sich wiederholen
    backgroundMusic.volume = volume;
    backgroundMusic.play().catch(e => console.warn("Hintergrundmusik Autoplay blockiert:", e));
}

/**
 * Stoppt die Hintergrundmusik.
 */
function stopBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0; // Setzt den Song an den Anfang zurück
    }
}

/**
 * Schaltet alle Sounds stumm oder an.
 */
function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('partyMuted', isMuted);
    
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) muteBtn.innerText = isMuted ? "🔇" : "🔊";
    
    if (isMuted) stopBackgroundMusic();
    playSound('click');
}

/**
 * Zeigt die Regeln basierend auf dem aktuellen Spielmodus oder Menü an.
 */
function zeigeRegeln() {
    const regeln = {
        'aufgaben': "Erfülle die Aufgabe auf der Karte. Wenn du scheiterst, musst du trinken! ✅🍹",
        'wer_wuerde_eher': "Die Gruppe zählt auf 3 und zeigt auf die Person, auf die die Aussage am ehesten zutrifft. Die Person mit den meisten Stimmen trinkt! 👆🍹",
        'ich_hab_noch_nie': "Alle, auf die die Aussage zutrifft (die es schon mal getan haben), müssen trinken! 🤫🍹",
        'paranoia': "Stell eine Frage leise an die Person auf dem Display. Diese zeigt auf jemanden. Wenn die Person wissen will warum, muss sie trinken! 🕵️🍹",
        'virus': "Viren sind dauerhafte Regeln. Wer gegen sie verstößt, muss trinken! Sie verschwinden nach ein paar Runden. 🦠🍹",
        'tribunal': "Die Gruppe stimmt über zwei Optionen ab (👍 oder 👎). Die Minderheit (die weniger Stimmen hat) muss trinken! ⚖️🍹",
        'zeitbombe': "Nenne einen Begriff zur Kategorie und gib das Handy schnell weiter. Bei wem die Bombe explodiert, der trinkt! 💣🍹",
        'countdown': "Dreh das Rad! Wer ausgewählt wird, trinkt und ist für den Rest der Runde raus. Der letzte Überlebende gewinnt! 🎡🍹",
        'shot_roulette': "Folge den Anweisungen des Schicksals. Wer Pech hat, muss trinken! 🥃🍹",
        'sudden_event': "Ein Extrem-Event! Alle müssen sofort die Anweisung befolgen. Keine Ausreden! 🚨🍹"
    };

    // Prüfe welcher Bereich gerade sichtbar ist (für Menü-Hilfe)
    if (document.getElementById('startMenue').style.display === 'block') {
        customAlert("Willkommen bei PARTYHEUTE! 🍹 Wähle einen Spielmodus, erstelle Charaktere und genieße den Abend. Alles ist auf Spaß ausgelegt!");
        return;
    }
    if (document.getElementById('editor-box').style.display === 'block') {
        customAlert("In der Garderobe kannst du neue Charaktere erstellen. Gib einen Namen ein und mach optional ein Foto! 👗");
        return;
    }
    if (document.getElementById('charakterSelection').style.display === 'block') {
        customAlert("Wähle hier die Spieler aus, die heute Abend mitspielen sollen (3 - 8 Personen). ✅");
        return;
    }

    let text = regeln[aktuelleKategorie] || "Befolgt einfach die Anweisungen auf dem Bildschirm und habt Spaß! 🍹";
    customAlert(text);
}

/**
 * Zeigt einen speziellen Screen an, wenn eine Aufgabe oder ein Virus beendet ist.
 */
function zeigeBefreiungsScreen(item, isVirus = false) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay freedom-overlay';
    
    let title, subtitle, color, btnClass, text;
    
    if (isVirus) {
        title = "VIRUS GEHEILT! 💉";
        subtitle = "Die Infektion ist vorbei:";
        color = "var(--neon-green)";
        btnClass = "btn-cyber-green";
        text = item.text; 
    } else {
        title = item.isGlobal ? "REGEL BEENDET! ⚖️" : "AUFGABE GESCHAFFT! ✅";
        subtitle = item.isGlobal ? "Die Zeit ist um:" : `${item.spielerEmoji} ${item.spielerName} ist befreit:`;
        color = item.isGlobal ? "var(--neon-red)" : "var(--neon-cyan)";
        btnClass = item.isGlobal ? "btn-cyber-red" : "btn-cyber-purple";
        text = item.text;
    }

    overlay.innerHTML = `
        <div class="custom-modal" style="border: 2px solid ${color}; box-shadow: 0 0 20px ${color}; min-width: 310px;">
            <h1 style="color: ${color}; text-shadow: 0 0 10px ${color}; margin-bottom: 10px; font-size: 1.8rem;">${title}</h1>
            <p style="font-size: 1.1rem; margin-bottom: 20px; color: #fff;">${subtitle}</p>
            <div style="background: rgba(0,0,0,0.6); padding: 20px; border-radius: 15px; margin-bottom: 25px; font-style: italic; border: 1px solid rgba(255,255,255,0.1); line-height: 1.4;">
                ${text}
            </div>
            <button class="nav-btn ${btnClass}" style="height: 60px; font-size: 1.2rem; width: 100%; margin: 0;" onclick="this.parentElement.parentElement.remove()">WEITER 🍹</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    playSound('win');
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

    /* Cyberpunk Statistik Styles */
    .stats-container { padding: 20px; color: white; text-transform: uppercase; background: #050505; min-height: 100vh; }
    .cyber-title { font-family: 'Inter', sans-serif; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
    .glow-cyan { text-shadow: 0 0 10px var(--neon-cyan), 0 0 20px var(--neon-cyan); color: #fff; }
    .glow-purple { text-shadow: 0 0 10px var(--neon-purple), 0 0 20px var(--neon-purple); color: #fff; }
    .glow-red { text-shadow: 0 0 10px var(--neon-red), 0 0 20px var(--neon-red); color: #fff; }

    .podium-wrapper { display: flex; align-items: flex-end; justify-content: center; gap: 15px; margin: 40px 0; height: 220px; }
    .podium-place { display: flex; flex-direction: column; align-items: center; width: 100px; position: relative; }
    .podium-bar { width: 100%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid; border-bottom: none; }
    .place-1 { height: 130px; background: rgba(0, 243, 255, 0.2); border-color: var(--neon-cyan); box-shadow: 0 0 15px var(--neon-cyan); order: 2; }
    .place-2 { height: 100px; background: rgba(255, 255, 255, 0.1); border-color: #fff; box-shadow: 0 0 10px #fff; order: 1; }
    .place-3 { height: 70px; background: rgba(188, 19, 254, 0.2); border-color: var(--neon-purple); box-shadow: 0 0 15px var(--neon-purple); order: 3; }
    
    .initial-placeholder { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 900; margin-bottom: 10px; border: 3px solid #fff; background: #000; }

    /* Tabelle */
    .cyber-table { width: 100%; border-collapse: collapse; border: 2px solid var(--neon-cyan); box-shadow: 0 0 15px var(--neon-cyan); margin: 20px 0; background: rgba(0,0,0,0.5); font-size: 0.85rem; }
    .cyber-table th { background: rgba(0, 243, 255, 0.2); color: var(--neon-cyan); padding: 12px 8px; text-align: left; border-bottom: 1px solid var(--neon-cyan); }
    .cyber-table td { padding: 12px 8px; border-bottom: 1px solid rgba(0, 243, 255, 0.1); }
    .highlight-val { color: var(--neon-purple); font-weight: bold; text-shadow: 0 0 5px var(--neon-purple); }

    /* Achievement Grid */
    .achievement-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px; }
    .achievement-card { 
        background: rgba(239, 68, 68, 0.05); 
        border: 2px solid var(--neon-red); 
        box-shadow: 0 0 15px var(--neon-red); 
        padding: 15px; 
        border-radius: 12px; 
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .ach-icon { font-size: 2rem; margin-bottom: 8px; }
    .ach-title { font-size: 0.75rem; font-weight: 900; color: var(--neon-red); margin-bottom: 5px; }
    .ach-desc { font-size: 0.65rem; opacity: 0.8; line-height: 1.2; }
    .ach-winner { margin-top: 8px; color: #fff; font-weight: bold; display: flex; align-items: center; gap: 5px; font-size: 0.75rem; }

    /* Restliche Bestands-Statistiken entfernen/ausblenden */
    .podium-avatar { width: 50px; height: 50px; border-radius: 50%; border: 3px solid white; margin-bottom: 5px; background: #1e293b; overflow: hidden; }
    .podium-avatar img { width: 100%; height: 100%; object-fit: cover; }

    /* Statistik Animationen */
    .stats-container { padding: 20px; color: white; }
    .stats-title { font-size: 2rem; margin-bottom: 30px; text-shadow: 0 0 10px rgba(255,255,255,0.5); }
    .stat-card { 
        background: rgba(255,255,255,0.1); 
        margin-bottom: 15px; 
        padding: 15px; 
        border-radius: 15px; 
        display: flex; 
        align-items: center; 
        gap: 20px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
        transform: translateY(50px);
        opacity: 0;
    }
    .stat-icon { font-size: 2.5rem; }
    .stat-label { display: block; font-size: 0.9rem; color: #cbd5e1; }
    .stat-value { display: block; font-size: 1.3rem; font-weight: bold; }
    .stat-sub { font-size: 0.8rem; opacity: 0.7; }

    .reveal-1 { animation: slideIn 0.5s ease forwards 0.2s; }
    .reveal-2 { animation: slideIn 0.5s ease forwards 0.5s; }
    .reveal-3 { animation: slideIn 0.5s ease forwards 0.8s; }
    @keyframes slideIn { to { transform: translateY(0); opacity: 1; } }

    /* Shot Roulette Card Design */
    .shot-card { background: rgba(255, 255, 255, 0.1); border: 2px solid #ef4444; border-radius: 20px; padding: 30px; text-align: center; backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(239, 68, 68, 0.2); max-width: 400px; margin: 0 auto; }
    .shot-task-box { min-height: 120px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; line-height: 1.4; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); border-top: 1px solid rgba(255,255,255,0.1); padding: 15px 0; }

    /* Rad-Zentrierung & Fix für den schwarzen Kreis */
    .wheel-wrapper { 
        display: flex; 
        justify-content: center; 
        align-items: center; 
        position: relative; 
        margin: 30px auto; 
        width: 300px; 
        height: 300px; 
        background: transparent;
    }
    #rouletteWheel { 
        border-radius: 50%; 
        background: transparent; 
        box-shadow: 0 0 20px rgba(0,0,0,0.5); 
    }

    /* Getränke-Steuerung auf der Karte */
    .drink-controls { display: flex; justify-content: center; gap: 8px; margin-top: 8px; }
    .drink-btn { border: none; border-radius: 8px; padding: 4px 10px; color: white; cursor: pointer; font-weight: bold; font-size: 0.9rem; transition: transform 0.1s; }
    .drink-btn.plus { background-color: #10b981; }
    .drink-btn.minus { background-color: #ef4444; }
    .drink-btn:active { transform: scale(0.9); }

    /* Globale Avatar-Anpassung für die Auswahlmenüs */
    .avatar-wrapper { display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 50%; margin: 0 auto; }
    .avatar-wrapper img { width: 100%; height: 100%; object-fit: cover; }

    /* Karten-Themes für die gemischte Runde */
    .theme-wer_wuerde_eher { border: 2px solid #ec4899 !important; box-shadow: 0 0 20px rgba(236, 72, 153, 0.3) !important; }
    .theme-aufgaben { border: 2px solid #3b82f6 !important; box-shadow: 0 0 20px rgba(59, 130, 246, 0.3) !important; }
    .theme-ich_hab_noch_nie { border: 2px solid #f59e0b !important; box-shadow: 0 0 20px rgba(245, 158, 11, 0.3) !important; }
    .theme-paranoia { border: 2px solid #10b981 !important; box-shadow: 0 0 20px rgba(16, 185, 129, 0.3) !important; }

    /* Verbessertes Runden Aufgaben UI */
    .runden-task-card { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1); border-left: 4px solid #f59e0b; padding: 15px; border-radius: 12px; margin-bottom: 15px; font-size: 0.95rem; backdrop-filter: blur(10px); animation: fadeInTask 0.3s ease-out; }
    @keyframes fadeInTask { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
    .runden-badge { background: #f59e0b; color: #1e293b; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 0.75rem; display: inline-block; margin-bottom: 8px; }
    .runden-task-card.compact { padding: 10px; font-size: 0.85rem; margin-bottom: 10px; }
    .runden-task-card.compact .runden-badge { font-size: 0.65rem; padding: 2px 6px; }
    .runden-fail-btn { background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; border-radius: 8px; padding: 8px; cursor: pointer; font-size: 0.85rem; margin-top: 10px; width: 100%; transition: all 0.2s; }
    .runden-fail-btn:hover { background: rgba(239, 68, 68, 0.4); color: white; }

    /* Karten-Animationen */
    .card-enter-anim {
        animation: cardSlideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes cardSlideUp {
        from { opacity: 0; transform: translateY(30px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .special-card-pulse {
        animation: pulseBorder 2s infinite;
    }
    @keyframes pulseBorder {
        0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
        70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
        100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    /* Zeitbombe & Explosion */
    .theme-zeitbombe { background: radial-gradient(circle, #450a0a, #000) !important; border: 2px solid #f97316 !important; }
    .explosion-flash { animation: flashScreen 0.2s 5; }
    @keyframes flashScreen { 0%, 100% { background: transparent; } 50% { background: #ef4444; } }
    
    .bomb-category-box { background: rgba(249, 115, 22, 0.1); border: 2px dashed #f97316; border-radius: 15px; padding: 20px; margin: 20px 0; font-size: 1.2rem; }

    /* Handy Wechsel */
    .handy-wechsel-card { background: #1e1b4b; border: 3px solid #6366f1; border-radius: 20px; padding: 40px; text-align: center; }

    /* Charakter Selection Mockup Style */
    .char-selection-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 500px; margin: 0 auto; padding: 10px; width: 100%; }
    .char-card { background: rgba(0,0,0,0.6); border: 2px solid var(--neon-purple); box-shadow: 0 0 10px var(--neon-purple); border-radius: 22px; padding: 20px; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); position: relative; }
    .char-card.selected { background: rgba(176, 38, 255, 0.15); box-shadow: 0 0 20px var(--neon-purple); transform: translateY(-3px); }
    .char-portrait { width: 90px; height: 90px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 50%; margin-bottom: 12px; background: rgba(255,255,255,0.08); font-size: 3.5rem; border: 2px solid rgba(255,255,255,0.1); }
    .char-portrait img { width: 100%; height: 100%; object-fit: cover; }
    .char-name { font-size: 1.1rem; color: #fff; font-weight: 700; margin-bottom: 12px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
    .neon-checkbox { width: 30px; height: 30px; border: 2px solid var(--neon-purple); border-radius: 8px; position: relative; transition: all 0.2s; background: rgba(0,0,0,0.2); }
    .neon-checkbox.checked { background: var(--neon-purple); box-shadow: 0 0 12px var(--neon-purple); }
    .neon-checkbox.checked::after { content: '✓'; position: absolute; top: -4px; left: 5px; font-size: 22px; color: white; font-weight: bold; }

    /* Floating Player Button */
    .floating-gaeste-btn {
        position: fixed;
        bottom: 25px;
        right: 25px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: rgba(176, 38, 255, 0.2);
        border: 2px solid var(--neon-purple);
        box-shadow: 0 0 15px var(--neon-purple);
        color: white;
        font-size: 1.5rem;
        z-index: 1001;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
        transition: transform 0.2s;
    }
    .floating-gaeste-btn:active { transform: scale(0.9); }
    #footerPlayerList { display: none !important; }

    /* Optimierte Gäste Übersicht (Cyberpunk Style) */
    #gaesteUebersicht { 
        padding: 20px; 
        background: #050505; 
        min-height: 100vh;
        color: white;
        text-transform: uppercase;
    }
    .gaeste-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
        gap: 15px; 
        margin-top: 25px; 
    }
    .gaeste-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(188, 19, 254, 0.3);
        box-shadow: 0 0 15px rgba(188, 19, 254, 0.1);
        border-radius: 16px;
        padding: 15px;
        display: flex;
        flex-direction: column;
        align-items: center;
        backdrop-filter: blur(10px);
    }
    .gaeste-card .val-display { 
        font-weight: 900; 
        color: var(--neon-cyan); 
        font-size: 1.1rem; 
        text-shadow: 0 0 8px var(--neon-cyan);
        min-width: 40px;
        text-align: center;
    }
    .control-row { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 10px; margin: 8px 0; }
    .cyber-mini-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid var(--neon-purple);
        color: white;
        width: 35px;
        height: 35px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }
    .cyber-mini-btn:active { background: var(--neon-purple); transform: scale(0.9); }
    .cyber-mini-btn.plus { border-color: var(--neon-cyan); color: var(--neon-cyan); }
`;
document.head.appendChild(style);

function initialisiereApp() {
    console.log("App wird initialisiert...");
    
    // Floating Button & Container erstellen falls nicht vorhanden
    if (!document.getElementById('floatingGaesteBtn')) {
        const btn = document.createElement('button');
        btn.id = 'floatingGaesteBtn';
        btn.className = 'floating-gaeste-btn';
        btn.innerHTML = '👥';
        btn.onclick = () => zeigeBereich('gaesteUebersicht');
        document.body.appendChild(btn);
    }

    if (!document.getElementById('gaesteUebersicht')) {
        const div = document.createElement('div');
        div.id = 'gaesteUebersicht';
        div.className = 'bereich'; 
        div.style.display = 'none';
        document.querySelector('.container').appendChild(div);
        if (typeof initialisiereGaesteUebersicht === 'function') initialisiereGaesteUebersicht();
    }

    // Stelle sicher, dass beim Start alle Spiel-UI-Elemente versteckt sind
    if (document.getElementById('naechsteKarteBtn')) {
        document.getElementById('naechsteKarteBtn').style.display = 'none';
    }
    
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) muteBtn.innerText = isMuted ? "🔇" : "🔊";

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
    
    if (spieler.length === 0) {
        customAlert("Keine Charaktere gespeichert! 👗 Geh zuerst in die Garderobe.");
        return;
    }
    
    renderCharakterSelectionGrid();
    zeigeBereich('charakterSelection');
}

function renderCharakterSelectionGrid() {
    const grid = document.getElementById('selectionGrid');
    if (!grid) return;
    grid.innerHTML = "";
    
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    
    spielerListe.forEach((spieler, index) => {
        const card = document.createElement('div');
        const isSelected = spieler.aktiv !== false;
        card.className = `char-card ${isSelected ? 'selected' : ''}`;
        card.onclick = () => toggleCharakterSelect(index);
        
        card.innerHTML = `
            <div class="char-portrait">${spieler.emoji}</div>
            <div class="char-name">${spieler.name}</div>
            <div class="neon-checkbox ${isSelected ? 'checked' : ''}"></div>
        `;
        grid.appendChild(card);
    });
}

function toggleCharakterSelect(index) {
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    spielerListe[index].aktiv = !spielerListe[index].aktiv;
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
    renderCharakterSelectionGrid();
}

function bestaetigeCharakterAuswahl() {
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    let aktiveSpieler = spielerListe.filter(s => s.aktiv !== false);
    
    if (aktiveSpieler.length < 3 || aktiveSpieler.length > 8) {
        customAlert("Halt! 🛑 Bitte wählt zwischen 3 und 8 Spielern aus.");
        return;
    }
    zeigeBereich('counterSelection');
}

function setCounterPreference(enabled) {
    isCounterEnabled = enabled;
    zeigeBereich('hauptMenue');
    
    // Buttons im Hauptmenü und Spielbereich aktualisieren
    const menuEndBtn = document.getElementById('menuEndBtn');
    if (menuEndBtn) {
        menuEndBtn.innerText = isCounterEnabled ? "🛑 Session beenden & Statistik" : "🛑 Session beenden";
    }

    // Spielerliste aktualisieren, um Counter zu verstecken/zeigen
    if (typeof listeAnzeigen === 'function') listeAnzeigen();
}

/**
 * Beendet die aktuelle Spiel-Session, zeigt ggf. Statistiken und resettet die Counter.
 */
function beendeSpielUndZeigeStatistik() {
    if (isCounterEnabled) {
        zeigeStatistiken();
    } else {
        geheZuStartMenue();
    }
    
    // WICHTIG: Counter sofort nach dem Anzeigen der Ergebnisse im Hintergrund resetten
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    spielerListe.forEach(s => {
        s.schluecke = 0;
        s.ausgewaehltCount = 0;
        s.getraenkeCount = 0;
    });
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));

    // NEU: Aktive Aufgaben und Viren zurücksetzen
    aktiveRundenAufgaben = [];
    updateRundenAufgabenUI();
    
    if (typeof resetViren === "function") {
        resetViren();
    }
    
    if (typeof listeAnzeigen === "function") listeAnzeigen();
}

// Alias für den Aufruf aus HTML
const geheZuHauptMenue = geheZuSpiele;

function kategorieWaehlen(kategorie) {
    aktuelleKategorie = kategorie; 
    isGemischteRunde = false;
    zeigeBereich('spielBereich');
    updateGameEndBtnVisibility();
    karteZiehen();
}

/**
 * Füllt den Stapel für die gemischte Runde neu und mischt ihn,
 * um eine gleichmäßige Verteilung der Spiele zu garantieren.
 */
function refillMixedModePool() {
    const categories = [
        'aufgaben', 
        'wer_wuerde_eher', 
        'ich_hab_noch_nie', 
        'paranoia',
        'countdown',
        'shot_roulette',
        'virus',
        'tribunal',
        'zeitbombe'
    ];
    
    let fullPool = [];
    // Standard-Kategorien werden öfter (5 Mal) in den Pool gelegt (45 Karten)
    for(let i = 0; i < 5; i++) {
        fullPool = fullPool.concat(categories);
    }

    // Extrem-Events (sudden_event) werden nur noch 1 Mal hinzugefügt.
    // Damit sinkt die Chance auf ca. 2.2% (im Schnitt alle 46 Karten), was sie deutlich seltener macht.
    fullPool.push('sudden_event');
    
    // Echter Fisher-Yates Shuffle für gleichmäßige Verteilung
    for (let i = fullPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fullPool[i], fullPool[j]] = [fullPool[j], fullPool[i]];
    }
    mixedModePool = fullPool;
}

function starteGemischteRunde() {
    isGemischteRunde = true;
    zeigeBereich('spielBereich');
    updateGameEndBtnVisibility();
    karteZiehen();
}

/**
 * Hilfsfunktion um den Beenden-Button im Spielbereich anzuzeigen
 */
function updateGameEndBtnVisibility() {
    const btn = document.getElementById('gameEndBtn');
    if (!btn) return;
    
    if (isCounterEnabled) {
        btn.innerText = "🏆 Spiel beenden & Statistik";
    } else {
        btn.innerText = "🛑 Spiel beenden";
    }
    btn.style.display = 'block';
}

/**
 * Hilfsfunktion um aus Spezial-Modi wieder in den Mix zu springen
 */
function geheZurueckZumMix() {
    zeigeBereich('spielBereich');
    karteZiehen();
}

function aktualisiereKartenOptik(kat) {
    const spielBox = document.getElementById('spielBereich');
    const iconEl = document.getElementById('gameIconHeader');
    const labelEl = document.getElementById('gameTypeLabel');
    const badgeMixed = document.getElementById('badgeMixed');
    const badgeVirus = document.getElementById('badgeVirus');
    const modularSlot = document.getElementById('modularFeatureSlot');

    // Reset UI
    spielBox.classList.remove('theme-wer_wuerde_eher', 'theme-aufgaben', 'theme-ich_hab_noch_nie', 'theme-paranoia', 'theme-sudden-event', 'theme-virus', 'theme-tribunal', 'theme-zeitbombe');
    badgeMixed.style.display = isGemischteRunde ? 'block' : 'none';
    badgeVirus.style.display = 'none'; // Hier könnte das Backend steuern
    modularSlot.style.display = 'none';

    const configs = {
        'wer_wuerde_eher': { label: 'WER WÜRDE EHER...', class: 'theme-wer_wuerde_eher', color: 'var(--neon-purple)' },
        'aufgaben': { label: 'AUFGABE', class: 'theme-aufgaben', color: 'var(--neon-cyan)' },
        'ich_hab_noch_nie': { label: 'ICH HAB NOCH NIE...', class: 'theme-ich_hab_noch_nie', color: '#ec4899' },
        'paranoia': { label: 'PARANOIA', class: 'theme-paranoia', color: 'var(--neon-green)' },
        'virus': { label: 'INFEKTION!', class: 'theme-virus', color: 'var(--neon-red)' },
        'tribunal': { label: 'DAS TRIBUNAL', class: 'theme-tribunal', color: 'var(--neon-cyan)' },
        'zeitbombe': { label: 'ZEITBOMBE', class: 'theme-zeitbombe', color: '#f97316' },
        'sudden_event': { label: 'EXTREM-EVENT!', class: 'theme-sudden-event', color: 'var(--neon-red)' }
    };

    const current = configs[kat] || configs['aufgaben'];
    spielBox.classList.add(current.class);
    labelEl.innerText = current.label;
    labelEl.style.color = current.color;
    labelEl.style.textShadow = `0 0 10px ${current.color}`;
}

function zufallsSpielWaehlen() {
    const spiele = [
        { name: "🤔 Wer würde eher...", color: "#ec4899", action: () => kategorieWaehlen('wer_wuerde_eher') },
        { name: "🎯 Aufgaben", color: "#3b82f6", action: () => kategorieWaehlen('aufgaben') },
        { name: "🤫 Ich hab noch nie...", color: "#f59e0b", action: () => kategorieWaehlen('ich_hab_noch_nie') },
        { name: "🕵️ Paranoia", color: "#10b981", action: () => typeof starteParanoia === 'function' ? starteParanoia() : null },
        { name: "🎡 Countdown", color: "#8b5cf6", action: () => typeof starteCountdownSpiel === 'function' ? starteCountdownSpiel() : null },
        { name: "🥃 Shot Roulette", color: "#ef4444", action: () => typeof starteShotRoulette === 'function' ? starteShotRoulette() : null }
    ];

    const overlay = document.getElementById('randomSelectionOverlay');
    const textEl = document.getElementById('randomGameText');
    
    if (!overlay || !textEl) return;

    overlay.style.display = 'flex';
    let counter = 0;
    const maxRounds = 12;
    
    const interval = setInterval(() => {
        const tempIndex = Math.floor(Math.random() * spiele.length);
        textEl.innerText = spiele[tempIndex].name;
        textEl.style.color = spiele[tempIndex].color;
        playSound('click');
        counter++;
        
        if (counter >= maxRounds) {
            clearInterval(interval);
            const finalIndex = Math.floor(Math.random() * spiele.length);
            const selected = spiele[finalIndex];
            
            textEl.innerText = selected.name;
            textEl.style.color = selected.color;
            textEl.classList.add('selected-game-animation');
            playSound('win');
            
            setTimeout(() => {
                overlay.style.display = 'none';
                textEl.classList.remove('selected-game-animation');
                selected.action();
            }, 1500);
        }
    }, 100);
}

function zurueckZumHauptMenue() {
    // Falls wir aus einem Spiel kommen, setzen wir die UI-Zustände zurück
    document.getElementById('werTrinktBereich').style.display = 'none';
    zeigeBereich('hauptMenue');
}

window.getraenkHinzufuegen = function(index) {
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    spielerListe[index].getraenkeCount = (spielerListe[index].getraenkeCount || 0) + 1;
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
    playSound('click');
    if (typeof window.listeAnzeigen === "function") window.listeAnzeigen();
};

window.getraenkAbziehen = function(index) {
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    if (spielerListe[index].getraenkeCount > 0) {
        spielerListe[index].getraenkeCount -= 1;
    } else {
        spielerListe[index].getraenkeCount = 0;
    }
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
    playSound('click');
    if (typeof window.listeAnzeigen === "function") window.listeAnzeigen();
};

async function karteZiehen() {
    const entscheidung = document.getElementById('entscheidungsBereich');
    const naechsteBtn = document.getElementById('naechsteKarteBtn');
    document.getElementById('werTrinktBereich').style.display = 'none';

    // Jede neue Karte verringert die Runden der aktiven Aufgaben
    verarbeiteRundenTick();

    if (isGemischteRunde) {
        // Prüfen ob der Stapel leer ist
        if (mixedModePool.length === 0) {
            refillMixedModePool();
        }

        // Sicherstellen, dass nicht das gleiche Spiel 2x hintereinander kommt
        let lastIndex = mixedModePool.length - 1;
        if (mixedModePool[lastIndex] === aktuelleKategorie && mixedModePool.length > 1) {
            // Suche im Stapel nach einem anderen Spiel zum Tauschen
            for (let i = 0; i < lastIndex; i++) {
                if (mixedModePool[i] !== aktuelleKategorie) {
                    // Tausche das Spiel am Ende mit einem anderen Platz im Stapel
                    [mixedModePool[i], mixedModePool[lastIndex]] = [mixedModePool[lastIndex], mixedModePool[i]];
                    break;
                }
            }
        }

        // Karte vom Stapel ziehen
        aktuelleKategorie = mixedModePool.pop();

        // Spezial-Logik für Spiele mit eigenem UI oder speziellen Start-Funktionen
        const totalActive = aktiveRundenAufgaben.length + (typeof aktiveViren !== 'undefined' ? aktiveViren.length : 0);
        if (aktuelleKategorie === 'virus') {
            if (typeof zeigeVirusEventAufKarte === 'function' && totalActive < 2) {
                const virus = neuerVirus(true);
                if (virus) {
                    zeigeVirusEventAufKarte(virus);
                    return;
                }
            }
            aktuelleKategorie = 'aufgaben'; 
        } else if (aktuelleKategorie === 'sudden_event') {
            zeigeSuddenEvent();
            return;
        } else if (aktuelleKategorie === 'shot_roulette') {
            starteShotRoulette();
            return;
        } else if (aktuelleKategorie === 'paranoia') {
            starteParanoia();
            return;
        } else if (aktuelleKategorie === 'tribunal') {
            if (typeof starteTribunalMixed === 'function') {
                starteTribunalMixed();
                return;
            }
            aktuelleKategorie = 'wer_wuerde_eher';
        } else if (aktuelleKategorie === 'countdown') {
            starteCountdownSpiel();
            return;
        } else if (aktuelleKategorie === 'zeitbombe') {
            starteZeitbombeMixed();
            return;
        }
    }

    aktualisiereKartenOptik(aktuelleKategorie);

    stopBackgroundMusic(); // Musik stoppen, wenn eine neue Karte gezogen wird
    playSound('card'); // Sound beim Ziehen der Karte abspielen

    const gewähltesLevel = document.getElementById('levelInput').value;
    const antwort = await fetch(`/neue_karte?level=${gewähltesLevel}&kategorie=${aktuelleKategorie}`); 
    const daten = await antwort.json();

    aktuelleSchluecke = daten.schluecke;
    
    // Sichtbarkeit anpassen
    if (!isCounterEnabled) {
        if (entscheidung) entscheidung.style.display = 'none';
        if (naechsteBtn) {
            naechsteBtn.style.display = 'block';
            naechsteBtn.innerText = "Weiter";
        }
    } else {
        if (entscheidung) entscheidung.style.display = 'flex';
        if (naechsteBtn) naechsteBtn.style.display = 'none';
    }

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

    // Statistik: Zähler für Auswahl erhöhen
    zufallsSpieler.ausgewaehltCount = (zufallsSpieler.ausgewaehltCount || 0) + 1;
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));

    let spielerHtml = "";
    if (zufallsSpieler.emoji.includes('<img')) {
        spielerHtml = `<span class="spieler-anzeige">${zufallsSpieler.emoji}</span>`;
    } else {
        spielerHtml = `<span class="spieler-anzeige"><span class="emoji-display">${zufallsSpieler.emoji}</span> <span class="spieler-name-display">${zufallsSpieler.name}</span></span>`;
    }

    let fertigeFrage = daten.frage.replace("[SPIELER]", spielerHtml);

    const frageElement = document.getElementById('frageText');
    frageElement.innerHTML = fertigeFrage;
    
    // Animation triggern
    const spielBox = document.getElementById('spielBereich');
    spielBox.classList.remove('card-enter-anim');
    void spielBox.offsetWidth; // Reflow
    spielBox.classList.add('card-enter-anim');

    frageElement.classList.remove('karten-animation');
    void frageElement.offsetWidth; 
    frageElement.classList.add('karten-animation');

    // Speziallogik für Runden-Aufgaben
    const rundenMatch = fertigeFrage.match(/(\d+)\s*Runden/i);
    const totalActive = aktiveRundenAufgaben.length + (typeof aktiveViren !== 'undefined' ? aktiveViren.length : 0);

    if (rundenMatch) {
        if (totalActive >= 2) {
            // Limit erreicht: Ziehe eine neue Karte, die keine Dauer-Aufgabe ist
            return karteZiehen();
        }
        const rundenAnzahl = parseInt(rundenMatch[1]);
        document.getElementById('failBtn').innerHTML = `✅ Herausforderung annehmen!`;
        document.getElementById('failBtn').style.display = 'block';
        document.getElementById('failBtn').onclick = () => rundenAufgabeStarten(zufallsSpieler, daten.frage, rundenAnzahl, aktuelleSchluecke);
        document.getElementById('strafeText').innerText = `Herausforderung: ${rundenAnzahl} Runden durchhalten!`;
        if (isCounterEnabled) document.getElementById('entscheidungsBereich').style.display = 'flex';
        if (isCounterEnabled) document.getElementById('naechsteKarteBtn').style.display = 'block';
    } else {
        if (isCounterEnabled) {
            let failText = `🍹 Trinken! <br><small>+${aktuelleSchluecke} Schlücke</small>`;
            let skipText = "🙅‍♂️ Keiner muss";

            if (aktuelleKategorie === 'aufgaben') {
                failText = `🍹 Nicht geschafft! <br><small>+${aktuelleSchluecke} Schlücke</small>`;
                skipText = "✅ Aufgabe geschafft";
            }

            document.getElementById('failBtn').innerHTML = failText;
            document.getElementById('skipDrinkBtn').innerText = skipText;
            document.getElementById('failBtn').style.display = 'block';
            document.getElementById('strafeText').innerText = `Einsatz: ${aktuelleSchluecke} Schlücke!`;
            document.getElementById('failBtn').onclick = trinkenBestätigen;
            document.getElementById('skipDrinkBtn').style.display = 'block';
        }
    }
}


function starteZeitbombeMixed() {
    isGemischteRunde = true;
    zeigeBereich('zeitbombeBereich');
    resetBombUI();
    startBombLogic();
}

/**
 * Zeigt ein Sudden Event (Extrem-Ereignis) an mit Jump-Scare Effekt
 */
function zeigeSuddenEvent() {
    const spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    const aktiveSpieler = spielerListe.filter(s => s.aktiv !== false);
    const totalActive = aktiveRundenAufgaben.length + (typeof aktiveViren !== 'undefined' ? aktiveViren.length : 0);
    
    // Wähle ein Event aus, aber verhindere Runden-Events, wenn das Limit erreicht ist
    let eventTemplate;
    let attempts = 0;
    do {
        eventTemplate = suddenEvents[Math.floor(Math.random() * suddenEvents.length)];
        attempts++;
    } while (eventTemplate.match(/(\d+)\s*Runden/i) && totalActive >= 2 && attempts < suddenEvents.length);

    const p1 = aktiveSpieler[Math.floor(Math.random() * aktiveSpieler.length)];
    
    const renderName = (s) => `<span style="color: #ef4444; font-weight: bold;">${s.name}</span>`;
    let fertigesEvent = eventTemplate.replace(/{p1}/g, renderName(p1));

    aktualisiereKartenOptik('sudden_event');
    playSound('shot');
    
    // Jump-Scare Screen Shake Effekt
    const container = document.querySelector('.container');
    container.classList.add('shake-anim');
    setTimeout(() => container.classList.remove('shake-anim'), 500);

    const frageElement = document.getElementById('frageText');
    frageElement.innerHTML = fertigesEvent;

    // Runden & Schlücke für das Tracking extrahieren
    const rundenMatch = fertigesEvent.match(/(\d+)\s*Runden/i);
    const schlueckeMatch = fertigesEvent.match(/(\d+)\s*Schlücke/i);
    const gefundeneSchluecke = schlueckeMatch ? parseInt(schlueckeMatch[1]) : 2;

    if (rundenMatch) {
        const rundenAnzahl = parseInt(rundenMatch[1]);
        if (isCounterEnabled) {
            document.getElementById('entscheidungsBereich').style.display = 'flex';
            const skipBtn = document.getElementById('skipDrinkBtn');
            if (skipBtn) skipBtn.style.display = 'none'; // Keine Ausrede bei Sudden Events
        } else {
            document.getElementById('entscheidungsBereich').style.display = 'none';
            document.getElementById('naechsteKarteBtn').style.display = 'block';
            document.getElementById('naechsteKarteBtn').innerText = "Weiter";
        }
        document.getElementById('failBtn').innerHTML = `🔥 Regel aktivieren!`;
        document.getElementById('failBtn').onclick = () => rundenAufgabeStarten(p1, fertigesEvent, rundenAnzahl, gefundeneSchluecke, true);
        document.getElementById('strafeText').innerText = `⚠️ Regel aktiv für ${rundenAnzahl} Runden!`;
        document.getElementById('naechsteKarteBtn').style.display = 'block';
    } else {
        document.getElementById('entscheidungsBereich').style.display = 'none';
        document.getElementById('naechsteKarteBtn').style.display = 'block';
        document.getElementById('naechsteKarteBtn').innerText = "Weiter";
        document.getElementById('strafeText').innerText = "🚨 ALARM! KEINE AUSREDEN!";
    }
    
    // Card Animation triggern
    const spielBox = document.getElementById('spielBereich');
    spielBox.classList.remove('card-enter-anim');
    void spielBox.offsetWidth; // Reflow
    spielBox.classList.add('card-enter-anim');

    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 500]);
}

/**
 * Entscheidet je nach Kategorie, ob eine Liste gezeigt wird oder direkt gebucht wird
 */
function trinkenBestätigen() {
    playSound('click');

    if (!isCounterEnabled) {
        document.getElementById('entscheidungsBereich').style.display = 'none';
        document.getElementById('naechsteKarteBtn').style.display = 'block';
        return;
    }

    // Bei Aufgaben direkt dem aktuellen Spieler buchen, bei anderen Kategorien Auswahl zeigen
    if (aktuelleKategorie === 'aufgaben') {
        document.getElementById('entscheidungsBereich').style.display = 'none';
        strafSchluckeVerteilen(aktuellerSpielerIndex);
    } else {
        werMussTrinkenZeigen();
    }
}

function rundenAufgabeStarten(spieler, text, runden, schluecke, isGlobal = false) {
    playSound('win');
    const aufgabe = {
        id: Date.now(),
        spielerName: spieler.name,
        spielerEmoji: spieler.emoji,
        text: isGlobal ? text : text.replace("[SPIELER]", spieler.name),
        restRunden: runden,
        schluecke: schluecke,
        isGlobal: isGlobal
    };
    aktiveRundenAufgaben.push(aufgabe);
    
    document.getElementById('entscheidungsBereich').style.display = 'none';
    document.getElementById('naechsteKarteBtn').style.display = 'block';
    updateRundenAufgabenUI();
}

function verarbeiteRundenTick() {
    aktiveRundenAufgaben.forEach(task => {
        if (task.restRunden > 0) {
            task.restRunden--;
            if (task.restRunden === 0) {
                zeigeBefreiungsScreen(task);
            }
        }
    });
    
    // Automatisch entfernen, wenn die Zeit um ist
    aktiveRundenAufgaben = aktiveRundenAufgaben.filter(task => task.restRunden > 0);
    updateRundenAufgabenUI();
    
    // Viren ticken lassen
    if (typeof virusTick === 'function') virusTick();
}

function updateRundenAufgabenUI() {
    const container = document.getElementById('rundenAufgabenContainer');
    if (!container) return;
    
    let html = "";
    const hatAufgaben = aktiveRundenAufgaben.length > 0;
    const hatViren = typeof aktiveViren !== 'undefined' && aktiveViren.length > 0;
    const totalCount = aktiveRundenAufgaben.length + (hatViren ? aktiveViren.length : 0);

    if (hatAufgaben || hatViren) {
        html = "<h4 style='margin-bottom:15px; opacity:0.8; color: var(--neon-cyan); text-transform: uppercase; letter-spacing: 1px; font-size: 0.8rem;'>⏳ Aktive Regeln & Challenges:</h4>";
    }

    // 1. Challenges / Runden-Aufgaben rendern
    aktiveRundenAufgaben.forEach((task, index) => {
        const statusText = `${task.restRunden} ${task.restRunden === 1 ? 'Runde' : 'Runden'} übrig`;
        const isGlobal = task.isGlobal === true;

        html += `
            <div class="runden-task-card ${totalCount > 1 ? 'compact' : ''}" style="${isGlobal ? 'border-left-color: #ef4444; background: rgba(239, 68, 68, 0.1);' : ''}">
                <span class="runden-badge" style="${isGlobal ? 'background: #ef4444; color: white;' : ''}">${statusText}</span>
                <div style="margin-bottom: 5px;">
                    <strong>${isGlobal ? '🚨 GLOBALE REGEL' : `${task.spielerEmoji} ${task.spielerName}`}</strong>
                </div>
                <div style="opacity: 0.9; line-height: 1.4;">${task.text}</div>
                <button class="runden-fail-btn" onclick="${isGlobal ? `rundenTaskGlobalVersagt(${index})` : `rundenTaskFehlgeschlagen(${index})`}">
                    ${isGlobal ? '❌ Jemand hat versagt' : '❌ Versagt'} (+${task.schluecke} 🥤)
                </button>
            </div>
        `;
    });

    // 2. Viren rendern (Nachträgliches Trinken ermöglichen)
    if (hatViren) {
        aktiveViren.forEach(v => {
            const statusText = v.runden === -1 ? "Permanent" : `${v.runden} Runden`;
            html += `
                <div class="runden-task-card ${totalCount > 1 ? 'compact' : ''}" style="border-left-color: var(--neon-green); background: rgba(57, 255, 20, 0.05);">
                    <span class="runden-badge" style="background: var(--neon-green); color: black;">${statusText}</span>
                    <div style="margin-bottom: 5px; color: var(--neon-green); font-weight: bold;">🦠 VIRUS-EFFEKT</div>
                    <div style="opacity: 0.9; line-height: 1.4;">${v.text}</div>
                    <button class="runden-fail-btn" style="border-color: var(--neon-red); color: var(--neon-red);" onclick="triggerVirusPenalty('${v.id}')">
                        ❌ Regel gebrochen
                    </button>
                </div>
            `;
        });
    }

    container.innerHTML = html;
}

/**
 * Ermöglicht das nachträgliche Buchen von Viren-Strafen
 */
function triggerVirusPenalty(virusId) {
    const virus = aktiveViren.find(v => v.id == virusId);
    if (!virus) return;

    // Wir nutzen das existierende System für globale Strafen
    const schluckeMatch = virus.plainText.match(/(\d+)\s*Schlücke/i);
    aktuelleSchluecke = schluckeMatch ? parseInt(schluckeMatch[1]) : 2;
    
    // Mocking einer "Globalen Aufgabe" für das Trink-Raster
    taskIndexForDrinkSelection = 999; // Dummy ID
    werMussTrinkenZeigen();
}
/**
 * Zeigt einen Virus speziell auf der Hauptkarte an (Mixed Mode)
 */
function zeigeVirusEventAufKarte(virus) {
    aktualisiereKartenOptik('virus');
    playSound('shot');

    const frageElement = document.getElementById('frageText');
    frageElement.innerHTML = virus.text;
    document.getElementById('strafeText').innerText = `☣️ INFEKTIONS-ALARM! Aktiv für ${virus.runden} Runden.`;
    
    document.getElementById('entscheidungsBereich').style.display = 'none';
    document.getElementById('naechsteKarteBtn').style.display = 'block';
    
    const spielBox = document.getElementById('spielBereich');
    spielBox.classList.remove('card-enter-anim');
    void spielBox.offsetWidth;
    spielBox.classList.add('card-enter-anim');

    if ("vibrate" in navigator) navigator.vibrate([100, 50, 100, 50, 300]);
}

function rundenTaskFehlgeschlagen(index) {
    const task = aktiveRundenAufgaben[index];
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    let spieler = spielerListe.find(s => s.name === task.spielerName);
    
    if (spieler) {
        spieler.schluecke += task.schluecke;
        localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
        playSound('shot');
        listeAnzeigen();
        
        // Nach dem Versagen die Aufgabe direkt entfernen
        rundenTaskEntfernen(index);
    }
}

/**
 * Öffnet das Trink-Raster für eine globale Regel (z.B. Königsevent)
 */
function rundenTaskGlobalVersagt(index) {
    taskIndexForDrinkSelection = index;
    aktuelleSchluecke = aktiveRundenAufgaben[index].schluecke;
    werMussTrinkenZeigen();
}

/**
 * Bucht Schlücke aus einer laufenden globalen Regel
 */
function strafSchluckAusTaskVerteilen(index) {
    if (taskIndexForDrinkSelection === -1) return;
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
    spielerListe[index].schluecke += aktuelleSchluecke;
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
    playSound('click');
    if (typeof listeAnzeigen === "function") listeAnzeigen();
}

function rundenTaskEntfernen(index) {
    aktiveRundenAufgaben.splice(index, 1);
    updateRundenAufgabenUI();
}

function niemandTrinkt() {
    playSound('click');
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
            // Logik wählen: Entweder aus einer Regel, Mehrfachwahl (Ich hab noch nie / Tribunal) oder Einzelwahl
            let aktion = `strafSchluckeVerteilen(${index})`;
            if (taskIndexForDrinkSelection !== -1) {
                aktion = `strafSchluckAusTaskVerteilen(${index})`;
            } else if (aktuelleKategorie === 'ich_hab_noch_nie' || aktuelleKategorie === 'tribunal') {
                aktion = `strafSchluckHinzufuegen(${index}, this)`;
            }

            auswahlBereich.innerHTML += `
                <button class="strafe-btn btn-fail" onclick="${aktion}">
                    ${spieler.emoji}
                </button>`;
        }
    });

    // Button zum Beenden der Auswahl (für Mehrfach-Modus, Tribunal oder laufende Regeln)
    if (aktuelleKategorie === 'ich_hab_noch_nie' || aktuelleKategorie === 'tribunal' || taskIndexForDrinkSelection !== -1) {
        const fertigBtn = document.createElement('button');
        fertigBtn.innerHTML = "✅ Auswahl beenden";
        fertigBtn.className = "nav-btn";
        fertigBtn.style.gridColumn = "1 / -1";
        fertigBtn.style.marginTop = "15px";
        fertigBtn.onclick = () => {
            document.getElementById('werTrinktBereich').style.display = 'none';
            if (aktuelleKategorie === 'tribunal' && !isGemischteRunde) {
                document.getElementById('tribunalNextBtn').style.display = 'inline-block';
            } else {
                document.getElementById('naechsteKarteBtn').style.display = 'block';
            }
            taskIndexForDrinkSelection = -1;
        };
        auswahlBereich.appendChild(fertigBtn);
    }
}

function strafSchluckeVerteilen(gewaehlterIndex) {
    let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
    spielerListe[gewaehlterIndex].schluecke += aktuelleSchluecke;
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
    
    listeAnzeigen(); 
    
    document.getElementById('werTrinktBereich').style.display = 'none';
    document.getElementById('naechsteKarteBtn').style.display = 'block';
}

/**
 * Fügt Schlücke hinzu, ohne den Bereich zu schließen (für Mehrfachauswahl)
 */
function strafSchluckHinzufuegen(index, btnElement) {
    if (btnElement.classList.contains('selected-for-drink')) return;

    let spielerListe = JSON.parse(localStorage.getItem('partySpieler'));
    spielerListe[index].schluecke += aktuelleSchluecke;
    localStorage.setItem('partySpieler', JSON.stringify(spielerListe));
    
    playSound('click');
    if (typeof listeAnzeigen === "function") listeAnzeigen();

    // Button als ausgewählt markieren (deaktiviert ihn über CSS)
    btnElement.classList.add('selected-for-drink');

    // Kurzes visuelles Feedback am Button
    btnElement.style.transform = "scale(0.9)";
    setTimeout(() => btnElement.style.transform = "scale(1)", 100);
}

function feierKonfetti() {
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']
    });
}

function zeigeStatistiken() {
    const spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    const aktiveSpieler = spielerListe.filter(s => s.aktiv !== false);
    if (aktiveSpieler.length === 0) {
        customAlert("Keine aktiven Spieler für Statistiken gefunden!");
        return;
    }

    playSound('win');
    feierKonfetti();

    const effizienzListe = aktiveSpieler
        .map(s => ({
            ...s,
            schnitt: s.getraenkeCount > 0 ? (s.schluecke / s.getraenkeCount).toFixed(1) : (s.schluecke > 0 ? s.schluecke : 0)
        }))
        .sort((a, b) => a.schnitt - b.schnitt);

    const meisteSchluecke = [...aktiveSpieler].sort((a, b) => b.schluecke - a.schluecke)[0];
    const meisteGetraenke = [...aktiveSpieler].sort((a, b) => b.getraenkeCount - a.getraenkeCount)[0];
    const amHaeufigstenGezogen = [...aktiveSpieler].sort((a, b) => b.ausgewaehltCount - a.ausgewaehltCount)[0];
    const wenigsteSchluecke = [...aktiveSpieler].sort((a, b) => a.schluecke - b.schluecke)[0];

    // Podium Plätze extrahieren
    const p1 = effizienzListe[0];
    const p2 = effizienzListe[1] || { name: "-", schnitt: "0", emoji: "👤" };
    const p3 = effizienzListe[2] || { name: "-", schnitt: "0", emoji: "👤" };

    const renderPodium = (s, rank, cls) => `
        <div class="podium-place">
            <div class="initial-placeholder" style="border-color: ${rank === 1 ? 'var(--neon-cyan)' : (rank === 2 ? '#fff' : 'var(--neon-purple)')};">
                ${s.name !== "-" ? s.name.charAt(0) : "?"}${rank}
            </div>
            <div class="podium-bar ${cls}">${rank}.</div>
            <div style="font-size: 0.65rem; margin-top: 8px; font-weight: bold;">${s.name}</div>
            <div style="font-size: 0.6rem; opacity: 0.8;">${s.schnitt} SCHLÜCKE / DRINK</div>
        </div>
    `;

    const statsHtml = `
        <div class="stats-container">
            <!-- SEKTION 1 -->
            <header style="text-align: center; margin-bottom: 40px;">
                <h1 class="cyber-title glow-cyan" style="font-size: 2.2rem; margin-bottom: 5px;">SESSION-ABSCHLUSS</h1>
                <p style="font-size: 0.9rem; letter-spacing: 3px; opacity: 0.7;">DIE RANGSCHLÜCKE & ERFOLGE</p>
                <button class="nav-btn btn-cyber-green" style="margin-top: 25px; box-shadow: 0 0 15px var(--neon-green);" onclick="geheZuStartMenue()">ZURÜCK ZUM HAUPTMENÜ</button>
            </header>

            <div style="text-align: center;">
                <h2 class="cyber-title" style="color: var(--neon-cyan); font-size: 1.1rem; margin-bottom: 10px;">EFFIZIENTESTE TRINKER</h2>
                <div class="podium-wrapper">
                    ${renderPodium(p2, 2, 'place-2')}
                    ${renderPodium(p1, 1, 'place-1')}
                    ${renderPodium(p3, 3, 'place-3')}
                </div>
            </div>

            <!-- SEKTION 2 -->
            <div style="margin: 60px 0;">
                <h2 class="cyber-title glow-purple" style="font-size: 1.1rem; text-align: center; margin-bottom: 20px;">ALLE EINZELSTATISTIKEN</h2>
                <table class="cyber-table">
                    <thead>
                        <tr>
                            <th>SPIELER</th>
                            <th>GESAMT SCHLÜCKE</th>
                            <th>GETRÄNKE</th>
                            <th>DURCHSCHNITT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${aktiveSpieler.map(s => `
                            <tr>
                                <td style="font-weight: bold;">${s.name}</td>
                                <td class="highlight-val">${s.schluecke}</td>
                                <td class="highlight-val">${s.getraenkeCount}</td>
                                <td class="highlight-val">${s.getraenkeCount > 0 ? (s.schluecke / s.getraenkeCount).toFixed(1) : s.schluecke}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- SEKTION 3 -->
            <div style="margin-bottom: 40px;">
                <h2 class="cyber-title glow-red" style="font-size: 1.1rem; text-align: center; margin-bottom: 20px;">ABSCHLUSS-ACHIEVEMENTS</h2>
                <div class="achievement-grid">
                    <div class="achievement-card">
                        <div class="ach-icon">🍻</div>
                        <div class="ach-title">PROMILLE-KÖNIG</div>
                        <div class="ach-desc">DIE MEISTEN SCHLÜCKE VERINNERLICHT</div>
                        <div class="ach-winner">➜ ${meisteSchluecke.name}</div>
                    </div>
                    <div class="achievement-card">
                        <div class="ach-icon">🎯</div>
                        <div class="ach-title">HAUPTZIEL</div>
                        <div class="ach-desc">AM HÄUFIGSTEN VOM SCHICKSAL GEWÄHLT</div>
                        <div class="ach-winner">➜ ${amHaeufigstenGezogen.name}</div>
                    </div>
                    <div class="achievement-card">
                        <div class="ach-icon">🐯</div>
                        <div class="ach-title">PARTY-TIGER</div>
                        <div class="ach-desc">DIE MEISTEN VOLLEN GETRÄNKE GELEERT</div>
                        <div class="ach-winner">➜ ${meisteGetraenke.name}</div>
                    </div>
                    <div class="achievement-card">
                        <div class="ach-icon">🌵</div>
                        <div class="ach-title">TROCKENER HALS</div>
                        <div class="ach-desc">HAT SICH ERFOLGREICH VORM TRINKEN GEDRÜCKT</div>
                        <div class="ach-winner">➜ ${wenigsteSchluecke.name}</div>
                    </div>
                </div>
            </div>
            
            <footer style="text-align: center; padding: 20px; opacity: 0.5; font-size: 0.7rem;">
                CYBER-STATS v2.0 // SYSTEM: ONLINE
            </footer>
        </div>
    `;

    document.getElementById('statistikBereich').innerHTML = statsHtml;
    zeigeBereich('statistikBereich');
}

window.onload = initialisiereApp;