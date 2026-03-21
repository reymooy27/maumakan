'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';

export default function SearchBar() {
  const { searchQuery, setSearchQuery, setSearchSidebarOpen } = useMapStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local state if global state changes externally
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

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

  const handleSearch = () => {
    if (localQuery.trim()) {
      setSearchQuery(localQuery);
      setSearchSidebarOpen(true);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
    setSearchSidebarOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex items-center w-full max-w-md group">
      <div className="absolute left-3 text-gray-400 w-4 h-4 pointer-events-none group-focus-within:text-orange-500 transition-colors">
        <Search className="w-full h-full" />
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search restaurants, cafes… (⌘K)"
        className="
          w-full pl-10 pr-24 py-3
          bg-gray-900/95 backdrop-blur-md shadow-lg
          border border-gray-700/50 rounded-2xl
          text-sm text-white placeholder-gray-500
          focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20
          transition-all duration-300 ease-out
        "
      />

      <div className="absolute right-2 flex items-center gap-1">
        {localQuery && (
          <button
            onClick={handleClear}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleSearch}
          disabled={!localQuery.trim()}
          className={`
            px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300
            ${localQuery.trim() 
              ? 'bg-orange-500 text-white shadow-[0_0_15px_-3px_#f97316] hover:bg-orange-600 cursor-pointer' 
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
          `}
        >
          Search
        </button>
      </div>
    </div>
  );
}
