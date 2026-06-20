'use client';

/**
 * Rotating solar system background overlay.
 * Renders orbital paths + animated planets via CSS animations.
 * Sits behind main content (z-[1]) but above StarField (z-0).
 */
export default function SolarSystem() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        width="680"
        height="680"
        viewBox="0 0 680 680"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.35 }}
      >
        <defs>
          <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffd700" stopOpacity="1" />
            <stop offset="60%" stopColor="#ffb300" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ff8c00" stopOpacity="0" />
          </radialGradient>
          <filter id="sunBlur">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Orbital paths */}
        <circle cx="340" cy="340" r="60"  fill="none" stroke="#9370db" strokeWidth="0.5" opacity="0.4" />
        <circle cx="340" cy="340" r="100" fill="none" stroke="#9370db" strokeWidth="0.5" opacity="0.4" />
        <circle cx="340" cy="340" r="140" fill="none" stroke="#9370db" strokeWidth="0.5" opacity="0.35" />
        <circle cx="340" cy="340" r="180" fill="none" stroke="#d4af37" strokeWidth="0.5" opacity="0.35" />
        <circle cx="340" cy="340" r="220" fill="none" stroke="#9370db" strokeWidth="0.5" opacity="0.3" />
        <circle cx="340" cy="340" r="260" fill="none" stroke="#9370db" strokeWidth="0.5" opacity="0.3" />
        <circle cx="340" cy="340" r="300" fill="none" stroke="#d4af37" strokeWidth="0.5" opacity="0.25" />
        <circle cx="340" cy="340" r="335" fill="none" stroke="#9370db" strokeWidth="0.5" opacity="0.2" />

        {/* Sun */}
        <circle cx="340" cy="340" r="22" fill="url(#sunGrad)" filter="url(#sunBlur)" className="animate-sun-glow" />
        <circle cx="340" cy="340" r="12" fill="#ffd700" />

        {/* Mercury – r=60 */}
        <g className="animate-orbit-mercury" style={{ transformOrigin: '340px 340px' }}>
          <circle cx="400" cy="340" r="3" fill="#8c7853" />
        </g>

        {/* Venus – r=100 */}
        <g className="animate-orbit-venus" style={{ transformOrigin: '340px 340px' }}>
          <circle cx="440" cy="340" r="4.5" fill="#ffc649" />
        </g>

        {/* Earth – r=140 */}
        <g className="animate-orbit-earth" style={{ transformOrigin: '340px 340px' }}>
          <circle cx="480" cy="340" r="5" fill="#4488cc" />
          <circle cx="480" cy="340" r="5.8" fill="none" stroke="#88ccff" strokeWidth="0.5" opacity="0.4" />
        </g>

        {/* Mars – r=180 */}
        <g className="animate-orbit-mars" style={{ transformOrigin: '340px 340px' }}>
          <circle cx="520" cy="340" r="4" fill="#d9534f" />
        </g>

        {/* Jupiter – r=220 */}
        <g className="animate-orbit-jupiter" style={{ transformOrigin: '340px 340px' }}>
          <circle cx="560" cy="340" r="9" fill="#c88b3a" />
          <ellipse cx="560" cy="337" rx="9" ry="1" fill="none" stroke="#a0612a" strokeWidth="0.4" opacity="0.5" />
          <ellipse cx="560" cy="343" rx="9" ry="1" fill="none" stroke="#a0612a" strokeWidth="0.4" opacity="0.5" />
        </g>

        {/* Saturn – r=260 */}
        <g className="animate-orbit-saturn" style={{ transformOrigin: '340px 340px' }}>
          <ellipse cx="600" cy="340" rx="14" ry="4" fill="none" stroke="#d4a574" strokeWidth="1" opacity="0.7" />
          <circle cx="600" cy="340" r="7" fill="#f4d9a6" />
        </g>

        {/* Uranus – r=300 */}
        <g className="animate-orbit-uranus" style={{ transformOrigin: '340px 340px' }}>
          <circle cx="640" cy="340" r="5.5" fill="#4dd0e1" />
        </g>

        {/* Neptune – r=335 */}
        <g className="animate-orbit-neptune" style={{ transformOrigin: '340px 340px' }}>
          <circle cx="675" cy="340" r="5" fill="#3355aa" />
        </g>
      </svg>
    </div>
  );
}
