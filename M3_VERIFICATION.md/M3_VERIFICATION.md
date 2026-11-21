# M3 – Evaluation und Verification

## 1. Ziel

Ziel von M3 ist es, den entwickelten Coding-Agent-Harness systematisch zu evaluieren.

Dafür wurde ein automatisierter Eval-Runner entwickelt, der mehrere Software-Engineering-Aufgaben selbstständig ausführt, die Ergebnisse automatisch überprüft und dabei Messwerte wie Erfolgsrate, Tokenverbrauch, Kosten und Laufzeit erfasst.

Als Zielprojekt wird **StudyTask** verwendet.

Für alle Evaluationen wurde dasselbe Modell eingesetzt:

```text
opencode-go/glm-5.3-flash
```

Der vollständige Eval-Durchlauf umfasste acht Tasks und wurde ohne Dry-Run ausgeführt.

---

## 2. Eval-Struktur

Für jede Evaluation existieren drei zentrale Dateien:

```text
prompt.txt
expected.md
check.js
```

### prompt.txt

Enthält die Aufgabe, die dem Coding Agent übergeben wird.

### expected.md

Beschreibt das erwartete funktionale Verhalten.

### check.js

Enthält die automatischen Acceptance Checks.

Der Agent erhält nur die eigentliche Aufgabenbeschreibung. Die automatischen Checks liegen außerhalb seines Arbeitsverzeichnisses und können daher nicht gezielt vom Agenten eingesehen oder manipuliert werden.

---

## 3. Eval Tasks

Es wurden insgesamt acht Evaluation Tasks erstellt.

### EVAL-01 – Title Validation

Validierung des Task-Titels.

Geprüft werden unter anderem:

- leerer Titel
- Titel nur aus Leerzeichen
- maximale Titellänge
- gültiger Titel
- Erhalt bestehender Endpoints

### EVAL-02 – Deadline Validation

Validierung der Deadline.

Geprüft werden:

- fehlende Deadline
- ungültiges Format
- unmögliches Datum
- gültiges Datum
- bestehende Endpoints

### EVAL-03 – Completed Task Count

Implementierung eines Endpoints zum Zählen erledigter Tasks.

```text
GET /tasks/completed/count
```

Außerdem muss `POST /tasks` das optionale Feld `completed` korrekt unterstützen.

### EVAL-04 – Task Search

Implementierung einer Suche nach Task-Titeln.

```text
GET /tasks/search?q=<query>
```

Geprüft werden:

- Teilstrings
- Case-Insensitive Search
- mehrere Treffer
- kein Treffer
- fehlende Query

### EVAL-05 – Deadline Sorting

Sortierung der Tasks nach Deadline.

```text
GET /tasks/sorted/deadline
```

Unterstützt werden:

```text
order=asc
order=desc
```

### EVAL-06 – Status Filter

Filterung nach dem Feld `completed`.

```text
GET /tasks/filter/status?completed=true
GET /tasks/filter/status?completed=false
```

### EVAL-07 – Task Priority

Unterstützung von Prioritäten:

```text
low
medium
high
```

Zusätzlich werden PATCH und Priority-Filter überprüft.

### EVAL-08 – Task Tags

Unterstützung mehrerer Tags pro Task.

Geprüft werden unter anderem:

- mehrere Tags
- Default-Wert
- Validierung
- Normalisierung
- Duplikate
- PATCH
- Filterung
- Case-Insensitive Search

---

## 4. Automatisierter Eval Runner

Der Eval-Runner befindet sich unter:

```text
evals/eval-runner.js
```

Der Ablauf einer Evaluation ist:

```text
Eval auswählen
↓
temporären Git Worktree erzeugen
↓
Harness in den Worktree kopieren
↓
Dependencies installieren
↓
OpenCode headless starten
↓
Agent implementiert die Aufgabe
↓
StudyTask Server starten
↓
automatischen Check ausführen
↓
PASS / FAIL bestimmen
↓
Tokens, Kosten und Laufzeit speichern
↓
Worktree entfernen
```

Für jede Evaluation existiert ein definierter Git-Startzustand.

Beim vollständigen Durchlauf wurden alle acht Startzustände erfolgreich gefunden und validiert.

---

## 5. Messgrößen

Für jeden Eval Run werden folgende Werte erfasst:

- Success Rate
- Tokenverbrauch
- Kosten
- Laufzeit
- Anzahl der Agent-Schritte
- Exit Code

Dadurch wird nicht nur überprüft, ob der Agent die Aufgabe korrekt löst, sondern auch, wie effizient die Lösung erzeugt wurde.

---

## 6. Baseline Results

Nach der Validierung aller Eval Tasks wurde ein vollständiger Baseline-Durchlauf mit allen acht Aufgaben durchgeführt.

Alle acht Evaluationen wurden erfolgreich bestanden.

| Eval | Success Rate | Tokens | Cost | Runtime |
|---|---:|---:|---:|---:|
| EVAL-01 | 100 % | 241.867 | 0,012565 | 81,50 s |
| EVAL-02 | 100 % | 254.137 | 0,012655 | 106,20 s |
| EVAL-03 | 100 % | 300.760 | 0,014458 | 91,56 s |
| EVAL-04 | 100 % | 102.091 | 0,005089 | 73,77 s |
| EVAL-05 | 100 % | 494.308 | 0,020883 | 122,97 s |
| EVAL-06 | 100 % | 214.868 | 0,010295 | 104,23 s |
| EVAL-07 | 100 % | 171.742 | 0,010052 | 115,30 s |
| EVAL-08 | 100 % | 210.544 | 0,011493 | 129,47 s |

Die Baseline zeigt eine funktionale Erfolgsrate von:

```text
8 / 8 Tasks = 100 %
```

EVAL-05 zeigte dabei den höchsten Tokenverbrauch mit 494.308 Tokens.

---

## 7. Harness Improvement

Die Baseline-Auswertung zeigte bei einigen Aufgaben einen vergleichsweise hohen Ressourcenverbrauch, insbesondere bei EVAL-05.

Daher wurde der Harness um explizite Regeln zur effizienteren Bearbeitung erweitert.

Dazu wurde eine **Minimal Exploration Strategy** in die Agent-Regeln aufgenommen.

Der Agent wurde angewiesen:

1. zuerst die Anforderungen vollständig zu lesen,
2. die Repository-Struktur nur gezielt zu untersuchen,
3. nur die unmittelbar relevanten Dateien zu öffnen,
4. bestehende Implementierungen und Hilfsfunktionen wiederzuverwenden,
5. keine unnötigen Refactorings durchzuführen,
6. bereits verstandene Dateien nicht unnötig erneut zu lesen,
7. nur fokussierte Tests auszuführen,
8. nach erfolgreicher Verifikation die Bearbeitung zu beenden.

Die zentralen Regeln lauten:

```text
Inspect only files directly relevant to the task.
Prefer minimal changes.
Reuse existing helpers and project structures.
Avoid unrelated refactoring.
Avoid repeated exploration.
Run focused verification.
Stop once the requirements are satisfied.
```

Ziel dieser Änderung war es, unnötige Exploration durch den Agenten zu reduzieren und dadurch Tokenverbrauch, Kosten und Laufzeit zu senken.

---

## 8. Before / After Comparison

Zur Überprüfung der Harness-Verbesserung wurde **EVAL-05 – Deadline Sorting** erneut ausgeführt.

Der gleiche Eval Task, der gleiche Git-Startzustand und dasselbe Modell wurden verwendet.

### Before

```text
Success Rate: 100 %
Tokens:       494.308
Cost:         0,020883
Runtime:      122,97 s
```

### After

```text
Success Rate: 100 %
Tokens:       137.003
Cost:         0,007366
Runtime:      77,96 s
```

### Vergleich

| Metrik | Before | After | Veränderung |
|---|---:|---:|---:|
| Success Rate | 100 % | 100 % | unverändert |
| Tokens | 494.308 | 137.003 | −72,3 % |
| Cost | 0,020883 | 0,007366 | −64,7 % |
| Runtime | 122,97 s | 77,96 s | −36,6 % |

Die funktionale Qualität blieb vollständig erhalten.

Gleichzeitig reduzierte sich der Tokenverbrauch deutlich.

---

## 9. Interpretation

Die Evaluation zeigt, dass der Coding Agent alle acht definierten Software-Engineering-Aufgaben erfolgreich lösen konnte.

Die Baseline erreichte bereits eine funktionale Erfolgsrate von 100 %.

Die Ergebnisse zeigen jedoch auch, dass funktionale Korrektheit allein nicht ausreicht, um die Qualität eines Coding-Agent-Harness zu bewerten.

Insbesondere der Tokenverbrauch und die Laufzeit unterscheiden sich deutlich zwischen den einzelnen Tasks.

EVAL-05 benötigte in der Baseline beispielsweise deutlich mehr Tokens als EVAL-04.

Durch die Einführung einer expliziten Minimal Exploration Strategy konnte der Ressourcenverbrauch bei EVAL-05 deutlich reduziert werden, ohne die funktionale Erfolgsrate zu verschlechtern.

Der Tokenverbrauch sank von 494.308 auf 137.003 Tokens.

Dies entspricht einer Reduktion von etwa 72,3 %.

Auch die gemessenen Kosten und die Laufzeit konnten reduziert werden.

Die Ergebnisse deuten darauf hin, dass klare Agent-Regeln zur Begrenzung unnötiger Exploration einen messbaren Einfluss auf die Effizienz eines Coding Agents haben können.

Da LLM-Ausführungen nicht vollständig deterministisch sind und die Before-/After-Werte jeweils aus einzelnen Runs stammen, sollten die gemessenen Prozentwerte jedoch als beobachtetes Ergebnis dieses Experiments und nicht als allgemeingültige Garantie interpretiert werden.

---

## 10. Technische Erkenntnisse

Während der Entwicklung des Eval-Harness wurden mehrere Probleme erkannt und behoben.

### Provider-Konfiguration

Zu Beginn wurde ein kostenloses OpenCode-Modell verwendet.

Dieses erreichte sein Usage Limit.

Anschließend wurde der vom Team bereitgestellte **OpenCode Go** Zugang verwendet.

Das finale Modell lautet:

```text
opencode-go/glm-5.3-flash
```

### Isolierte Git Worktrees

Jede Evaluation wird in einem eigenen temporären Git Worktree ausgeführt.

Dadurch beeinflussen sich die verschiedenen Eval Runs nicht gegenseitig.

### Hidden Acceptance Checks

Die automatischen Acceptance Checks befinden sich außerhalb des Agent-Worktrees.

Der Agent erhält nur die Aufgabenbeschreibung und kann dadurch die Checks nicht direkt an seine Implementierung anpassen.

### Server-Diagnose

Der Runner wurde erweitert, sodass Server-Ausgaben und Fehler sichtbar werden:

```text
[SERVER]
[SERVER ERROR]
[SERVER EXIT]
```

Dies erleichtert die Unterscheidung zwischen:

- Agent-Fehlern,
- Server-Fehlern,
- Eval-Checker-Fehlern,
- Infrastrukturproblemen.

### Reproduzierbare Modellwahl

Alle finalen Evaluationen verwenden explizit dasselbe Modell:

```text
opencode-go/glm-5.3-flash
```

Dadurch wird verhindert, dass unterschiedliche Modelle die Messergebnisse unnötig verfälschen.

---

## 11. Ergebnis

Der entwickelte Eval-Harness erfüllt die zentralen Anforderungen von M3:

- acht automatisierte Eval Tasks,
- definierte Startzustände,
- Headless-Ausführung des Coding Agents,
- automatische Acceptance Checks,
- Success Rate,
- Tokenmessung,
- Kostenmessung,
- Laufzeitmessung,
- reproduzierbare Ausführung,
- isolierte Worktrees,
- dokumentierte Harness-Verbesserung,
- Before-/After-Vergleich,
- Interpretation der Ergebnisse.

Der vollständige Baseline-Durchlauf erreichte:

```text
8 / 8 Evals bestanden
Success Rate: 100 %
```

Nach der Harness-Optimierung konnte bei EVAL-05 die funktionale Erfolgsrate von 100 % beibehalten werden, während Tokenverbrauch, Kosten und Laufzeit im beobachteten After-Run deutlich reduziert wurden.

Damit zeigt die Evaluation sowohl die funktionale Zuverlässigkeit des Harness als auch den Einfluss gezielter Agent-Regeln auf die Effizienz der Bearbeitung.