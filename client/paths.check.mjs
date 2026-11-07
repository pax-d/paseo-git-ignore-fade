import assert from "node:assert/strict";
import { isIgnored, resolvePaths } from "./paths.ts";

const r = (index, name, pad) => ({ index, name, pad });
assert.deepEqual(
  resolvePaths([r(0, "dist", 12), r(1, "src", 12), r(2, "utils", 24), r(3, "debug.log", 36), r(4, "index.ts", 24), r(5, "logs", 12)], 12),
  ["dist", "src", "src/utils", "src/utils/debug.log", "src/index.ts", "logs"],
);
assert.deepEqual(resolvePaths([r(7, "deep", 36), r(8, "x", 12), r(9, "y", 24)], 12), [null, "x", "x/y"]);
assert.deepEqual(resolvePaths([r(7, "deep", 36)], null), [null]);
const set = new Set(["logs", "src/utils/debug.log", "node_modules"]);
assert.ok(isIgnored("logs", set));
assert.ok(isIgnored("node_modules/a/b.js", set));
assert.ok(isIgnored("src/utils/debug.log", set));
assert.ok(!isIgnored("src/utils", set));
assert.ok(!isIgnored("logsx", set));
console.log("ok");
