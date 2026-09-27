// Educational fixtures, not inference results or hardware benchmarks.
export const detections = [
  { label: 'fire', confidence: 0.92, x: 135, y: 122, w: 70, h: 90 },
  { label: 'smoke', confidence: 0.73, x: 110, y: 30, w: 120, h: 100 },
  { label: 'fire', confidence: 0.38, x: 345, y: 137, w: 55, h: 68 },
]
export function visibleDetections(threshold: number) { return detections.filter(d => d.confidence >= threshold) }
export function pipelineBudget(streams: number, fps: number, inferenceMs: number) {
  const demand = streams * fps
  const capacity = 1000 / (2 + 1 + inferenceMs + 1)
  return { demand, capacity, overloaded: demand > capacity }
}
export function voxelEstimate(size: number) { return Math.ceil(4 / size) ** 3 }
export function occupied(x: number, y: number, n: number) {
  return x === 0 || y === 0 || x === n - 1 || y === n - 1 ||
    (x >= n * .25 && x < n * .45 && y >= n * .3 && y < n * .65) ||
    (x >= n * .65 && x < n * .8 && y >= n * .2 && y < n * .4)
}
