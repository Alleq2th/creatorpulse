const test = require("node:test");
const assert = require("node:assert/strict");
const { isUpstreamAuthError, handleAuthError, cleanUrl, cleanKey, UNREACHABLE_AUTH_MSG } = require("../config/supabase");

test("isUpstreamAuthError detects connectivity and reachability failures", () => {
  assert.equal(isUpstreamAuthError(new Error("fetch failed")), true);
  assert.equal(isUpstreamAuthError(new Error("TypeError: Failed to fetch")), true);
  assert.equal(isUpstreamAuthError({ name: "AuthRetryableFetchError", message: "fetch failed", status: 0 }), true);
  assert.equal(isUpstreamAuthError(new Error("getaddrinfo ENOTFOUND xyz.supabase.co")), true);
  assert.equal(isUpstreamAuthError(new Error("connect ECONNREFUSED 127.0.0.1:443")), true);
  assert.equal(isUpstreamAuthError(new Error("connect ETIMEDOUT")), true);
  assert.equal(isUpstreamAuthError(new Error("UND_ERR_CONNECT_TIMEOUT")), true);
});

test("isUpstreamAuthError does not flag user credential or validation errors", () => {
  assert.equal(isUpstreamAuthError({ message: "Invalid login credentials", status: 400 }), false);
  assert.equal(isUpstreamAuthError({ message: "User already registered", status: 400 }), false);
  assert.equal(isUpstreamAuthError({ message: "Password should be at least 6 characters", status: 422 }), false);
  assert.equal(isUpstreamAuthError(null), false);
  assert.equal(isUpstreamAuthError(undefined), false);
});

test("handleAuthError returns 503 and friendly guidance on reachability failures", () => {
  let statusCode = 0;
  let jsonBody = null;
  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      jsonBody = body;
      return this;
    }
  };

  handleAuthError(mockRes, new Error("fetch failed"), "login");
  assert.equal(statusCode, 503);
  assert.equal(jsonBody.code, "AUTH_SERVICE_UNREACHABLE");
  assert.match(jsonBody.error, /verify in your Supabase dashboard that the project is active/i);
});

test("handleAuthError preserves client errors with status 400", () => {
  let statusCode = 0;
  let jsonBody = null;
  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      jsonBody = body;
      return this;
    }
  };

  handleAuthError(mockRes, { message: "Invalid login credentials", status: 400 }, "login");
  assert.equal(statusCode, 400);
  assert.equal(jsonBody.error, "Invalid login credentials");
});

test("cleanUrl strips whitespace, trailing slashes, and accidental quotes", () => {
  const sanitize = (url) => (url || "").trim().replace(/^["']|["']$/g, "").trim().replace(/\/+$/, "");
  assert.equal(sanitize(' "https://abc.supabase.co/" '), "https://abc.supabase.co");
  assert.equal(sanitize("'https://xyz.supabase.co///'"), "https://xyz.supabase.co");
  assert.equal(sanitize("https://test.supabase.co"), "https://test.supabase.co");
});
