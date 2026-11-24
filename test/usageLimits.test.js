const test = require("node:test");
const assert = require("node:assert/strict");
const { LIMITS, getUsage, canGenerate, recordUsage, setPlan, checkLimitMiddleware } = require("../services/usageLimits");

test("LIMITS constants reflect free tier policy", () => {
  assert.equal(LIMITS.scripts, 5, "5 free scripts per day");
  assert.equal(LIMITS.images, 3, "3 free post images per day");
});

test("fresh user starts with 0 used and full quota", () => {
  const mockReq = { headers: { "x-user-id": "test-user-fresh-" + Date.now() } };
  const usage = getUsage(mockReq);
  assert.equal(usage.scripts.used, 0);
  assert.equal(usage.scripts.remaining, 5);
  assert.equal(usage.scripts.blocked, false);

  assert.equal(usage.images.used, 0);
  assert.equal(usage.images.remaining, 3);
  assert.equal(usage.images.blocked, false);
});

test("canGenerate permits generation under limit and blocks at limit", () => {
  const uid = "test-user-quota-" + Date.now();
  const mockReq = { headers: { "x-user-id": uid } };

  // Generate 5 scripts
  for (let i = 0; i < 5; i++) {
    const check = canGenerate(mockReq, "scripts");
    assert.equal(check.allowed, true, `Script #${i+1} should be allowed`);
    recordUsage(mockReq, "scripts", 1);
  }

  // 6th script should be blocked
  const blockedCheck = canGenerate(mockReq, "scripts");
  assert.equal(blockedCheck.allowed, false, "6th script must be blocked");
  assert.equal(blockedCheck.used, 5);
  assert.equal(blockedCheck.limit, 5);

  // Images should still be allowed
  const imageCheck = canGenerate(mockReq, "images");
  assert.equal(imageCheck.allowed, true, "Images quota is independent of scripts");
});

test("images limit enforces 3 generations per day", () => {
  const uid = "test-user-img-" + Date.now();
  const mockReq = { headers: { "x-user-id": uid } };

  for (let i = 0; i < 3; i++) {
    assert.equal(canGenerate(mockReq, "images").allowed, true);
    recordUsage(mockReq, "images", 1);
  }

  const blocked = canGenerate(mockReq, "images");
  assert.equal(blocked.allowed, false, "4th image generation must be blocked");
  assert.equal(blocked.used, 3);
});

test("checkLimitMiddleware returns 403 with DAILY_LIMIT_REACHED error structure", () => {
  const uid = "test-user-mw-" + Date.now();
  const mockReq = { headers: { "x-user-id": uid } };

  // Use up all 3 images
  recordUsage(mockReq, "images", 3);

  const mw = checkLimitMiddleware("images");
  let statusCode = 0;
  let jsonPayload = null;

  const mockRes = {
    status(c) {
      statusCode = c;
      return this;
    },
    json(data) {
      jsonPayload = data;
      return this;
    }
  };

  let nextCalled = false;
  mw(mockReq, mockRes, () => { nextCalled = true; });

  assert.equal(nextCalled, false, "next() must not be called when limit reached");
  assert.equal(statusCode, 403, "Status should be 403 Forbidden");
  assert.equal(jsonPayload.error, "DAILY_LIMIT_REACHED");
  assert.equal(jsonPayload.limitType, "images");
  assert.equal(jsonPayload.limit, 3);
  assert.equal(jsonPayload.used, 3);
});

test("pro plan bypasses limits", () => {
  const uid = "test-user-pro-" + Date.now();
  setPlan(`user:${uid}`, "pro");
  const mockReq = { headers: { "x-user-id": uid } };

  recordUsage(mockReq, "scripts", 10);
  const check = canGenerate(mockReq, "scripts");
  assert.equal(check.allowed, true, "Pro plan has unlimited scripts");
});
