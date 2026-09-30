'use client';

/**
 * Rotating solar system background overlay, painted style.
 * Planets are lit spheres: each sits on the +x side of its orbit group and
 * the gradient's bright side points at -x, so while the group rotates the
 * lit side always faces the sun. Orbits are thin gold lines.
 * Sits behind main content (z-[1]) but above StarField (z-0).
 */

const C = 340;

// [id, orbit radius, planet radius, light color, shadow color, animation class]
const PLANETS: [string, number, number, string, string, string][] = [
  ['mercury', 60, 3, '#e9d9c0', '#5e5040', 'animate-orbit-mercury'],
  ['venus', 100, 4.5, '#ffe2a8', '#8a5a14', 'animate-orbit-venus'],
  ['earth', 140, 5, '#9cd0ff', '#123a7a', 'animate-orbit-earth'],
  ['mars', 180, 4, '#ff9a84', '#7a1f14', 'animate-orbit-mars'],
  ['jupiter', 220, 9.5, '#f6d29a', '#7a4a1a', 'animate-orbit-jupiter'],
  ['saturn', 260, 7, '#fbe8c4', '#8a6a3a', 'animate-orbit-saturn'],
  ['uranus', 300, 5.5, '#b6f4f4', '#145a66', 'animate-orbit-uranus'],
  ['neptune', 335, 5, '#9fb6ff', '#1b2f8a', 'animate-orbit-neptune'],
];

export default function SolarSystem() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        width="680"
        height="680"
        viewBox="0 0 680 680"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.6 }}
      >
        <defs>
          <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffbe8" stopOpacity="1" />
            <stop offset="28%" stopColor="#ffd97a" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#e89a2e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#e89a2e" stopOpacity="0" />
          </radialGradient>
          {PLANETS.map(([id, , , light, shadow]) => (
            <radialGradient key={id} id={`pl-${id}`} cx="22%" cy="42%" r="85%">
              <stop offset="0%" stopColor={light} />
              <stop offset="55%" stopColor={shadow} />
              <stop offset="100%" stopColor="#05050f" />
            </radialGradient>
          ))}
        </defs>

        {/* Orbital paths */}
        {PLANETS.map(([id, r]) => (
          <circle key={id} cx={C} cy={C} r={r} fill="none" stroke="#e9c97a" strokeWidth="0.5" opacity="0.24" />
        ))}

        {/* Sun: warm halo + bright core */}
        <circle cx={C} cy={C} r="58" fill="url(#sunHalo)" className="animate-sun-glow" />
        <circle cx={C} cy={C} r="11" fill="#ffe9a8" />

        {/* Planets */}
        {PLANETS.map(([id, r, size, , , anim]) => (
          <g key={id} className={anim} style={{ transformOrigin: `${C}px ${C}px` }}>
            {id === 'saturn' && (
              <ellipse cx={C + r} cy={C} rx={size * 2.1} ry={size * 0.55} fill="none" stroke="#e8d3a6" strokeWidth="1.3" opacity="0.8" />
            )}
            <circle cx={C + r} cy={C} r={size} fill={`url(#pl-${id})`} />
          </g>
        ))}
      </svg>
    </div>
  );
}
