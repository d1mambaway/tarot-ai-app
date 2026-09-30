'use client';

/* Mockup-only background variants (not committed). ?bg=astrolabe|engraving|cosmos|calm */

const C = 340;
const ORBITS = [60, 100, 140, 180, 220, 260, 300];
// planet angle (deg) per orbit, just for a still frame
const ANG = [20, 140, 250, 330, 75, 200, 290];
const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pos = (r: number, deg: number) => [C + r * Math.cos((deg * Math.PI) / 180), C + r * Math.sin((deg * Math.PI) / 180)];

function Stars({ n, seed, gold = 0.3, spikes = false, maxR = 1.3 }: { n: number; seed: number; gold?: number; spikes?: boolean; maxR?: number }) {
  const r = rng(seed);
  const list = Array.from({ length: n }, () => ({ x: r() * 100, y: r() * 100, s: 0.3 + r() * r() * maxR, a: 0.25 + r() * 0.75, g: r() < gold }));
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      {list.map((s, i) => (
        <g key={i}>
          <ellipse cx={s.x} cy={s.y} rx={s.s * 0.23} ry={s.s * 0.105} fill={s.g ? '#f3d98b' : '#f4f1ff'} opacity={s.a} />
          {spikes && s.s > 1.1 && (
            <g opacity={s.a * 0.7} stroke={s.g ? '#f3d98b' : '#e8e4ff'} strokeWidth={0.06}>
              <line x1={s.x - 1.6} y1={s.y} x2={s.x + 1.6} y2={s.y} />
              <line x1={s.x} y1={s.y - 0.75} x2={s.x} y2={s.y + 0.75} />
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

function Frame({ children, opacity }: { children: React.ReactNode; opacity: number }) {
  return (
    <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" width="680" height="680" viewBox="0 0 680 680" style={{ opacity }}>
      {children}
    </svg>
  );
}

/* 1. Astrolabe: brass rings with degree ticks and zodiac, gems in gold bezels */
function Astrolabe() {
  const gems = [
    ['#fff1c9', '#b98a2e'], ['#ff8a9a', '#7a0019'], ['#8ff0c2', '#0b5e3c'], ['#9fc4ff', '#14306e'],
    ['#ffd08a', '#8a4a10'], ['#e6b3ff', '#4b1470'], ['#a8f2ff', '#0d5566'],
  ];
  return (
    <>
      <Stars n={140} seed={7} gold={0.35} maxR={1.1} />
      <Frame opacity={0.55}>
        <defs>
          <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6e2a4" /><stop offset="0.5" stopColor="#c9a24a" /><stop offset="1" stopColor="#8a6a26" />
          </linearGradient>
          {gems.map(([a, b], i) => (
            <radialGradient key={i} id={`gem${i}`} cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor="#fff" stopOpacity="0.9" /><stop offset="0.25" stopColor={a} /><stop offset="1" stopColor={b} />
            </radialGradient>
          ))}
          <radialGradient id="aSun" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff4c8" /><stop offset="0.55" stopColor="#e9c46a" /><stop offset="1" stopColor="#9a7424" />
          </radialGradient>
        </defs>
        {/* outer limb */}
        <circle cx={C} cy={C} r={332} fill="none" stroke="url(#brass)" strokeWidth={1.4} />
        <circle cx={C} cy={C} r={318} fill="none" stroke="url(#brass)" strokeWidth={0.7} />
        <circle cx={C} cy={C} r={284} fill="none" stroke="url(#brass)" strokeWidth={0.7} />
        {Array.from({ length: 72 }, (_, i) => {
          const long = i % 6 === 0;
          const [x1, y1] = pos(318, i * 5);
          const [x2, y2] = pos(long ? 306 : 312, i * 5);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d9b861" strokeWidth={long ? 1 : 0.5} />;
        })}
        {ZODIAC.map((z, i) => {
          const [x, y] = pos(296, i * 30 + 15 - 90);
          return <text key={z} x={x} y={y + 5} textAnchor="middle" fontSize={15} fill="#e9c97a" fontFamily="DejaVu Sans">{z + '︎'}</text>;
        })}
        {/* rete: orbits */}
        {ORBITS.slice(0, 6).map((r, i) => (
          <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="#d4af37" strokeWidth={0.6} opacity={0.55} strokeDasharray={i % 2 ? '1 5' : undefined} />
        ))}
        <line x1={C - 332} y1={C} x2={C + 332} y2={C} stroke="#d4af37" strokeWidth={0.4} opacity={0.35} />
        <line x1={C} y1={C - 332} x2={C} y2={C + 332} stroke="#d4af37" strokeWidth={0.4} opacity={0.35} />
        {/* engraved sun */}
        {Array.from({ length: 16 }, (_, i) => {
          const len = i % 2 ? 26 : 34;
          const [x1, y1] = pos(17, i * 22.5);
          const [x2, y2] = pos(len, i * 22.5);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e9c97a" strokeWidth={i % 2 ? 0.8 : 1.4} strokeLinecap="round" />;
        })}
        <circle cx={C} cy={C} r={15} fill="url(#aSun)" stroke="#f6e2a4" strokeWidth={1} />
        <circle cx={C} cy={C} r={10} fill="none" stroke="#8a6a26" strokeWidth={0.6} />
        {/* gems */}
        {ORBITS.slice(0, 6).map((r, i) => {
          const [x, y] = pos(r, ANG[i]);
          const s = [5, 6.5, 7, 6, 10, 8][i];
          return (
            <g key={r}>
              <circle cx={x} cy={y} r={s + 2.2} fill="none" stroke="url(#brass)" strokeWidth={1.6} />
              <circle cx={x} cy={y} r={s} fill={`url(#gem${i + 1})`} />
              <path d={`M${x - s * 0.5} ${y - s * 0.1} L${x} ${y - s * 0.6} L${x + s * 0.5} ${y - s * 0.1}`} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={0.5} />
            </g>
          );
        })}
      </Frame>
    </>
  );
}

/* 2. Engraving: old star-atlas line art, one gold ink */
function Engraving() {
  const r0 = rng(3);
  const constel = Array.from({ length: 5 }, () => {
    const cx = 10 + r0() * 80, cy = 8 + r0() * 84;
    return Array.from({ length: 5 }, () => [cx + (r0() - 0.5) * 22, cy + (r0() - 0.5) * 14]);
  });
  return (
    <>
      <Stars n={110} seed={11} gold={0.6} maxR={1} />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" opacity={0.22}>
        {constel.map((pts, i) => (
          <g key={i}>
            <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#e9c97a" strokeWidth={0.08} strokeDasharray="0.4 0.5" />
            {pts.map(([x, y], j) => <ellipse key={j} cx={x} cy={y} rx={0.3} ry={0.14} fill="#e9c97a" />)}
          </g>
        ))}
      </svg>
      <Frame opacity={0.5}>
        <defs>
          <pattern id="hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="3" stroke="#e9c97a" strokeWidth="0.7" />
          </pattern>
          {ORBITS.map((r, i) => {
            const [x, y] = pos(r, ANG[i]);
            const s = [4, 5.5, 6, 5, 10, 8, 6][i];
            return (
              <clipPath key={i} id={`shade${i}`}>
                <path d={`M${x} ${y - s} A${s} ${s} 0 0 1 ${x} ${y + s} A${s * 0.45} ${s} 0 0 0 ${x} ${y - s}Z`} />
              </clipPath>
            );
          })}
        </defs>
        {ORBITS.map((r, i) => (
          <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="#e9c97a" strokeWidth={0.5} opacity={0.7} strokeDasharray={i % 3 === 2 ? '2 3' : i % 3 === 1 ? '0.6 3' : undefined} />
        ))}
        <circle cx={C} cy={C} r={332} fill="none" stroke="#e9c97a" strokeWidth={0.5} opacity={0.5} />
        {/* sun with flame rays */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = i * 30;
          const [bx1, by1] = pos(16, a - 7);
          const [bx2, by2] = pos(16, a + 7);
          const [tx, ty] = pos(34, a);
          const [cx1, cy1] = pos(26, a + 9);
          return <path key={i} d={`M${bx1} ${by1} Q${cx1} ${cy1} ${tx} ${ty} Q${cx1} ${cy1} ${bx2} ${by2}`} fill="none" stroke="#e9c97a" strokeWidth={0.8} />;
        })}
        <circle cx={C} cy={C} r={14} fill="none" stroke="#e9c97a" strokeWidth={1.1} />
        <circle cx={C} cy={C} r={14} fill="url(#hatch)" opacity={0.35} />
        {/* planets: outline + hatched night side */}
        {ORBITS.map((r, i) => {
          const [x, y] = pos(r, ANG[i]);
          const s = [4, 5.5, 6, 5, 10, 8, 6][i];
          return (
            <g key={r}>
              {i === 4 && <ellipse cx={x} cy={y} rx={s * 2} ry={s * 0.55} fill="none" stroke="#e9c97a" strokeWidth={0.7} />}
              <circle cx={x} cy={y} r={s} fill="#0b0b1e" stroke="#e9c97a" strokeWidth={0.9} />
              <rect x={x - s} y={y - s} width={s * 2} height={s * 2} fill="url(#hatch)" clipPath={`url(#shade${i})`} />
            </g>
          );
        })}
      </Frame>
    </>
  );
}

/* 3. Painted cosmos: jewel-tone nebula, lit spheres, glinting stars */
function Cosmos() {
  const tones = [
    ['#a3123a', 20, 18], ['#0f7a55', 82, 40], ['#1b2f8a', 30, 72], ['#b8862b', 70, 88], ['#5a1a7a', 60, 12],
  ] as const;
  const pl = [
    ['#e9d9c0', '#6b5a44'], ['#ffd59a', '#8a5a14'], ['#8fc3ff', '#123a7a'], ['#ff8f7a', '#7a1f14'],
    ['#f2c98a', '#7a4a1a'], ['#fbe6bf', '#8a6a3a'], ['#9ff0f0', '#145a66'],
  ];
  return (
    <>
      <div className="absolute inset-0">
        {tones.map(([c, x, y], i) => (
          <div key={i} className="absolute rounded-full" style={{ left: `${x}%`, top: `${y}%`, width: 420, height: 420, marginLeft: -210, marginTop: -210, background: `radial-gradient(circle, ${c}55 0%, ${c}22 40%, transparent 70%)`, filter: 'blur(20px)' }} />
        ))}
      </div>
      <Stars n={170} seed={5} gold={0.25} spikes maxR={1.6} />
      <Frame opacity={0.6}>
        <defs>
          <radialGradient id="cSun" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fffbe8" /><stop offset="0.3" stopColor="#ffd97a" /><stop offset="0.6" stopColor="#e89a2e" stopOpacity="0.5" /><stop offset="1" stopColor="#e89a2e" stopOpacity="0" />
          </radialGradient>
          {pl.map(([a, b], i) => (
            <radialGradient key={i} id={`pl${i}`} cx="30%" cy="30%" r="80%">
              <stop offset="0" stopColor={a} /><stop offset="0.6" stopColor={b} /><stop offset="1" stopColor="#05050f" />
            </radialGradient>
          ))}
        </defs>
        {ORBITS.map((r) => <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="#e9c97a" strokeWidth={0.5} opacity={0.22} />)}
        <circle cx={C} cy={C} r={60} fill="url(#cSun)" />
        <circle cx={C} cy={C} r={11} fill="#ffe9a8" />
        {ORBITS.map((r, i) => {
          const [x, y] = pos(r, ANG[i]);
          const s = [3.5, 5, 5.5, 4.5, 11, 8.5, 6][i];
          return (
            <g key={r}>
              {i === 4 && <ellipse cx={x} cy={y} rx={s * 2} ry={s * 0.5} fill="none" stroke="#e8d3a6" strokeWidth={1.4} opacity={0.85} transform={`rotate(-18 ${x} ${y})`} />}
              <circle cx={x} cy={y} r={s} fill={`url(#pl${i})`} />
            </g>
          );
        })}
      </Frame>
    </>
  );
}

/* 4. Calm luxury: sparse stars, gold dust, hairline orbits, tiny gold points */
function Calm() {
  const r = rng(21);
  const dust = Array.from({ length: 60 }, () => ({ x: r() * 100, y: r() * 100, s: 0.25 + r() * 0.35, a: 0.25 + r() * 0.5 }));
  return (
    <>
      <Stars n={70} seed={9} gold={0.2} maxR={0.9} />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {dust.map((d, i) => <ellipse key={i} cx={d.x} cy={d.y} rx={d.s * 0.46} ry={d.s * 0.21} fill="#e9c97a" opacity={d.a} />)}
      </svg>
      <Frame opacity={0.6}>
        <defs>
          <radialGradient id="glowG" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#f6e2a4" stopOpacity="0.9" /><stop offset="1" stopColor="#f6e2a4" stopOpacity="0" />
          </radialGradient>
        </defs>
        {ORBITS.map((rr) => <circle key={rr} cx={C} cy={C} r={rr} fill="none" stroke="#e9c97a" strokeWidth={0.35} opacity={0.35} />)}
        <circle cx={C} cy={C} r={26} fill="url(#glowG)" opacity={0.5} />
        <circle cx={C} cy={C} r={5} fill="#f6e2a4" />
        {ORBITS.map((rr, i) => {
          const [x, y] = pos(rr, ANG[i]);
          return (
            <g key={rr}>
              <circle cx={x} cy={y} r={7} fill="url(#glowG)" opacity={0.45} />
              <circle cx={x} cy={y} r={[1.6, 2, 2.2, 1.8, 3, 2.6, 2][i]} fill="#f6e2a4" />
            </g>
          );
        })}
      </Frame>
    </>
  );
}

export default function BgVariant({ v }: { v: string }) {
  return (
    <div className="bg-layer fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {v === 'astrolabe' && <Astrolabe />}
      {v === 'engraving' && <Engraving />}
      {v === 'cosmos' && <Cosmos />}
      {v === 'calm' && <Calm />}
    </div>
  );
}
