/**
 * Hand-off from network events to the frame loop. Events arrive on timers and sockets;
 * the effects they trigger need the renderer's clock and camera, so they are queued
 * here and drained by the effect systems inside useFrame. Plain arrays, never state.
 */

const MAX_QUEUED = 12
const trainQueue = []

export function queueTrainFx(event) {
  trainQueue.push(event)
  if (trainQueue.length > MAX_QUEUED) trainQueue.shift()
}

export function drainTrainFx(handle) {
  while (trainQueue.length) handle(trainQueue.shift())
}
