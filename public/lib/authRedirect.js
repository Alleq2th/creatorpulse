// Pure URL → outcome mapping for the links Supabase emails out: password
// recovery, signup confirmation, and hard errors.
//
// Lifted verbatim out of public/core.js so it can be unit-tested directly
// (test/authRedirect.test.js) without a DOM: it is the only thing standing
// between a reset email and the "set a new password" screen, and its failure
// mode is a dead link with no explanation.
//
// Returns { kind, access_token, refresh_token, error } where kind is one of
// "recovery" | "signup" | "email_change" | "error" | "none".

function parseAuthRedirect(hash, search){
  const hashParams = new URLSearchParams(String(hash || "").replace(/^#/, ""));
  const searchParams = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  const type = hashParams.get("type") || searchParams.get("type");
  const rawErr = hashParams.get("error_description") || searchParams.get("error_description");
  // decodeURIComponent throws URIError on malformed percent-encoding (a
  // truncated "%E0%A4%A", say). Supabase never sends that, but a mangled link
  // would otherwise blow up the whole redirect check -- and the catch around
  // checkAuthRedirect() in app.js swallows it into a blank login screen, which
  // is exactly the dead-end-with-no-explanation this function exists to avoid.
  let error = "";
  if (rawErr) {
    const spaced = rawErr.replace(/\+/g, " ");
    try { error = decodeURIComponent(spaced); }
    catch (_) { error = "That link is invalid or has expired."; }
  }
  const access_token = hashParams.get("access_token") || searchParams.get("access_token") || "";
  const refresh_token = hashParams.get("refresh_token") || searchParams.get("refresh_token") || "";

  if(type === "recovery"){
    // Supabase sends error_description when the link is expired/already used;
    // otherwise the session must be present. A recovery link carrying neither
    // is a dead end, so say so rather than rendering an unusable form.
    return {
      kind: "recovery", access_token, refresh_token,
      error: error || ((!access_token || !refresh_token) ? "This reset link is invalid or has already been used." : ""),
    };
  }
  if(error) return { kind: "error", access_token, refresh_token, error };
  if(type === "signup" || type === "email_change") return { kind: type, access_token, refresh_token, error: "" };
  return { kind: "none", access_token, refresh_token, error: "" };
}

// Node consumes this as a CommonJS module (see test/authRedirect.test.js). The
// browser also loads this same file, as a classic script from index.html -- in
// that context `module` is undefined, the guard is skipped, and the top-level
// function declaration becomes a global that app.js's checkAuthRedirect() can
// call. One implementation, two consumers.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { parseAuthRedirect };
}
