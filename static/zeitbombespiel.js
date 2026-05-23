/**
 * zeitbombespiel.js
 * Kernlogik für das Zeitbomben-Spiel (Hot Potato).
 */

let bombTimer = null;
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
    
    const randomTime = Math.floor(Math.random() * (40000 - 15000 + 1)) + 15000; // 15s bis 40s
    
    document.getElementById('bombStartBtn').style.display = "none";
    document.getElementById('bombPassBtn').style.display = "none";
    document.getElementById('bombCategoryBox').innerHTML = `Kategorie: <br><strong>${bombCategories[Math.floor(Math.random() * bombCategories.length)]}</strong>`;
    
    document.getElementById('bombPlayerDisplay').innerHTML = `
        <div style="font-size: 1.5rem; margin-top: 20px; color: #f97316; font-weight: bold; animation: pulse 1.5s infinite;">
            ⏱️ DIE BOMBE TICKT... <br> Reicht das Handy schnell weiter!
        </div>
    `;

    playSound('click');

    bombTimer = setTimeout(explodeBomb, randomTime);
}

function explodeBomb() {
    bombIsActive = false;
    
    // UI Explosion
    playSound('shot');
    document.body.classList.add('explosion-flash');
    document.getElementById('zeitbombeBereich').classList.add('shake-anim');
    document.getElementById('bombPassBtn').style.display = "none";
    
    const explosionBox = document.getElementById('bombExplosionBox');
    explosionBox.style.display = "block";
    
    // Zeige Auswahl-Grid für das Opfer
    explosionBox.innerHTML = `
        <h1 style="font-size: 3rem; color: #ef4444;">💥 BOOM!</h1>
        <p style="font-size: 1.2rem; margin-bottom: 20px;">Bei wem ist die Bombe explodiert?</p>
        <div id="bombVictimGrid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px;"></div>
    `;

    const grid = document.getElementById('bombVictimGrid');
    bombPool.forEach(p => {
        const btn = document.createElement('button');
        btn.className = "strafe-btn";
        btn.style.padding = "10px";
        btn.innerHTML = `
            <div class="avatar-wrapper" style="width: 60px; height: 60px;">${p.emoji}</div>
            <small style="font-size: 0.7rem; display: block; margin-top: 5px;">${p.name}</small>
        `;
        btn.onclick = () => {
            bucheBombSchluecke(p, 3);
            zeigeBombErgebnis(p);
        };
        grid.appendChild(btn);
    });

    setTimeout(() => {
        document.body.classList.remove('explosion-flash');
        document.getElementById('zeitbombeBereich').classList.remove('shake-anim');
    }, 1000);
}

/**
 * Zeigt das finale Ergebnis nach Auswahl des Opfers an
 */
function zeigeBombErgebnis(opfer) {
    const explosionBox = document.getElementById('bombExplosionBox');
    explosionBox.innerHTML = `
        <h1 style="font-size: 3rem; color: #ef4444;">💥 BOOM!</h1>
        <p>Die Bombe ist bei <strong>${opfer.name}</strong> explodiert!</p>
        <p style="font-size: 1.5rem; margin-top: 10px;">TRINK 3 SCHLÜCKE! 🍹</p>
        <button id="bombBackBtn" class="nav-btn" style="margin-top: 25px;"></button>
    `;

    const backBtn = document.getElementById('bombBackBtn');
    if (isGemischteRunde) {
        backBtn.innerText = "Weiter im Mix 🚀";
        backBtn.onclick = () => geheZurueckZumMix();
    } else {
        backBtn.innerText = "Nächste Runde";
        backBtn.onclick = () => resetBombUI();
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