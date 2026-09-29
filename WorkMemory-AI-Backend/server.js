const express = require("express");
const cors = require("cors");
require("dotenv").config();

const incidentRoutes = require("./routes/incidentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "WorkMemory AI Backend is running",
    status: "ok"
  });
});

app.use("/api", incidentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`WorkMemory AI Backend running at http://localhost:${PORT}`);
});
