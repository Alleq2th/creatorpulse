// Shared Supabase client — used by server.js and any route module that needs
// database access (e.g. routes/push.js). One client instance, one home.
const { createClient } = require("@supabase/supabase-js");

const rawUrl = process.env.SUPABASE_URL || "";
const rawKey = process.env.SUPABASE_SERVICE_KEY || "";

// Sanitize inputs: strip leading/trailing whitespace, accidental quotes, and trailing slashes
const cleanUrl = rawUrl.trim().replace(/^["']|["']$/g, "").trim().replace(/\/+$/, "");
const cleanKey = rawKey.trim().replace(/^["']|["']$/g, "").trim();

const supabase = cleanUrl && cleanKey
  ? createClient(cleanUrl, cleanKey)
  : null;

function isUpstreamAuthError(error) {
  if (!error) return false;
  const msg = String(error.message || error || "").toLowerCase();
  const name = String(error.name || "").toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("etimedout") ||
    msg.includes("und_err_connect_timeout") ||
    msg.includes("network") ||
    name === "authretryablefetcherror" ||
    error.status === 0
  );
}

const UNREACHABLE_AUTH_MSG = "Unable to connect to the authentication server. If you are using a free Supabase project, please verify in your Supabase dashboard that the project is active and unpaused.";

function handleAuthError(res, error, context = "auth") {
  if (isUpstreamAuthError(error)) {
    console.error(`[auth] Supabase unreachable during ${context}:`, error && (error.message || error), error && error.cause ? error.cause : "");
    return res.status(503).json({
      error: UNREACHABLE_AUTH_MSG,
      code: "AUTH_SERVICE_UNREACHABLE"
    });
  }
  const status = typeof error.status === "number" && error.status >= 400 && error.status < 500 ? error.status : 400;
  return res.status(status).json({
    error: (error && error.message) || "Authentication failed"
  });
}

module.exports = {
  supabase,
  cleanUrl,
  cleanKey,
  isUpstreamAuthError,
  handleAuthError,
  UNREACHABLE_AUTH_MSG
};
