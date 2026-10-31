# RIFT DUEL

## Gegen einen Bot spielen

Im Hauptmenü **Gegen Bot spielen** wählen, danach **Weiterspielen** zum Aktivieren der Maus. Der Trainingsraum startet ohne zweiten Browser. Der Bot findet Wege um Deckungen, dreht sich mit begrenzter Geschwindigkeit und schießt erst nach einer Reaktionszeit bei freier Sicht. Er verwendet dieselbe serverseitige Bewegung, Munition, Nachladezeit, Trefferprüfung und Respawnlogik wie Spieler. Es gelten dieselben Matchregeln; mit **Bereit / Revanche** beginnt nach Matchende das nächste Duell. Der Bot belegt den zweiten Platz; beim Verlassen wird der Trainingsraum entfernt. Der Bot-Modus läuft direkt im Browser und benötigt keinen Node-Server. Online-PvP verwendet weiterhin den autoritativen WebSocket-Server. Vor dem Start stehen im Menü Leicht (Standard), Mittel und Schwer zur Wahl. Leicht reagiert nach 1,5 s, schießt höchstens alle 850 ms und bewegt sich langsamer; Mittel reagiert nach 900 ms und schießt alle 450 ms; Schwer reagiert nach 550 ms und schießt alle 240 ms. Leicht und Mittel zielen ungenauer als Schwer. Der Bot plant Wege zur Gegnerposition, zielt aber nur bei Sichtkontakt.

Eigenständiger Desktop-1vs1-Shooter auf der Low-Poly-Map **Foundry**. Modelle und Sounds entstehen im Code. Betonoberflächen verwenden lokale CC0-Texturen von Poly Haven; Quellen stehen in ASSET-LICENSES.md.

## Lokal starten

Voraussetzung: Node.js 22.12+ und npm. PowerShell:

```powershell
cd C:\Users\sesse\AppData\Local\Temp\rift-duel
npm.cmd install
npm.cmd run dev
```

http://localhost:5173 in zwei Browserfenstern öffnen. Im ersten Raum erstellen, im zweiten Code eingeben oder Einladungslink öffnen. Beide klicken **Bereit**, danach **Weiterspielen**, um Pointer Lock zu aktivieren. Escape gibt die Maus frei. Der Raum bleibt bei Abbruch für den verbleibenden Spieler offen; ein neuer Gegner kann mit demselben Code beitreten.

WASD bewegen, Maus zielen, Leertaste springen (gehalten auch beim Landen), Shift sprinten, Linksklick feuern, Rechtsklick halten zum Zielen durch das Visier, R nachladen. Die Pause gibt nur die Maus frei: Ein Online-Match läuft weiter. 100 HP, 25 Schaden, 24 Patronen, 110 ms Schussabstand, 1,4 s Nachladen, Rundenmodus bis fünf Rundensiege in Bot- und PvP-Spielen. Ein Abschuss entscheidet die Runde. Danach folgt eine 2,5-sekündige Pause, in der Bewegung und Schaden gesperrt sind. Beide Spieler starten anschließend an ihren Spawns mit 100 HP und vollem Magazin. Jede Runde dauert höchstens zwei Minuten: Bei Zeitablauf gewinnt der Spieler mit mehr HP; bei gleichen HP beginnt eine neue Runde ohne Punktvergabe. Beide Spieler können anschließend mit Bereit eine Revanche starten.

## Prüfung

```powershell
npm.cmd run build
npm.cmd test
```

Build prüft TypeScript und erzeugt dist. Tests prüfen Movement, Sichtschutz, Eingabevalidierung, Feuerrate, Schaden, Respawn, Nachladen, fünf Rundensiege, Rundenzeitlimit, Gleichstand und Revanche. Ein zusätzlicher Integrationstest startet einen echten Server auf 3099 und verbindet drei WebSocket-Clients für Raumkapazität, Bereitschaft, Bewegung und Abbruch.

Ein weiterer Integrationstest auf Port 3100 spielt mit zwei Bots über echte WebSockets bis fünf Rundensiege und startet eine Revanche. Die Bots senden ausschließlich normale Eingaben; sie verändern keine Serverzustände. Für den Browser-Smoke-Test zuerst `npm.cmd run dev` starten und in einer zweiten Konsole `node tests/browser.mjs` ausführen. Dafür muss Microsoft Edge installiert sein. Der Test öffnet zwei unsichtbare Browserseiten, prüft Beitritt, Pointer Lock und Schießen und schreibt browser-game.png sowie browser-menu.png. Ein automatisierter Browsertest ersetzt keine menschliche Bewertung des Spielgefühls oder einen Internet-Latenztest.

## Produktion / Hosting

```powershell
npm.cmd ci
npm.cmd run build
$env:PORT='3001'
npm.cmd start
```

Der Node-Server liefert dist und WebSockets unter /ws aus. Lokal dann http://localhost:3001 öffnen. Für öffentliches Hosting einen dauerhaft laufenden Node-Prozess hinter einem HTTPS-Reverse-Proxy betreiben, der WebSocket-Upgrades für /ws weiterleitet; beispielsweise eine VM oder einen Node-Webservice. HTTPS ist für Pointer Lock / Clipboard im normalen öffentlichen Betrieb empfohlen. Keine rein statische Hosting-Lösung: Multiplayer braucht den laufenden Node-Prozess. Bei einem einzelnen Prozess bleiben Räume im Arbeitsspeicher. Neustart beendet alle Räume; mehrere Instanzen benötigen Sticky Routing oder einen gemeinsamen Raumdienst, der hier nicht implementiert ist.

Optionale Variablen:

| Variable | Standard | Zweck |
| --- | --- | --- |
| PORT | 3001 | HTTP-/WebSocket-Port des Servers |
| HOST | 0.0.0.0 | Bind-Adresse |
| ALLOWED_ORIGIN | nicht gesetzt | Exakt erlaubter Browser-Origin, z. B. https://duel.example.com |
| VITE_WS_URL | automatisch gleicher Host, /ws | Optional separate ws://- oder wss://-Adresse, beim Client-Build setzen |

Vite leitet /ws im Entwicklungsbetrieb an localhost:3001 weiter. Bei geändertem Entwicklungsport muss vite.config.ts entsprechend angepasst werden. Für LAN-Tests Rechner-IP statt localhost verwenden und Firewall-Port 5173 freigeben. Öffentliche HTTPS-Seiten benötigen wss://.

## Architektur und Grenzen

shared/game.ts enthält deterministische Physik mit festem 60-Hz-Schritt, AABB-Kollisionen und Ray-vs-Box-Treffertests. Der Client sendet nur Eingaben mit Sequenznummern. server/match.ts entscheidet über Bewegung, Munition, Treffer, Respawns und Punkte. server/index.ts begrenzt Payloads, Nachrichtenrate und Eingabewarteschlange, verwaltet Räume und prüft Verbindungen per Ping/Pong. Pro Tick wird maximal eine Eingabe pro Spieler verarbeitet; Client-Zeitstempel und Trefferbehauptungen werden nicht verwendet.

Der Client führt Bewegung sofort voraus, setzt bei Snapshots auf den bestätigten Serverzustand zurück und spielt noch unbestätigte Eingaben erneut ab. Gegner werden mit 100 ms Verzögerung zwischen Snapshots interpoliert; Respawns springen direkt zum neuen Ort. Schüsse und Trefferfeedback folgen der Serverbestätigung. Es gibt keine Lag Compensation; hohe Latenz verzögert Schussfeedback. Die Kollisionskörper sind einfache Quader, keine Skelett-Hitboxen. Kein Slide-Hopping, keine Accounts, keine persistente Statistik. Die physikalischen Grundlagen und echte Multiplayer-Räume haben Vorrang.

Der Projektordner liegt momentan im Windows-Temp-Verzeichnis. Für dauerhafte Nutzung den gesamten Ordner in ein normales Entwicklungsverzeichnis kopieren.

## Tests für Bot-Stufen und Runden

`npm.cmd test` prüft alle drei Stufen auf Reaktionszeit und Schussabstand sowie fünf Rundensiege, gesperrte Eingaben während der Rundenpause, gemeinsame Rücksetzung, Zeitablauf, Unentschieden und Revanche. Bei laufendem Entwicklungsserver prüft `node tests/bot-browser.mjs` zusätzlich alle drei Menüoptionen und einen echten Rundenwechsel im Browser.

## GitHub Pages

Die Website wird aus docs auf dem main-Branch veröffentlicht. Der Bot-Modus läuft vollständig im Browser mit derselben Match- und Bot-Logik wie der Server. Für Online-PvP muss VITE_WS_URL beim Build auf einen öffentlichen wss://-Server gesetzt werden. Ohne diese Konfiguration zeigt Pages einen Hinweis statt eines fehlschlagenden Verbindungsversuchs. Zum Aktualisieren npm run build ausführen und den Inhalt von dist nach docs kopieren; danach committen.

## Lobby und Waffen

In der Lobby stehen AK-47 (25 Schaden, 24 Patronen), MP5 (18 Schaden, 32 Patronen) und Barrett M82 .50 (100 Schaden, 8 Patronen) mit drehender 3D-Vorschau zur Wahl. Die Auswahl ist für das Match einschließlich Revanche festgelegt; zum Wechseln ins Hauptmenü zurückkehren. Alle Waffen sind automatische Hitscan-Waffen mit eigenen Schussabständen, Nachladezeiten und Rückstoßwerten. Der Server akzeptiert ausschließlich bekannte Waffen-IDs beim Raumbeitritt. Die Grafik nutzt prozedurale Bodenmaterialien, Metallverkleidungen, Lichtleisten, Schatten, Tonemapping und detaillierte Waffen aus selbst erstellter Geometrie. Betontexturen: Poly Haven (CC0). `node tests/armory.mjs` prüft die drei Waffen im Browser; mit TEST_URL kann die veröffentlichte Website geprüft werden.

## Visiere und Figuren

Rechtsklick halten aktiviert das Reflexvisier von AR und SMG beziehungsweise das 4×-Zielfernrohr der Sniper. Das Zielen reduziert Sichtfeld, Mausempfindlichkeit, Bewegungsgeschwindigkeit und Streuung. Nachladen unterbricht das Visier; Loslassen, Fokusverlust und Escape lösen das Zielen. Die Sniper verursacht 100 Schaden bei 1,4 Sekunden Schussabstand und hat stärkeren Rückstoß. Die SMG hat mehr vertikalen und seitlichen Rückstoß sowie serverseitige Schussstreuung, die beim Laufen und Springen wächst. Ein voll eingezoomter Sniperschuss ist ohne Zufallsstreuung.

Prozedurale Soldaten besitzen Kopf, Helm, Schutzbrille, Weste, Taschen, Arme, Handschuhe und animierte Beine. In der Egoansicht halten sichtbare Arme die Waffe. Die Trefferprüfung verwendet weiterhin den bestehenden Körperquader.

Zusätzliche Prüfung: `node tests/sights-browser.mjs` bei laufendem Entwicklungsserver. Prüft alle drei Visiere, Schießen beim Zielen, Nachladen und Loslassen. `node tests/character-preview.mjs` erstellt eine Modellvorschau.

## Grafik-Update

Detailliertere Waffen mit abgerundeten Kanten, getrennt animiertem Magazin und Verschluss, Stoffmaterialien, gegliederten Handschuhen und überarbeiteten Soldaten. Die Foundry nutzt lokale 1K-Farb-, Normal- und Rauheitskarten von Poly Haven, atmosphärischen Himmel, Lichtreflexionen, Kontaktschatten und zusätzliche Industriearchitektur. Geometrie wird nach Material zusammengefasst, um Zeichenaufrufe zu reduzieren. Die Figuren bleiben prozedural und stilisiert, nicht fotorealistisch.

Unter Einstellungen → Grafik kann zwischen Hoch (Schatten, höhere Auflösung) und Leistung gewechselt werden. Die Auswahl wird gespeichert. Die Waffen besitzen synthetisierte Schussgeräusche mit Rauschimpuls und Bassanteil.

`node tests/graphics-browser.mjs` prüft die sechs Texturen, beide Grafikmodi und Browser-/WebGL-Fehler. `TEST_URL` unterstützt die Live-Seite. Veröffentlichung: Build ausführen, danach `node package-site.mjs`. Das Paket enthält Quellcode, Lizenzhinweise, öffentliche Assets und den Pages-Build einschließlich binärsicherer Texturen.

## Waffenmodelle und eigene Sounds

SMG: MP5 mit röhrenförmigem Gehäuse, Schiebeschaft und gebogenem Magazin. Sturmgewehr: AK-47 mit Holzschaft, Holz-Handschutz, Gasrohr und Bananenmagazin. Sniper: Barrett M82 .50 mit langem Lauf, großer Mündungsbremse, gelochtem Laufmantel und Zweibein. Alle drei sind eigene stilisierte Modelle; Reflexvisiere und Zielfernrohr bleiben funktional.

Jede Waffe besitzt einen eigenen synthetisierten Sound mit drei Varianten: kurzer heller MP5-Impuls, mittiger AK-Knall mit mechanischem Anschlag, tiefer Barrett-Schuss mit längerem Nachhall. Die Sounds werden lokal erzeugt, gepuffert und bei gegnerischen Schüssen leiser und gedämpfter abgespielt. Keine externen Tonaufnahmen. Spielwerte und Munition bleiben unverändert.
