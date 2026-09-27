import { test } from "node:test";
import assert from "node:assert/strict";
import {
  visibleDetections,
  pipelineBudget,
  voxelEstimate,
  occupied,
} from "../src/lab/models.ts";
test("confidence threshold includes equality and allows no detections", () => {
  assert.equal(visibleDetections(0).length, 3);
  assert.equal(visibleDetections(0.73).length, 2);
  assert.equal(visibleDetections(1).length, 0);
});
test("pipeline marks overload only above the calculated budget", () => {
  assert.equal(pipelineBudget(1, 60, 12).overloaded, false);
  assert.equal(pipelineBudget(2, 60, 12).overloaded, true);
});
test("halving voxel size multiplies full-volume cell count by eight", () => {
  assert.equal(voxelEstimate(0.1), voxelEstimate(0.2) * 8);
  assert.equal(occupied(0, 5, 20), true);
  assert.equal(occupied(10, 10, 20), false);
});
