// Web Push routes — subscribe/unsubscribe and the endpoint an external cron
// (cron-job.org, since Render free tier sleeps) hits every 2h to send digests.
const express = require("express");
const router = express.Router();
const webpush = require("web-push");
const { supabase } = require("../config/supabase");
const { parser, NICHE_BLOG_RSS } = require("../config/feeds");

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:sportsguycollabs@gmail.com";

const pushConfigured = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (pushConfigured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.log("[push] VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY not set — push endpoints will return 503 until configured.");
}

// Client calls this after Notification.requestPermission() + pushManager.subscribe()
router.post("/push-subscribe", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  if (!pushConfigured) return res.status(503).json({ error: "Push not configured" });
  try {
    const { token, subscription } = req.body || {};
    if (!token || !subscription?.endpoint) return res.status(400).json({ error: "Missing token or subscription" });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });
    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id: userData.user.id,
      endpoint: subscription.endpoint,
      keys: subscription.keys
    }, { onConflict: "endpoint" });
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/push-unsubscribe", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ error: "Missing endpoint" });
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Hit by an external cron every 2h (Render free tier sleeps, so this can't be
// a setInterval inside the app — see the cron-job.org setup notes).
router.post("/send-digest-push", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  if (!pushConfigured) return res.status(503).json({ error: "Push not configured" });

  try {
    const { data: subs, error: subsError } = await supabase.from("push_subscriptions").select("*");
    if (subsError) throw subsError;
    if (!subs?.length) return res.json({ sent: 0, note: "No subscriptions yet" });

    // Group subscriptions by user so we only build each user's digest once.
    const byUser = {};
    subs.forEach(s => { (byUser[s.user_id] = byUser[s.user_id] || []).push(s); });

    let sent = 0, removed = 0;
    for (const userId of Object.keys(byUser)) {
      const { data: userAuth } = await supabase.auth.admin.getUserById(userId);
      const niches = (userAuth?.user?.user_metadata?.niches || []).slice(0, 3);
      if (!niches.length) continue;

      let headline = "New stories are in — open CreatorPulse to see what's trending.";
      for (const n of niches) {
        try {
          const feeds = NICHE_BLOG_RSS[n] || NICHE_BLOG_RSS.default;
          const rssUrl = feeds[Math.floor(Math.random() * feeds.length)];
          const feed = await parser.parseURL(rssUrl);
          if (feed.items?.[0]) { headline = feed.items[0].title; break; }
        } catch (e) {}
      }

      const payload = JSON.stringify({ title: "CreatorPulse Digest", body: headline, url: "/" });
      for (const sub of byUser[userId]) {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
          sent++;
        } catch (e) {
          if (e.statusCode === 404 || e.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            removed++;
          }
        }
      }
    }
    res.json({ sent, removed });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
