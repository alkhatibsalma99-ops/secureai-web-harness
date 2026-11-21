# EVAL-06 – Status Filter

## Ziel

Die StudyTask API soll Tasks anhand ihres `completed`-Status filtern können.

## Neuer Endpoint

```text
GET /tasks/filter/status?completed=<value>
Erledigte Tasks
Request:
GET /tasks/filter/status?completed=true

liefert ausschließlich Tasks mit:
{
  "completed": true
}

Nicht erledigte Tasks
Request:
GET /tasks/filter/status?completed=false

liefert ausschließlich Tasks mit:
{
  "completed": false
}

Fehlender Parameter
Wenn completed fehlt:
GET /tasks/filter/status

Erwartet:
HTTP 400

Ungültiger Wert
Beispiele:
completed=yes
completed=1
completed=abc

Erwartet:
HTTP 400

POST /tasks
POST /tasks unterstützt weiterhin optional:
{
  "completed": true
}

Ohne Angabe gilt:
{
  "completed": false
}

Bestehende API
Folgende Endpunkte müssen weiterhin funktionieren:
GET /
GET /tasks/count
POST /tasks

Erfolgskriterien
EVAL-06 gilt als bestanden, wenn:
- completed=true ausschließlich erledigte Tasks liefert,
- completed=false ausschließlich nicht erledigte Tasks liefert,
- fehlender Parameter HTTP 400 liefert,
- ungültige Werte HTTP 400 liefern,
- POST /tasks den Boolean-Wert completed korrekt speichert,
- ohne Angabe completed=false gilt,
- bestehende Endpunkte weiterhin funktionieren.