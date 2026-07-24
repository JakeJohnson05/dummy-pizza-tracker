import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { verifyUpdatePassword } from "./lib/auth.js";
import { STATES } from "./lib/states.js";
import { getTrackerState, setTrackerState } from "./lib/tracker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/config", (_req, res) => {
  res.json({ states: STATES });
});

app.get("/api/state", async (_req, res) => {
  try {
    const tracker = await getTrackerState();
    res.json({
      stateId: tracker.stateId,
      updatedAt: tracker.updatedAt,
      state: tracker.state,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/state", async (req, res) => {
  try {
    const { stateId, password } = req.body ?? {};

    if (!verifyUpdatePassword(password)) {
      return res.status(401).json({ error: "Invalid password." });
    }

    const tracker = await setTrackerState(stateId);
    res.json({
      stateId: tracker.stateId,
      updatedAt: tracker.updatedAt,
      state: tracker.state,
    });
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message });
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Pizza tracker running at http://localhost:${PORT}`);
});
