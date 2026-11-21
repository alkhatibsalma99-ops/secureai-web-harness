# M2 – Verification Loop

## Ziel

Im Milestone 2 erweitern wir unseren SecureAI Web Harness um eine echte Verification Loop.

Der Coding Agent soll Änderungen nicht nur erzeugen, sondern die Ergebnisse mithilfe eigener Tools überprüfen, auf Fehler reagieren und die Prüfung anschließend erneut ausführen.

Der gewünschte Ablauf ist:

```text
Änderung
↓
Verification
↓
Fehler
↓
Analyse
↓
Korrektur
↓
Recheck
↓
Erfolg
```

---

## Verwendete Tools

Für M2 verwenden wir zwei eigene Tools.

### 1. project-checks

Das Tool `project-checks` überprüft den allgemeinen Zustand des StudyTask-Projekts.

Intern werden folgende Befehle ausgeführt:

```bash
npm test
npm run build
```

Damit wird geprüft:

- ob alle automatischen Tests erfolgreich sind
- ob der Build-Check erfolgreich ist
- ob die Änderungen keine bestehenden Funktionen beschädigt haben

Die eigentliche Ausführung erfolgt über:

```text
tools/run_project_checks.js
```

Die OpenCode-Tool-Definition befindet sich unter:

```text
.opencode/tools/project-checks.js
```

---

### 2. deadline-check

Das Tool `deadline-check` überprüft speziell die Deadline-Validierung in StudyTask.

Dabei werden verschiedene gültige und ungültige Eingaben an die API gesendet.

Beispiele für ungültige Werte:

```text
abc
morgen
0
2026
2026-13-45
12/25/2026
```

Ein gültiges Beispiel ist:

```text
2026-12-25
```

Das Ziel ist, dass nur ein gültiges Datum im Format:

```text
YYYY-MM-DD
```

akzeptiert wird.

---

## Erster Verification-Lauf

Beim ersten Lauf des Deadline-Verification-Tools wurden mehrere Fehler gefunden.

Ergebnis:

```text
PASS: Invalid deadline rejected: "abc"
PASS: Invalid deadline rejected: "morgen"

FAIL: Invalid deadline accepted: "0"
Expected: HTTP 400
Received: HTTP 201

FAIL: Invalid deadline accepted: "2026"
Expected: HTTP 400
Received: HTTP 201

PASS: Invalid deadline rejected: "2026-13-45"

FAIL: Invalid deadline accepted: "12/25/2026"
Expected: HTTP 400
Received: HTTP 201

PASS: Valid deadline accepted: "2026-12-25"
```

Gesamtergebnis:

```text
DEADLINE CHECK: FAILED
```

Damit hatte der Coding Agent ein klares Verification Signal.

---

## Reaktion des Coding Agents

OpenCode analysierte die fehlgeschlagenen Prüfungen.

Die Ursache lag in der Deadline-Validierung von StudyTask.

Die Validierung war nicht strikt genug und akzeptierte einige Werte, die nicht dem gewünschten Format entsprachen.

OpenCode änderte daraufhin unter anderem:

```text
src/validation.js
```

Die Validierung wurde verschärft.

Dabei wird jetzt:

1. das Format `YYYY-MM-DD` geprüft
2. zusätzlich geprüft, ob das Datum tatsächlich ein gültiges Kalenderdatum ist

Beispiele:

```text
2026-12-25 → gültig
0 → ungültig
2026 → ungültig
12/25/2026 → ungültig
2026-13-45 → ungültig
```

---

## Zusätzliche Tests

OpenCode ergänzte anschließend weitere automatische Tests in:

```text
test/tasks.test.js
```

Die neuen Tests prüfen unter anderem:

- `"0"`
- `"2026"`
- `"12/25/2026"`
- ungültige Kalenderdaten
- ein korrektes Datum im Format `YYYY-MM-DD`

Damit wird verhindert, dass derselbe Fehler später erneut unbemerkt auftritt.

---

## Recheck

Nach der Korrektur wurde das Deadline-Verification-Tool erneut ausgeführt.

Ergebnis:

```text
Deadline-Verification-Tool: PASSED
```

Alle ungültigen Eingaben wurden mit HTTP 400 abgelehnt.

Das gültige Datum:

```text
2026-12-25
```

wurde weiterhin akzeptiert.

---

## Allgemeine Projektprüfung

Nach dem erfolgreichen Deadline-Check wurde zusätzlich `project-checks` ausgeführt.

Ergebnis:

```text
31/31 Tests PASSED
Build PASSED
```

Damit wurde überprüft, dass die Änderung nicht nur die Deadline-Validierung repariert hat, sondern auch keine bestehenden Funktionen im StudyTask-Projekt beschädigt wurden.

---

## Verification Loop

Die vollständige Verification Loop sah damit so aus:

```text
deadline-check
↓
FAILED
↓
OpenCode analysiert die Fehlermeldung
↓
src/validation.js wird geändert
↓
Tests werden ergänzt
↓
deadline-check wird erneut ausgeführt
↓
PASSED
↓
project-checks wird ausgeführt
↓
31/31 Tests PASSED
↓
Build PASSED
```

---

## Stop Criterion

Die Verification Loop wird beendet, wenn alle folgenden Bedingungen erfüllt sind:

```text
deadline-check = PASSED
project-checks = PASSED
Build = PASSED
```

Wenn eine Prüfung fehlschlägt, soll der Agent:

1. die Fehlermeldung analysieren
2. die Ursache identifizieren
3. eine gezielte Änderung durchführen
4. die Prüfung erneut ausführen

Um Endlosschleifen zu vermeiden, soll die Anzahl automatischer Reparaturversuche begrenzt werden.

Als maximale Anzahl verwenden wir:

```text
3 Reparaturversuche
```

Wenn danach weiterhin eine Prüfung fehlschlägt, wird der Prozess beendet und eine manuelle Überprüfung erforderlich.

---

## Permissions und Sandbox

Unser Harness und die Zielsoftware befinden sich in zwei getrennten Repositories.

```text
workspace/
├── secureai-web-harness/
└── studytask/
```

Wenn OpenCode aus dem Harness auf das externe StudyTask-Repository zugreifen möchte, wird eine Berechtigung angefordert.

Beispiel:

```text
Access external directory ../studytask
```

Für die Arbeit verwenden wir möglichst:

```text
Allow once
```

Dadurch wird der Zugriff nur für den aktuellen Vorgang erlaubt.

Damit soll verhindert werden, dass der Coding Agent unbegrenzt auf externe Verzeichnisse zugreifen kann.

---

## Ergebnis von M2

Mit Milestone 2 konnten wir zeigen, dass unser SecureAI Web Harness eine echte Verification Loop unterstützt.

Der Coding Agent kann:

- Änderungen im Zielprojekt durchführen
- eigene Verification-Tools verwenden
- Fehler automatisch erkennen
- Fehlermeldungen als Feedback verwenden
- Code gezielt korrigieren
- Prüfungen erneut ausführen
- erst bei erfolgreicher Verification stoppen

Der zentrale Ablauf ist:

```text
FAIL
→ Analyse
→ Änderung
→ Recheck
→ PASS
```

Damit wird die Arbeit des Coding Agents kontrollierter und überprüfbarer.