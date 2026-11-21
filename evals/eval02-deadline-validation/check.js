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

async function createTask(body) {
  return request("/tasks", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function sameDate(value, expectedDate) {
  if (typeof value !== "string") {
    return false;
  }

  return value.startsWith(expectedDate);
}

async function main() {
  console.log(
    "EVAL-02: Deadline Validation"
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
      "EVAL-02 FAILED"
    );

    console.log(
      `Failures: ${failures}`
    );

    process.exitCode = 1;
    return;
  }

  // 1. Missing deadline
  const missingDeadline =
    await createTask({
      title:
        "Task ohne Deadline",
    });

  if (
    missingDeadline.status === 400
  ) {
    pass(
      "Fehlende Deadline wird abgelehnt"
    );
  } else {
    fail(
      "Fehlende Deadline wurde akzeptiert",
      [
        "Expected HTTP 400",
        `Received HTTP: ${missingDeadline.status}`,
        `Body: ${JSON.stringify(
          missingDeadline.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // 2. Invalid format
  const invalidFormat =
    await createTask({
      title:
        "Ungültiges Format",
      deadline:
        "20.12.2026",
    });

  if (
    invalidFormat.status === 400
  ) {
    pass(
      "Ungültiges Deadline-Format wird abgelehnt"
    );
  } else {
    fail(
      "Ungültiges Deadline-Format wurde akzeptiert",
      [
        "Expected HTTP 400",
        `Received HTTP: ${invalidFormat.status}`,
        `Body: ${JSON.stringify(
          invalidFormat.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // 3. Impossible date
  const impossibleDate =
    await createTask({
      title:
        "Ungültiges Datum",
      deadline:
        "2026-02-30",
    });

  if (
    impossibleDate.status === 400
  ) {
    pass(
      "Unmögliches Datum wird abgelehnt"
    );
  } else {
    fail(
      "Unmögliches Datum wurde akzeptiert",
      [
        "Expected HTTP 400",
        `Received HTTP: ${impossibleDate.status}`,
        `Body: ${JSON.stringify(
          impossibleDate.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // 4. Valid deadline
  const validDeadline =
    await createTask({
      title:
        "Mathe lernen",
      deadline:
        "2026-12-20",
    });

  if (
    validDeadline.status === 201 &&
    sameDate(
      validDeadline.body?.deadline,
      "2026-12-20"
    )
  ) {
    pass(
      "Gültige Deadline wird akzeptiert"
    );
  } else {
    fail(
      "Gültige Deadline wurde nicht korrekt akzeptiert",
      [
        "Expected HTTP 201",
        "Expected deadline date: 2026-12-20",
        `Received HTTP: ${validDeadline.status}`,
        `Received deadline: ${validDeadline.body?.deadline}`,
        `Received body: ${JSON.stringify(
          validDeadline.body,
          null,
          2
        )}`,
      ].join("\n")
    );
  }

  // 5. Existing GET /
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

  // 6. Existing GET /tasks/count
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
      "EVAL-02 PASSED"
    );

    process.exitCode = 0;
    return;
  }

  console.log(
    "EVAL-02 FAILED"
  );

  console.log(
    `Failures: ${failures}`
  );

  process.exitCode = 1;
}

main().catch(
  (error) => {
    console.error(
      "EVAL-02 CHECK ERROR:"
    );

    console.error(error);

    process.exitCode = 1;
  }
);