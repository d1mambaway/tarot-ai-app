'use client';

import { useEffect, useState, useCallback } from 'react';

interface User {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  locale: string;
  mana: number;
  isAdmin: boolean;
  channelSubBonus: boolean;
  streakDays: number;
  createdAt: string;
  _count: { readings: number; payments: number };
}

interface Stats {
  totalUsers: number;
  totalMana: number;
  totalStarsRevenue: number;
  totalPayments: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [adminTgId, setAdminTgId] = useState('');
  const [authed, setAuthed] = useState(false);

  // Mana grant modal
  const [grantTarget, setGrantTarget] = useState<User | null>(null);
  const [grantAmount, setGrantAmount] = useState('');
  const [grantMode, setGrantMode] = useState<'add' | 'set'>('add');

  const fetchUsers = useCallback(async () => {
    if (!adminTgId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), search });
      const res = await fetch(`/api/admin?${params}`, {
        headers: { 'x-admin-tg-id': adminTgId },
      });
      if (res.status === 403) {
        setError('⛔ Нет доступа. Проверь Telegram ID.');
        setAuthed(false);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(data.users);
      setStats(data.stats);
      setPages(data.pages);
      setAuthed(true);
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [adminTgId, page, search]);

  useEffect(() => {
    if (authed) fetchUsers();
  }, [fetchUsers, authed, page]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthed(true);
    fetchUsers();
  };

  const handleGrantMana = async () => {
    if (!grantTarget || !grantAmount) return;
    const amount = parseInt(grantAmount);
    if (isNaN(amount)) return;

    const action = grantMode === 'set' ? 'set_mana' : 'grant_mana';
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        adminTgId,
        targetTgId: grantTarget.telegramId,
        amount,
      }),
    });

    setGrantTarget(null);
    setGrantAmount('');
    fetchUsers();
  };

  // Login screen
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center">🔐 Admin Panel</h1>
          <label className="text-sm text-gray-400 mb-2 block">Telegram ID администратора</label>
          <input
            type="text"
            value={adminTgId}
            onChange={(e) => setAdminTgId(e.target.value)}
            placeholder="123456789"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-4"
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">🔮 Магия Карт — Админ</h1>
          <button onClick={() => setAuthed(false)} className="text-sm text-gray-400 hover:text-white">
            Выйти
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-2xl font-bold text-blue-400">{stats.totalUsers}</p>
              <p className="text-xs text-gray-400">Пользователей</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-2xl font-bold text-purple-400">{stats.totalMana.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Общая мана</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-2xl font-bold text-yellow-400">{stats.totalStarsRevenue} ⭐</p>
              <p className="text-xs text-gray-400">Доход Stars</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-2xl font-bold text-green-400">{stats.totalPayments}</p>
              <p className="text-xs text-gray-400">Платежей</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="🔍 Поиск по username или имени..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white"
          />
        </div>

        {/* Users table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="py-3 px-2">User</th>
                  <th className="py-3 px-2">TG ID</th>
                  <th className="py-3 px-2">💎 Мана</th>
                  <th className="py-3 px-2">🔮 Расклады</th>
                  <th className="py-3 px-2">💳 Платежей</th>
                  <th className="py-3 px-2">🌐</th>
                  <th className="py-3 px-2">Дата</th>
                  <th className="py-3 px-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                    <td className="py-2.5 px-2">
                      <div>
                        <span className="font-medium">{user.firstName || '—'}</span>
                        {user.username && (
                          <span className="text-gray-400 ml-1.5">@{user.username}</span>
                        )}
                        {user.isAdmin && <span className="ml-1 text-yellow-400">👑</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-gray-400 font-mono text-xs">{user.telegramId}</td>
                    <td className="py-2.5 px-2 font-bold text-blue-400">{user.mana.toLocaleString()}</td>
                    <td className="py-2.5 px-2">{user._count.readings}</td>
                    <td className="py-2.5 px-2">{user._count.payments}</td>
                    <td className="py-2.5 px-2">{user.locale.toUpperCase()}</td>
                    <td className="py-2.5 px-2 text-gray-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-2">
                      <button
                        onClick={() => { setGrantTarget(user); setGrantAmount(''); setGrantMode('add'); }}
                        className="text-xs bg-blue-600/20 text-blue-400 px-2.5 py-1 rounded-lg hover:bg-blue-600/30 transition"
                      >
                        💎 Мана
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 disabled:opacity-30"
            >
              ←
            </button>
            <span className="text-gray-400 text-sm">{page} / {pages}</span>
            <button
              onClick={() => setPage(Math.min(pages, page + 1))}
              disabled={page === pages}
              className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 disabled:opacity-30"
            >
              →
            </button>
          </div>
        )}

        {/* Grant Mana Modal */}
        {grantTarget && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-800">
              <h2 className="text-lg font-bold mb-1">💎 Управление маной</h2>
              <p className="text-sm text-gray-400 mb-4">
                {grantTarget.firstName} (@{grantTarget.username}) — сейчас {grantTarget.mana} маны
              </p>

              {/* Mode toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setGrantMode('add')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                    grantMode === 'add' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  ＋ Добавить
                </button>
                <button
                  onClick={() => setGrantMode('set')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                    grantMode === 'set' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  ＝ Установить
                </button>
              </div>

              <input
                type="number"
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                placeholder={grantMode === 'add' ? 'Сколько добавить (можно -100)' : 'Новый баланс'}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-4"
              />

              {/* Quick amounts */}
              <div className="flex gap-2 mb-4">
                {[100, 500, 1000, 5000].map((n) => (
                  <button
                    key={n}
                    onClick={() => setGrantAmount(String(n))}
                    className="flex-1 py-1.5 text-xs bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                  >
                    {grantMode === 'add' ? '+' : ''}{n}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setGrantTarget(null)}
                  className="flex-1 py-2.5 bg-gray-800 rounded-xl text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={handleGrantMana}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm transition"
                >
                  {grantMode === 'add' ? 'Начислить' : 'Установить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
