'use client';

import FilterPanel from '@/components/filters/FilterPanel';
import SearchBar from '@/components/search/SearchBar';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { LogIn, LogOut, MapPin, User } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  const { user, signOut } = useAuthStore();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    signOut();
  }

  return (
    <header className="
      absolute top-0 left-0 right-0 z-30
      flex items-center gap-3 px-4 py-3
      bg-gradient-to-b from-gray-950/80 to-transparent
      pointer-events-none
    ">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-1.5 pointer-events-auto flex-shrink-0"
      >
        <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
          <MapPin className="w-4 h-4 text-white fill-current" />
        </div>
        <span className="text-white font-extrabold text-lg tracking-tight hidden sm:block">
          mau<span className="text-orange-400">makan</span>
        </span>
      </Link>

      {/* Search */}
      <div className="flex-1 pointer-events-auto">
        <SearchBar />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pointer-events-auto flex-shrink-0">
        <FilterPanel />

        {user ? (
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-gray-400 truncate max-w-[120px]">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700 transition-all border border-gray-700"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="
              flex items-center gap-1.5 px-3 py-2
              bg-orange-500 hover:bg-orange-600
              rounded-xl text-white text-sm font-semibold
              transition-all duration-200 shadow-lg
            "
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:block">Sign in</span>
          </Link>
        )}
      </div>
    </header>
  );
}
