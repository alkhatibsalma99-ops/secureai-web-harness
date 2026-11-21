# EVAL-02 – Deadline Validation

## Ziel

Die StudyTask API soll Deadlines bei `POST /tasks` strikt validieren.

## Anforderungen

### Fehlende Deadline

Eine Aufgabe ohne Deadline muss abgelehnt werden.

Erwartet:

```text
HTTP 400
Falsches Format
Die Deadline muss das Format YYYY-MM-DD besitzen.

Beispiele für ungültige Werte:
20.12.2026
2026/12/20
abc

Erwartet:
HTTP 400

Ungültiges Datum
Auch formal korrekt aussehende, aber unmögliche Daten müssen abgelehnt werden.

Beispiel:
2026-02-30

Erwartet:
HTTP 400

Gültige Deadline
Beispiel:
{
  "title": "Mathe lernen",
  "deadline": "2026-12-20"
}

Erwartet:
HTTP 201

Bestehende API
Folgende Endpunkte müssen weiterhin funktionieren:
GET /
GET /tasks/count
POST /tasks

Erfolgskriterien
EVAL-02 gilt als bestanden, wenn:
- eine fehlende Deadline HTTP 400 liefert,
- ein falsches Format HTTP 400 liefert,
- ein unmögliches Datum HTTP 400 liefert,
- eine gültige Deadline HTTP 201 liefert,
- bestehende Endpunkte weiterhin funktionieren