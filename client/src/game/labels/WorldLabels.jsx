import { useEffect, useState } from 'react'

import { getGame } from '../../store/game'
import { useQuality } from '../../store/quality'
import { LabelBatch } from './LabelBatch'
import { lobbyLabels } from './lobbyLabels'
import { getActiveLabelBatch, setActiveLabelBatch } from './registry'

/**
 * All floating lobby text, batched (see LabelBatch). Builds asynchronously once the
 * font is ready; the world is playable before it appears.
 */
export function WorldLabels() {
  const maxDistance = useQuality((s) => s.settings.labelDistance)
  const [batch, setBatch] = useState(null)

  useEffect(() => {
    const next = new LabelBatch({ pageSize: useQuality.getState().settings.maxTexture })
    for (const label of lobbyLabels(getGame().profile)) next.add(label.id, label.position, label.spec, label)
    let cancelled = false
    next.build().then(() => {
      if (cancelled) return
      setActiveLabelBatch(next)
      setBatch(next)
    })
    return () => {
      cancelled = true
      if (getActiveLabelBatch() === next) setActiveLabelBatch(null)
      next.dispose()
    }
  }, [])

  useEffect(() => {
    batch?.setMaxDistance(maxDistance)
  }, [batch, maxDistance])

  if (!batch) return null
  return batch.meshes.map((mesh) => <primitive key={mesh.uuid} object={mesh} />)
}

export default WorldLabels
