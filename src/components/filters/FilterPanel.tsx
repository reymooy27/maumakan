'use client';

import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';

const PRICE_LABELS = ['$', '$$', '$$$', '$$$$'];

export default function FilterPanel() {
  const { filters, setFilters, resetFilters, filterPanelOpen, setFilterPanelOpen } = useMapStore();

  function togglePrice(value: number) {
    const current = filters.priceRange;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilters({ priceRange: next.length ? next : [1, 2, 3, 4] });
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setFilterPanelOpen(!filterPanelOpen)}
        className={`
          flex items-center gap-2 px-4 py-2.5
          bg-gray-900/90 backdrop-blur-sm border rounded-xl
          text-sm font-medium transition-all duration-200 cursor-pointer
          ${filterPanelOpen
            ? 'border-orange-500 text-orange-400'
            : 'border-gray-700 text-white hover:border-orange-500 hover:text-orange-400'}
        `}
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters
      </button>

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-80 z-50
          bg-gray-900/95 backdrop-blur-lg border-l border-gray-800
          transform transition-transform duration-300 ease-in-out
          ${filterPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Filters</h2>
          <div className="flex gap-2">
            <button
              onClick={resetFilters}
              title="Reset"
              className="p-1.5 text-gray-400 hover:text-orange-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFilterPanelOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-7">
          {/* Price Range */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Price Range
            </p>
            <div className="flex gap-2">
              {PRICE_LABELS.map((label, i) => {
                const val = i + 1;
                const active = filters.priceRange.includes(val);
                return (
                  <button
                    key={val}
                    onClick={() => togglePrice(val)}
                    className={`
                      flex-1 py-2 rounded-lg text-sm font-semibold border transition-all duration-150 cursor-pointer
                      ${active
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-orange-500 hover:text-orange-400'}
                    `}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Min Rating */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Minimum Rating: <span className="text-white">{filters.minRating === 0 ? 'Any' : `${filters.minRating}★`}</span>
            </p>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={filters.minRating}
              onChange={(e) => setFilters({ minRating: parseFloat(e.target.value) })}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Any</span><span>5★</span>
            </div>
          </div>

          {/* Max Distance */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Max Distance: <span className="text-white">{filters.maxDistance === 0 ? 'Unlimited' : `${filters.maxDistance} km`}</span>
            </p>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={filters.maxDistance}
              onChange={(e) => setFilters({ maxDistance: parseInt(e.target.value) })}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Unlimited</span><span>20 km</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
