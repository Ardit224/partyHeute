/**
 * zeitbombespiel.js
 * Kernlogik für das Zeitbomben-Spiel (Hot Potato).
 */

let bombTimer = null;
let bombCurrentPlayerIndex = 0;
let bombPool = [];
let bombIsActive = false;

const bombCategories = [
    "Nenne eine Automarke",
    "Nenne ein Wort mit 'Trink'",
    "Dinge, die man im Supermarkt klauen kann",
    "Nenne einen Cocktail",
    "Nenne eine Sexstellung",
    "Nenne eine Biersorte",
    "Nenne einen Grund zum Schlussmachen",
    "Nenne eine App auf deinem Handy",
    "Nenne ein Pokémon",
    "Nenne einen deutschen Rapper",
    "Nenne eine Pizzabelag",
    "Nenne etwas, das man im Dunkeln macht"
];

function starteZeitbombeSpiel() {
    isGemischteRunde = false;
    zeigeBereich('zeitbombeBereich');
    resetBombUI();
}

/**
 * Triggert eine sofortige, unvorhersehbare Explosion in der gemischten Runde.
 */
function triggerSuddenExplosion() {
    const spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    const aktiveSpieler = spielerListe.filter(s => s.aktiv !== false);
    if (aktiveSpieler.length === 0) return;

    // Der "Besitzer" des Handys wird zufällig bestimmt
    const opfer = aktiveSpieler[Math.floor(Math.random() * aktiveSpieler.length)];
    
    isGemischteRunde = true;
    zeigeBereich('zeitbombeBereich');
    
    // UI für den Schock-Moment vorbereiten
    document.getElementById('bombCategoryBox').innerHTML = "🚨 SCHARFE BOMBE! 🚨";
    document.getElementById('bombStartBtn').style.display = "none";
    document.getElementById('bombPassBtn').style.display = "none";
    
    bombPool = aktiveSpieler;
    bombCurrentPlayerIndex = aktiveSpieler.findIndex(s => s.name === opfer.name);
    
    explodeBomb();
}

function resetBombUI() {
    document.getElementById('bombCategoryBox').innerHTML = "Bereit?";
    document.getElementById('bombPlayerDisplay').innerHTML = "";
    document.getElementById('bombStartBtn').style.display = "block";
    document.getElementById('bombPassBtn').style.display = "none";
    document.getElementById('bombExplosionBox').style.display = "none";
    bombIsActive = false;
}

function startBombLogic() {
    const spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    bombPool = spielerListe.filter(s => s.aktiv !== false);

    if (bombPool.length < 2) {
        customAlert("Du brauchst mindestens 2 Spieler für die Bombe! 💣");
        return;
    }

    bombIsActive = true;
    bombCurrentPlayerIndex = Math.floor(Math.random() * bombPool.length);
    
    const randomTime = Math.floor(Math.random() * (40000 - 15000 + 1)) + 15000; // 15s bis 40s
    
    document.getElementById('bombStartBtn').style.display = "none";
    document.getElementById('bombPassBtn').style.display = "block";
    document.getElementById('bombCategoryBox').innerHTML = `Kategorie: <br><strong>${bombCategories[Math.floor(Math.random() * bombCategories.length)]}</strong>`;
    
    updateBombPlayer();
    playSound('click');

    bombTimer = setTimeout(explodeBomb, randomTime);
}

function updateBombPlayer() {
    const p = bombPool[bombCurrentPlayerIndex];
    const avatar = p.emoji.includes('<img') ? p.emoji : `<span style="font-size: 3rem;">${p.emoji}</span>`;
    document.getElementById('bombPlayerDisplay').innerHTML = `
        <div class="avatar-wrapper" style="width: 100px; height: 100px;">${avatar}</div>
        <h2 style="margin-top: 10px;">💣 BOMBE BEI: ${p.name}</h2>
    `;
}

function bombeWeitergeben() {
    if (!bombIsActive) return;
    bombCurrentPlayerIndex = (bombCurrentPlayerIndex + 1) % bombPool.length;
    updateBombPlayer();
    playSound('click');
    if ("vibrate" in navigator) navigator.vibrate(30);
}

function explodeBomb() {
    bombIsActive = false;
    const opfer = bombPool[bombCurrentPlayerIndex];
    
    // UI Explosion
    playSound('shot');
    document.body.classList.add('explosion-flash');
    document.getElementById('zeitbombeBereich').classList.add('shake-anim');
    document.getElementById('bombPassBtn').style.display = "none";
    
    const explosionBox = document.getElementById('bombExplosionBox');
    explosionBox.style.display = "block";
    explosionBox.innerHTML = `
        <h1 style="font-size: 3rem; color: #ef4444;">💥 BOOM!</h1>
        <p>Die Bombe ist bei <strong>${opfer.name}</strong> explodiert!</p>
        <p style="font-size: 1.5rem; margin-top: 10px;">TRINK 3 SCHLÜCKE! 🍺</p>
    `;

    // Robustes Tracking
    bucheBombSchluecke(opfer, 3);

    setTimeout(() => {
        document.body.classList.remove('explosion-flash');
        document.getElementById('zeitbombeBereich').classList.remove('shake-anim');
    }, 1000);

    // Back Button Handling
    const backBtn = document.getElementById('bombBackBtn');
    if (isGemischteRunde) {
        backBtn.innerText = "Weiter im Mix 🚀";
        backBtn.setAttribute('onclick', 'geheZurueckZumMix()');
    } else {
        backBtn.innerText = "Nächste Runde";
        backBtn.setAttribute('onclick', 'resetBombUI()');
    }
}

function bucheBombSchluecke(opfer, anzahl) {
    let alleSpieler = JSON.parse(localStorage.getItem('partySpieler'));
    let echterSpieler = alleSpieler.find(s => s.name === opfer.name && s.emoji === opfer.emoji);
    if(echterSpieler) {
        echterSpieler.schluecke += anzahl;
        echterSpieler.ausgewaehltCount = (echterSpieler.ausgewaehltCount || 0) + 1;
        localStorage.setItem('partySpieler', JSON.stringify(alleSpieler));
        if (typeof listeAnzeigen === "function") listeAnzeigen(); 
    }
}