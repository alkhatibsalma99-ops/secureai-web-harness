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

async function createTask(title) {
  return request("/tasks", {
    method: "POST",

    body: JSON.stringify({
      title,
      deadline: "2026-12-20",
    }),
  });
}

async function main() {
  console.log(
    "EVAL-01: Title Validation"
  );

  console.log(
    "================================="
  );

  // 1. Empty title
  const emptyTitle =
    await createTask("");

  if (emptyTitle.status === 400) {
    pass(
      "Leerer Titel wird abgelehnt"
    );
  } else {
    fail(
      "Leerer Titel wurde nicht korrekt abgelehnt",
      [
        "Expected HTTP 400",
        `Received HTTP: ${emptyTitle.status}`,
        emptyTitle.error
          ? `Error: ${emptyTitle.error}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  // 2. Whitespace-only title
  const whitespaceTitle =
    await createTask("   ");

  if (whitespaceTitle.status === 400) {
    pass(
      "Titel nur aus Leerzeichen wird abgelehnt"
    );
  } else {
    fail(
      "Whitespace-Titel wurde nicht korrekt abgelehnt",
      [
        "Expected HTTP 400",
        `Received HTTP: ${whitespaceTitle.status}`,
        whitespaceTitle.error
          ? `Error: ${whitespaceTitle.error}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  // 3. Title longer than 100 characters
  const longTitle =
    "A".repeat(101);

  const longTitleResponse =
    await createTask(longTitle);

  if (longTitleResponse.status === 400) {
    pass(
      "Titel mit mehr als 100 Zeichen wird abgelehnt"
    );
  } else {
    fail(
      "Zu langer Titel wurde akzeptiert",
      [
        "Expected HTTP 400",
        `Received HTTP: ${longTitleResponse.status}`,
        longTitleResponse.error
          ? `Error: ${longTitleResponse.error}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  // 4. Valid title
  const validTitle =
    await createTask(
      "Mathe lernen"
    );

  if (
    validTitle.status === 201 &&
    validTitle.body?.title ===
      "Mathe lernen"
  ) {
    pass(
      "Gültiger Titel wird akzeptiert"
    );
  } else {
    fail(
      "Gültiger Titel wurde nicht korrekt akzeptiert",
      [
        "Expected HTTP 201",
        `Received HTTP: ${validTitle.status}`,
        `Received body: ${JSON.stringify(
          validTitle.body,
          null,
          2
        )}`,
        validTitle.error
          ? `Error: ${validTitle.error}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  // 5. Existing GET /
  const rootResponse =
    await request("/");

  if (rootResponse.status === 200) {
    pass(
      "Bestehender GET / funktioniert weiterhin"
    );
  } else {
    fail(
      "Bestehender GET / wurde beschädigt",
      [
        "Expected HTTP 200",
        `Received HTTP: ${rootResponse.status}`,
        rootResponse.error
          ? `Error: ${rootResponse.error}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
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
        "Expected HTTP 200",
        `Received HTTP: ${countResponse.status}`,
        `Received body: ${JSON.stringify(
          countResponse.body,
          null,
          2
        )}`,
        countResponse.error
          ? `Error: ${countResponse.error}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  console.log(
    "================================="
  );

  if (failures === 0) {
    console.log(
      "EVAL-01 PASSED"
    );

    process.exitCode = 0;
    return;
  }

  console.log(
    "EVAL-01 FAILED"
  );

  console.log(
    `Failures: ${failures}`
  );

  process.exitCode = 1;
}

main().catch((error) => {
  console.error(
    "EVAL-01 CHECK ERROR:"
  );

  console.error(error);

  process.exitCode = 1;
});