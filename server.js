import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { verifyUpdatePassword } from "./lib/auth.js";
import {
  buildOgImagePng,
  getSharePayload,
  renderIndexHtml,
} from "./lib/share.js";
import { STATES } from "./lib/states.js";
import { getTrackerState, setTrackerState } from "./lib/tracker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const { share } = await getSharePayload(req);
    const html = await renderIndexHtml(share);
    res.type("html").send(html);
  } catch (error) {
    res.status(500).send("Could not load tracker.");
  }
});

app.get("/og-image.png", async (req, res) => {
  try {
    const { tracker } = await getSharePayload(req);
    const png = await buildOgImagePng(tracker);
    res.type("image/png");
    res.set("Cache-Control", "public, max-age=60");
    res.send(png);
  } catch (error) {
    res.status(500).send("Could not render preview image.");
  }
});

app.use(express.static(path.join(__dirname, "public"), { index: false }));

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

app.listen(PORT, () => {
  console.log(`Pizza tracker running at http://localhost:${PORT}`);
});
