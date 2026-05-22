/**
 * tribunalspiel.js
 * Logik für "Das Tribunal" - Gruppenabstimmungen mit visuellem Countdown.
 */

let tribunalSchluecke = 0;

const tribunalQuestions = [
    "⚖️ TRIBUNAL: Würdet ihr eher ein warmes, abgestandenes Bier trinken ODER einen Shot aus purem Essig? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher für den Rest des Lebens auf Alkohol verzichten ODER auf Partys nie wieder Musik hören dürfen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher betrunken euren Chef/Lehrer anrufen ODER eurer/m Ex eine peinliche Sprachnachricht schicken? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher ein Jahr lang jeden Tag einen leichten Kater haben ODER ein Jahr lang komplett auf Partys verzichten? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher das Glas eines Fremden austrinken ODER euer eigenes Getränk über euer neues Outfit schütten? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher für den Rest des Abends nur noch rückwärts gehen ODER nur noch flüstern dürfen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher auf dieser Party lautstark pupsen ODER beim Tanzen so hinfallen, dass alle hinkucken? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher den peinlichsten Tanz eures Lebens vor allen aufführen ODER 3 Minuten lang die Füße der Person links von euch massieren? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher für immer nur noch billiges Dosenbier trinken ODER nur noch extrem teure Cocktails, die ihr selbst zahlen müsst? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher eine Nacht in einer Ausnüchterungszelle verbringen ODER am nächsten Morgen die komplette Party-Wohnung alleine aufräumen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher reich aber absolut unglücklich sein ODER arm aber dafür wunschlos glücklich? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher 10 Millionen Euro bar auf die Hand bekommen ODER die Garantie, dass alle eure Freunde für immer kerngesund bleiben? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher euren absoluten Traumjob für Mindestlohn machen ODER einen absoluten Hass-Job für 20.000 € im Monat? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher für immer kostenlos im Luxushotel leben ODER ein eigenes, bescheidenes Haus geschenkt bekommen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher nie wieder arbeiten müssen (aber nur 1.500 € im Monat haben) ODER 60 Stunden die Woche arbeiten für 10.000 € im Monat? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher im Lotto gewinnen und es niemandem erzählen dürfen ODER den Gewinn mit der ganzen Welt teilen müssen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher der dümmste Mensch in einer Gruppe von Genies sein ODER der klügste Mensch unter lauter Idioten? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher weltberühmt, aber von der Hälfte der Menschen gehasst werden ODER völlig unbekannt, aber von euren Liebsten vergöttert? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher euer ganzes Leben lang dasselbe Auto fahren ODER jedes Jahr ein neues bekommen, das aber alle zwei Wochen eine Panne hat? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher eine Woche lang im absoluten Luxus schwelgen und danach pleite sein ODER euer Leben lang sparsam, aber ohne Geldsorgen leben? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher fliegen können (aber nur im langsamen Schritttempo) ODER euch teleportieren können (aber nur an Orte, die ihr absolut hasst)? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher die Gedanken von Tieren lesen können ODER jede menschliche Sprache fließend sprechen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher in die Vergangenheit reisen können (nur zum Zuschauen) ODER immer 5 Minuten in die Zukunft sehen können? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher für immer unsichtbar sein können (wann ihr wollt, aber ihr müsst nackt sein) ODER fliegen können (aber ihr verliert dabei dauerhaft alle Haare)? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher unsterblich sein (und sehen, wie alle um euch herum altern) ODER nur noch 5 Jahre leben, dafür aber als mächtigster Mensch der Welt? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher echten Kontakt mit Außerirdischen aufnehmen ODER die Tiefsee der Erde komplett erforschen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher nie wieder schlafen müssen (ohne müde zu sein) ODER nie wieder essen müssen (ohne Hunger zu haben)? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher die Zeit für alle Menschen für 10 Sekunden anhalten können (einmal am Tag) ODER die letzten 24 Stunden eures eigenen Lebens einmal pro Woche zurückspulen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher das Wetter kontrollieren können ODER alle elektronischen Geräte nur mit euren Gedanken steuern? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher ein weltberühmter Superheld sein (ohne Privatsphäre) ODER ein geheimnisvoller Detektiv im Hintergrund, den niemand kennt? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher für immer Single bleiben ODER in einer Beziehung sein, in der ihr euch jeden einzelnen Tag streitet? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher herausfinden, dass euer Partner euch belügt ODER dass all eure Freunde hinter eurem Rücken über euch lästern? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher die Gedanken eures Partners lesen können ODER die Gedanken eurer Feinde? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher für den Rest des Lebens nur noch die absolute Wahrheit sagen müssen ODER ab jetzt jede Stunde eine harmlose Lüge erzählen müssen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher die große Liebe eures Lebens finden, die aber nach 5 Jahren stirbt ODER jemanden heiraten, den ihr \"ganz okay\" findet, und 50 Jahre zusammenbleiben? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher euren kompletten Browserverlauf der letzten 5 Jahre auf Instagram posten ODER eurem Chef/Lehrer eure ehrlichste Meinung ins Gesicht sagen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher auf einer einsamen Insel mit eurem schlimmsten Erzfeind stranden ODER komplett alleine? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher für immer auf Social Media verzichten ODER für immer auf Netflix, YouTube und Streaming-Dienste? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher das originale Hochzeitskleid / den Anzug eurer Eltern bei eurer eigenen Hochzeit tragen ODER eure Hochzeit in einer Fast-Food-Filiale feiern? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher ein Jahr lang ohne jegliche Intimität leben ODER ein Jahr lang komplett ohne Freunde isoliert sein? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher eine Woche lang ohne Smartphone leben ODER eine Woche lang ohne Duschen und Zähneputzen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher für den Rest des Lebens nur noch eiskalte Pizza essen ODER nur noch kochend heiße Suppe? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher jeden Morgen mit einem extrem lauten Wecker geweckt werden, den man nicht leiser machen kann ODER jeden Tag im Winter ohne Jacke rausmüssen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher barfuß durch eine öffentliche Bahnhofstoilette laufen ODER einen Tag lang Kleidung tragen, die extrem juckt und kratzt? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher für immer nur noch ein einziges Lied hören dürfen ODER bei jedem Song, den ihr irgendwo hört, lautstark mitsingen müssen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher eine Woche lang im Dschungelcamp Prüfungen bestehen müssen ODER eine Woche lang in einem echten Geisterhaus schlafen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher aus Versehen eurem Lehrer/Chef ein Kuss-Emoji schicken ODER in einer völlig überfüllten Bahn lautstark stolpern und hinfallen? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher für immer auf Toilettenpapier verzichten ODER für immer auf Seife und Duschgel? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher den Rest eures Lebens nur noch knallgelbe Kleidung tragen ODER jeden Tag Socken tragen müssen, die leicht nass sind? Die Minderheit trinkt {schlucke} Schlücke!",
    "⚖️ TRIBUNAL: Würdet ihr eher eine Spinne in eurer Wohnung tolerieren, die so groß wie eure Hand ist ODER jede Nacht 50 winzige Mücken im Schlafzimmer haben? Die Minderheit trinkt {schlucke} Schlücke!"
];

function starteTribunalSpiel() {
    isGemischteRunde = false;
    aktuelleKategorie = 'tribunal';
    zeigeBereich('tribunalBereich');
    naechsteTribunalRunde();
}

function naechsteTribunalRunde() {
    const spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    const aktiveSpieler = spielerListe.filter(s => s.aktiv !== false);
    
    if (aktiveSpieler.length < 2) {
        customAlert("Das Gericht braucht mindestens 2 Geschworene! ⚖️");
        return;
    }

    // UI zurücksetzen
    document.getElementById('tribunalCountdownStandalone').innerHTML = "";
    document.getElementById('tribunalStandaloneBtn').style.display = "inline-block";
    document.getElementById('tribunalNextBtn').style.display = "none";

    const questionTemplate = tribunalQuestions[Math.floor(Math.random() * tribunalQuestions.length)];
    const p1 = aktiveSpieler[Math.floor(Math.random() * aktiveSpieler.length)];
    tribunalSchluecke = Math.floor(Math.random() * 4) + 2; // 2-5 Schlücke

    const renderName = (n) => `<span style="color: #ef4444; font-weight: bold;">${n}</span>`;
    
    let fertigeFrage = questionTemplate
        .replace(/{p1}/g, renderName(p1.name))
        .replace(/{schlucke}/g, `<strong>${tribunalSchluecke}</strong>`);

    document.getElementById('tribunalTaskText').innerHTML = fertigeFrage;
    if (typeof playSound === 'function') playSound('card');
}

/**
 * Integration für die gemischte Runde
 */
function starteTribunalMixed() {
    aktuelleKategorie = 'tribunal';
    const spielerListe = JSON.parse(localStorage.getItem('partySpieler')) || [];
    const aktiveSpieler = spielerListe.filter(s => s.aktiv !== false);
    
    if (aktiveSpieler.length < 2) {
        aktuelleKategorie = 'aufgaben';
        karteZiehen();
        return;
    }

    aktualisiereKartenOptik('tribunal');
    if (typeof playSound === 'function') playSound('card');

    const questionTemplate = tribunalQuestions[Math.floor(Math.random() * tribunalQuestions.length)];
    const p1 = aktiveSpieler[Math.floor(Math.random() * aktiveSpieler.length)];
    tribunalSchluecke = Math.floor(Math.random() * 3) + 2; 

    const renderName = (n) => `<span style="color: #ef4444; font-weight: bold;">${n}</span>`;
    let fertigeFrage = questionTemplate
        .replace(/{p1}/g, renderName(p1.name))
        .replace(/{schlucke}/g, `<strong>${tribunalSchluecke}</strong>`);

    document.getElementById('frageText').innerHTML = fertigeFrage;
    document.getElementById('strafeText').innerText = "Bereitet euch auf die Abstimmung vor!";
    
    // UI im spielBereich anpassen
    document.getElementById('entscheidungsBereich').style.display = 'flex';
    document.getElementById('failBtn').style.display = 'none';
    document.getElementById('tribunalBtn').style.display = 'block';
    document.getElementById('naechsteKarteBtn').style.display = 'none';
}

/**
 * Startet den visuellen Countdown
 * @param {string} displayId - ID des Containers für die Zahlen
 * @param {string} btnId - ID des Buttons, der versteckt werden soll
 */
function starteTribunalCountdown(displayId, btnId) {
    const display = document.getElementById(displayId);
    const btn = document.getElementById(btnId);
    
    btn.style.display = "none";
    const steps = ["3", "2", "1", "⚖️ ZEIGT AUF SIE!"];
    let current = 0;

    const interval = setInterval(() => {
        if (current < steps.length) {
            display.innerHTML = `<span class="countdown-number">${steps[current]}</span>`;
            if (typeof playSound === 'function') playSound('click');
            current++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                display.innerHTML = ""; // Countdown leeren
                window.aktuelleSchluecke = tribunalSchluecke; // Schluckanzahl global setzen
                
                if (typeof werMussTrinkenZeigen === 'function') {
                    werMussTrinkenZeigen();
                }
            }, 1500);
        }
    }, 1000);
}