// Unit tests for parseAuthRedirect() in lib/authRedirect.js.
//
// This is the pure URL -> outcome mapping behind every link Supabase emails out
// (password recovery, signup confirmation, hard errors). It runs in the browser
// as a classic script, but it is deliberately DOM-free, so it can be required
// here directly with no window/document stubbing.
//
// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const { parseAuthRedirect } = require("../lib/authRedirect");

const INVALID_LINK = "This reset link is invalid or has already been used.";

// A realistic Supabase recovery fragment, as appended to the redirect URL.
const RECOVERY_HASH =
  "#access_token=eyJhbGciOiJIUzI1NiJ9.rec%2Bp.payload&refresh_token=v1.MRr9x2Qq&type=recovery";

test("no module-level dependency on window or document", () => {
  // Requiring it above already proves this; assert the globals are still absent
  // so the guarantee can't regress silently.
  assert.equal(typeof globalThis.window, "undefined");
  assert.equal(typeof globalThis.document, "undefined");
});

test("a valid recovery hash returns the parsed session", () => {
  const r = parseAuthRedirect(RECOVERY_HASH, "");
  assert.equal(r.kind, "recovery");
  assert.equal(r.access_token, "eyJhbGciOiJIUzI1NiJ9.rec+p.payload");
  assert.equal(r.refresh_token, "v1.MRr9x2Qq");
  assert.equal(r.error, "");
});

test("a recovery hash missing the tokens is reported, not thrown", () => {
  const r = parseAuthRedirect("#type=recovery", "");
  assert.equal(r.kind, "recovery");
  assert.equal(r.access_token, "");
  assert.equal(r.refresh_token, "");
  assert.equal(r.error, INVALID_LINK);
});

test("a recovery hash with only one token is still treated as invalid", () => {
  assert.equal(parseAuthRedirect("#type=recovery&access_token=abc", "").error, INVALID_LINK);
  assert.equal(parseAuthRedirect("#type=recovery&refresh_token=abc", "").error, INVALID_LINK);
});

test("an expired recovery link surfaces Supabase's error_description", () => {
  const r = parseAuthRedirect("#error_description=Email+link+is+invalid+or+has+expired", "");
  assert.equal(r.kind, "error");
  assert.equal(r.error, "Email link is invalid or has expired");
});

test("a recovery hash carrying both a session and an error keeps the error", () => {
  const r = parseAuthRedirect(
    "#type=recovery&access_token=a&refresh_token=b&error_description=Link+expired",
    ""
  );
  assert.equal(r.kind, "recovery");
  assert.equal(r.error, "Link expired");
});

test("error_description is percent-decoded and plus signs become spaces", () => {
  const r = parseAuthRedirect("#error_description=Invalid%20request%3A+bad%2Flink", "");
  assert.equal(r.error, "Invalid request: bad/link");
});

test("a truncated percent-escape in error_description does not throw", () => {
  // decodeURIComponent raises URIError on malformed escapes; the redirect check
  // must degrade to a readable message instead of dying into a blank screen.
  assert.doesNotThrow(() => parseAuthRedirect("?error_description=%E0%A4%A", ""));
  const r = parseAuthRedirect("?error_description=%E0%A4%A", "");
  assert.equal(r.kind, "error");
  assert.equal(r.error, "That link is invalid or has expired.");
});

test("a malformed escape inside a recovery hash is still reported", () => {
  const r = parseAuthRedirect("#type=recovery&error_description=%E0%A4%A", "");
  assert.equal(r.kind, "recovery");
  assert.equal(r.error, "That link is invalid or has expired.");
});

test("query-param style values are read when the hash is empty", () => {
  const r = parseAuthRedirect("", "?type=recovery&access_token=a1&refresh_token=r1");
  assert.equal(r.kind, "recovery");
  assert.equal(r.access_token, "a1");
  assert.equal(r.refresh_token, "r1");
  assert.equal(r.error, "");
});

test("hash wins over query string when both are present", () => {
  const r = parseAuthRedirect("#type=recovery&access_token=fromHash&refresh_token=h", "?access_token=fromQuery");
  assert.equal(r.access_token, "fromHash");
  assert.equal(r.refresh_token, "h");
});

test("a query-param error with no type still surfaces as an error", () => {
  const r = parseAuthRedirect("", "?error_description=Something+broke");
  assert.equal(r.kind, "error");
  assert.equal(r.error, "Something broke");
});

test("signup and email_change confirmations keep their own kind", () => {
  assert.equal(parseAuthRedirect("#type=signup&access_token=a&refresh_token=b", "").kind, "signup");
  assert.equal(parseAuthRedirect("#type=email_change", "").kind, "email_change");
});

test("the happy path for every kind carries no error", () => {
  assert.equal(parseAuthRedirect("#type=signup", "").error, "");
  assert.equal(parseAuthRedirect("#type=email_change", "").error, "");
});

test("a URL with no auth parameters reports none", () => {
  const r = parseAuthRedirect("", "");
  assert.equal(r.kind, "none");
  assert.equal(r.access_token, "");
  assert.equal(r.refresh_token, "");
  assert.equal(r.error, "");
});

test("a bare fragment or bare question mark is not mistaken for a redirect", () => {
  assert.equal(parseAuthRedirect("#", "").kind, "none");
  assert.equal(parseAuthRedirect("", "?").kind, "none");
  assert.equal(parseAuthRedirect("#", "?").kind, "none");
});

test("malformed and non-string input never throws", () => {
  const junk = ["%%%%", "??&&==", "#&&&", "?=", "#=&&=", "%E0%A4%A", "\u0000\u0001"];
  for (const h of junk) {
    assert.doesNotThrow(() => parseAuthRedirect(h, h), `threw on ${JSON.stringify(h)}`);
    assert.equal(parseAuthRedirect(h, h).kind, "none");
  }
});

test("null and undefined arguments are treated as empty", () => {
  assert.deepEqual(parseAuthRedirect(null, null), {
    kind: "none", access_token: "", refresh_token: "", error: "",
  });
  assert.deepEqual(parseAuthRedirect(undefined, undefined), {
    kind: "none", access_token: "", refresh_token: "", error: "",
  });
});

test("a realistic expired recovery redirect from Supabase yields a clear error", () => {
  const r = parseAuthRedirect(
    "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
    ""
  );
  assert.equal(r.kind, "error");
  assert.match(r.error, /expired/i);
});

test("the result always has the four documented keys", () => {
  const shapes = [RECOVERY_HASH, "#type=signup", "#error_description=x", "", "#type=recovery"];
  for (const h of shapes) {
    assert.deepEqual(
      Object.keys(parseAuthRedirect(h, "")).sort(),
      ["access_token", "error", "kind", "refresh_token"]
    );
  }
});
