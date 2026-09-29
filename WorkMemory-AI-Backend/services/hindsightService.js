require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../.env")
});
const HINDSIGHT_API_KEY = process.env.HINDSIGHT_API_KEY;
const HINDSIGHT_BASE_URL =
  process.env.HINDSIGHT_BASE_URL || "https://api.hindsight.vectorize.io";
const HINDSIGHT_BANK_ID =
  process.env.HINDSIGHT_BANK_ID || "workmemory";

async function hindsightRequest(endpoint, options = {}) {
  if (!HINDSIGHT_API_KEY) {
    throw new Error("HINDSIGHT_API_KEY is missing in .env");
  }

  const response = await fetch(
    `${HINDSIGHT_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HINDSIGHT_API_KEY}`,
        ...(options.headers || {})
      }
    }
  );

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `Hindsight API error ${response.status}: ${
        typeof data === "string" ? data : JSON.stringify(data)
      }`
    );
  }

  return data;
}


// ===============================
// SAVE INCIDENT TO HINDSIGHT
// ===============================
async function saveToHindsight(incident) {
  const content = `
Problem: ${incident.problem || incident.title || "Not provided"}
Service: ${incident.service || "Not provided"}
Action Taken: ${incident.action || incident.actionTaken || "Not provided"}
Result: ${incident.result || "Not provided"}
Consequence: ${incident.consequence || "Not provided"}
`.trim();

  const result = await hindsightRequest(
    `/v1/default/banks/${HINDSIGHT_BANK_ID}/memories`,
    {
      method: "POST",
      body: JSON.stringify({
        items: [
          {
            content,
            context: "software_incident"
          }
        ]
      })
    }
  );

  return {
    status: "stored",
    source: "hindsight",
    result
  };
}


// ===============================
// RECALL SIMILAR INCIDENTS
// ===============================
async function investigateWithMemory(incident) {
  const query = `
Current incident:
Problem: ${incident.problem || incident.title || ""}
Service: ${incident.service || ""}
Action Taken: ${incident.action || incident.actionTaken || ""}
Result: ${incident.result || ""}
Consequence: ${incident.consequence || ""}

Find relevant past incidents.
Explain what happened before, what action was taken,
what result occurred, and whether there were later
side effects or consequences.
`.trim();

  const result = await hindsightRequest(
    `/v1/default/banks/${HINDSIGHT_BANK_ID}/memories/recall`,
    {
      method: "POST",
      body: JSON.stringify({
        query
      })
    }
  );

  return {
    message: "Past incident memories retrieved",
    incident,
    similarIncidents: result
  };
}


module.exports = {
  saveToHindsight,
  investigateWithMemory
};