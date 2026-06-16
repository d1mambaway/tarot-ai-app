'use client';

import { useAppStore } from '@/store/app-store';

export default function ProfileScreen() {
  const { locale } = useAppStore();

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold text-mystic-accent">ProfileScreen</h1>
      <p className="text-mystic-muted mt-2">TODO: Implement</p>
    </div>
  );
}
