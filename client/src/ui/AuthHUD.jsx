import { useBloxity } from '../bloxity/BloxityContext'
import StrokeText from './StrokeText'
import { ChunkyButton } from './hud/parts'
import { GRADIENTS, u } from './hud/style'

const LOGIN_GRADIENT = 'linear-gradient(180deg, #c7a6ff 0%, #8b5cff 50%, #5b2be0 100%)'

/**
 * Your name tag, in the top-right corner: picture, name and the log in / out button.
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
      className="pointer-events-auto flex items-center"
      style={{
        height: u(64),
        padding: `0 ${u(10)} 0 ${u(6)}`,
        gap: u(10),
        borderRadius: u(32),
        background: 'linear-gradient(180deg, rgba(58, 68, 98, 0.94), rgba(26, 30, 46, 0.94))',
        border: `${u(4)} solid #111`,
        boxShadow: `0 ${u(6)} 0 #111, inset 0 ${u(3)} 0 rgba(255,255,255,0.18)`,
      }}
    >
      {pfp ? (
        <img
          src={pfp}
          alt=""
          className="rounded-full object-cover"
          style={{ width: u(46), height: u(46), border: `${u(3)} solid #fff`, background: '#2c344d' }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: u(46), height: u(46), border: `${u(3)} solid #fff`, background: GRADIENTS.blueButton, fontSize: u(26) }}
        >
          <StrokeText stroke={u(5)}>{name.charAt(0).toUpperCase()}</StrokeText>
        </div>
      )}
      <span className="max-w-[26vw] truncate" style={{ fontSize: u(28) }}>
        <StrokeText stroke={u(6)}>{name}</StrokeText>
      </span>
      {isLoggedIn ? (
        <ChunkyButton gradient={GRADIENTS.greyButton} onClick={logout} radius={12} border={3} style={{ height: u(40), padding: `0 ${u(12)}` }}>
          <span style={{ fontSize: u(20) }}>
            <StrokeText stroke={u(5)}>Log out</StrokeText>
          </span>
        </ChunkyButton>
      ) : (
        <ChunkyButton
          gradient={LOGIN_GRADIENT}
          onClick={login}
          disabled={status !== 'ready'}
          radius={12}
          border={3}
          style={{ height: u(40), padding: `0 ${u(14)}` }}
        >
          <span style={{ fontSize: u(20) }}>
            <StrokeText stroke={u(5)}>{status === 'ready' ? 'Log in' : '…'}</StrokeText>
          </span>
        </ChunkyButton>
      )}
    </div>
  )
}

export default AuthHUD
