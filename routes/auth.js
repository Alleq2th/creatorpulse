// Auth routes for CreatorPulse: signup, login, update-profile.
const express = require("express");
const supabase = require("../config/supabase");

const router = express.Router();

router.post("/signup", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Auth not configured" });
  const { email, password, name, niches, platforms, primaryPlatform, postsPerDay } = req.body;
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          niches,
          platforms,
          primaryPlatform,
          postsPerDay
        }
      }
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({
      success: true,
      message: "Account created successfully.",
      user: data.user
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/login", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Auth not configured" });
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    const meta = data.user?.user_metadata || {};
    res.json({
      token: data.session?.access_token,
      user: {
        name: meta.name || email.split("@")[0],
        niches: meta.niches || [],
        platforms: meta.platforms || [],
        primaryPlatform: meta.primaryPlatform || "",
        postsPerDay: meta.postsPerDay || 3,
        email
      }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/update-profile", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Auth not configured" });
  const { token, name, niches, platforms, primaryPlatform, postsPerDay } = req.body;
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });
    const { error } = await supabase.auth.admin.updateUserById(userData.user.id, {
      user_metadata: { name, niches, platforms, primaryPlatform, postsPerDay }
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
