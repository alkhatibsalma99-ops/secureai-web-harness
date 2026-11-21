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

async function createTask(title, deadline) {
  return request("/tasks", {
    method: "POST",
    body: JSON.stringify({
      title,
      deadline,
    }),
  });
}

async function main() {
  console.log(
    "EVAL-05: Deadline Sorting"
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
      "EVAL-05 FAILED"
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

  const taskA =
    await createTask(
      "Eval05 Task A",
      "2026-01-10"
    );

  const taskB =
    await createTask(
      "Eval05 Task B",
      "2026-06-15"
    );

  const taskC =
    await createTask(
      "Eval05 Task C",
      "2026-12-30"
    );

  if (
    taskA.status === 201 &&
    taskB.status === 201 &&
    taskC.status === 201
  ) {
    pass(
      "Test-Tasks wurden erstellt"
    );
  } else {
    fail(
      "Test-Tasks konnten nicht erstellt werden",
      [
        `Task A: HTTP ${taskA.status} - ${taskA.error || ""}`,
        `Task B: HTTP ${taskB.status} - ${taskB.error || ""}`,
        `Task C: HTTP ${taskC.status} - ${taskC.error || ""}`,
      ].join("\n")
    );
  }

  function getEvalTasks(body) {
    if (!Array.isArray(body)) {
      return [];
    }

    return body.filter(
      (task) =>
        typeof task.title === "string" &&
        task.title.startsWith(
          "Eval05 Task"
        )
    );
  }

  // ---------------------------------------------------
  // 2. Default ascending
  // ---------------------------------------------------

  const defaultSort =
    await request(
      "/tasks/sorted/deadline"
    );

  const defaultTitles =
    getEvalTasks(
      defaultSort.body
    ).map(
      (task) => task.title
    );

  const expectedAscending = [
    "Eval05 Task A",
    "Eval05 Task B",
    "Eval05 Task C",
  ];

  if (
    defaultSort.status === 200 &&
    JSON.stringify(defaultTitles) ===
      JSON.stringify(
        expectedAscending
      )
  ) {
    pass(
      "Standard-Sortierung ist aufsteigend"
    );
  } else {
    fail(
      "Standard-Sortierung ist nicht korrekt",
      [
        `Expected: ${JSON.stringify(
          expectedAscending
        )}`,
        `Received: ${JSON.stringify(
          defaultTitles
        )}`,
        `HTTP: ${defaultSort.status}`,
        `Error: ${defaultSort.error || ""}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 3. Explicit ASC
  // ---------------------------------------------------

  const ascSort =
    await request(
      "/tasks/sorted/deadline?order=asc"
    );

  const ascTitles =
    getEvalTasks(
      ascSort.body
    ).map(
      (task) => task.title
    );

  if (
    ascSort.status === 200 &&
    JSON.stringify(ascTitles) ===
      JSON.stringify(
        expectedAscending
      )
  ) {
    pass(
      "order=asc funktioniert korrekt"
    );
  } else {
    fail(
      "order=asc funktioniert nicht korrekt",
      [
        `Expected: ${JSON.stringify(
          expectedAscending
        )}`,
        `Received: ${JSON.stringify(
          ascTitles
        )}`,
        `HTTP: ${ascSort.status}`,
        `Error: ${ascSort.error || ""}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 4. DESC
  // ---------------------------------------------------

  const descSort =
    await request(
      "/tasks/sorted/deadline?order=desc"
    );

  const descTitles =
    getEvalTasks(
      descSort.body
    ).map(
      (task) => task.title
    );

  const expectedDescending = [
    "Eval05 Task C",
    "Eval05 Task B",
    "Eval05 Task A",
  ];

  if (
    descSort.status === 200 &&
    JSON.stringify(descTitles) ===
      JSON.stringify(
        expectedDescending
      )
  ) {
    pass(
      "order=desc funktioniert korrekt"
    );
  } else {
    fail(
      "order=desc funktioniert nicht korrekt",
      [
        `Expected: ${JSON.stringify(
          expectedDescending
        )}`,
        `Received: ${JSON.stringify(
          descTitles
        )}`,
        `HTTP: ${descSort.status}`,
        `Error: ${descSort.error || ""}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 5. Invalid order
  // ---------------------------------------------------

  const invalidOrder =
    await request(
      "/tasks/sorted/deadline?order=random"
    );

  if (
    invalidOrder.status === 400
  ) {
    pass(
      "Ungültiger order-Wert wird abgelehnt"
    );
  } else {
    fail(
      "Ungültiger order-Wert wurde akzeptiert",
      [
        "Expected HTTP 400",
        `Received HTTP: ${invalidOrder.status}`,
        `Error: ${invalidOrder.error || ""}`,
        `Body: ${JSON.stringify(
          invalidOrder.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // ---------------------------------------------------
  // 6. Existing GET /
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
  // 7. Existing GET /tasks/count
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
        `Body: ${JSON.stringify(
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
      "EVAL-05 PASSED"
    );

    process.exitCode = 0;
    return;
  }

  console.log(
    "EVAL-05 FAILED"
  );

  console.log(
    `Failures: ${failures}`
  );

  process.exitCode = 1;
}

main().catch(
  (error) => {
    console.error(
      "EVAL-05 CHECK ERROR:"
    );

    console.error(error);

    process.exitCode = 1;
  }
);