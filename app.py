from flask import Flask, render_template, jsonify, request
import random

app = Flask(__name__)

# 1. Unsere "Datenbank" (Das Original, das niemals verändert wird)
fragen_pools = {
    "wer_wuerde_eher": [
        "[SPIELER], wer aus der Runde würde am ehesten ein Haus anzünden?",
        "[SPIELER], wer hat den schlimmsten Musikgeschmack?",
        "Wer würde am ehesten in der Wildnis überleben? [SPIELER], entscheide, wer trinkt!"
    ],
    "aufgaben": [
        "[SPIELER], mache 10 Liegestütze oder trinke!",
        "[SPIELER], zeige das letzte Foto auf deinem Handy oder trinke!",
        "[SPIELER], du darfst 5 Minuten nicht 'Ja' oder 'Nein' sagen."
    ],
    "ich_hab_noch_nie": [
        "Ich hab noch nie so getan, als würde ich telefonieren, um jemandem aus dem Weg zu gehen.",
        "Ich hab noch nie eine Nachricht an die falsche Person geschickt und es sofort bereut.",
        "Ich hab noch nie gegoogelt, wie man einen Kater loswird."
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
