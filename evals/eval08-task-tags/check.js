const BASE_URL =
  process.env.STUDYTASK_URL ||
  "http://127.0.0.1:3000";

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

async function request(
  endpoint,
  options = {}
) {
  try {
    const response = await fetch(
      `${BASE_URL}${endpoint}`,
      {
        headers: {
          "Content-Type":
            "application/json",

          ...(options.headers || {}),
        },

        ...options,
      }
    );

    const text =
      await response.text();

    let body = null;

    if (text) {
      try {
        body =
          JSON.parse(text);
      } catch {
        body = text;
      }
    }

    return {
      status:
        response.status,

      body,
    };
  } catch (error) {
    return {
      status: 0,
      body: null,
      error:
        error.message,
    };
  }
}

// =====================================================
// CREATE TASK HELPER
// =====================================================

async function createTask(
  title,
  tags
) {
  const body = {
    title,
    deadline:
      "2026-12-20",
  };

  if (tags !== undefined) {
    body.tags = tags;
  }

  return request(
    "/tasks",
    {
      method: "POST",

      body:
        JSON.stringify(
          body
        ),
    }
  );
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  console.log(
    "EVAL-08: Task Tags Management"
  );

  console.log(
    "================================="
  );

  // ===================================================
  // 1. CREATE WITH MULTIPLE TAGS
  // ===================================================

  const taggedTask =
    await createTask(
      "Eval08 Tagged Task",
      [
        "uni",
        "prüfung",
      ]
    );

  if (
    taggedTask.status === 201 &&
    Array.isArray(
      taggedTask.body?.tags
    ) &&
    taggedTask.body.tags.includes(
      "uni"
    ) &&
    taggedTask.body.tags.includes(
      "prüfung"
    )
  ) {
    pass(
      "Task mit mehreren Tags wird korrekt erstellt"
    );
  } else {
    fail(
      "Task mit mehreren Tags erstellen",
      [
        `Received HTTP: ${taggedTask.status}`,
        `Received body: ${JSON.stringify(
          taggedTask.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ===================================================
  // 2. DEFAULT TAGS
  // ===================================================

  const defaultTagsTask =
    await createTask(
      "Eval08 Default Tags"
    );

  if (
    defaultTagsTask.status === 201 &&
    Array.isArray(
      defaultTagsTask.body?.tags
    ) &&
    defaultTagsTask.body.tags.length === 0
  ) {
    pass(
      "Default-Tags sind []"
    );
  } else {
    fail(
      "Default-Tags",
      [
        "Expected: []",
        `Received: ${JSON.stringify(
          defaultTagsTask.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ===================================================
  // 3. TAGS MUST BE ARRAY
  // ===================================================

  const stringInsteadOfArray =
    await createTask(
      "Eval08 Invalid String",
      "uni"
    );

  if (
    stringInsteadOfArray.status === 400
  ) {
    pass(
      "String statt Array wird abgelehnt"
    );
  } else {
    fail(
      "String statt Array wurde akzeptiert",
      [
        "Expected: HTTP 400",
        `Received: HTTP ${stringInsteadOfArray.status}`,
      ].join("\n")
    );
  }

  // ===================================================
  // 4. TAG ELEMENTS MUST BE STRINGS
  // ===================================================

  const nonStringTag =
    await createTask(
      "Eval08 Invalid Number",
      [
        "uni",
        123,
      ]
    );

  if (
    nonStringTag.status === 400
  ) {
    pass(
      "Nicht-String-Tag wird abgelehnt"
    );
  } else {
    fail(
      "Nicht-String-Tag wurde akzeptiert",
      [
        "Expected: HTTP 400",
        `Received: HTTP ${nonStringTag.status}`,
      ].join("\n")
    );
  }

  // ===================================================
  // 5. EMPTY TAG MUST BE REJECTED
  // ===================================================

  const emptyTag =
    await createTask(
      "Eval08 Empty Tag",
      [
        "uni",
        "",
      ]
    );

  if (
    emptyTag.status === 400
  ) {
    pass(
      "Leerer Tag wird abgelehnt"
    );
  } else {
    fail(
      "Leerer Tag wurde akzeptiert",
      [
        "Expected: HTTP 400",
        `Received: HTTP ${emptyTag.status}`,
      ].join("\n")
    );
  }

  // ===================================================
  // 6. NORMALIZATION + DUPLICATES
  // ===================================================

  const normalizedTask =
    await createTask(
      "Eval08 Normalized Tags",
      [
        " Uni ",
        "PRÜFUNG",
        "uni",
      ]
    );

  const expectedNormalized = [
    "uni",
    "prüfung",
  ];

  const receivedNormalized =
    normalizedTask.body?.tags;

  if (
    normalizedTask.status === 201 &&
    Array.isArray(
      receivedNormalized
    ) &&
    JSON.stringify(
      receivedNormalized
    ) ===
      JSON.stringify(
        expectedNormalized
      )
  ) {
    pass(
      "Tags werden normalisiert und Duplikate entfernt"
    );
  } else {
    fail(
      "Tag-Normalisierung",
      [
        `Expected: ${JSON.stringify(
          expectedNormalized
        )}`,
        `Received: ${JSON.stringify(
          normalizedTask.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ===================================================
  // 7. PATCH TAGS
  // ===================================================

  const patchTarget =
    await createTask(
      "Eval08 Patch Target",
      [
        "alt",
      ]
    );

  if (
    patchTarget.status === 201 &&
    patchTarget.body?.id
  ) {
    const patchResponse =
      await request(
        `/tasks/${patchTarget.body.id}`,
        {
          method: "PATCH",

          body:
            JSON.stringify({
              tags: [
                " Projekt ",
                "WICHTIG",
              ],
            }),
        }
      );

    if (
      patchResponse.status === 200 &&
      Array.isArray(
        patchResponse.body?.tags
      ) &&
      JSON.stringify(
        patchResponse.body.tags
      ) ===
        JSON.stringify([
          "projekt",
          "wichtig",
        ])
    ) {
      pass(
        "Tags können über PATCH geändert werden"
      );
    } else {
      fail(
        "PATCH Tags",
        [
          `Received HTTP: ${patchResponse.status}`,
          `Received body: ${JSON.stringify(
            patchResponse.body,
            null,
            2
          )}`,
        ].join("\n")
      );
    }
  } else {
    fail(
      "PATCH-Test konnte nicht vorbereitet werden",
      `Task konnte nicht erstellt werden: ${JSON.stringify(
        patchTarget,
        null,
        2
      )}`
    );
  }

  // ===================================================
  // 8. FILTER BY TAG
  // ===================================================

  await createTask(
    "Eval08 Search Uni",
    [
      "uni",
      "lernen",
    ]
  );

  await createTask(
    "Eval08 Search Arbeit",
    [
      "arbeit",
    ]
  );

  const tagFilter =
    await request(
      "/tasks/tag/uni"
    );

  if (
    tagFilter.status === 200 &&
    Array.isArray(
      tagFilter.body
    ) &&
    tagFilter.body.length >= 1 &&
    tagFilter.body.every(
      (task) =>
        Array.isArray(
          task.tags
        ) &&
        task.tags.includes(
          "uni"
        )
    )
  ) {
    pass(
      "Tag-Filter funktioniert korrekt"
    );
  } else {
    fail(
      "GET /tasks/tag/uni",
      [
        `Received HTTP: ${tagFilter.status}`,
        `Received: ${JSON.stringify(
          tagFilter.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ===================================================
  // 9. CASE INSENSITIVE TAG SEARCH
  // ===================================================

  const upperCaseFilter =
    await request(
      "/tasks/tag/UNI"
    );

  if (
    upperCaseFilter.status === 200 &&
    Array.isArray(
      upperCaseFilter.body
    ) &&
    upperCaseFilter.body.length >= 1
  ) {
    pass(
      "Tag-Suche ist case-insensitive"
    );
  } else {
    fail(
      "Case-insensitive Tag-Suche",
      `Received: ${JSON.stringify(
        upperCaseFilter,
        null,
        2
      )}`
    );
  }

  // ===================================================
  // 10. NO MATCH
  // ===================================================

  const noMatch =
    await request(
      "/tasks/tag/tag-existiert-nicht"
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
      "Kein-Treffer-Verhalten",
      [
        "Expected: HTTP 200 und []",
        `Received: ${JSON.stringify(
          noMatch,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ===================================================
  // 11. EXISTING GET /
  // ===================================================

  const rootResponse =
    await request(
      "/"
    );

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
        "Expected: HTTP 200",
        `Received HTTP: ${rootResponse.status}`,
        `Received body: ${JSON.stringify(
          rootResponse.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ===================================================
  // 12. EXISTING GET /tasks/count
  // ===================================================

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
        "Expected: HTTP 200 und numerisches count-Feld",
        `Received HTTP: ${countResponse.status}`,
        `Received body: ${JSON.stringify(
          countResponse.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ===================================================
  // FINAL RESULT
  // ===================================================

  console.log(
    "================================="
  );

  if (failures === 0) {
    console.log(
      "EVAL-08 PASSED"
    );

    process.exitCode = 0;
    return;
  }

  console.log(
    "EVAL-08 FAILED"
  );

  console.log(
    `Failures: ${failures}`
  );

  process.exitCode = 1;
}

// =====================================================
// START
// =====================================================

main().catch(
  (error) => {
    console.error(
      "EVAL-08 CHECK ERROR:"
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);