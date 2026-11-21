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
  priority
) {
  const body = {
    title,
    deadline: "2026-12-20",
  };

  if (priority !== undefined) {
    body.priority = priority;
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
    "EVAL-07: Task Priority"
  );

  console.log(
    "================================="
  );

  console.log(
    `Target API: ${BASE_URL}`
  );

  // 0. API reachable
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
      "EVAL-07 FAILED"
    );

    console.log(
      `Failures: ${failures}`
    );

    process.exitCode = 1;
    return;
  }

  // 1. Create high priority task
  const highTask =
    await createTask(
      "Eval07 High",
      "high"
    );

  if (
    highTask.status === 201 &&
    highTask.body?.priority === "high"
  ) {
    pass(
      "Priority high wird korrekt gespeichert"
    );
  } else {
    fail(
      "Priority high wurde nicht korrekt gespeichert",
      [
        `HTTP: ${highTask.status}`,
        `Body: ${JSON.stringify(
          highTask.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // 2. Default medium
  const defaultTask =
    await createTask(
      "Eval07 Default"
    );

  if (
    defaultTask.status === 201 &&
    defaultTask.body?.priority === "medium"
  ) {
    pass(
      "Default-Priority ist medium"
    );
  } else {
    fail(
      "Default-Priority ist nicht medium",
      [
        `HTTP: ${defaultTask.status}`,
        `Body: ${JSON.stringify(
          defaultTask.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // 3. Normalize uppercase
  const normalizedTask =
    await createTask(
      "Eval07 Uppercase",
      "HIGH"
    );

  if (
    normalizedTask.status === 201 &&
    normalizedTask.body?.priority === "high"
  ) {
    pass(
      "Priority wird normalisiert"
    );
  } else {
    fail(
      "Priority-Normalisierung funktioniert nicht",
      [
        `HTTP: ${normalizedTask.status}`,
        `Body: ${JSON.stringify(
          normalizedTask.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // 4. Reject invalid priority
  const invalidTask =
    await createTask(
      "Eval07 Invalid",
      "urgent"
    );

  if (
    invalidTask.status === 400
  ) {
    pass(
      "Ungültige Priority wird abgelehnt"
    );
  } else {
    fail(
      "Ungültige Priority wurde akzeptiert",
      `Expected HTTP 400, received HTTP ${invalidTask.status}`
    );
  }

  // 5. PATCH priority
  const patchTarget =
    await createTask(
      "Eval07 Patch",
      "low"
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

          body: JSON.stringify({
            priority: "high",
          }),
        }
      );

    if (
      patchResponse.status === 200 &&
      patchResponse.body?.priority === "high"
    ) {
      pass(
        "Priority kann über PATCH geändert werden"
      );
    } else {
      fail(
        "PATCH Priority funktioniert nicht",
        [
          `HTTP: ${patchResponse.status}`,
          `Body: ${JSON.stringify(
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
      JSON.stringify(
        patchTarget,
        null,
        2
      )
    );
  }

  // 6. PATCH invalid priority
  if (
    patchTarget.status === 201 &&
    patchTarget.body?.id
  ) {
    const invalidPatch =
      await request(
        `/tasks/${patchTarget.body.id}`,
        {
          method: "PATCH",

          body: JSON.stringify({
            priority: "urgent",
          }),
        }
      );

    if (
      invalidPatch.status === 400
    ) {
      pass(
        "Ungültige PATCH-Priority wird abgelehnt"
      );
    } else {
      fail(
        "Ungültige PATCH-Priority wurde akzeptiert",
        `Expected HTTP 400, received HTTP ${invalidPatch.status}`
      );
    }
  }

  // 7. Priority filter
  const highFilter =
    await request(
      "/tasks/priority/high"
    );

  const highResults =
    Array.isArray(
      highFilter.body
    )
      ? highFilter.body
      : [];

  if (
    highFilter.status === 200 &&
    highResults.length >= 1 &&
    highResults.every(
      (task) =>
        task.priority === "high"
    )
  ) {
    pass(
      "Priority-Filter funktioniert korrekt"
    );
  } else {
    fail(
      "Priority-Filter funktioniert nicht korrekt",
      [
        `HTTP: ${highFilter.status}`,
        `Body: ${JSON.stringify(
          highFilter.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // 8. Case-insensitive filter
  const uppercaseFilter =
    await request(
      "/tasks/priority/HIGH"
    );

  if (
    uppercaseFilter.status === 200 &&
    Array.isArray(
      uppercaseFilter.body
    ) &&
    uppercaseFilter.body.length >= 1 &&
    uppercaseFilter.body.every(
      (task) =>
        task.priority === "high"
    )
  ) {
    pass(
      "Priority-Filter ist case-insensitive"
    );
  } else {
    fail(
      "Case-insensitive Priority-Filter funktioniert nicht",
      [
        `HTTP: ${uppercaseFilter.status}`,
        `Body: ${JSON.stringify(
          uppercaseFilter.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // 9. No result
  const lowFilter =
    await request(
      "/tasks/priority/low"
    );

  const evalLowTasks =
    Array.isArray(
      lowFilter.body
    )
      ? lowFilter.body.filter(
          (task) =>
            typeof task.title === "string" &&
            task.title.startsWith(
              "Eval07"
            )
        )
      : [];

  if (
    lowFilter.status === 200 &&
    Array.isArray(
      lowFilter.body
    ) &&
    evalLowTasks.length === 0
  ) {
    pass(
      "Kein Treffer ergibt eine leere Liste"
    );
  } else {
    fail(
      "Kein-Treffer-Verhalten ist falsch",
      [
        "Expected no Eval07 task with low priority",
        `HTTP: ${lowFilter.status}`,
        `Body: ${JSON.stringify(
          lowFilter.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // 10. Invalid filter
  const invalidFilter =
    await request(
      "/tasks/priority/urgent"
    );

  if (
    invalidFilter.status === 400
  ) {
    pass(
      "Ungültiger Priority-Filter wird abgelehnt"
    );
  } else {
    fail(
      "Ungültiger Priority-Filter wurde akzeptiert",
      `Expected HTTP 400, received HTTP ${invalidFilter.status}`
    );
  }

  // 11. Existing GET /
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

  // 12. Existing GET /tasks/count
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
      "EVAL-07 PASSED"
    );

    process.exitCode = 0;
    return;
  }

  console.log(
    "EVAL-07 FAILED"
  );

  console.log(
    `Failures: ${failures}`
  );

  process.exitCode = 1;
}

main().catch(
  (error) => {
    console.error(
      "EVAL-07 CHECK ERROR:"
    );

    console.error(error);

    process.exitCode = 1;
  }
);