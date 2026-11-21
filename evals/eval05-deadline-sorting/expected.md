# EVAL-05 – Deadline Sorting

## Ziel

Die StudyTask API soll gespeicherte Tasks nach ihrer Deadline sortiert zurückgeben können.

## Neuer Endpoint

```text
GET /tasks/sorted/deadline
Ascending
Ohne Query-Parameter erfolgt die Sortierung aufsteigend.

Beispiel:
[
  {
    "title": "Task C",
    "deadline": "2026-12-30"
  },
  {
    "title": "Task A",
    "deadline": "2026-01-10"
  },
  {
    "title": "Task B",
    "deadline": "2026-06-15"
  }
]

Erwartete Reihenfolge:
Task A
Task B
Task C

Explizit ascending
GET /tasks/sorted/deadline?order=asc

muss ebenfalls die früheste Deadline zuerst liefern.
Descending
GET /tasks/sorted/deadline?order=desc

Erwartete Reihenfolge:
Task C
Task B
Task A

Ungültiger order-Wert
Beispiel:
GET /tasks/sorted/deadline?order=random

Erwartet:
HTTP 400

Bestehende API
Diese Endpunkte müssen weiterhin funktionieren:
GET /
GET /tasks/count
POST /tasks

Erfolgskriterien
EVAL-05 gilt als bestanden, wenn:
- der neue Endpoint HTTP 200 liefert,
- standardmäßig aufsteigend sortiert wird,
- order=asc korrekt funktioniert,
- order=desc korrekt funktioniert,
- ein ungültiger order-Wert HTTP 400 liefert,
- bestehende Endpunkte weiterhin funktionieren.