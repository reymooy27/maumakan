'use client';

import FilterPanel from '@/components/filters/FilterPanel';
import SearchBar from '@/components/search/SearchBar';
import { signIn, signOut, useSession } from 'next-auth/react';
import { LogIn, LogOut, MapPin, Compass, Sparkles, User as UserIcon, Heart } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useState } from 'react';
import { Session } from 'next-auth';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const { data: nextAuthSession } = useSession();
  const { user: supabaseUser } = useAuthStore();
  
  // Normalize user object between providers
  const user = supabaseUser ? {
    name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email?.split('@')[0],
    email: supabaseUser.email,
    image: supabaseUser.user_metadata?.avatar_url ?? null,
  } : nextAuthSession?.user;

  const { setCenter, setZoom, setFilters, setUserLocation, setSelectedPlace } = useMapStore();
  const [discovering, setDiscovering] = useState(false);

  const handleEatNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setCenter(loc);
          setZoom(15);
          setFilters({ maxDistance: 2 }); // Restrict to < 2km
        },
        () => alert('Location access denied. Please enable location services in your browser.')
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const res = await fetch('/api/recommend');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Pick a random one from top 5 for variety
        const pick = data[Math.floor(Math.random() * data.length)];
        setSelectedPlace(pick);
        setCenter([pick.lat, pick.lng]);
        setZoom(16);
      } else {
        alert('No recommendations found yet. Try saving some places first!');
      }
    } catch {
      alert('Failed to fetch recommendations.');
    }
    setDiscovering(false);
  };

  return (
    <header className="
      absolute top-0 left-0 right-0 z-30
      flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3
      bg-gradient-to-b from-gray-950/80 to-transparent
      pointer-events-none
    ">
      {/* Logo */}
      <Link
        href="/"
        className="hidden sm:flex items-center gap-1.5 pointer-events-auto flex-shrink-0"
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
        <button
          onClick={handleEatNearMe}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-blue-500/90 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg backdrop-blur-sm cursor-pointer border border-blue-400"
        >
          <Compass className="w-4 h-4" />
          Eat Near Me
        </button>

        {user && (
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-purple-500/90 hover:bg-purple-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg backdrop-blur-sm cursor-pointer border border-purple-400 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${discovering ? 'animate-spin' : ''}`} />
            {discovering ? '...' : 'Discover'}
          </button>
        )}

        <FilterPanel />

        <UserProfile user={user} />
      </div>
    </header>
  );
}

function UserProfile({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const { setFilters, filters } = useMapStore();
  const { signOut: supabaseSignOut } = useAuthStore();

  const handleSignOut = async () => {
    // Sign out from both providers
    const supabase = createClient();
    await supabase.auth.signOut();
    supabaseSignOut();
    signOut(); // next-auth signout
  };

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="
          flex items-center gap-1.5 px-3 py-2
          bg-orange-500 hover:bg-orange-600
          rounded-xl text-white text-sm font-semibold
          transition-all duration-200 shadow-lg cursor-pointer
        "
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:block">Sign in</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center justify-center p-1 rounded-full 
          border-2 border-gray-800 hover:border-orange-500/50 
          transition-all cursor-pointer overflow-hidden bg-gray-900/50 shadow-md
        "
      >
        {user.image ? (
          <Image 
            src={user.image} 
            alt={user.name || 'User'} 
            width={32} 
            height={32} 
            className="w-8 h-8 rounded-full object-cover" 
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="
            absolute right-0 mt-3 w-56 p-2 z-50
            bg-gray-900/95 backdrop-blur-xl border border-gray-800 
            rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200
          ">
            {/* Header / Info */}
            <div className="px-3 py-3 border-b border-gray-800/50">
              <p className="text-sm font-bold text-white truncate">{user.name || 'Account'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>

            {/* Links / Options */}
            <div className="py-2 space-y-1">
              <button
                onClick={() => {
                  setFilters({ onlySaved: !filters.onlySaved });
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer
                  ${filters.onlySaved 
                    ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                `}
              >
                <Heart className={`w-4 h-4 ${filters.onlySaved ? 'fill-current' : ''}`} />
                {filters.onlySaved ? 'Show All Places' : 'My Favorites'}
              </button>
            </div>

            {/* Logout */}
            <div className="pt-2 border-t border-gray-800/50">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

