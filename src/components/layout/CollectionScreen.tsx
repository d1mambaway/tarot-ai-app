'use client';

import { useAppStore } from '@/store/app-store';

export default function CollectionScreen() {
  const { locale } = useAppStore();

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold text-mystic-accent">CollectionScreen</h1>
      <p className="text-mystic-muted mt-2">TODO: Implement</p>
    </div>
  );
}
