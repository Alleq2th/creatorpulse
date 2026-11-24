const express = require("express");
const router = express.Router();
const { getUsage, recordUsage, canGenerate, setPlan, LIMITS } = require("../services/usageLimits");

router.get("/usage", (req, res) => {
  res.json(getUsage(req));
});

router.post("/usage/record", (req, res) => {
  const { type, count } = req.body || {};
  if (!type || !["scripts", "images"].includes(type)) {
    return res.status(400).json({ error: "Invalid type. Must be 'scripts' or 'images'." });
  }
  const usage = recordUsage(req, type, Math.max(1, parseInt(count) || 1));
  res.json(usage);
});

// For testing / upgrades
router.post("/usage/upgrade", (req, res) => {
  const { plan } = req.body || {};
  const id = require("../services/usageLimits").getClientIdentifier(req);
  const updated = setPlan(id, plan || "pro");
  res.json({ success: true, plan: updated.plan });
});

module.exports = router;
