// Uniqueness Checker — compares a creator's own script against scripts other
// users have submitted in the same niche, using shingle-based similarity.
// This is a real corpus comparison (not an AI "does this sound generic" guess) —
// it can only flag against what's actually been submitted so far, and grows
// more useful as more scripts get checked. At very large scale (millions of
// submissions/niche) this naive full-scan compare would need a proper
// nearest-neighbor index (e.g. MinHash/LSH) instead of comparing against every
// stored fingerprint — noted here as a known future scaling step, not solved yet.
const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");

const SHINGLE_SIZE = 5; // 5-word phrases
function shingles(text) {
  const words = (text || "").toLowerCase().replace(/[^\w\s']/g, "").split(/\s+/).filter(Boolean);
  const set = new Set();
  for (let i = 0; i <= words.length - SHINGLE_SIZE; i++) set.add(words.slice(i, i + SHINGLE_SIZE).join(" "));
  return [...set];
}
function jaccard(a, b) {
  const setA = new Set(a), setB = new Set(b);
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const s of setA) if (setB.has(s)) intersection++;
  return intersection / (setA.size + setB.size - intersection);
}

router.post("/check-uniqueness", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { token, niche, text } = req.body || {};
    if (!token || !text || text.trim().split(/\s+/).length < 15) {
      return res.status(400).json({ error: "Paste at least ~15 words of your script to check." });
    }
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });

    const mine = shingles(text);
    if (!mine.length) return res.json({ similarity: 0, verdict: "unique", message: "Too short to meaningfully compare — looks fine." });

    // Compare against recent submissions in the same niche (capped for cost —
    // see scaling note above for what this needs to become at real scale).
    const { data: others } = await supabase
      .from("content_fingerprints")
      .select("shingles")
      .eq("niche", niche || "")
      .order("created_at", { ascending: false })
      .limit(500);

    let maxSim = 0;
    (others || []).forEach(row => {
      const sim = jaccard(mine, row.shingles || []);
      if (sim > maxSim) maxSim = sim;
    });

    const pct = Math.round(maxSim * 100);
    let verdict, message;
    if (pct < 15) { verdict = "unique"; message = "Looks original — no meaningful overlap with other submissions in this niche."; }
    else if (pct < 35) { verdict = "some_overlap"; message = "Some phrasing overlaps with another creator's script in this niche. Consider reworking a few lines."; }
    else { verdict = "too_similar"; message = "This closely matches another submission in this niche. Rewrite key sections before posting to avoid duplicate-content flags."; }

    // Store this submission's fingerprint so future checks compare against it too.
    await supabase.from("content_fingerprints").insert({
      user_id: userData.user.id, niche: niche || "", shingles: mine
    });

    res.json({ similarity: pct, verdict, message });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
