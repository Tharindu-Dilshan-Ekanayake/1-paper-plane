/**
 * The game's icon set, hand-drawn as SVG: glossy cartoon style with thick dark outlines,
 * matching the reference HUD. Strings rather than components so the same art feeds
 * both the DOM HUD (<img src>) and the canvas-drawn 3D world labels.
 *
 * Every icon uses a 100x100 viewBox. Gradient ids are prefixed per icon so icons can
 * be inlined side by side without clashing.
 */

const OUT = '#1b1b1f'

const svg = (body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${defs}</defs>${body}</svg>`

const vgrad = (id, stops) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join('')}</linearGradient>`

const GOLD = [
  [0, '#fff6a3'],
  [0.45, '#ffcf2e'],
  [1, '#f08c00'],
]

const trophy = svg(
  `<g stroke="${OUT}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <path d="M27 24H11c0 19 9 28 22 30" fill="none" stroke-width="13"/>
    <path d="M73 24h16c0 19-9 28-22 30" fill="none" stroke-width="13"/>
  </g>
  <g fill="none" stroke="url(#tr-g)" stroke-width="5" stroke-linecap="round">
    <path d="M27 24H11c0 19 9 28 22 30"/><path d="M73 24h16c0 19-9 28-22 30"/>
  </g>
  <g stroke="${OUT}" stroke-width="5" stroke-linejoin="round" fill="url(#tr-g)">
    <path d="M42 62h16l3 15H39z"/>
    <rect x="27" y="76" width="46" height="15" rx="5"/>
    <path d="M22 12h56v22c0 19-12 30-28 30S22 53 22 34z"/>
  </g>
  <path d="M50 21l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L50 44.6l-9.3 4.9 1.8-10.3-7.5-7.3 10.4-1.5z" fill="#fffbd1" stroke="#d98900" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M30 18v16c0 8 3 14 8 18" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".75"/>`,
  vgrad('tr-g', GOLD),
)

const rebirth = svg(
  `<path d="M16 66A36 36 0 0 1 82 26" fill="none" stroke="${OUT}" stroke-width="17" stroke-linecap="round"/>
  <path d="M16 66A36 36 0 0 1 82 26" fill="none" stroke="url(#rb-a)" stroke-width="9" stroke-linecap="round"/>
  <path d="M71 10l24 9-15 20z" fill="#5be3ff" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="52" cy="58" r="31" fill="url(#rb-w)" stroke="${OUT}" stroke-width="5.5"/>
  <path d="M21 58a31 31 0 0 1 62 0z" fill="url(#rb-r)" stroke="${OUT}" stroke-width="5.5" stroke-linejoin="round"/>
  <path d="M21 58h62" stroke="${OUT}" stroke-width="6"/>
  <circle cx="52" cy="58" r="9" fill="#fff" stroke="${OUT}" stroke-width="5"/>
  <path d="M33 43c4-8 11-12 18-13" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>`,
  vgrad('rb-r', [
    [0, '#ff7a96'],
    [1, '#e0123f'],
  ]) +
    vgrad('rb-w', [
      [0, '#ffffff'],
      [1, '#cfd9e6'],
    ]) +
    `<linearGradient id="rb-a" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#1fa3ff"/><stop offset="1" stop-color="#7ff0ff"/></linearGradient>`,
)

const muscle = svg(
  `<path d="M14 88V64c0-20 22-30 38-14l4 3V34c-3-6-3-14 3-19 7-6 19-6 25 2 5 7 5 16-1 21l1 34c0 10-8 17-18 17z" fill="url(#mu-g)" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M56 53c4 3 9 3 13-1" fill="none" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>
  <path d="M62 24c3-3 8-4 12-2" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>
  <path d="M22 70c2-9 10-14 20-11" fill="none" stroke="#fff6c4" stroke-width="5" stroke-linecap="round" opacity=".85"/>
  <path d="M64 15c4-2 9-1 12 1" fill="none" stroke="#fff6c4" stroke-width="4" stroke-linecap="round" opacity=".85"/>`,
  vgrad('mu-g', [
    [0, '#ffd84a'],
    [0.6, '#ffa21c'],
    [1, '#f07a00'],
  ]),
)

const bux = svg(
  `<path d="M50 6l38 22v44L50 94 12 72V28z" fill="url(#bx-g)" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M50 27l19 11v24L50 73 31 62V38z" fill="#0d7a2c" stroke="#b9ffc8" stroke-width="7" stroke-linejoin="round"/>
  <path d="M22 32l26-15" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>`,
  vgrad('bx-g', [
    [0, '#8dff7a'],
    [0.5, '#2fd14a'],
    [1, '#119934'],
  ]),
)

const pets = svg(
  `<path d="M17 40L22 8l24 22zM83 40L78 8 54 30z" fill="url(#pt-o)" stroke="${OUT}" stroke-width="5.5" stroke-linejoin="round"/>
  <path d="M24 34l2-15 11 10zM76 34l-2-15-11 10z" fill="#ffc2c9"/>
  <rect x="10" y="24" width="80" height="68" rx="18" fill="url(#pt-o)" stroke="${OUT}" stroke-width="6"/>
  <path d="M38 26l3 10M50 25v11M62 26l-3 10" stroke="#c94a00" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="50" cy="74" rx="22" ry="14" fill="#fff4e6" stroke="${OUT}" stroke-width="4"/>
  <ellipse cx="33" cy="55" rx="8" ry="10" fill="${OUT}"/><ellipse cx="67" cy="55" rx="8" ry="10" fill="${OUT}"/>
  <circle cx="30" cy="51" r="3.4" fill="#fff"/><circle cx="64" cy="51" r="3.4" fill="#fff"/>
  <path d="M45 66h10l-5 5z" fill="#ff6f8f" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M42 76c4 4 12 4 16 0" fill="none" stroke="${OUT}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M46 78c0 9 8 9 8 0" fill="#ff5f84" stroke="${OUT}" stroke-width="3"/>
  <path d="M18 44c1-9 6-14 14-16" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".55"/>`,
  vgrad('pt-o', [
    [0, '#ffb14a'],
    [1, '#ff7414'],
  ]),
)

const items = svg(
  `<path d="M34 22c0-14 32-14 32 0" fill="none" stroke="${OUT}" stroke-width="13" stroke-linecap="round"/>
  <path d="M34 22c0-14 32-14 32 0" fill="none" stroke="#c4192c" stroke-width="5" stroke-linecap="round"/>
  <rect x="14" y="20" width="72" height="72" rx="20" fill="url(#it-r)" stroke="${OUT}" stroke-width="6"/>
  <rect x="26" y="52" width="48" height="32" rx="9" fill="url(#it-p)" stroke="${OUT}" stroke-width="5"/>
  <path d="M26 64h48" stroke="${OUT}" stroke-width="4"/>
  <rect x="40" y="30" width="20" height="16" rx="3" fill="#fff" stroke="${OUT}" stroke-width="4"/>
  <path d="M44 34v8l6-5 6 5v-8" fill="none" stroke="#e0213b" stroke-width="3" stroke-linejoin="round"/>
  <path d="M22 40c0-8 4-12 10-13" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".55"/>`,
  vgrad('it-r', [
    [0, '#ff6b62'],
    [1, '#d6182b'],
  ]) +
    vgrad('it-p', [
      [0, '#ff8a80'],
      [1, '#e42a3b'],
    ]),
)

const store = svg(
  `<path d="M26 44c0-34 48-34 48 0" fill="none" stroke="${OUT}" stroke-width="14" stroke-linecap="round"/>
  <path d="M26 44c0-34 48-34 48 0" fill="none" stroke="#5fc4ff" stroke-width="6" stroke-linecap="round"/>
  <path d="M8 40h84l-9 48c-1 4-4 6-8 6H25c-4 0-7-2-8-6z" fill="url(#st-y)" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
  <rect x="5" y="36" width="90" height="13" rx="6" fill="#ffe46b" stroke="${OUT}" stroke-width="5"/>
  <path d="M30 58v26M43 58v26M57 58v26M70 58v26" stroke="#d18a00" stroke-width="5" stroke-linecap="round"/>
  <path d="M18 66h64" stroke="#d18a00" stroke-width="4" stroke-linecap="round"/>`,
  vgrad('st-y', [
    [0, '#ffe25a'],
    [1, '#ffa412'],
  ]),
)

const gift = svg(
  `<path d="M50 28C40 6 18 8 22 22c3 9 17 8 28 6zM50 28C60 6 82 8 78 22c-3 9-17 8-28 6z" fill="url(#gf-y)" stroke="${OUT}" stroke-width="5.5" stroke-linejoin="round"/>
  <rect x="10" y="44" width="80" height="48" rx="7" fill="url(#gf-p)" stroke="${OUT}" stroke-width="6"/>
  <rect x="6" y="28" width="88" height="20" rx="6" fill="url(#gf-p2)" stroke="${OUT}" stroke-width="6"/>
  <path d="M41 28v64h18V28z" fill="url(#gf-y)" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M16 54v28" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5"/>`,
  vgrad('gf-p', [
    [0, '#ff6fc3'],
    [1, '#e3168f'],
  ]) +
    vgrad('gf-p2', [
      [0, '#ff8fd2'],
      [1, '#f0369f'],
    ]) +
    vgrad('gf-y', [
      [0, '#fff27a'],
      [1, '#ffb01e'],
    ]),
)

const calendar = svg(
  `<rect x="10" y="16" width="80" height="76" rx="12" fill="#ffffff" stroke="${OUT}" stroke-width="6"/>
  <path d="M10 28c0-7 5-12 12-12h56c7 0 12 5 12 12v12H10z" fill="url(#cl-r)" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
  <rect x="26" y="6" width="9" height="20" rx="4" fill="#cfd8e3" stroke="${OUT}" stroke-width="4"/>
  <rect x="65" y="6" width="9" height="20" rx="4" fill="#cfd8e3" stroke="${OUT}" stroke-width="4"/>
  <g fill="#ff9a1f"><rect x="22" y="50" width="12" height="10" rx="2"/><rect x="44" y="50" width="12" height="10" rx="2"/><rect x="66" y="50" width="12" height="10" rx="2"/><rect x="22" y="68" width="12" height="10" rx="2"/><rect x="44" y="68" width="12" height="10" rx="2" fill="#2fd14a"/><rect x="66" y="68" width="12" height="10" rx="2"/></g>`,
  vgrad('cl-r', [
    [0, '#ff6b6b'],
    [1, '#d91c3a'],
  ]),
)

const star = svg(
  `<path d="M50 8l12 25 27 4-20 19 5 27-24-13-24 13 5-27-20-19 27-4z" fill="#ffffff" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>`,
)

const gear = svg(
  `<path d="M43 6h14l3 12 9 4 11-7 10 10-7 11 4 9 12 3v14l-12 3-4 9 7 11-10 10-11-7-9 4-3 12H43l-3-12-9-4-11 7-10-10 7-11-4-9-12-3V43l12-3 4-9-7-11 10-10 11 7 9-4z" fill="url(#gr-b)" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="50" cy="50" r="15" fill="#e8f4ff" stroke="${OUT}" stroke-width="5"/>`,
  vgrad('gr-b', [
    [0, '#6cc3ff'],
    [1, '#1d7fe0'],
  ]),
)

const plane = svg(
  `<path d="M4 50L96 14 66 90 52 62z" fill="#ffffff" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M52 62L96 14 40 56z" fill="#c9dcf2" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>`,
)

const autoThrow = svg(
  `<path d="M20 52a30 30 0 0 1 50-24" fill="none" stroke="${OUT}" stroke-width="14" stroke-linecap="round"/>
  <path d="M20 52a30 30 0 0 1 50-24" fill="none" stroke="#7fe7ff" stroke-width="7" stroke-linecap="round"/>
  <path d="M62 14l20 10-16 14z" fill="#7fe7ff" stroke="${OUT}" stroke-width="4.5" stroke-linejoin="round"/>
  <path d="M80 48a30 30 0 0 1-50 24" fill="none" stroke="${OUT}" stroke-width="14" stroke-linecap="round"/>
  <path d="M80 48a30 30 0 0 1-50 24" fill="none" stroke="#7fe7ff" stroke-width="7" stroke-linecap="round"/>
  <path d="M38 86L18 76l16-14z" fill="#7fe7ff" stroke="${OUT}" stroke-width="4.5" stroke-linejoin="round"/>
  <path d="M30 50l40-14-12 30-6-11z" fill="#fff" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>`,
)

/** A round potion flask with a cork, filled with `liquid` and a small badge icon. */
function potion(id, liquid, liquidDark, badge) {
  return svg(
    `<rect x="38" y="6" width="24" height="16" rx="4" fill="#c98a4b" stroke="${OUT}" stroke-width="5"/>
    <path d="M40 22h20v12c16 5 26 18 26 32 0 18-16 30-36 30S14 84 14 66c0-14 10-27 26-32z" fill="#e8f6ff" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M18 64c10-6 22 4 32 0s22-6 32 0c0 16-14 26-32 26S18 80 18 64z" fill="url(#${id}-l)"/>
    <path d="M24 56c2-8 8-14 16-16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    ${badge}`,
    vgrad(`${id}-l`, [
      [0, liquid],
      [1, liquidDark],
    ]),
  )
}

const potionWins = potion(
  'pw',
  '#4fd2ff',
  '#1565e0',
  `<path d="M38 62h24v6c0 7-5 12-12 12s-12-5-12-12z" fill="#ffd23a" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
   <rect x="42" y="80" width="16" height="6" rx="2" fill="#ffd23a" stroke="${OUT}" stroke-width="3"/>`,
)
const potionPower = potion(
  'pp',
  '#ffd23a',
  '#ff8a00',
  `<path d="M38 84V74c0-7 9-10 14-4V62c-2-3 0-7 4-7s6 3 5 7v15c0 4-3 7-7 7z" fill="#ffb01e" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>`,
)

/** A spotted egg in the given colours. */
export function eggSvg(base, dark, spot) {
  return svg(
    `<path d="M50 6C28 6 12 40 12 62c0 20 17 32 38 32s38-12 38-32C88 40 72 6 50 6z" fill="url(#eg-g)" stroke="${OUT}" stroke-width="6"/>
    <ellipse cx="34" cy="50" rx="7" ry="9" fill="${spot}"/><ellipse cx="62" cy="34" rx="6" ry="7" fill="${spot}"/>
    <ellipse cx="66" cy="68" rx="9" ry="8" fill="${spot}"/><ellipse cx="44" cy="80" rx="5" ry="4" fill="${spot}"/>
    <path d="M26 46c2-14 10-26 18-30" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>`,
    vgrad('eg-g', [
      [0, base],
      [1, dark],
    ]),
  )
}

const lock = svg(
  `<path d="M30 46V32c0-26 40-26 40 0v14" fill="none" stroke="${OUT}" stroke-width="16"/>
  <path d="M30 46V32c0-26 40-26 40 0v14" fill="none" stroke="#c7d2de" stroke-width="7"/>
  <rect x="16" y="42" width="68" height="50" rx="10" fill="url(#lk-g)" stroke="${OUT}" stroke-width="6"/>
  <circle cx="50" cy="62" r="7" fill="${OUT}"/><path d="M47 64h6l2 14h-10z" fill="${OUT}"/>`,
  vgrad('lk-g', GOLD),
)

const users = svg(
  `<circle cx="36" cy="32" r="16" fill="#fff" stroke="${OUT}" stroke-width="6"/>
  <path d="M8 84c0-18 12-30 28-30s28 12 28 30z" fill="#fff" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
  <circle cx="68" cy="30" r="13" fill="#c9e6ff" stroke="${OUT}" stroke-width="5"/>
  <path d="M60 52c4-2 6-2 8-2 14 0 24 10 24 26H68" fill="#c9e6ff" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>`,
)

const close = svg(
  `<path d="M24 24l52 52M76 24L24 76" stroke="${OUT}" stroke-width="22" stroke-linecap="round"/>
  <path d="M24 24l52 52M76 24L24 76" stroke="#fff" stroke-width="11" stroke-linecap="round"/>`,
)

const arrowDown = svg(
  `<path d="M36 8h28v40h20L50 90 16 48h20z" fill="#ffffff" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>`,
)

const check = svg(
  `<path d="M16 52l22 22 46-48" fill="none" stroke="${OUT}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 52l22 22 46-48" fill="none" stroke="#5cf064" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
)

const portal = svg(
  `<circle cx="50" cy="50" r="42" fill="url(#po-g)" stroke="${OUT}" stroke-width="6"/>
  <path d="M50 50c0-10 14-10 14 0 0 16-28 16-28 0 0-22 42-22 42 0 0 28-56 28-56 0" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`,
  `<radialGradient id="po-g"><stop offset="0" stop-color="#b8f3ff"/><stop offset="1" stop-color="#2f7fe6"/></radialGradient>`,
)

const sound = svg(
  `<path d="M12 38h16l22-18v60L28 62H12z" fill="#fff" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M62 34c8 8 8 24 0 32M72 24c14 14 14 38 0 52" fill="none" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>`,
)

const starGold = svg(
  `<path d="M50 6l13 27 29 4-21 20 5 29-26-14-26 14 5-29L8 37l29-4z" fill="url(#sg-g)" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M38 30l7-13" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".75"/>`,
  vgrad('sg-g', GOLD),
)

const fastForward = svg(
  `<path d="M8 18l40 32-40 32z" fill="url(#ff-g)" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M50 18l40 32-40 32z" fill="url(#ff-g)" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/>`,
  vgrad('ff-g', [
    [0, '#ffffff'],
    [1, '#9fdcff'],
  ]),
)

export const ICON_SVGS = {
  starGold,
  fastForward,
  trophy,
  rebirth,
  muscle,
  bux,
  pets,
  items,
  store,
  gift,
  calendar,
  star,
  gear,
  plane,
  autoThrow,
  potionWins,
  potionPower,
  lock,
  users,
  close,
  arrowDown,
  check,
  portal,
  sound,
}

/** Egg colours by egg id, shared by the icons and the 3D eggs. */
export const EGG_COLORS = {
  basic: ['#ffffff', '#cdd6e2', '#e2e8f0'],
  meadow: ['#7cf08a', '#2fae4a', '#c8ffd0'],
  sunset: ['#ffc07a', '#ff6a3d', '#ffe2b8'],
  unicorn: ['#f6eaff', '#d3b4ff', '#ffd1f0'],
  demon: ['#4a1d2e', '#1a0710', '#ff4a1c'],
}

const urlCache = new Map()

/** `data:` URL for an icon name, or `egg:<id>` for an egg. */
export function iconUrl(name) {
  let url = urlCache.get(name)
  if (url) return url
  let markup = ICON_SVGS[name]
  if (!markup && name.startsWith('egg:')) {
    const colors = EGG_COLORS[name.slice(4)] || EGG_COLORS.basic
    markup = eggSvg(...colors)
  }
  if (!markup) return null
  url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
  urlCache.set(name, url)
  return url
}
