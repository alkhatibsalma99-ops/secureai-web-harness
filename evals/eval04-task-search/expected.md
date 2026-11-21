# EVAL-04 – Task Search

## Ziel

Die StudyTask API soll Tasks anhand ihres Titels durchsuchen können.

## Neuer Endpoint

```text
GET /tasks/search?q=<query>
Verhalten
Die Suche erfolgt über das Feld:
title

Die Suche muss:
- case-insensitive sein,
- Teilstrings unterstützen,
- alle passenden Tasks zurückgeben.
Beispiel:

Vorhandene Tasks:
[
  {
    "title": "Mathe lernen"
  },
  {
    "title": "Englisch lernen"
  },
  {
    "title": "Einkaufen"
  }
]

Request:
GET /tasks/search?q=lernen

Erwartet:
[
  {
    "title": "Mathe lernen"
  },
  {
    "title": "Englisch lernen"
  }
]

Case-insensitive
Request:
GET /tasks/search?q=MATHE

muss ebenfalls "Mathe lernen" finden.
Kein Treffer
Wenn kein Task passt:
[]

mit:
HTTP 200

Fehlender Suchbegriff
Wenn q fehlt oder leer ist:
HTTP 400

Bestehende API
Folgende Endpunkte müssen weiterhin funktionieren:
GET /
GET /tasks/count
POST /tasks

Erfolgskriterien
EVAL-04 gilt als bestanden, wenn:
- der Search-Endpoint verfügbar ist,
- Teilstrings gefunden werden,
- die Suche case-insensitive ist,
- mehrere Treffer zurückgegeben werden,
- kein Treffer [] liefert,
- fehlendes oder leeres q HTTP 400 liefert,
- bestehende Endpunkte weiterhin funktionieren.