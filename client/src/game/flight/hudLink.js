/**
 * The flight's distance counter is a DOM element written from the frame loop. The
 * overlay registers it here; the renderer writes to it only when the whole-metre value
 * changes, so React never re-renders during a flight.
 */
let distanceEl = null
let shown = -1

export function setDistanceElement(el) {
  distanceEl = el
  shown = -1
}

export function writeDistance(meters) {
  const m = Math.floor(meters)
  if (!distanceEl || m === shown) return
  shown = m
  const text = `${m.toLocaleString('en-US')}m`
  for (const span of distanceEl.querySelectorAll('[data-distance]')) span.textContent = text
}
