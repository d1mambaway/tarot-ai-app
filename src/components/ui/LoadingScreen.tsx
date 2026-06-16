'use client';

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-mystic-bg">
      <div className="animate-pulse text-6xl">🔮</div>
      <p className="mt-4 text-mystic-muted animate-fade-in">Карты перемешиваются...</p>
    </div>
  );
}
