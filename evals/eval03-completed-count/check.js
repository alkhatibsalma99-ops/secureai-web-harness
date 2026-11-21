const BASE_URL =
  process.env.STUDYTASK_URL ||
  "http://127.0.0.1:3000";

let failures = 0;

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
    };
  } catch (error) {
    return {
      status: 0,
      body: null,
      error: error.message,
    };
  }
}

async function createTask(
  title,
  completed = false
) {
  return request(
    "/tasks",
    {
      method: "POST",

      body: JSON.stringify({
        title,
        deadline: "2026-12-20",
        completed,
      }),
    }
  );
}

async function main() {
  console.log(
    "EVAL-03: Completed Task Count"
  );

  console.log(
    "================================="
  );

  // ---------------------------------------------------
  // 1. Endpoint exists
  // ---------------------------------------------------

  const initialCount =
    await request(
      "/tasks/completed/count"
    );

  if (
    initialCount.status === 200 &&
    typeof initialCount.body?.count ===
      "number"
  ) {
    pass(
      "GET /tasks/completed/count ist verfügbar"
    );
  } else {
    fail(
      "GET /tasks/completed/count funktioniert nicht",
      [
        "Expected HTTP 200 with numeric count",
        `Received HTTP: ${initialCount.status}`,
        `Received body: ${JSON.stringify(
          initialCount.body,
          null,
          2
        )}`,
        initialCount.error
          ? `Error: ${initialCount.error}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  // Remember starting count in case the store is not empty.
  const startCompletedCount =
    typeof initialCount.body?.count ===
    "number"
      ? initialCount.body.count
      : 0;

  // ---------------------------------------------------
  // 2. Create incomplete task
  // ---------------------------------------------------

  const incompleteTask =
    await createTask(
      "Eval03 Incomplete Task",
      false
    );

  if (
    incompleteTask.status === 201
  ) {
    pass(
      "Nicht erledigter Task wurde erstellt"
    );
  } else {
    fail(
      "Nicht erledigter Task konnte nicht erstellt werden",
      [
        "Expected HTTP 201",
        `Received HTTP: ${incompleteTask.status}`,
        `Received body: ${JSON.stringify(
          incompleteTask.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  const afterIncomplete =
    await request(
      "/tasks/completed/count"
    );

  if (
    afterIncomplete.status === 200 &&
    afterIncomplete.body?.count ===
      startCompletedCount
  ) {
    pass(
      "Nicht erledigte Tasks werden nicht gezählt"
    );
  } else {
    fail(
      "Nicht erledigter Task wurde fälschlich gezählt",
      [
        `Expected count: ${startCompletedCount}`,
        `Received: ${JSON.stringify(
          afterIncomplete.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 3. Create completed tasks
  // ---------------------------------------------------

  const completedTask1 =
    await createTask(
      "Eval03 Completed Task 1",
      true
    );

  const completedTask2 =
    await createTask(
      "Eval03 Completed Task 2",
      true
    );

  if (
    completedTask1.status === 201 &&
    completedTask2.status === 201
  ) {
    pass(
      "Erledigte Tasks wurden erstellt"
    );
  } else {
    fail(
      "Erledigte Tasks konnten nicht korrekt erstellt werden",
      [
        `Task 1 HTTP: ${completedTask1.status}`,
        `Task 2 HTTP: ${completedTask2.status}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 4. Count completed tasks
  // ---------------------------------------------------

  const completedCount =
    await request(
      "/tasks/completed/count"
    );

  const expectedCount =
    startCompletedCount + 2;

  if (
    completedCount.status === 200 &&
    completedCount.body?.count ===
      expectedCount
  ) {
    pass(
      "Nur erledigte Tasks werden korrekt gezählt"
    );
  } else {
    fail(
      "Completed Count ist falsch",
      [
        `Expected count: ${expectedCount}`,
        `Received HTTP: ${completedCount.status}`,
        `Received body: ${JSON.stringify(
          completedCount.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 5. Existing GET /
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
      `Received HTTP ${rootResponse.status}`
    );
  }

  // ---------------------------------------------------
  // 6. Existing GET /tasks/count
  // ---------------------------------------------------

  const totalCount =
    await request(
      "/tasks/count"
    );

  if (
    totalCount.status === 200 &&
    typeof totalCount.body?.count ===
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
        `Received HTTP: ${totalCount.status}`,
        `Received body: ${JSON.stringify(
          totalCount.body,
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
      "EVAL-03 PASSED"
    );

    process.exitCode = 0;
    return;
  }

  console.log(
    "EVAL-03 FAILED"
  );

  console.log(
    `Failures: ${failures}`
  );

  process.exitCode = 1;
}

main().catch((error) => {
  console.error(
    "EVAL-03 CHECK ERROR:"
  );

  console.error(error);

  process.exitCode = 1;
});