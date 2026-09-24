// Unit tests for the uniqueness checker's shingle/Jaccard maths.
// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const { shingles, jaccard } = require("../routes/uniqueness");

test("shingles produces one 5-word phrase per window", () => {
  const s = shingles("one two three four five six seven");
  assert.equal(s.length, 3);
  assert.equal(s[0], "one two three four five");
  assert.equal(s[2], "three four five six seven");
});

test("shingles normalises case and strips punctuation", () => {
  assert.deepEqual(
    shingles("Hello, World! This is Fine today now"),
    shingles("hello world this is fine today now")
  );
});

test("shingles returns nothing for text shorter than the window", () => {
  assert.deepEqual(shingles("too short here"), []);
  assert.deepEqual(shingles(""), []);
  assert.deepEqual(shingles(null), []);
  assert.deepEqual(shingles(undefined), []);
});

test("shingles never contains duplicates", () => {
  const s = shingles("a b c d e a b c d e");
  assert.equal(new Set(s).size, s.length);
});

test("jaccard of identical sets is 1", () => {
  assert.equal(jaccard(["a", "b", "c"], ["a", "b", "c"]), 1);
});

test("jaccard of disjoint sets is 0", () => {
  assert.equal(jaccard(["a", "b"], ["c", "d"]), 0);
});

test("jaccard of a half-overlap is one third", () => {
  assert.equal(jaccard(["a", "b"], ["a", "c"]), 1 / 3);
});

test("jaccard is 0 when either side is empty", () => {
  assert.equal(jaccard([], ["a"]), 0);
  assert.equal(jaccard(["a"], []), 0);
  assert.equal(jaccard([], []), 0);
});

test("jaccard is order-insensitive", () => {
  assert.equal(jaccard(["a", "b"], ["b", "a"]), 1);
});
