import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'

import { useQuality } from '../../store/quality'
import { BlockSet, disposeBlocks, PropBuilder } from '../blocks'
import { createToyMaterial, sharedMaterials, toyTime } from '../materials'
import { createGroundGeometry, createGroundMap } from './ground'
import { buildEggStands } from './eggs'
import { buildPortalFrame } from './portalFrame'
import { buildHangar, buildLanes } from './structures'
import { buildTargets } from './targets'
import { createThrowAreaDecal } from './throwArea'
import { buildWaterfall } from './waterfall'
import { buildTerrain } from './terrain'

/**
 * The static lobby: ground plane, every box (hills, trees, lane floors, hangar) in one
 * InstancedMesh, and every non-box prop (targets...) merged into one mesh. Three draw
 * calls for the whole environment.
 *
 * Built once. Quality only decides tree density at build time and whether the result
 * casts/receives realtime shadows.
 */
export function World() {
  const shadows = useQuality((s) => s.settings.shadows === 'realtime')
  const [decal, setDecal] = useState(null)

  // Drives every animated toy-material style (water...).
  useFrame((state) => {
    toyTime.value = state.clock.elapsedTime
  })

  useEffect(() => {
    let made = null
    let cancelled = false
    createThrowAreaDecal(useQuality.getState().settings.maxTexture).then((d) => {
      if (cancelled) {
        d.geometry.dispose()
        d.material.dispose()
        d.texture.dispose()
        return
      }
      made = d
      setDecal(d)
    })
    return () => {
      cancelled = true
      if (made) {
        made.geometry.dispose()
        made.material.dispose()
        made.texture.dispose()
      }
    }
  }, [])

  const { blocks, ground, props } = useMemo(() => {
    const { decorDensity, maxTexture } = useQuality.getState().settings
    const set = new BlockSet()
    buildTerrain(set, { treeDensity: decorDensity })
    buildLanes(set)
    buildHangar(set)
    buildPortalFrame(set)
    buildWaterfall(set)

    const propBuilder = new PropBuilder()
    buildTargets(propBuilder)
    buildEggStands(set, propBuilder)

    const map = createGroundMap(maxTexture)
    const groundMaterial = createToyMaterial({ instanced: false, vertexColors: false, map, studScale: 2 })

    return {
      blocks: set.build(sharedMaterials().blocks),
      props: propBuilder.build(),
      ground: { geometry: createGroundGeometry(), material: groundMaterial, map },
    }
  }, [])

  useEffect(
    () => () => {
      disposeBlocks(blocks)
      props?.dispose()
      ground.geometry.dispose()
      ground.material.dispose()
      ground.map.dispose()
    },
    [blocks, ground, props],
  )

  return (
    <>
      <mesh geometry={ground.geometry} material={ground.material} receiveShadow={shadows} />
      <primitive object={blocks} castShadow={shadows} receiveShadow={shadows} />
      {props && <mesh geometry={props} material={sharedMaterials().props} castShadow={shadows} receiveShadow={shadows} />}
      {decal && <mesh geometry={decal.geometry} material={decal.material} position={decal.position} renderOrder={1} />}
    </>
  )
}

export default World
