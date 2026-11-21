# EVAL-08 – Task Tags Management

## Ziel

Die StudyTask API soll um Tags für Tasks erweitert werden.

Jede Aufgabe kann mehrere Tags besitzen.

---

## 1. Tags beim Erstellen einer Aufgabe

`POST /tasks` akzeptiert optional ein Feld:

```json
{
  "tags": ["uni", "prüfung"]
}
Wenn keine Tags angegeben werden, muss die Aufgabe standardmäßig enthalten:
{
  "tags": []
}
2. Validierung
tags muss ein Array sein.

Jeder Eintrag im Array muss ein String sein.

Ungültige Beispiele:
{
  "tags": "uni"
}
{
  "tags": ["uni", 123]
}
{
  "tags": ["uni", ""]
}
Bei ungültigen Tags muss die API antworten mit:
HTTP 400
3. Normalisierung
Tags müssen normalisiert werden.

Beispiel:
{
  "tags": [
    " Uni ",
    "PRÜFUNG",
    "uni"
  ]
}
muss gespeichert werden als:
{
  "tags": [
    "uni",
    "prüfung"
  ]
}
Regeln:
- Leerzeichen am Anfang und Ende entfernen.
- Tags in Kleinbuchstaben umwandeln.
- Doppelte Tags entfernen.
- Leere Tags ablehnen.
4. Tags ändern
Tags einer bestehenden Aufgabe müssen über folgenden Endpoint geändert werden können:
PATCH /tasks/:id
Beispiel:
{
  "tags": [
    "projekt",
    "wichtig"
  ]
}
Die aktualisierte Aufgabe muss zurückgegeben werden.
5. Tasks nach Tag filtern
Neuer Endpoint:
GET /tasks/tag/:tag
Beispiel:
GET /tasks/tag/uni
Der Endpoint gibt alle Tasks zurück, die diesen Tag besitzen.

Die Suche muss case-insensitive sein.

Beispiele:
GET /tasks/tag/uni
GET /tasks/tag/UNI
GET /tasks/tag/Uni
müssen dasselbe Ergebnis liefern.

Wenn kein Task den Tag besitzt:
[]
mit:
HTTP 200
6. Bestehende API darf nicht beschädigt werden
Die bereits im Startzustand vorhandenen Endpunkte müssen weiterhin funktionieren:
GET /
GET /tasks/count
POST /tasks
Die neue Tags-Funktionalität darf die bestehende StudyTask API nicht beschädigen.
Erwartetes Verhalten
Die Lösung gilt als erfolgreich, wenn:
- Tasks mit mehreren Tags erstellt werden können.
- Ohne Tags standardmäßig [] gespeichert wird.
- Ungültige Tags mit HTTP 400 abgelehnt werden.
- Tags normalisiert werden.
- Doppelte Tags entfernt werden.
- Tags über PATCH geändert werden können.
- Tasks nach Tag gefiltert werden können.
- Die Tag-Suche case-insensitive funktioniert.
- Kein Treffer HTTP 200 mit [] liefert.
- Die vorhandenen API-Endpunkte weiterhin funktionieren.



```text
evals/eval08-task-tags/expected.md

