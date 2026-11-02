# Relay für Multiplayer

Die öffentlichen Relay-Hosts aus der PeerJS-Standardkonfiguration waren bei der
Prüfung am 2. November 2026 nicht per DNS erreichbar. Zwei Browser auf demselben
Rechner beweisen nicht, dass Verbindungen über unterschiedliche Router funktionieren.

Das Spiel lädt vor jeder Verbindung `multiplayer.json` relativ zur Spielseite.
Ohne TURN-Konfiguration funktioniert nur der direkte WebRTC-Verbindungsweg.

## Metered

1. Ein Konto unter https://dashboard.metered.ca erstellen bzw. anmelden.
2. Im TURN-Bereich ein Credential für diese Anwendung erstellen.
3. Über **Get credential → Show API Key** die für dieses einzelne Credential
   bestimmte Frontend-URL beziehen. Keinen Account-Secret-/Admin-Key verwenden.
4. Die Konfiguration in `public/multiplayer.json` und `docs/multiplayer.json`
   durch folgendes Format ersetzen, mit der tatsächlichen Credential-URL:

```json
{"credentialsUrl":"https://APP.metered.live/api/v1/turn/credentials?apiKey=CREDENTIAL_SCOPED_KEY"}
```

Die konkrete URL wird vom Anbieter geliefert. Sie ist für den Browser sichtbar.
Das Spiel lädt die aktuellen ICE-Server darüber; Account- oder Admin-Schlüssel
gehören weder in diese Datei noch ins Repository. Für andere Anbieter kann
`credentialsUrl` eine eigene HTTPS-API sein, die ein Array von RTCIceServer-
Einträgen mit kurzlebigen Zugangsdaten zurückgibt. Alternativ unterstützt die Datei
`iceServers`, ein entsprechendes Array direkt für browsergeeignete Zugangsdaten.

Quelle: https://www.metered.ca/docs/turn-server-service/quickstart/

## Verifikation vor einer Erfolgsmeldung

`node tests/peer-browser.mjs` prüft den normalen Verbindungsweg.
`RIFT_FORCE_RELAY=1 node tests/peer-browser.mjs` erzwingt TURN in beiden Browsern
und prüft zusätzlich, dass der gewählte ICE-Kandidat ein Relay ist. Der Relay-Test
muss mit tatsächlich konfiguriertem Dienst erfolgreich sein. Ein Erfolg ohne
erzwungenes Relay reicht nicht aus. PowerShell:

```powershell
$env:RIFT_FORCE_RELAY='1'
node tests/peer-browser.mjs
Remove-Item Env:RIFT_FORCE_RELAY
```

Danach mit zwei Geräten in unterschiedlichen Netzwerken testen. Beide Seiten
neu laden und einen neuen Raum erstellen. Der Host muss die Seite geöffnet halten.
