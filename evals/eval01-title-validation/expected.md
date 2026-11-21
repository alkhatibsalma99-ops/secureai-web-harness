# EVAL-01 – Title Validation

## Ziel

Die StudyTask API soll eine strikte Validierung für den Titel einer Aufgabe besitzen.

Die Validierung betrifft:

`POST /tasks`

---

## 1. Leerer Titel

Ein leerer Titel ist ungültig.

Beispiel:

```json
{
  "title": "",
  "deadline": "2026-12-20"
}
2. Titel nur aus Leerzeichen
Ein Titel, der nur aus Leerzeichen besteht, ist ungültig.

Beispiel:
{
  "title": "   ",
  "deadline": "2026-12-20"
}

Erwartete Antwort:
HTTP 400

3. Maximale Länge
Ein Titel darf maximal 100 Zeichen enthalten.

Ein Titel mit mehr als 100 Zeichen muss abgelehnt werden.

Erwartete Antwort:
HTTP 400

4. Gültiger Titel
Ein gültiger Titel muss weiterhin akzeptiert werden.

Beispiel:
{
  "title": "Mathe lernen",
  "deadline": "2026-12-20"
}

Erwartete Antwort:
HTTP 201

5. Bestehende API
Die im Startzustand vorhandenen Endpunkte dürfen durch die Änderung nicht beschädigt werden:
GET /
GET /tasks/count
POST /tasks

Erfolgskriterien
EVAL-01 gilt als erfolgreich, wenn:
- ein leerer Titel mit HTTP 400 abgelehnt wird,
- ein Titel nur aus Leerzeichen mit HTTP 400 abgelehnt wird,
- ein Titel mit mehr als 100 Zeichen mit HTTP 400 abgelehnt wird,
- ein gültiger Titel weiterhin HTTP 201 liefert,
- die bestehende API weiterhin funktioniert

