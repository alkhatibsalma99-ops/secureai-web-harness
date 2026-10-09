# Model Selection

Für unser SecureAI Web Harness vergleichen wir drei mögliche Modelle bzw. Anbieter anhand der Kriterien Qualität, Kosten, Latenz, Lizenz und Datenschutz.

| Kriterium | GPT-5.6 Sol | Claude Sonnet 5.5 | Qwen3 lokal |
|---|---|---|---|
| Qualität | Sehr hoch, stark bei Coding und komplexen Softwareaufgaben | Sehr hoch, besonders stark bei Coding und Agenten | Gut bis sehr gut, abhängig von Modellgröße und Hardware |
| Kosten | API-Kosten abhängig von Token-Nutzung | API-Kosten abhängig von Token-Nutzung | Keine direkten API-Kosten bei lokaler Ausführung |
| Latenz | Niedrig bis mittel, abhängig von Netzwerk und Auslastung | Niedrig bis mittel, abhängig von Netzwerk und Auslastung | Stark abhängig von lokaler Hardware |
| Lizenz / Nutzung | Proprietäres Modell | Proprietäres Modell | Open-Weights, je nach Modell unter offener Lizenz |
| Datenschutz | Verarbeitung über Cloud/API | Verarbeitung über Cloud/API | Sehr gut bei lokaler Ausführung, da Projektdaten lokal bleiben können |
| Eignung für unser Projekt | Sehr gut | Sehr gut | Sehr gut für lokale und datenschutzfreundliche Tests |

## Begründete Auswahl

Für die Entwicklung und erste Evaluation unseres Harness bevorzugen wir zunächst ein lokal ausgeführtes Qwen-Modell, sofern dieses in der Hochschulumgebung verfügbar ist.

Der wichtigste Grund dafür ist der Datenschutz, da Quellcode und Projektdaten lokal verarbeitet werden können und das System keine externen API-Dienste benötigt.

Zusätzlich entstehen bei der lokalen Ausführung keine direkten API-Kosten.

GPT-5.6 Sol und Claude Sonnet 5.5 bleiben interessante Alternativen für Vergleichstests, da beide eine sehr hohe Qualität bei Coding- und Agentenaufgaben bieten.

Die endgültige Auswahl des Modells ist für unser Projekt weniger wichtig als die Zuverlässigkeit des Harness, da der Harness unabhängig vom verwendeten Modell funktionieren soll.