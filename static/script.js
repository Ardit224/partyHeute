let aktuelleKategorie = ""; 
let aktuelleSchluecke = 0; 
let aktuellerSpielerIndex = -1; 
let backgroundMusic = null; // Globale Variable für die Hintergrundmusik
let isMuted = localStorage.getItem('partyMuted') === 'true';
let isGemischteRunde = false;
let aktiveRundenAufgaben = [];
let taskIndexForDrinkSelection = -1; // Trackt, für welche laufende Regel gerade Schlücke verteilt werden
let mixedModePool = []; // Der Stapel für die gemischte Runde
let handyWechselCounter = 0;

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
    const bereiche = ['startMenue', 'editor-box', 'hauptMenue', 'spielBereich', 'countdownBereich', 'statistikBereich', 'paranoiaBereich', 'shotRouletteBereich', 'virusBereich', 'tribunalBereich', 'zeitbombeBereich', 'handyWechselBereich'];
    
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

    /* Podium / Siegertreppchen */
    .podium-wrapper { display: flex; align-items: flex-end; justify-content: center; gap: 10px; margin: 40px 0; height: 200px; }
    .podium-place { display: flex; flex-direction: column; align-items: center; width: 80px; transition: height 1s ease-out; }
    .podium-bar { width: 100%; border-radius: 10px 10px 0 0; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; }
    .place-1 { height: 120px; background: linear-gradient(to top, #f59e0b, #fbbf24); order: 2; }
    .place-2 { height: 90px; background: linear-gradient(to top, #94a3b8, #cbd5e1); order: 1; }
    .place-3 { height: 60px; background: linear-gradient(to top, #92400e, #b45309); order: 3; }
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
`;
document.head.appendChild(style);

function initialisiereApp() {
    console.log("App wird initialisiert...");
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
    isGemischteRunde = false;
    zeigeBereich('spielBereich');
    karteZiehen();
}

/**
 * Füllt den Stapel für die gemischte Runde neu und mischt ihn,
 * um eine gleichmäßige Verteilung der Spiele zu garantieren.
 */
function refillMixedModePool() {
    // Alle Spiele werden mit absolut gleicher Häufigkeit in den Pool gelegt
    const categories = [
        'aufgaben', 
        'wer_wuerde_eher', 
        'ich_hab_noch_nie', 
        'paranoia',
        'countdown',
        'shot_roulette',
        'virus',
        'sudden_event',
        'tribunal'
    ];
    
    // Wir erstellen einen größeren Pool (z.B. 24 Karten), damit die Mischung besser ist
    let fullPool = [];
    for(let i = 0; i < 3; i++) {
        fullPool = fullPool.concat(categories);
    }
    
    // Fisher-Yates Shuffle für echten Zufall ohne Wiederholungs-Pech
    mixedModePool = fullPool.sort(() => Math.random() - 0.5);
}

function starteGemischteRunde() {
    isGemischteRunde = true;
    zeigeBereich('spielBereich');
    karteZiehen();
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

    // Alle Themes entfernen
    spielBox.classList.remove('theme-wer_wuerde_eher', 'theme-aufgaben', 'theme-ich_hab_noch_nie', 'theme-paranoia', 'theme-sudden-event', 'theme-virus', 'theme-tribunal', 'theme-zeitbombe');

    const configs = {
        'wer_wuerde_eher': { icon: '🤔', label: 'Wer würde eher...', class: 'theme-wer_wuerde_eher' },
        'aufgaben': { icon: '🎯', label: 'Aufgabe', class: 'theme-aufgaben' },
        'ich_hab_noch_nie': { icon: '🤫', label: 'Ich hab noch nie...', class: 'theme-ich_hab_noch_nie' },
        'paranoia': { icon: '🕵️', label: 'Paranoia', class: 'theme-paranoia' },
        'virus': { icon: '☣️', label: 'INFEKTION!', class: 'theme-virus' },
        'tribunal': { icon: '⚖️', label: 'DAS TRIBUNAL', class: 'theme-tribunal' },
        'zeitbombe': { icon: '💣', label: 'ZEITBOMBE', class: 'theme-zeitbombe' },
        'sudden_event': { icon: '🚨', label: '⚠️ EXTREM-EVENT!', class: 'theme-sudden-event' }
    };

    const current = configs[kat] || configs['aufgaben'];
    spielBox.classList.add(current.class);
    iconEl.innerText = current.icon;
    labelEl.innerText = isGemischteRunde ? `Gemischter Mix: ${current.label}` : current.label;
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

    // Sudden Explosion Chance (ca. 4% - passiert unvorhersehbar)
    if (isGemischteRunde && Math.random() < 0.04) {
        if (typeof triggerSuddenExplosion === 'function') {
            triggerSuddenExplosion();
            return;
        }
    }

    // Handy-Wechsel alle 8 Karten
    handyWechselCounter++;
    if (isGemischteRunde && handyWechselCounter >= 8) {
        handyWechselCounter = 0;
        if (typeof zeigeHandyWechsel === 'function') {
            zeigeHandyWechsel();
            return;
        }
    }

    if (isGemischteRunde) {
        // Prüfen ob der Stapel leer ist
        if (mixedModePool.length === 0) {
            refillMixedModePool();
        }

        // Karte vom Stapel ziehen
        aktuelleKategorie = mixedModePool.pop();

        // Spezial-Logik für Spiele mit eigenem UI oder speziellen Start-Funktionen
        if (aktuelleKategorie === 'virus') {
            if (typeof zeigeVirusEventAufKarte === 'function') {
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
    if (rundenMatch) {
        const rundenAnzahl = parseInt(rundenMatch[1]);
        document.getElementById('failBtn').innerHTML = `✅ Herausforderung annehmen!`;
        document.getElementById('failBtn').onclick = () => rundenAufgabeStarten(zufallsSpieler, daten.frage, rundenAnzahl, aktuelleSchluecke);
        document.getElementById('strafeText').innerText = `Herausforderung: ${rundenAnzahl} Runden durchhalten!`;
    } else {
        document.getElementById('failBtn').innerHTML = `🍻 Trinken! <br><small>+${aktuelleSchluecke} Schlücke</small>`;
        document.getElementById('failBtn').onclick = trinkenBestätigen;
        document.getElementById('strafeText').innerText = `Einsatz: ${aktuelleSchluecke} Schlücke!`;
    }
}

/**
 * Zeigt den Screen zum Handy-Weitergeben
 */
function zeigeHandyWechsel() {
    const spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    const aktiveSpieler = spielerListe.filter(s => s.aktiv !== false);
    const zielSpieler = aktiveSpieler[Math.floor(Math.random() * aktiveSpieler.length)];
    
    zeigeBereich('handyWechselBereich');
    playSound('card');

    const display = document.getElementById('handyWechselDisplay');
    const avatar = zielSpieler.emoji.includes('<img') ? zielSpieler.emoji : `<span style="font-size: 5rem;">${zielSpieler.emoji}</span>`;
    
    display.innerHTML = `
        <div class="avatar-wrapper" style="width: 150px; height: 150px; margin-bottom: 20px;">${avatar}</div>
        <h1 style="font-size: 2.5rem;">ÜBERGABE!</h1>
        <p style="font-size: 1.5rem;">Reich das Handy weiter an:</p>
        <h2 style="color: #6366f1; font-size: 3rem;">${zielSpieler.name}</h2>
    `;
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
    
    const eventTemplate = suddenEvents[Math.floor(Math.random() * suddenEvents.length)];
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
        document.getElementById('entscheidungsBereich').style.display = 'flex';
        document.getElementById('failBtn').innerHTML = `🔥 Regel aktivieren!`;
        document.getElementById('failBtn').onclick = () => rundenAufgabeStarten(p1, fertigesEvent, rundenAnzahl, gefundeneSchluecke, true);
        document.getElementById('naechsteKarteBtn').style.display = 'none';
        document.getElementById('strafeText').innerText = `⚠️ Regel aktiv für ${rundenAnzahl} Runden!`;
    } else {
        document.getElementById('entscheidungsBereich').style.display = 'none';
        document.getElementById('naechsteKarteBtn').style.display = 'block';
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
    // Bei Aufgaben direkt buchen, bei "Ich hab noch nie" die Mehrfachauswahl zeigen
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
        if (task.restRunden > 0) task.restRunden--;
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
    
    container.innerHTML = aktiveRundenAufgaben.length > 0 ? "<h4 style='margin-bottom:10px; opacity:0.7;'>⏳ Laufende Challenges:</h4>" : "";
    
    aktiveRundenAufgaben.forEach((task, index) => {
        const statusText = `${task.restRunden} ${task.restRunden === 1 ? 'Runde' : 'Runden'} übrig`;
        const isGlobal = task.isGlobal === true;

        container.innerHTML += `
            <div class="runden-task-card" style="${isGlobal ? 'border-left-color: #ef4444; background: rgba(239, 68, 68, 0.1);' : ''}">
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

    // Sound und Konfetti!
    playSound('win');
    feierKonfetti();

    // Berechnungen für Awards
    const meisteSchluecke = [...aktiveSpieler].sort((a, b) => (b.schluecke || 0) - (a.schluecke || 0))[0];
    const amHaeufigstenGezogen = [...aktiveSpieler].sort((a, b) => (b.ausgewaehltCount || 0) - (a.ausgewaehltCount || 0))[0];
    const gesamtSchluecke = aktiveSpieler.reduce((sum, s) => sum + (s.schluecke || 0), 0);

    // Effizienz berechnen (Schlücke pro Getränk) - Weniger ist besser
    const effizienzListe = aktiveSpieler
        .filter(s => s.getraenkeCount > 0)
        .map(s => ({
            ...s,
            schnitt: (s.schluecke / s.getraenkeCount).toFixed(1)
        }))
        .sort((a, b) => a.schnitt - b.schnitt); // Aufsteigend sortieren

    let podiumHtml = "";
    if (effizienzListe.length > 0) {
        podiumHtml = `
            <h3>🏆 Effizienz-Ranking</h3>
            <p style="font-size: 0.8rem; opacity: 0.7;">(Schlücke pro Getränk - Weniger ist besser!)</p>
            <div class="podium-wrapper">
                ${effizienzListe.slice(0, 3).map((s, i) => `
                    <div class="podium-place">
                        <div class="podium-avatar">
                            ${s.emoji.includes('<img') ? s.emoji : `<span style="font-size: 30px;">${s.emoji}</span>`}
                        </div>
                        <div class="podium-bar place-${i+1}">
                            ${i+1}.
                        </div>
                        <div style="font-size: 0.7rem; margin-top: 5px;">${s.name}</div>
                        <div style="font-size: 0.8rem; font-weight: bold;">${s.schnitt}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    const statsHtml = `
        <div class="stats-container">
            <h2 class="stats-title">🏆 Abend-Resümee</h2>
            
            ${podiumHtml}

            <div class="stat-card reveal-1">
                <div class="stat-icon">🍻</div>
                <div class="stat-info">
                    <span class="stat-label">Promille-König</span>
                    <span class="stat-value" style="display: flex; align-items: center; gap: 10px;">
                        <div class="avatar-wrapper" style="width: 60px; height: 60px; margin: 0; font-size: 2rem;">
                            ${meisteSchluecke.emoji}
                        </div>
                        ${meisteSchluecke.name}
                    </span>
                    <span class="stat-sub">${meisteSchluecke.schluecke || 0} Schlücke</span>
                </div>
            </div>

            <div class="stat-card reveal-2">
                <div class="stat-icon">🎯</div>
                <div class="stat-info">
                    <span class="stat-label">Hauptziel</span>
                    <span class="stat-value" style="display: flex; align-items: center; gap: 10px;">
                        <div class="avatar-wrapper" style="width: 60px; height: 60px; margin: 0; font-size: 2rem;">
                            ${amHaeufigstenGezogen.emoji}
                        </div>
                        ${amHaeufigstenGezogen.name}
                    </span>
                    <span class="stat-sub">${amHaeufigstenGezogen.ausgewaehltCount || 0} Mal dran gewesen</span>
                </div>
            </div>

            <div class="stat-card reveal-3">
                <div class="stat-icon">🔥</div>
                <div class="stat-info">
                    <span class="stat-label">Gruppenleistung</span>
                    <span class="stat-value">Eskalation pur</span>
                    <span class="stat-sub">Insgesamt ${gesamtSchluecke} Schlücke vernichtet</span>
                </div>
            </div>
            <button class="nav-btn" style="margin-top:20px;" onclick="geheZuStartMenue()">Neue Runde</button>
        </div>
    `;
    document.getElementById('statistikBereich').innerHTML = statsHtml;
    zeigeBereich('statistikBereich');
}

window.onload = initialisiereApp;