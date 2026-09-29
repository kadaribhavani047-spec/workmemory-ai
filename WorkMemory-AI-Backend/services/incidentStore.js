const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const INCIDENTS_FILE = path.join(DATA_DIR, "incidents.json");

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(INCIDENTS_FILE)) {
    fs.writeFileSync(INCIDENTS_FILE, "[]", "utf8");
  }
}

function getIncidents() {
  ensureStorage();

  const data = fs.readFileSync(INCIDENTS_FILE, "utf8");

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveIncidents(incidents) {
  ensureStorage();

  fs.writeFileSync(
    INCIDENTS_FILE,
    JSON.stringify(incidents, null, 2),
    "utf8"
  );
}

function addIncident(incident) {
  const incidents = getIncidents();

  incidents.unshift(incident);

  saveIncidents(incidents);

  return incident;
}

function updateIncident(code, updates) {
  const incidents = getIncidents();

  const index = incidents.findIndex(
    (incident) => incident.code === code
  );

  if (index === -1) {
    return null;
  }

  incidents[index] = {
    ...incidents[index],
    ...updates,
  };

  saveIncidents(incidents);

  return incidents[index];
}
function deleteIncident(code) {
  const incidents = getIncidents();

  const filteredIncidents = incidents.filter(
    (incident) => incident.code !== code
  );

  if (filteredIncidents.length === incidents.length) {
    return null;
  }

  saveIncidents(filteredIncidents);

  return true;
}

module.exports = {
  getIncidents,
  addIncident,
  updateIncident,
  deleteIncident,
};