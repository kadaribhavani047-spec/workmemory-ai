const fs = require("fs");
const path = require("path");

const filePath = path.join(
  __dirname,
  "data",
  "incidents.json"
);

const seedIncidents = [
  {
    code: "INC-024",
    title: "Payment API Latency",
    service: "payments-api",
    severity: "HIGH",
    type: "high",
    status: "Investigating",
    age: "12m ago",
    impact: "Checkout p95 at 4.8s",
    lesson: "DB pool exhaustion caused repeated API latency.",
  },
  {
    code: "INC-023",
    title: "Auth Service Timeout",
    service: "auth-gateway",
    severity: "MEDIUM",
    type: "medium",
    status: "Mitigating",
    age: "41m ago",
    impact: "Login retries up 22%",
    lesson: "Stale cache caused authentication slowdown.",
  },
  {
    code: "INC-022",
    title: "Order Service Failure",
    service: "order-worker",
    severity: "HIGH",
    type: "high",
    status: "Watching",
    age: "2h ago",
    impact: "Failed order writes in US-East",
    lesson:
      "Restarting workers did not resolve DB connection exhaustion.",
  },
  {
    code: "INC-021",
    title: "Cache Stampede",
    service: "session-cache",
    severity: "LOW",
    type: "low",
    status: "Resolved",
    age: "Yesterday",
    impact: "Brief dashboard lag",
    lesson: "Warm the cache before traffic spikes.",
  },
];

fs.writeFileSync(
  filePath,
  JSON.stringify(seedIncidents, null, 2),
  "utf8"
);

console.log("4 seed incidents added successfully.");