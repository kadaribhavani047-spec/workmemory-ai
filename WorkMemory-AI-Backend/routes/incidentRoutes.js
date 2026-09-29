const express = require("express");
const router = express.Router();

const {
  saveToHindsight,
  investigateWithMemory
} = require("../services/hindsightService");

const { analyzeIncidentWithGrok } = require("../services/LLMService");

const {
  getIncidents,
  addIncident,
  updateIncident,
  deleteIncident
} = require("../services/incidentStore");


// ==========================================
// POST /api/incidents
// Store incident in JSON + Hindsight
// ==========================================
router.post("/incidents", async (req, res) => {
  try {
    const incident = req.body;

    if (!incident || Object.keys(incident).length === 0) {
      return res.status(400).json({
        error: "Incident data is required"
      });
    }

    // Generate incident code
    const existingIncidents = getIncidents();

    const highestNumber = existingIncidents.reduce(
      (max, item) => {
        const number = Number(
          String(item.code || "").replace("INC-", "")
        );

        return Number.isNaN(number)
          ? max
          : Math.max(max, number);
      },
      24
    );

    const storedIncident = {
      ...incident,
      code: `INC-${String(highestNumber + 1).padStart(3, "0")}`,
      status: "Investigating",
      createdAt: new Date().toISOString()
    };

    // Store exact incident for website persistence
    const savedIncident = addIncident(storedIncident);

    // Store experience in Hindsight
    const memory = await saveToHindsight(storedIncident);

    return res.status(201).json({
      message: "Incident stored",
      incident: savedIncident,
      memory
    });

  } catch (error) {
    console.error("Error storing incident:", error);

    return res.status(500).json({
      error: "Failed to store incident",
      details: error.message
    });
  }
});


// ==========================================
// POST /api/incidents/investigate
// Recall Hindsight + Groq analysis
// ==========================================
router.post("/incidents/investigate", async (req, res) => {
  try {
    const incident = req.body;

    if (!incident || Object.keys(incident).length === 0) {
      return res.status(400).json({
        error: "Incident data is required"
      });
    }

    // Step 1: Recall relevant past experiences
    const memoryResult = await investigateWithMemory(incident);

    // Step 2: Ask Groq to analyze the memories
    const aiResult = await analyzeIncidentWithGrok(
      incident,
      memoryResult.similarIncidents
    );

    return res.status(200).json({
      message: "Incident investigated successfully",
      incident,
      similarIncidents: memoryResult.similarIncidents,
      analysis: aiResult
    });

  } catch (error) {
    console.error("Error investigating incident:", error);

    return res.status(500).json({
      error: "Failed to investigate incident",
      details: error.message
    });
  }
});


// ==========================================
// GET /api/incidents
// Return persistent incident records
// ==========================================
router.get("/incidents", (req, res) => {
  try {
    const incidents = getIncidents();

    return res.status(200).json({
      incidents
    });

  } catch (error) {
    console.error("Error fetching incidents:", error);

    return res.status(500).json({
      error: "Failed to fetch incidents",
      details: error.message
    });
  }
});


// ==========================================
// PATCH /api/incidents/:code
// Update stored incident
// ==========================================
router.patch("/incidents/:code", (req, res) => {
  try {
    const { code } = req.params;
    const updates = req.body;

    const updatedIncident = updateIncident(code, updates);

    if (!updatedIncident) {
      return res.status(404).json({
        error: "Incident not found"
      });
    }

    return res.status(200).json({
      message: "Incident updated",
      incident: updatedIncident
    });

  } catch (error) {
    console.error("Error updating incident:", error);

    return res.status(500).json({
      error: "Failed to update incident",
      details: error.message
    });
  }
});
// ==========================================
// DELETE /api/incidents/:code
// Delete incident from JSON storage
// ==========================================
router.delete("/incidents/:code", (req, res) => {
  try {
    const { code } = req.params;

    const deleted = deleteIncident(code);

    if (!deleted) {
      return res.status(404).json({
        error: "Incident not found"
      });
    }

    return res.status(200).json({
      message: "Incident deleted successfully",
      code
    });

  } catch (error) {
    console.error("Error deleting incident:", error);

    return res.status(500).json({
      error: "Failed to delete incident",
      details: error.message
    });
  }
});


module.exports = router;