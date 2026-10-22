/** The live label batch, for systems that relabel things (pads, stock counters). */
let activeBatch = null

export function setActiveLabelBatch(batch) {
  activeBatch = batch
}

export function getActiveLabelBatch() {
  return activeBatch
}

/** Redraws one world label. No-op until the labels have built. */
export function updateWorldLabel(id, spec) {
  activeBatch?.update(id, spec)
}
