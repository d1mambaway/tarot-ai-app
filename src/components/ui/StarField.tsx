'use client';

/** Decorative star particles background — reusable */
const STARS = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: Math.random() * 2 + 1,
  duration: Math.random() * 4 + 2,
  delay: Math.random() * 4,
}));

export default function StarField() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {STARS.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-mystic-accent/60 star-particle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            '--duration': `${star.duration}s`,
            '--delay': `${star.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
