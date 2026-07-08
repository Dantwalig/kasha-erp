'use client';

import { useAuth } from '@/lib/auth-context';
import { KashaWordmark } from './KashaLogo';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between bg-kasha-black px-6 py-4">
      <div className="flex items-center gap-3">
        <KashaWordmark dark />
        <span className="hidden text-xs font-bold uppercase tracking-widest text-kasha-yellow sm:inline">
          Access. Choice. Trust.
        </span>
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">
            {user.firstName ?? user.email}
            {user.roles.length > 0 && (
              <span className="ml-2 rounded-full bg-kasha-yellow px-2 py-0.5 text-xs font-bold text-black">
                {user.roles.join(', ')}
              </span>
            )}
          </span>
          <button
            onClick={logout}
            className="rounded-md border border-gray-600 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}
