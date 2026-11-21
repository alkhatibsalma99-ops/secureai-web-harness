# EVAL-07 – Task Priority

## Ziel

Die StudyTask API soll Prioritäten für Tasks unterstützen.

## Erlaubte Werte

```text
low
medium
high
POST /tasks
POST /tasks unterstützt optional:
{
  "priority": "high"
}

Wenn keine Priorität angegeben wird, gilt:
{
  "priority": "medium"
}

Die Priorität wird in Kleinbuchstaben gespeichert.

Beispiel:
{
  "priority": "HIGH"
}

wird gespeichert als:
{
  "priority": "high"
}

Ungültige Werte müssen mit:
HTTP 400

abgelehnt werden.
PATCH /tasks/:id
Die Priorität eines bestehenden Tasks kann geändert werden.

Beispiel:
{
  "priority": "low"
}

Eine ungültige Priorität muss mit HTTP 400 abgelehnt werden.
Filter
Neuer Endpoint:
GET /tasks/priority/:priority

Beispiel:
GET /tasks/priority/high

liefert alle Tasks mit:
{
  "priority": "high"
}

Die Suche muss case-insensitive sein.

Beispiel:
GET /tasks/priority/HIGH

muss dieselben Ergebnisse liefern.

Wenn keine Tasks passen:
[]

mit HTTP 200.

Ein ungültiger Filterwert muss HTTP 400 liefern.
Bestehende API
Folgende Endpunkte müssen weiterhin funktionieren:
GET /
GET /tasks/count
POST /tasks

Erfolgskriterien
EVAL-07 gilt als bestanden, wenn:
- POST /tasks Priority speichert,
- Priority standardmäßig medium ist,
- Priority normalisiert wird,
- ungültige Werte abgelehnt werden,
- Priority über PATCH geändert werden kann,
- der Priority-Filter funktioniert,
- die Suche case-insensitive ist,
- kein Treffer [] liefert,
- ungültige Filterwerte HTTP 400 liefern,
- bestehende Endpunkte weiterhin funktionieren.