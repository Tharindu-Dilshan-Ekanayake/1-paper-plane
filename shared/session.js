import { LANES, TRAIN_INTERVAL } from './balance.js'
import {
  advanceTutorial,
  applyTrain,
  awardBadge,
  createSession,
  friendBoost,
  isLaneUnlocked,
  isMaxLevel,
  applyRebirth,
} from './logic.js'
import { laneRect, inRect } from './world.js'

/** How far outside a lane's floor still counts as "in" it (network jitter). */
const LANE_SLACK = 0.8

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
 * - 'toast'    { text, kind }
 * - 'badge'    { id, name }
 */
export class PlayerSession {
  /**
   * @param {object} profile normalized profile (see logic.normalizeProfile)
   * @param {{ now: number, emit: (type: string, payload?: object) => void,
   *           getPosition: () => {x: number, y: number, z: number},
   *           getFriends?: () => number }} options
   */
  constructor(profile, { now, emit, getPosition, getFriends = () => 0 }) {
    this.profile = profile
    this.session = createSession(now)
    this.emit = emit
    this.getPosition = getPosition
    this.getFriends = getFriends

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
  }

  afterRebirth() {
    this.dirty = true
    this.tutorial('rebirth')
    if (this.profile.rebirths === 1) this.badge('firstRebirth')
    this.toast(`Rebirth ${this.profile.rebirths}! Power x${this.profile.rebirths + 1}`, 'success')
  }

  // --- Simulation ------------------------------------------------------------------

  friends() {
    return this.getFriends()
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
