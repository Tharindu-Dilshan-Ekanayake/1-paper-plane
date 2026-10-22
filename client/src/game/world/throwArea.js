import { CanvasTexture, LinearMipmapLinearFilter, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from 'three'

import { SHOP_BOARD, STAGE, THROW_AREA } from '@shared/world'

const FONT = '"Fredoka One", "Arial Rounded MT Bold", sans-serif'

/**
 * Big outlined text painted on a textured quad, slanted by shear (the font has no
 * italic face). `fill` is a colour or a top-to-bottom list of gradient stops.
 * Every painted sign shares one material setup, so one shader program.
 */
function paintText(text, maxTexture, { aspect, fill, slant = 0.22, worldWidth }) {
  const width = Math.min(1024, maxTexture)
  const height = Math.round(width * aspect)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const size = height * 0.78
  ctx.font = `${size}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.setTransform(1, 0, -slant, 1, height * slant * 0.55, 0)
  ctx.lineWidth = size * 0.2
  ctx.strokeStyle = '#1b1b1f'
  ctx.strokeText(text, width / 2, height / 2 + size * 0.06)
  if (Array.isArray(fill)) {
    const gradient = ctx.createLinearGradient(0, height * 0.15, 0, height * 0.85)
    fill.forEach((stop, i) => gradient.addColorStop(i / (fill.length - 1), stop))
    ctx.fillStyle = gradient
  } else {
    ctx.fillStyle = fill
  }
  ctx.fillText(text, width / 2, height / 2)

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
  const geometry = new PlaneGeometry(worldWidth, worldWidth * aspect)
  return { geometry, material, texture }
}

/**
 * The painted signs, drawn once the font has loaded: "THROW AREA" across the throw
 * pad and "FRISBEES" on the shop's board.
 *
 * @param {number} maxTexture texture size cap for the preset
 * @returns {Promise<Array<{ geometry, material, texture, position: number[], rotation: number[] }>>}
 */
export async function createPaintedSigns(maxTexture) {
  await document.fonts?.load(`64px ${FONT}`).catch(() => null)

  const padWidth = THROW_AREA.maxX - THROW_AREA.minX
  const throwArea = paintText('THROW AREA', maxTexture, { aspect: 0.22, fill: '#ffffff', worldWidth: padWidth })
  // Just above the pad's raised yellow fill (its top is 0.12 up), centred on it.
  throwArea.position = [0, STAGE.height + 0.15, (THROW_AREA.minZ + THROW_AREA.maxZ) / 2]
  throwArea.rotation = [-Math.PI / 2, 0, 0]

  const boardWidth = SHOP_BOARD.maxZ - SHOP_BOARD.minZ - 3
  const board = paintText('FRISBEES', maxTexture, {
    aspect: 0.26,
    fill: ['#fff6b0', '#ffd21f', '#ff8a00'],
    slant: 0.14,
    worldWidth: boardWidth,
  })
  // On the board's face, turned to the plaza (west).
  board.position = [SHOP_BOARD.x - 0.36, SHOP_BOARD.top - 4.1, (SHOP_BOARD.minZ + SHOP_BOARD.maxZ) / 2]
  board.rotation = [0, -Math.PI / 2, 0]

  return [throwArea, board]
}
