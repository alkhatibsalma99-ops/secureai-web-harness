const BASE_URL = "http://localhost:3000";

let failures = 0;

// =====================================================
// OUTPUT HELPERS
// =====================================================

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message, details = "") {
  failures++;

  console.log(`FAIL: ${message}`);

  if (details) {
    console.log(details);
  }
}

// =====================================================
// HTTP HELPER
// =====================================================

async function request(endpoint, options = {}) {
  try {
    const response = await fetch(
      `${BASE_URL}${endpoint}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },

        ...options,
      }
    );

    const text = await response.text();

    let body = null;

    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    return {
      status: response.status,
      body,
      error: null,
    };
  } catch (error) {
    return {
      status: 0,
      body: null,
      error:
        error?.cause?.message ||
        error?.message ||
        String(error),
    };
  }
}

// =====================================================
// CREATE TASK
// =====================================================

async function createTask(title) {
  return request(
    "/tasks",
    {
      method: "POST",

      body: JSON.stringify({
        title,
        deadline: "2026-12-20",
      }),
    }
  );
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  console.log(
    "EVAL-04: Task Search"
  );

  console.log(
    "================================="
  );

  console.log(
    `Target API: ${BASE_URL}`
  );

  // ---------------------------------------------------
  // 0. Verify server connection first
  // ---------------------------------------------------

  const health =
    await request("/");

  if (health.status === 200) {
    pass(
      "StudyTask API ist erreichbar"
    );
  } else {
    fail(
      "StudyTask API ist nicht erreichbar",
      [
        `URL: ${BASE_URL}`,
        `HTTP: ${health.status}`,
        `Error: ${health.error || "unknown"}`,
        `Body: ${JSON.stringify(
          health.body,
          null,
          2
        )}`,
      ].join("\n")
    );

    console.log(
      "================================="
    );

    console.log(
      "EVAL-04 FAILED"
    );

    console.log(
      `Failures: ${failures}`
    );

    process.exitCode = 1;
    return;
  }

  // ---------------------------------------------------
  // 1. Prepare test data
  // ---------------------------------------------------

  const task1 =
    await createTask(
      "Mathe lernen"
    );

  const task2 =
    await createTask(
      "Englisch lernen"
    );

  const task3 =
    await createTask(
      "Einkaufen"
    );

  if (
    task1.status === 201 &&
    task2.status === 201 &&
    task3.status === 201
  ) {
    pass(
      "Test-Tasks wurden erstellt"
    );
  } else {
    fail(
      "Test-Tasks konnten nicht vollständig erstellt werden",
      [
        `Task 1: HTTP ${task1.status} - ${task1.error || ""}`,
        `Task 2: HTTP ${task2.status} - ${task2.error || ""}`,
        `Task 3: HTTP ${task3.status} - ${task3.error || ""}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 2. Partial search
  // ---------------------------------------------------

  const partialSearch =
    await request(
      "/tasks/search?q=lernen"
    );

  const partialTitles =
    Array.isArray(
      partialSearch.body
    )
      ? partialSearch.body.map(
          (task) => task.title
        )
      : [];

  if (
    partialSearch.status === 200 &&
    partialTitles.includes(
      "Mathe lernen"
    ) &&
    partialTitles.includes(
      "Englisch lernen"
    )
  ) {
    pass(
      "Teilstring-Suche findet mehrere passende Tasks"
    );
  } else {
    fail(
      "Teilstring-Suche funktioniert nicht korrekt",
      [
        "Expected matches: Mathe lernen, Englisch lernen",
        `Received HTTP: ${partialSearch.status}`,
        `Error: ${partialSearch.error || ""}`,
        `Received body: ${JSON.stringify(
          partialSearch.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 3. Case-insensitive search
  // ---------------------------------------------------

  const caseInsensitive =
    await request(
      "/tasks/search?q=MATHE"
    );

  const caseTitles =
    Array.isArray(
      caseInsensitive.body
    )
      ? caseInsensitive.body.map(
          (task) => task.title
        )
      : [];

  if (
    caseInsensitive.status === 200 &&
    caseTitles.includes(
      "Mathe lernen"
    )
  ) {
    pass(
      "Suche ist case-insensitive"
    );
  } else {
    fail(
      "Case-insensitive Suche funktioniert nicht",
      [
        "Expected match: Mathe lernen",
        `Received HTTP: ${caseInsensitive.status}`,
        `Error: ${caseInsensitive.error || ""}`,
        `Received body: ${JSON.stringify(
          caseInsensitive.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 4. No match
  // ---------------------------------------------------

  const noMatch =
    await request(
      "/tasks/search?q=xyz-kein-treffer"
    );

  if (
    noMatch.status === 200 &&
    Array.isArray(
      noMatch.body
    ) &&
    noMatch.body.length === 0
  ) {
    pass(
      "Kein Treffer ergibt eine leere Liste"
    );
  } else {
    fail(
      "Kein-Treffer-Verhalten ist falsch",
      [
        "Expected HTTP 200 and []",
        `Received HTTP: ${noMatch.status}`,
        `Error: ${noMatch.error || ""}`,
        `Received body: ${JSON.stringify(
          noMatch.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 5. Missing query
  // ---------------------------------------------------

  const missingQuery =
    await request(
      "/tasks/search"
    );

  if (
    missingQuery.status === 400
  ) {
    pass(
      "Fehlendes q wird abgelehnt"
    );
  } else {
    fail(
      "Fehlendes q wurde nicht korrekt abgelehnt",
      [
        "Expected HTTP 400",
        `Received HTTP: ${missingQuery.status}`,
        `Error: ${missingQuery.error || ""}`,
        `Body: ${JSON.stringify(
          missingQuery.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 6. Empty query
  // ---------------------------------------------------

  const emptyQuery =
    await request(
      "/tasks/search?q="
    );

  if (
    emptyQuery.status === 400
  ) {
    pass(
      "Leeres q wird abgelehnt"
    );
  } else {
    fail(
      "Leeres q wurde nicht korrekt abgelehnt",
      [
        "Expected HTTP 400",
        `Received HTTP: ${emptyQuery.status}`,
        `Error: ${emptyQuery.error || ""}`,
        `Body: ${JSON.stringify(
          emptyQuery.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 7. Existing GET /
  // ---------------------------------------------------

  const rootResponse =
    await request("/");

  if (
    rootResponse.status === 200
  ) {
    pass(
      "Bestehender GET / funktioniert weiterhin"
    );
  } else {
    fail(
      "Bestehender GET / wurde beschädigt",
      [
        "Expected HTTP 200",
        `Received HTTP: ${rootResponse.status}`,
        `Error: ${rootResponse.error || ""}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 8. Existing GET /tasks/count
  // ---------------------------------------------------

  const countResponse =
    await request(
      "/tasks/count"
    );

  if (
    countResponse.status === 200 &&
    typeof countResponse.body?.count ===
      "number"
  ) {
    pass(
      "Bestehender GET /tasks/count funktioniert weiterhin"
    );
  } else {
    fail(
      "Bestehender GET /tasks/count wurde beschädigt",
      [
        "Expected HTTP 200 with numeric count",
        `Received HTTP: ${countResponse.status}`,
        `Error: ${countResponse.error || ""}`,
        `Received body: ${JSON.stringify(
          countResponse.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // FINAL RESULT
  // ---------------------------------------------------

  console.log(
    "================================="
  );

  if (failures === 0) {
    console.log(
      "EVAL-04 PASSED"
    );

    process.exitCode = 0;
    return;
  }

  console.log(
    "EVAL-04 FAILED"
  );

  console.log(
    `Failures: ${failures}`
  );

  process.exitCode = 1;
}

main().catch(
  (error) => {
    console.error(
      "EVAL-04 CHECK ERROR:"
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);