'use client';

import { useState, useRef, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import type { AuthUser } from '@/lib/supabase/types';

interface UserMenuProps {
  user: AuthUser;
  logoutLabel: string;
}

export function UserMenu({ user, logoutLabel }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const avatarUrl = user.user_metadata['avatar_url'] as string | undefined;
  const username = user.user_metadata['user_name'] as string | undefined;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full ring-2 ring-transparent hover:ring-blue-500 transition-all"
        aria-label="사용자 메뉴"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username ?? '사용자'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white">
            {(username ?? 'U')[0].toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-lg bg-gray-900 border border-gray-700 shadow-xl z-50">
          {username && (
            <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700 truncate">
              @{username}
            </div>
          )}
          {/* TODO: i18n 추후 적용 */}
          <Link
            href="/my-kits"
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            onClick={() => setOpen(false)}
          >
            내 킷
          </Link>
          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              {logoutLabel}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
