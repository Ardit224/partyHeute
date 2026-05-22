from flask import Flask, render_template, jsonify, request
import random

app = Flask(__name__)

# 1. Unsere "Datenbank" (Das Original, das niemals verändert wird)
fragen_pools = {
    "wer_wuerde_eher": [
        "Wer würde am ehesten ein Haus anzünden?",
        "Wer hat den schlimmsten Musikgeschmack?",
        "Wer würde am ehesten in der Wildnis überleben?",
        "Wer würde am ehesten im Lotto gewinnen und alles an einem Tag ausgeben?",
        "Wer würde am ehesten ohne Grund anfangen zu weinen?",
        "Wer würde am ehesten vergessen, dass er/sie Geburtstag hat?",
        "Wer würde am ehesten im Gefängnis landen?",
        "Wer würde am ehesten eine eigene Sekte gründen?",
        "Wer würde am ehesten beim ersten Date nach der Anzahl der Kinder fragen?",
        "Wer würde am ehesten berühmt werden für etwas Peinliches?",
        "Wer würde am ehesten eine Woche lang nicht duschen?",
        "Wer würde am ehesten Präsident werden?",
        "Wer würde am ehesten an Verschwörungstheorien glauben?",
        "Wer würde am ehesten im Supermarkt etwas mitgehen lassen?",
        "Wer würde am ehesten den Namen seines Partners vergessen?",
        "Wer würde am ehesten eine Spinne essen?",
        "Wer würde am ehesten 24 Stunden durchzocken?",
        "Wer würde am ehesten bei einem Horrorfilm schreien?",
        "Wer würde am ehesten in einer Reality-TV-Show mitmachen?",
        "Wer würde am ehesten ein UFO sehen und es niemandem erzählen?",
        "Wer würde am ehesten aus Versehen ein Kind im Supermarkt vergessen?",
        "Wer würde am ehesten ein Tattoo auf einer Wette hin stechen lassen?",
        "Wer würde am ehesten mit seinem Chef flirten?",
        "Wer würde am ehesten über 100 Jahre alt werden?",
        "Wer würde am ehesten auf dem Mars leben wollen?",
        "Wer würde am ehesten seine eigene Identität fälschen?",
        "Wer würde am ehesten mit Tieren sprechen?",
        "Wer würde am ehesten sich in seinem eigenen Haus verlaufen?",
        "Wer würde am ehesten ein Internet-Meme werden?",
        "Wer würde am ehesten ein Erdbeben verschlafen?",
        "Wer würde am ehesten versehentlich ein Nacktbild an die Familiengruppe schicken?",
        "Wer würde am ehesten einen Weltrekord brechen?",
        "Wer würde am ehesten als Erster in einem Horrorfilm sterben?",
        "Wer würde am ehesten einen Monat ohne Internet aushalten?",
        "Wer würde am ehesten ein wichtiges Geheimnis ausplaudern?",
        "Wer würde am ehesten eine Leiche verschwinden lassen?",
        "Wer würde am ehesten einen Esswettbewerb gewinnen?",
        "Wer würde am ehesten innerhalb einer Woche wieder geschieden sein?",
        "Wer würde am ehesten Milliardär werden?",
        "Wer würde am ehesten für Geld heiraten?",
        "Wer würde am ehesten ein Geheimagent sein?",
        "Wer würde am ehesten seinen Job kündigen, um Weltreise zu machen?",
        "Wer würde am ehesten bei einer Werbung weinen?",
        "Wer würde am ehesten eine Schlägerei in einer Bar anfangen?",
        "Wer würde am ehesten aus einem Club geworfen werden?",
        "Wer würde am ehesten im Kino einschlafen?",
        "Wer würde am ehesten einem Kind die Süßigkeiten klauen?",
        "Wer würde am ehesten bei einer Beerdigung lachen?",
        "Wer würde am ehesten als Einsiedler im Wald enden?",
        "Wer würde am ehesten heimlich die Zahnbürste von jemand anderem benutzen?"
    ],
    "aufgaben": [
        "[SPIELER], mache 10 Liegestütze oder trinke!",
        "[SPIELER], zeige das letzte Foto auf deinem Handy oder trinke!",
        "[SPIELER], du darfst 3 Runden lang nicht 'Ja' oder 'Nein' sagen.",
        "[SPIELER], du darfst für 2 Runden nur noch flüstern!",
        "[SPIELER], imitiere 3 Runden lang einen Roboter.",
        "[SPIELER], nenne 5 deutsche Städte in 10 Sekunden oder trinke!",
        "[SPIELER], du und die Person links von dir trinken 3 Schlücke auf Bruderschaft.",
        "[SPIELER], du darfst 4 Runden lang dein Handy nicht berühren.",
        "[SPIELER], iss einen Löffel Senf oder Ketchup.",
        "[SPIELER], tanze eine Minute lang ohne Musik.",
        "[SPIELER], die Person rechts von dir darf dir eine neue Frisur machen.",
        "[SPIELER], du darfst 3 Runden lang nur in Reimen sprechen.",
        "[SPIELER], nimm die Socken der Person links von dir für eine Runde in die Hand.",
        "[SPIELER], mache der Person gegenüber ein ernstgemeintes Kompliment.",
        "[SPIELER], erzähle ein peinliches Geheimnis oder trinke!",
        "[SPIELER], imitiere jemanden aus der Runde. Wer es errät, darf 2 Schlücke verteilen.",
        "[SPIELER], mache einen Handstand oder trinke!",
        "[SPIELER], trinke dein Glas leer, ohne deine Hände zu benutzen.",
        "[SPIELER], du darfst 2 Runden lang nur mit geschlossenen Augen spielen.",
        "[SPIELER], mache eine Plank für 45 Sekunden.",
        "[SPIELER], sage 3 Zungenbrecher fehlerfrei auf.",
        "[SPIELER], balanciere einen Gegenstand 2 Runden lang auf deinem Kopf.",
        "[SPIELER], verhalte dich eine Runde lang wie ein Hund.",
        "[SPIELER], umarme jeden in der Runde.",
        "[SPIELER], trinke einen Schluck aus jedem Glas in der Runde.",
        "[SPIELER], tausche dein Oberteil mit der Person rechts von dir.",
        "[SPIELER], nenne 10 Automarken in 15 Sekunden.",
        "[SPIELER], lass dir von der Gruppe einen lustigen Status bei WhatsApp posten.",
        "[SPIELER], du darfst 3 Runden lang niemanden beim Namen nennen.",
        "[SPIELER], zeige uns deine meistgenutzten Emojis.",
        "[SPIELER], sprich 2 Runden lang mit einem Akzent deiner Wahl.",
        "[SPIELER], mache 5 Kniebeugen mit der Person links von dir auf dem Rücken.",
        "[SPIELER], lass dir die Augen verbinden und errate jemanden durch Anfassen der Hände.",
        "[SPIELER], trinke 2 Schlücke für jeden Brillenträger in der Runde.",
        "[SPIELER], erzähle einen Witz. Wenn keiner lacht, trinkst du 5 Schlücke.",
        "[SPIELER], zeig uns deine Google-Suchverläufe der letzten 24 Stunden.",
        "[SPIELER], setz dich für 3 Runden auf den Schoß der Person rechts von dir.",
        "[SPIELER], du darfst 2 Runden lang nur noch fluchen, wenn du sprichst.",
        "[SPIELER], mache eine Liebeserklärung an einen Gegenstand im Raum.",
        "[SPIELER], du darfst 4 Runden lang nicht lachen. Wer dich zum Lachen bringt, verteilt 3 Schlücke.",
        "[SPIELER], trinke so viele Schlücke, wie Personen im Raum sind.",
        "[SPIELER], nenne 5 Filme mit Leonardo DiCaprio.",
        "[SPIELER], spiele eine Runde lang 'Der Boden ist Lava'.",
        "[SPIELER], verfasse ein kurzes Gedicht über [SPIELER] (Zufall).",
        "[SPIELER], du musst jede Antwort mit 'Eure Majestät' beenden für 2 Runden.",
        "[SPIELER], zeige uns dein peinlichstes Video auf dem Handy.",
        "[SPIELER], trinke einen Shot mit der Person, die du am längsten kennst.",
        "[SPIELER], versuche eine Münze in ein Glas zu werfen. Wenn du triffst, verteilst du 5.",
        "[SPIELER], du darfst 3 Runden lang nicht dein Gesicht berühren.",
        "[SPIELER], tausche die Plätze mit der Person, die am weitesten weg sitzt."
    ],
    "ich_hab_noch_nie": [
        "Ich hab noch nie so getan, als würde ich telefonieren, um jemandem aus dem Weg zu gehen.",
        "Ich hab noch nie eine Nachricht an die falsche Person geschickt und es sofort bereut.",
        "Ich hab noch nie gegoogelt, wie man einen Kater loswird.",
        "Ich hab noch nie Sex im Freien gehabt.",
        "Ich hab noch nie jemanden gestalkt.",
        "Ich hab noch nie etwas geklaut.",
        "Ich hab noch nie eine peinliche Nachricht an meinen Ex geschickt.",
        "Ich hab noch nie nackt gebadet.",
        "Ich hab noch nie im Kino rumgemacht.",
        "Ich hab noch nie eine Verhaftung miterlebt.",
        "Ich hab noch nie jemanden angelogen, um ein Date abzusagen.",
        "Ich hab noch nie in ein Waschbecken gepinkelt.",
        "Ich hab noch nie so getan, als würde ich jemanden nicht sehen.",
        "Ich hab noch nie ein Tinder-Date gehabt.",
        "Ich hab noch nie einen ONS gehabt.",
        "Ich hab noch nie einen falschen Namen benutzt.",
        "Ich hab noch nie eine ganze Pizza alleine gegessen.",
        "Ich hab noch nie meinen Partner mit dem Namen des Ex angesprochen.",
        "Ich hab noch nie heimlich das Handy meines Partners kontrolliert.",
        "Ich hab noch nie eine Diät nach einem Tag abgebrochen.",
        "Ich hab noch nie vergessen, die Handbremse anzuziehen.",
        "Ich hab noch nie in der Dusche gepinkelt.",
        "Ich hab noch nie etwas gegessen, was auf dem Boden lag.",
        "Ich hab noch nie eine schlechte Bewertung im Internet geschrieben.",
        "Ich hab noch nie eine Sprache vorgetäuscht, die ich nicht kann.",
        "Ich hab noch nie meinen Tod vorgetäuscht, um aus einer Situation zu kommen.",
        "Ich hab noch nie einen Strafzettel bekommen.",
        "Ich hab noch nie im Club geweint.",
        "Ich hab noch nie in der Öffentlichkeit Sex gehabt.",
        "Ich hab noch nie so getan, als wäre ich betrunken.",
        "Ich hab noch nie eine ganze Serie an einem Wochenende geschaut.",
        "Ich hab noch nie jemanden im Internet blockiert.",
        "Ich hab noch nie eine peinliche Suchanfrage gelöscht.",
        "Ich hab noch nie ein Kleidungsstück zurückgegeben, nachdem ich es getragen habe.",
        "Ich hab noch nie bei einem Spiel geschummelt.",
        "Ich hab noch nie einen Kater gehabt, der 2 Tage gedauert hat.",
        "Ich hab noch nie eine Nachricht gelöscht, damit sie niemand liest.",
        "Ich hab noch nie meinen Namen gegoogelt.",
        "Ich hab noch nie jemanden geküsst, den ich gerade erst getroffen habe.",
        "Ich hab noch nie den Geburtstag meiner Eltern vergessen.",
        "Ich hab noch nie in einem Zelt geschlafen.",
        "Ich hab noch nie ein Haustier verloren.",
        "Ich hab noch nie bei einem Film geweint.",
        "Ich hab noch nie versucht, mit einer Celebritiy Kontakt aufzunehmen.",
        "Ich hab noch nie eine Narbe bekommen, für die ich mich schäme.",
        "Ich hab noch nie verschlafen und ein wichtiges Meeting verpasst.",
        "Ich hab noch nie behauptet, krank zu sein, um zu feiern.",
        "Ich hab noch nie ein unangebrachtes Foto verschickt.",
        "Ich hab noch nie eine Person aus der Runde nackt gesehen.",
        "Ich hab noch nie gedacht, dass jemand hier in der Runde schlecht riecht."
    ],
    "paranoia": [
        "Wer in der Runde würde am ehesten [SPIELER] im Stich lassen?",
        "Wer hier ist am ehesten in [SPIELER] verknallt?",
        "Wer würde am ehesten das letzte Bier von [SPIELER] klauen?",
        "Wer ist die vertrauenswürdigste Person für [SPIELER]?",
        "Wer würde am ehesten [SPIELER] bei der Polizei verpfeifen?",
        "Wer hat das peinlichste Foto von [SPIELER] auf dem Handy?",
        "Wer hier hat das größte Geheimnis vor [SPIELER]?",
        "Wer mag [SPIELER] heimlich am wenigsten?",
        "Wer würde [SPIELER] am ehesten für 1 Million Euro verkaufen?",
        "Wer hier ist der größte Fake-Freund von [SPIELER]?",
        "Wer würde am ehesten mit dem Ex von [SPIELER] schlafen?",
        "Wer hier findet [SPIELER] am attraktivsten?",
        "Wer würde am ehesten ein Geheimnis von [SPIELER] ausplaudern?",
        "Wer findet, dass [SPIELER] den schlechtesten Kleidungsstil hat?",
        "Wer würde am ehesten vergessen, [SPIELER] zur Hochzeit einzuladen?",
        "Wer hier glaubt, dass [SPIELER] am ehesten mal im Gefängnis landet?",
        "Wer hier würde [SPIELER] am ehesten anlügen, um sich selbst zu retten?",
        "Wer findet [SPIELER] am nervigsten, wenn er/sie betrunken ist?",
        "Wer hier würde [SPIELER] niemals sein Auto leihen?",
        "Wer glaubt, dass [SPIELER] die schmutzigste Fantasie hat?",
        "Wer würde am ehesten ein Kind mit [SPIELER] haben wollen?",
        "Wer hier findet, dass [SPIELER] am meisten stinkt?",
        "Wer würde am ehesten [SPIELER] nachts allein im Wald lassen?",
        "Wer hier denkt, dass [SPIELER] am ehesten fremdgehen würde?",
        "Wer findet, dass [SPIELER] am meisten Geld für unnötiges Zeug ausgibt?",
        "Wer würde am ehesten [SPIELER] bei einer Schlägerei alleine lassen?",
        "Wer hier hat [SPIELER] schon mal im Internet gestalkt?",
        "Wer glaubt, dass [SPIELER] heimlich in jemanden aus der Runde verliebt ist?",
        "Wer würde am ehesten mit [SPIELER] auf eine einsame Insel gehen?",
        "Wer hier findet [SPIELER] am unzuverlässigsten?",
        "Wer würde am ehesten [SPIELER] ein falsches Kompliment machen?",
        "Wer hier glaubt, dass [SPIELER] am meisten Pornos schaut?",
        "Wer würde am ehesten [SPIELER] beim Fremdgehen decken?",
        "Wer hier findet [SPIELER] am arrogantesten?",
        "Wer würde am ehesten [SPIELER] die Schuld für einen Unfall geben?",
        "Wer hier hat schon mal schlecht über [SPIELER] geredet?",
        "Wer findet, dass [SPIELER] am schlechtesten küsst?",
        "Wer würde am ehesten [SPIELER] Geld leihen und nie wieder zurückfordern?",
        "Wer hier glaubt, dass [SPIELER] am ehesten ein Doppelleben führt?",
        "Wer würde am ehesten [SPIELER] bei einem Survival-Trip als Erstes essen?",
        "Wer hier findet [SPIELER] am lustigsten?",
        "Wer würde am ehesten mit [SPIELER] in den Urlaub fahren?",
        "Wer hier vertraut [SPIELER] am wenigsten?",
        "Wer würde am ehesten [SPIELER] nackt sehen wollen?",
        "Wer hier findet [SPIELER] am ehesten peinlich in der Öffentlichkeit?",
        "Wer würde am ehesten ein Haustier von [SPIELER] umbringen (aus Versehen)?",
        "Wer hier glaubt, dass [SPIELER] am ehesten mal reich wird?",
        "Wer würde am ehesten [SPIELER] ghosten?",
        "Wer hier findet [SPIELER] am bodenständigsten?",
        "Wer würde am ehesten für [SPIELER] ins Gefängnis gehen?"
    ]
}

# 2. Unser "Zieh-Stapel" (Das Gedächtnis des Servers)
# Wir kopieren am Anfang einmal alle Fragen in diesen Stapel
uebrige_fragen = {}
for kat in fragen_pools:
    uebrige_fragen[kat] = fragen_pools[kat].copy()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/neue_karte')
def neue_karte():
    level = request.args.get('level', '2')
    kategorie = request.args.get('kategorie', 'wer_wuerde_eher') 
    
    if kategorie not in fragen_pools:
        kategorie = 'wer_wuerde_eher'

    # 3. PRÜFEN: Ist der Zieh-Stapel für dieses Spiel leer?
    if len(uebrige_fragen[kategorie]) == 0:
        # Wenn ja: Alle Original-Karten wieder neu reinkopieren (Mischen!)
        uebrige_fragen[kategorie] = fragen_pools[kategorie].copy()

    # 4. Eine Frage aus den noch ÜBRIGEN Karten ziehen
    frage = random.choice(uebrige_fragen[kategorie])
    
    # 5. Die gezogene Frage SOFORT vom Stapel löschen, damit sie nicht doppelt kommt
    uebrige_fragen[kategorie].remove(frage)
    
    # Schlücke berechnen
    if level == '1':
        schluecke = random.randint(1, 2)
    elif level == '3':
        schluecke = random.randint(3, 6)
    else:
        schluecke = random.randint(2, 4)
        
    return jsonify({"frage": frage, "schluecke": schluecke})

if __name__ == '__main__':
    app.run(debug=True)
