'use client';

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useMapStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="relative flex items-center w-full max-w-md">
      <Search className="absolute left-3 text-gray-400 w-4 h-4 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search restaurants, cafes… (⌘K)"
        className="
          w-full pl-10 pr-9 py-2.5
          bg-gray-900/90 backdrop-blur-sm
          border border-gray-700 rounded-xl
          text-sm text-white placeholder-gray-500
          focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500
          transition-all duration-200
        "
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-3 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
