const test = require("node:test");
const assert = require("node:assert/strict");
const digestRouter = require("../routes/digest");

test("digest route is an express router instance", () => {
  assert.equal(typeof digestRouter, "function");
  assert.equal(typeof digestRouter.stack, "object");
});

test("digest route returns fresh news with 75 capacity format", async () => {
  const req = { query: { niches: "" } };
  let jsonRes = null;
  const res = { json(d) { jsonRes = d; return this; } };
  const routeLayer = digestRouter.stack.find(s => s.route && s.route.path === "/daily-digest");
  await routeLayer.route.stack[0].handle(req, res);
  assert.ok(jsonRes.digest, "digest should not be null");
  assert.equal(jsonRes.digest.capacity, 75, "capacity is 75");
  assert.ok(jsonRes.digest.stories.length > 0, "stories are populated");
  assert.ok(jsonRes.digest.stories[0].url.startsWith("http"), "url is valid link");
});
