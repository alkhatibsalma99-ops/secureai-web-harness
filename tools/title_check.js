const BASE_URL = process.env.STUDYTASK_URL || "http://localhost:3000";

async function createTask(title) {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      deadline: "2026-12-25",
    }),
  });

  return response.status;
}

async function run() {
  console.log("StudyTask Title Verification");
  console.log("=================================");

  const tests = [
    {
      title: "",
      expectedStatus: 400,
      description: 'Empty title: ""',
    },
    {
      title: "   ",
      expectedStatus: 400,
      description: 'Whitespace-only title: "   "',
    },
    {
      title: "A".repeat(101),
      expectedStatus: 400,
      description: "Title longer than 100 characters",
    },
    {
      title: "Mathe lernen",
      expectedStatus: 201,
      description: 'Valid title: "Mathe lernen"',
    },
  ];

  let failed = false;

  for (const test of tests) {
    try {
      const status = await createTask(test.title);

      if (status === test.expectedStatus) {
        console.log(`PASS: ${test.description}`);
      } else {
        failed = true;

        console.log(`FAIL: ${test.description}`);
        console.log(`Expected: HTTP ${test.expectedStatus}`);
        console.log(`Received: HTTP ${status}`);
      }
    } catch (error) {
      failed = true;

      console.log(`FAIL: ${test.description}`);
      console.log(`Error: ${error.message}`);
    }
  }

  console.log("=================================");

  if (failed) {
    console.log("TITLE CHECK: FAILED");
    process.exit(1);
  }

  console.log("TITLE CHECK: PASSED");
  process.exit(0);
}

run();