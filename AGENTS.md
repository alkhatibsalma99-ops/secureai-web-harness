# Anweisungen für den Coding Agent

Du arbeitest am Projekt StudyTask.

## Ziel

Entwickle und pflege eine kleine datenbankgestützte Webanwendung für Studierende.

## Regeln

- Halte dich an die Projektspezifikation.
- Führe nur kleine und nachvollziehbare Änderungen durch.
- Ändere keine Dateien, die für die aktuelle Aufgabe nicht relevant sind.
- Führe nach Änderungen die verfügbaren Prüfungen aus.
- Wenn eine Prüfung fehlschlägt, analysiere den Fehler und behebe die Ursache.
- Greife nicht auf geheime Daten oder Zugangsdaten zu.
- Gib keine Umgebungsvariablen oder Zugangsdaten aus.
- Frage vor potenziell destruktiven Aktionen nach einer Bestätigung.

## Zielsoftware

StudyTask ist eine Anwendung für Studierende zur Verwaltung von Aufgaben und Deadlines.
## Efficient Task Execution

When implementing a requested change:

1. Inspect only the files directly relevant to the task before exploring additional files.
2. Prefer minimal changes that preserve the existing architecture and behavior.
3. Do not rewrite unrelated code.
4. Reuse existing helpers, validation logic, routes, and data structures whenever possible.
5. Before editing, identify the smallest set of files that must change.
6. After implementation, run only the focused checks needed to verify the requested behavior.
7. If the requested behavior is already satisfied, do not make unnecessary changes.
8. Stop once the requirements are implemented and verified.
9. Avoid repeatedly reading the same files unless new information requires it.
10. Preserve all existing endpoints and behavior unless the task explicitly requires changing them.
## Minimal Exploration Strategy

For each task:

1. Read the task requirements first.
2. Inspect the repository structure once.
3. Identify the smallest number of files required for the change.
4. Do not scan unrelated directories or files.
5. Do not repeatedly inspect files that were already understood.
6. Prefer modifying existing implementation files over creating new abstractions.
7. Do not refactor unrelated code.
8. Use the existing project patterns and helpers.
9. Run one focused verification after the implementation.
10. If the focused verification passes, stop immediately.
11. Do not perform additional exploratory analysis after the requirements are satisfied.
12. Avoid repeated test runs unless the first verification fails.