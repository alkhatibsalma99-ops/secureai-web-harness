const BASE_URL = "http://localhost:3000";

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

async function createTask(
  title,
  completed
) {
  const body = {
    title,
    deadline: "2026-12-20",
  };

  if (completed !== undefined) {
    body.completed = completed;
  }

  return request(
    "/tasks",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

async function main() {
  console.log(
    "EVAL-06: Status Filter"
  );

  console.log(
    "================================="
  );

  console.log(
    `Target API: ${BASE_URL}`
  );

  // ---------------------------------------------------
  // 0. API reachable
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
        `HTTP: ${health.status}`,
        `Error: ${health.error || "unknown"}`,
      ].join("\n")
    );

    console.log(
      "================================="
    );

    console.log(
      "EVAL-06 FAILED"
    );

    console.log(
      `Failures: ${failures}`
    );

    process.exitCode = 1;
    return;
  }

  // ---------------------------------------------------
  // 1. Create completed task
  // ---------------------------------------------------

  const completedTask =
    await createTask(
      "Eval06 Completed",
      true
    );

  if (
    completedTask.status === 201 &&
    completedTask.body?.completed === true
  ) {
    pass(
      "Erledigter Task wird korrekt gespeichert"
    );
  } else {
    fail(
      "completed=true wurde nicht korrekt gespeichert",
      [
        "Expected HTTP 201 with completed=true",
        `Received HTTP: ${completedTask.status}`,
        `Body: ${JSON.stringify(
          completedTask.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 2. Create incomplete task
  // ---------------------------------------------------

  const incompleteTask =
    await createTask(
      "Eval06 Incomplete",
      false
    );

  if (
    incompleteTask.status === 201 &&
    incompleteTask.body?.completed === false
  ) {
    pass(
      "Nicht erledigter Task wird korrekt gespeichert"
    );
  } else {
    fail(
      "completed=false wurde nicht korrekt gespeichert",
      [
        "Expected HTTP 201 with completed=false",
        `Received HTTP: ${incompleteTask.status}`,
        `Body: ${JSON.stringify(
          incompleteTask.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 3. Default completed=false
  // ---------------------------------------------------

  const defaultTask =
    await createTask(
      "Eval06 Default"
    );

  if (
    defaultTask.status === 201 &&
    defaultTask.body?.completed === false
  ) {
    pass(
      "completed ist standardmäßig false"
    );
  } else {
    fail(
      "Default completed=false funktioniert nicht",
      [
        "Expected HTTP 201 with completed=false",
        `Received HTTP: ${defaultTask.status}`,
        `Body: ${JSON.stringify(
          defaultTask.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // Helper
  // ---------------------------------------------------

  function eval06Tasks(body) {
    if (!Array.isArray(body)) {
      return [];
    }

    return body.filter(
      (task) =>
        typeof task.title === "string" &&
        task.title.startsWith(
          "Eval06"
        )
    );
  }

  // ---------------------------------------------------
  // 4. Filter completed=true
  // ---------------------------------------------------

  const completedFilter =
    await request(
      "/tasks/filter/status?completed=true"
    );

  const completedResults =
    eval06Tasks(
      completedFilter.body
    );

  if (
    completedFilter.status === 200 &&
    completedResults.length >= 1 &&
    completedResults.every(
      (task) =>
        task.completed === true
    ) &&
    completedResults.some(
      (task) =>
        task.title ===
        "Eval06 Completed"
    )
  ) {
    pass(
      "completed=true liefert nur erledigte Tasks"
    );
  } else {
    fail(
      "Filter completed=true ist falsch",
      [
        `HTTP: ${completedFilter.status}`,
        `Body: ${JSON.stringify(
          completedFilter.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 5. Filter completed=false
  // ---------------------------------------------------

  const incompleteFilter =
    await request(
      "/tasks/filter/status?completed=false"
    );

  const incompleteResults =
    eval06Tasks(
      incompleteFilter.body
    );

  if (
    incompleteFilter.status === 200 &&
    incompleteResults.length >= 2 &&
    incompleteResults.every(
      (task) =>
        task.completed === false
    ) &&
    incompleteResults.some(
      (task) =>
        task.title ===
        "Eval06 Incomplete"
    ) &&
    incompleteResults.some(
      (task) =>
        task.title ===
        "Eval06 Default"
    )
  ) {
    pass(
      "completed=false liefert nur nicht erledigte Tasks"
    );
  } else {
    fail(
      "Filter completed=false ist falsch",
      [
        `HTTP: ${incompleteFilter.status}`,
        `Body: ${JSON.stringify(
          incompleteFilter.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 6. Missing completed parameter
  // ---------------------------------------------------

  const missingParameter =
    await request(
      "/tasks/filter/status"
    );

  if (
    missingParameter.status === 400
  ) {
    pass(
      "Fehlender completed-Parameter wird abgelehnt"
    );
  } else {
    fail(
      "Fehlender completed-Parameter wurde akzeptiert",
      `Expected HTTP 400, received HTTP ${missingParameter.status}`
    );
  }

  // ---------------------------------------------------
  // 7. Invalid completed value
  // ---------------------------------------------------

  const invalidValue =
    await request(
      "/tasks/filter/status?completed=yes"
    );

  if (
    invalidValue.status === 400
  ) {
    pass(
      "Ungültiger completed-Wert wird abgelehnt"
    );
  } else {
    fail(
      "Ungültiger completed-Wert wurde akzeptiert",
      [
        "Expected HTTP 400",
        `Received HTTP: ${invalidValue.status}`,
        `Body: ${JSON.stringify(
          invalidValue.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 8. Existing GET /
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
  // 9. Existing GET /tasks/count
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
        `HTTP: ${countResponse.status}`,
        `Body: ${JSON.stringify(
          countResponse.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  console.log(
    "================================="
  );

  if (failures === 0) {
    console.log(
      "EVAL-06 PASSED"
    );

    process.exitCode = 0;
    return;
  }

  console.log(
    "EVAL-06 FAILED"
  );

  console.log(
    `Failures: ${failures}`
  );

  process.exitCode = 1;
}

main().catch(
  (error) => {
    console.error(
      "EVAL-06 CHECK ERROR:"
    );

    console.error(error);

    process.exitCode = 1;
  }
);