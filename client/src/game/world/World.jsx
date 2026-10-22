import { useEffect, useMemo } from 'react'

import { useQuality } from '../../store/quality'
import { BlockSet, disposeBlocks, PropBuilder } from '../blocks'
import { createToyMaterial, sharedMaterials } from '../materials'
import { createGroundGeometry, createGroundMap } from './ground'
import { buildHangar, buildLanes } from './structures'
import { buildTargets } from './targets'
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

  const { blocks, ground, props } = useMemo(() => {
    const { decorDensity, maxTexture } = useQuality.getState().settings
    const set = new BlockSet()
    buildTerrain(set, { treeDensity: decorDensity })
    buildLanes(set)
    buildHangar(set)

    const propBuilder = new PropBuilder()
    buildTargets(propBuilder)

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
    </>
  )
}

export default World
