import { useBloxity } from '../bloxity/BloxityContext'
import StrokeText from './StrokeText'
import { u } from './hud/style'

/**
 * Compact identity chip for the top bar.
 *
 * Uses the `getUser() || getGuest()` pattern (surfaced as `identity` on the context)
 * so there is always a name and picture to show, even before the player logs in.
 */
export function AuthHUD() {
  const { identity, isLoggedIn, login, logout, status } = useBloxity()

  const name = identity?.displayName || identity?.username || 'Guest'
  const pfp = identity?.pfp

  return (
    <div
      className="pointer-events-auto flex items-center rounded-full bg-black/45 text-white"
      style={{ height: u(56), padding: `0 ${u(6)}`, gap: u(10) }}
    >
      {pfp ? (
        <img src={pfp} alt="" className="rounded-full object-cover" style={{ width: u(44), height: u(44) }} />
      ) : (
        <div className="flex items-center justify-center rounded-full bg-white/25" style={{ width: u(44), height: u(44), fontSize: u(24) }}>
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="max-w-[30vw] truncate" style={{ fontSize: u(24) }}>
        <StrokeText stroke={u(5)}>{name}</StrokeText>
      </span>
      {isLoggedIn ? (
        <button type="button" onClick={logout} className="pp-btn rounded-full bg-white/15 font-semibold" style={{ padding: `${u(6)} ${u(14)}`, fontSize: u(18) }}>
          Log out
        </button>
      ) : (
        <button
          type="button"
          onClick={login}
          disabled={status !== 'ready'}
          className="pp-btn rounded-full bg-violet-600 font-semibold disabled:opacity-50"
          style={{ padding: `${u(6)} ${u(14)}`, fontSize: u(18) }}
        >
          {status === 'ready' ? 'Log in' : '…'}
        </button>
      )}
    </div>
  )
}

export default AuthHUD
