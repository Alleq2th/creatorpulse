// services/usageLimits.js
// Server-enforced daily usage limits for CreatorPulse Free Tier:
// - 3 Post Image / Graphic generations per day
// - 5 Script generations per day
// - News, Calendar, Hooks, and Camera Studio are free & unmetered.
//
// Persistent across page reloads & stored server-side.

const fs = require("fs");
const path = require("path");

const USAGE_CACHE_FILE = path.join(__dirname, "../.usage_cache.json");

// Free tier limits
const LIMITS = {
  scripts: 5,
  images: 3
};

// In-memory cache: { [identifier]: { date: "YYYY-MM-DD", scripts: 0, images: 0, plan: "free" } }
let usageStore = new Map();

// Load persistent cache from disk on startup if present
try {
  if (fs.existsSync(USAGE_CACHE_FILE)) {
    const raw = fs.readFileSync(USAGE_CACHE_FILE, "utf8");
    const data = JSON.parse(raw);
    for (const [k, v] of Object.entries(data)) {
      usageStore.set(k, v);
    }
  }
} catch (e) {
  console.warn("[usageLimits] Failed to load cache file:", e.message);
}

function persistStore() {
  try {
    const obj = {};
    for (const [k, v] of usageStore.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(USAGE_CACHE_FILE, JSON.stringify(obj), "utf8");
  } catch (e) {
    // Non-fatal if read-only filesystem
  }
}

// Current UTC date string: YYYY-MM-DD
function getUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

// Extract a stable identifier for the requester:
// 1. Authenticated user ID (from Authorization header or session)
// 2. Client Device ID (x-device-id header from client)
// 3. Client IP address (fallback)
function getClientIdentifier(req) {
  if (!req) return "anonymous";
  
  // Check auth user (set by auth middleware or token decoder)
  if (req.user && req.user.id) return `user:${req.user.id}`;
  if (req.headers && req.headers["x-user-id"]) return `user:${req.headers["x-user-id"]}`;

  // Check client device fingerprint header
  if (req.headers && req.headers["x-device-id"]) {
    return `device:${req.headers["x-device-id"]}`;
  }

  // Fallback to IP address
  const forwarded = req.headers && req.headers["x-forwarded-for"];
  const ip = forwarded ? forwarded.split(",")[0].trim() : (req.socket && req.socket.remoteAddress) || "127.0.0.1";
  return `ip:${ip}`;
}

// Get or initialize record for identifier
function getRecord(identifier) {
  const today = getUtcDate();
  let record = usageStore.get(identifier);

  // If no record or date rolled over (midnight UTC), reset counts
  if (!record || record.date !== today) {
    record = {
      date: today,
      scripts: 0,
      images: 0,
      plan: (record && record.plan) || "free"
    };
    usageStore.set(identifier, record);
    persistStore();
  }

  return record;
}

// Calculate hours until midnight UTC reset
function getHoursUntilReset() {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.max(1, Math.round((midnight - now) / 3600000));
}

// Check current usage status for a request
function getUsage(req) {
  const id = getClientIdentifier(req);
  const record = getRecord(id);
  const isPro = record.plan === "pro";

  const scriptLimit = isPro ? Infinity : LIMITS.scripts;
  const imageLimit = isPro ? Infinity : LIMITS.images;

  return {
    date: record.date,
    plan: record.plan,
    isPro,
    scripts: {
      used: record.scripts,
      limit: isPro ? "unlimited" : scriptLimit,
      remaining: isPro ? 999999 : Math.max(0, scriptLimit - record.scripts),
      blocked: !isPro && record.scripts >= scriptLimit
    },
    images: {
      used: record.images,
      limit: isPro ? "unlimited" : imageLimit,
      remaining: isPro ? 999999 : Math.max(0, imageLimit - record.images),
      blocked: !isPro && record.images >= imageLimit
    },
    resetHours: getHoursUntilReset()
  };
}

// Check if generation is allowed
function canGenerate(req, type) {
  const id = getClientIdentifier(req);
  const record = getRecord(id);
  if (record.plan === "pro") return { allowed: true, used: record[type] || 0, limit: Infinity };

  const limit = LIMITS[type] || 0;
  const used = record[type] || 0;

  if (used >= limit) {
    return {
      allowed: false,
      type,
      used,
      limit,
      remaining: 0,
      resetHours: getHoursUntilReset()
    };
  }

  return {
    allowed: true,
    type,
    used,
    limit,
    remaining: limit - used,
    resetHours: getHoursUntilReset()
  };
}

// Record generation usage
function recordUsage(req, type, count = 1) {
  const id = getClientIdentifier(req);
  const record = getRecord(id);
  if (record[type] !== undefined) {
    record[type] += count;
  } else {
    record[type] = count;
  }
  usageStore.set(id, record);
  persistStore();
  return getUsage(req);
}

// Set user plan (e.g. for testing or when user upgrades)
function setPlan(identifier, plan = "pro") {
  const record = getRecord(identifier);
  record.plan = plan;
  usageStore.set(identifier, record);
  persistStore();
  return record;
}

// Express middleware to enforce limit
function checkLimitMiddleware(type) {
  return (req, res, next) => {
    const check = canGenerate(req, type);
    if (!check.allowed) {
      const typeLabel = type === "scripts" ? "5 scripts" : "3 graphics / post images";
      return res.status(403).json({
        error: "DAILY_LIMIT_REACHED",
        limitType: type,
        limit: check.limit,
        used: check.used,
        resetHours: check.resetHours,
        message: `You have reached your daily free limit of ${typeLabel}. Upgrade to Pro for unlimited generation or wait until tomorrow's reset.`
      });
    }
    next();
  };
}

module.exports = {
  LIMITS,
  getClientIdentifier,
  getUsage,
  canGenerate,
  recordUsage,
  setPlan,
  checkLimitMiddleware
};
