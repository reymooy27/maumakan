'use client';

import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';

const PRICE_LABELS = ['$', '$$', '$$$', '$$$$'];

export default function FilterPanel() {
  const { filters, setFilters, resetFilters, filterPanelOpen, setFilterPanelOpen } = useMapStore();

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
            ? 'border-orange-500 text-orange-400 shadow-[0_0_15px_-5px_#f97316]'
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
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <SlidersHorizontal className="w-4 h-4 text-orange-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Filters</h2>
          </div>
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

        <div className="p-5 space-y-7 h-[calc(100%-80px)] overflow-y-auto">
          {/* Open Now Toggle */}
          <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-xl border border-gray-700/50">
             <div>
               <p className="text-sm font-semibold text-white">Open Now</p>
               <p className="text-[10px] text-gray-400">Only show places currently open</p>
             </div>
             <button
               onClick={() => setFilters({ isOpenNow: !filters.isOpenNow })}
               className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${filters.isOpenNow ? 'bg-orange-500' : 'bg-gray-700'}`}
             >
               <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${filters.isOpenNow ? 'translate-x-5' : 'translate-x-0'}`} />
             </button>
          </div>

          {/* Price Range */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex justify-between">
              Price Range <span>Rp {filters.minPrice.toLocaleString('id-ID')} – Rp {filters.maxPrice.toLocaleString('id-ID')}</span>
            </p>
            
            <div className="space-y-6 px-1">
              {/* Min Price */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase font-bold">
                  <span>Min Budget</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min={0} max={filters.maxPrice} 
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ minPrice: Math.min(filters.maxPrice, Math.max(0, parseInt(e.target.value) || 0)) })}
                      className="w-20 bg-gray-800 border-none text-right text-orange-400 text-xs focus:ring-1 focus:ring-orange-500 rounded px-2 py-1"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={500000}
                  step={5000}
                  value={filters.minPrice}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setFilters({ minPrice: Math.min(val, filters.maxPrice) });
                  }}
                  className="w-full accent-orange-500 h-1"
                />
              </div>

              {/* Max Price */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase font-bold">
                  <span>Max Budget</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min={filters.minPrice} max={500000} 
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ maxPrice: Math.max(filters.minPrice, Math.min(500000, parseInt(e.target.value) || 500000)) })}
                      className="w-20 bg-gray-800 border-none text-right text-orange-400 text-xs focus:ring-1 focus:ring-orange-500 rounded px-2 py-1"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={500000}
                  step={5000}
                  value={filters.maxPrice}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setFilters({ maxPrice: Math.max(val, filters.minPrice) });
                  }}
                  className="w-full accent-orange-500 h-1"
                />
              </div>
            </div>
            
            <div className="flex justify-between text-[10px] text-gray-500 mt-4 px-1">
              <span>Rp 0</span>
              <span>Rp 250k</span>
              <span>Rp 500k</span>
            </div>
          </div>

          {/* Min Rating */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Min Rating: <span className="text-white ml-1">{filters.minRating === 0 ? 'Any' : `${filters.minRating}★`}</span>
            </p>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={filters.minRating}
              onChange={(e) => setFilters({ minRating: parseFloat(e.target.value) })}
              className="w-full accent-orange-500 h-1"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
              <span>Any</span><span>5★</span>
            </div>
          </div>

          {/* Max Distance */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Distance: <span className="text-white ml-1">{filters.maxDistance === 0 ? 'Anywhere' : `< ${filters.maxDistance} km`}</span>
            </p>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={filters.maxDistance}
              onChange={(e) => setFilters({ maxDistance: parseFloat(e.target.value) })}
              className="w-full accent-orange-500 h-1"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
              <span>0 km</span><span>10 km</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
