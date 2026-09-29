require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../.env")
});

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

async function analyzeIncidentWithGrok(incident, memories) {
  console.log("GROQ: optimized analysis started");

  const memoryText = JSON.stringify(memories)
    .replace(/\s+/g, " ")
    .slice(0, 500);

  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in .env");
  }

  const prompt = `
Analyze this incident using only the recalled memory.

Problem: ${incident.problem || incident.title || ""}
Service: ${incident.service || ""}
Result: ${incident.result || incident.impact || ""}

Past memory:
${memoryText}

Return exactly:

⚠️ Similar Past Incident Found

Previous Action: [short answer]
Result: [short answer]
Later Consequence: [short answer]
Warning: [short answer]
Recommended Next Step: [short answer]
`;

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 120
      })
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
      `Groq API error ${response.status}: ${
        typeof data === "string" ? data : JSON.stringify(data)
      }`
    );
  }

  return {
    model: GROQ_MODEL,
    analysis:
      data?.choices?.[0]?.message?.content ||
      "No analysis returned"
  };
}

module.exports = {
  analyzeIncidentWithGrok
};