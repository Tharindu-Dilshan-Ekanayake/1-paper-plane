import { CanvasTexture, LinearMipmapLinearFilter, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from 'three'

import { THROW_AREA } from '@shared/world'

const FONT = '"Fredoka One", "Arial Rounded MT Bold", sans-serif'

/**
 * "THROW AREA" painted across the throw pad in big slanted outlined letters, as in the
 * reference. One textured quad; drawn after the font loads.
 *
 * @param {number} maxTexture texture size cap for the preset
 * @returns {Promise<{ geometry, material, texture, position: number[] }>}
 */
export async function createThrowAreaDecal(maxTexture) {
  await document.fonts?.load(`64px ${FONT}`).catch(() => null)
  const width = Math.min(1024, maxTexture)
  const height = Math.round(width * 0.22)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const size = height * 0.78
  ctx.font = `${size}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  // Italic by shear: the font has no italic face.
  ctx.setTransform(1, 0, -0.22, 1, height * 0.12, 0)
  ctx.lineWidth = size * 0.2
  ctx.strokeStyle = '#1b1b1f'
  ctx.strokeText('THROW AREA', width / 2, height / 2 + size * 0.06)
  ctx.fillStyle = '#ffffff'
  ctx.fillText('THROW AREA', width / 2, height / 2)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearMipmapLinearFilter
  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  })
  const w = THROW_AREA.maxX - THROW_AREA.minX
  const geometry = new PlaneGeometry(w, w * 0.22)
  geometry.rotateX(-Math.PI / 2)
  return { geometry, material, texture, position: [0, 0.03, THROW_AREA.minZ + 2.4] }
}
