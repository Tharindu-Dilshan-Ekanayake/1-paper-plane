import { EGGS, ITEMS, LANES, MULTI_HATCH, PLANES, PRODUCTS, TRAIN_INTERVAL } from './balance.js'
import {
  advanceTutorial,
  applyRebirth,
  applyThrow,
  applyTrain,
  awardBadge,
  buyPlane,
  claimDaily,
  claimFreeReward,
  claimPlaytime,
  createSession,
  deletePet,
  equipBestPets,
  equipPet,
  equipPlane,
  friendBoost,
  grantProduct,
  hatchEgg,
  isLaneUnlocked,
  isMaxLevel,
  planeById,
  unequipPet,
  usePotion,
} from './logic.js'
import { eggStandNear, FREE_REWARD, inRect, inThrowArea, laneRect, PLANE_PADS, padRect } from './world.js'

const PLANES_INDEX = Object.fromEntries(PLANES.map((p, i) => [p.id, i]))

/** How far outside a lane's floor still counts as "in" it (network jitter). */
const LANE_SLACK = 0.8
/** Same for the throw area. */
const THROW_SLACK = 1.5
/** Pads are bought by standing on them; allow for a little lag. */
const PAD_SLACK = 2

/**
 * One player's authoritative session: validates intents, runs the training tick and
 * reports what happened through `emit`.
 *
 * Transport-agnostic on purpose. The Colyseus room wraps one of these per client; the
 * offline mode wraps one for the local player. Either way the rules that run are
 * byte-for-byte the same.
 *
 * Events emitted (type, payload):
 * - 'profile'  { profile, session }  full state, after anything structural
 * - 'train'    { gain, power, level, levelProgress, leveledUp }  each training throw
 * - 'throw'    { distance, wins, trophies, duration, multiplier }  a throw to replay
 * - 'hatch'    { eggId, pets: [{ uid, id }] }  pets to reveal
 * - 'toast'    { text, kind }
 * - 'badge'    { id, name }
 *
 * `onThrow(result)` lets the host tell other players about a throw (ghost planes).
 */
export class PlayerSession {
  /**
   * @param {object} profile normalized profile (see logic.normalizeProfile)
   * @param {{ now: number, emit: (type: string, payload?: object) => void,
   *           getPosition: () => {x: number, y: number, z: number},
   *           getFriends?: () => number, mockPurchases?: boolean,
   *           onPurchase?: (productId: string) => boolean }} options
   *   `mockPurchases` grants premium products on request with no payment (dev and
   *   offline only). `onPurchase` lets the host veto or count a grant (stock limits).
   */
  constructor(profile, { now, emit, getPosition, getFriends = () => 0, mockPurchases = false, onPurchase, onThrow }) {
    this.profile = profile
    this.session = createSession(now)
    this.emit = emit
    this.getPosition = getPosition
    this.getFriends = getFriends
    this.mockPurchases = mockPurchases
    this.onPurchase = onPurchase
    this.onThrow = onThrow

    /** Lane the client says it's in; verified against position every tick. */
    this.lane = -1
    this.trainTimer = 0
    /** Server time until which the player is watching a throw and can't train or throw. */
    this.busyUntil = 0
    this.dirty = false
  }

  // --- Plumbing --------------------------------------------------------------------

  sendProfile() {
    this.dirty = false
    this.emit('profile', { profile: this.profile, session: this.session })
  }

  toast(text, kind = 'info') {
    this.emit('toast', { text, kind })
  }

  fail(result) {
    if (result && !result.ok && result.error) this.toast(result.error, 'error')
    return result
  }

  badge(id) {
    const badge = awardBadge(this.profile, id)
    if (badge) {
      this.dirty = true
      this.emit('badge', badge)
    }
  }

  tutorial(event) {
    if (advanceTutorial(this.profile, event)) this.dirty = true
  }

  // --- Intents ---------------------------------------------------------------------

  /** Dispatches one client message. Unknown types are ignored. */
  handle(type, payload = {}, now) {
    const handler = this.handlers[type]
    if (!handler) return
    handler.call(this, payload || {}, now)
    if (this.dirty) this.sendProfile()
  }

  handlers = {
    enterLane({ lane }) {
      const index = Number(lane)
      if (!Number.isInteger(index) || !LANES[index]) return
      if (!isLaneUnlocked(this.profile, index)) {
        this.toast('This lane is locked!', 'error')
        return
      }
      if (this.lane !== index) {
        this.lane = index
        // The first throw lands a beat after stepping in, not instantly.
        this.trainTimer = TRAIN_INTERVAL * 0.5
      }
    },

    leaveLane() {
      this.lane = -1
    },

    setting({ key, value }) {
      if (key === 'autoThrow') {
        if (!this.profile.passes.autoThrow) return
        this.profile.settings.autoThrow = Boolean(value)
      } else if (key === 'autoRebirth') {
        this.profile.settings.autoRebirth = Boolean(value)
      } else {
        return
      }
      this.dirty = true
    },

    rebirth() {
      const result = this.fail(applyRebirth(this.profile))
      if (result.ok) this.afterRebirth()
    },

    throw(_payload, now) {
      if (now < this.busyUntil) return
      const p = this.getPosition()
      if (!inThrowArea(p.x, p.z, THROW_SLACK)) {
        this.toast('Go to the THROW AREA to throw!', 'error')
        return
      }
      const result = applyThrow(this.profile, now)
      this.busyUntil = now + result.cooldown * 1000
      this.emit('throw', {
        distance: result.distance,
        wins: result.wins,
        trophies: result.trophies,
        duration: result.duration,
        multiplier: result.multiplier,
      })
      this.onThrow?.(result)
      // The HUD holds the new Wins back until landing; the profile can go now.
      this.dirty = true
      this.tutorial('throw')
      this.badge('firstThrow')
      if (result.distance >= 1000) this.badge('kilometer')
    },

    buyPlane({ id }) {
      if (!this.nearPadFor(id)) {
        this.toast('Stand on the plane’s pad in the Hangar to buy it', 'error')
        return
      }
      const result = this.fail(buyPlane(this.profile, id))
      if (!result.ok) return
      this.dirty = true
      if (result.bought) {
        this.tutorial('buyPlane')
        this.toast(`Bought the ${planeById(id).name}! +${planeById(id).power} Power per throw`, 'success')
      } else {
        this.toast(`Equipped the ${planeById(id).name}`, 'success')
      }
    },

    equipPlane({ id }) {
      const result = this.fail(equipPlane(this.profile, id))
      if (result.ok) this.dirty = true
    },

    hatch({ eggId, count }) {
      const egg = EGGS[eggId]
      if (!egg) return
      const p = this.getPosition()
      if (eggStandNear(p.x, p.z)?.eggId !== eggId) {
        this.toast('Walk up to the egg to hatch it!', 'error')
        return
      }
      if (!egg.cost.wins) {
        this.toast(`The ${egg.name} Egg is premium - buy it from its stand!`)
        return
      }
      const n = count === MULTI_HATCH ? MULTI_HATCH : 1
      this.reveal(this.fail(hatchEgg(this.profile, eggId, n)))
    },

    openEggItem({ itemId }) {
      const item = ITEMS[itemId]
      if (!item || item.kind !== 'egg') return
      this.reveal(this.fail(hatchEgg(this.profile, item.egg, 1, { paid: 'item' })))
    },

    equipPet({ uid }) {
      if (this.fail(equipPet(this.profile, Number(uid))).ok) this.dirty = true
    },

    unequipPet({ uid }) {
      unequipPet(this.profile, Number(uid))
      this.dirty = true
    },

    equipBest() {
      equipBestPets(this.profile)
      this.dirty = true
    },

    deletePet({ uid }) {
      if (deletePet(this.profile, Number(uid)).ok) this.dirty = true
    },

    claimDaily({ day }, now) {
      const result = this.fail(claimDaily(this.profile, Number(day), now))
      this.afterReward(result)
    },

    claimPlaytime({ index }, now) {
      const result = this.fail(claimPlaytime(this.profile, this.session, Number(index), now))
      this.afterReward(result)
    },

    claimFreeReward() {
      const p = this.getPosition()
      if (Math.hypot(p.x - FREE_REWARD.x, p.z - FREE_REWARD.z) > FREE_REWARD.radius + 1.5) return
      const result = this.fail(claimFreeReward(this.profile, this.session))
      this.afterReward(result)
    },

    usePotion({ itemId }, now) {
      const result = this.fail(usePotion(this.profile, itemId, now))
      if (!result.ok) return
      this.dirty = true
      this.toast(`${ITEMS[itemId].name} active! x2 ${result.boost === 'power' ? 'Power' : 'Wins'} for 5 minutes`, 'success')
    },

    purchase({ productId }, now) {
      if (!this.mockPurchases) {
        this.toast('Purchases are coming soon!')
        return
      }
      this.grant(productId, now)
    },
  }

  /**
   * Grants a paid product. Called for mock purchases here, and by the server's payment
   * webhook for real ones.
   */
  grant(productId, now) {
    const product = PRODUCTS[productId]
    if (!product) return { ok: false }
    if (this.onPurchase && !this.onPurchase(productId)) {
      this.toast(`${product.name} is sold out!`, 'error')
      return { ok: false }
    }
    const result = this.fail(grantProduct(this.profile, productId))
    if (!result.ok) return result
    this.dirty = true
    if (productId === 'skipRebirth') this.afterRebirth()
    else if (!result.pets) this.toast(`Purchased ${product.name}!`, 'success')
    this.reveal(result)
    if (this.dirty) this.sendProfile()
    return result
  }

  afterReward(result) {
    if (!result?.ok) return
    this.dirty = true
    if (result.pets?.length) this.reveal(result)
    else this.toast(`Claimed: ${result.label ?? 'Free Reward'}!`, 'success')
  }

  /** Sends newly gained pets to the client's hatch animation. */
  reveal(result) {
    if (!result?.ok || !result.pets?.length) return
    this.dirty = true
    this.emit('hatch', { eggId: result.eggId ?? null, pets: result.pets })
    this.tutorial('hatch')
    this.badge('firstPet')
  }

  afterRebirth() {
    this.dirty = true
    this.tutorial('rebirth')
    if (this.profile.rebirths === 1) this.badge('firstRebirth')
    this.toast(`Rebirth ${this.profile.rebirths}! Power x${this.profile.rebirths + 1}`, 'success')
    LANES.forEach((lane) => {
      if (!lane.product && lane.rebirths === this.profile.rebirths) {
        this.toast(`New lane unlocked: ${lane.name} (x${lane.mult} Power)!`, 'success')
      }
    })
  }

  // --- Simulation ------------------------------------------------------------------

  friends() {
    return this.getFriends()
  }

  /** Whether the player stands on (or right by) the pad for plane `id`. */
  nearPadFor(id) {
    const index = PLANES_INDEX[id]
    const pad = PLANE_PADS[index]
    if (!pad) return false
    const p = this.getPosition()
    return inRect(padRect(pad), p.x, p.z, PAD_SLACK)
  }

  /** Whether the player is really standing in the lane they claim. */
  inClaimedLane() {
    if (this.lane < 0) return false
    const p = this.getPosition()
    return inRect(laneRect(this.lane), p.x, p.z, LANE_SLACK)
  }

  /** Advances training. Call at a steady rate (the room's simulation interval). */
  tick(dt, now) {
    if (this.lane >= 0 && now >= this.busyUntil && this.inClaimedLane()) {
      this.trainTimer += dt
      while (this.trainTimer >= TRAIN_INTERVAL) {
        this.trainTimer -= TRAIN_INTERVAL
        this.trainOnce(now)
      }
    } else {
      this.trainTimer = Math.min(this.trainTimer, TRAIN_INTERVAL * 0.5)
    }
    this.profile.stats.playtime += dt
    if (this.dirty) this.sendProfile()
  }

  trainOnce(now) {
    const result = applyTrain(this.profile, this.lane, now, this.friends())
    if (!result.ok) {
      this.lane = -1
      return
    }
    this.emit('train', {
      lane: this.lane,
      gain: result.gain,
      power: this.profile.power,
      level: this.profile.level,
      levelProgress: this.profile.levelProgress,
      leveledUp: result.leveledUp,
    })
    this.tutorial('train')
    if (this.profile.settings.autoRebirth && isMaxLevel(this.profile)) {
      const rebirth = applyRebirth(this.profile)
      if (rebirth.ok) this.afterRebirth()
    }
  }

  /** Friend Boost fraction, for display. */
  friendBoost() {
    return friendBoost(this.friends())
  }
}
