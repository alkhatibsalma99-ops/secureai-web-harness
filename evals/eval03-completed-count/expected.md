# EVAL-03 – Completed Task Count

## Ziel

Die StudyTask API soll erledigte Aufgaben speichern und separat zählen können.

## POST /tasks

`POST /tasks` unterstützt optional das Feld:

```json
{
  "completed": true
}
Wenn completed übergeben wird, muss der boolesche Wert im Task gespeichert werden.

Wenn completed nicht übergeben wird, gilt standardmäßig:
{
  "completed": false
}

Beispiel:
{
  "title": "Aufgabe erledigt",
  "deadline": "2026-12-20",
  "completed": true
}

muss als Task mit:
{
  "completed": true
}

gespeichert werden.
Neuer Endpoint
GET /tasks/completed/count

Dieser Endpoint zählt ausschließlich Tasks mit:
completed === true

Beispiel:
[
  {
    "title": "Task 1",
    "completed": true
  },
  {
    "title": "Task 2",
    "completed": false
  },
  {
    "title": "Task 3",
    "completed": true
  }
]

Erwartete Antwort:
{
  "count": 2
}

Keine erledigten Tasks
Wenn keine erledigten Tasks vorhanden sind:
{
  "count": 0
}

mit:
HTTP 200

Bestehende API
Folgende Endpunkte müssen weiterhin funktionieren:
GET /
GET /tasks/count
POST /tasks

GET /tasks/count darf nicht durch den neuen Endpoint ersetzt werden.
Erfolgskriterien
EVAL-03 gilt als bestanden, wenn:
- POST /tasks optional completed: true speichern kann,
- ohne Angabe completed standardmäßig false ist,
- GET /tasks/completed/count HTTP 200 liefert,
- nur Tasks mit completed === true gezählt werden,
- Tasks mit completed === false nicht gezählt werden,
- bei null erledigten Tasks count: 0 zurückgegeben wird,
- GET /tasks/count weiterhin funktioniert,
- GET / weiterhin funktioniert.