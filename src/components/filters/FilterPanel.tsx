'use client';

import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';
import { useState } from 'react';
import { Filters } from '@/types';

const AMENITIES_LIST = ['WiFi', 'Parking', 'AC', 'Toilet', 'Mushola'];
const DIETARY_LIST = ['Halal', 'Vegan', 'Vegetarian', 'Gluten-Free'];

export default function FilterPanel() {
  const { 
    filters: globalFilters, 
    setFilters: setGlobalFilters, 
    resetFilters: resetGlobalFilters, 
    filterPanelOpen, 
    setFilterPanelOpen 
  } = useMapStore();
  
  // Local state to hold changes before "Saving"
  const [localFilters, setLocalFilters] = useState<Filters>(globalFilters);

  // Sync local state when panel opens (using a separate handler or key)
  const openPanel = () => {
    setLocalFilters(globalFilters);
    setFilterPanelOpen(true);
  };

  const handleApply = () => {
    setGlobalFilters(localFilters);
    setFilterPanelOpen(false);
  };

  const handleReset = () => {
    resetGlobalFilters();
    // After store resets, we need to sync local state to the new default
    setLocalFilters(useMapStore.getState().filters);
  };

  const updateLocal = (partial: Partial<Filters>) => {
    setLocalFilters(prev => ({ ...prev, ...partial }));
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={openPanel}
        className={`
          flex items-center gap-2 px-3 py-2.5 sm:px-4
          bg-gray-900/90 backdrop-blur-sm border rounded-xl
          text-sm font-medium transition-all duration-200 cursor-pointer
          ${filterPanelOpen
            ? 'border-orange-500 text-orange-400 shadow-[0_0_15px_-5px_#f97316]'
            : 'border-gray-700 text-white hover:border-orange-500 hover:text-orange-400'}
        `}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span className="hidden sm:block">Filters</span>
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
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              title="Reset"
              className="p-2 text-gray-400 hover:text-orange-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleApply}
              title="Apply Filters"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer shadow-lg ml-1"
            >
              <Check className="w-3.5 h-3.5" />
              Apply
            </button>
            <button
              onClick={() => setFilterPanelOpen(false)}
              className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-7 h-[calc(100%-80px)] overflow-y-auto">
          {/* Sort By */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sort By</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateLocal({ orderBy: 'rating' })}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  localFilters.orderBy === 'rating' || !localFilters.orderBy
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Best Rated
              </button>
              <button
                onClick={() => updateLocal({ orderBy: 'favorites' })}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  localFilters.orderBy === 'favorites'
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Most Favorites
              </button>
            </div>
          </div>

          {/* Open Now Toggle */}
          <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-xl border border-gray-700/50">
             <div>
               <p className="text-sm font-semibold text-white">Open Now</p>
               <p className="text-[10px] text-gray-400">Only show places currently open</p>
             </div>
             <button
               onClick={() => updateLocal({ isOpenNow: !localFilters.isOpenNow })}
               className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${localFilters.isOpenNow ? 'bg-orange-500' : 'bg-gray-700'}`}
             >
               <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${localFilters.isOpenNow ? 'translate-x-5' : 'translate-x-0'}`} />
             </button>
          </div>

          {/* Price Range */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex justify-between">
              Price Range <span>Rp {localFilters.minPrice.toLocaleString('id-ID')} – Rp {localFilters.maxPrice.toLocaleString('id-ID')}</span>
            </p>
            
            <div className="space-y-6 px-1">
              {/* Min Price */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase font-bold">
                  <span>Min Budget</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min={0} max={localFilters.maxPrice} 
                      value={localFilters.minPrice}
                      onChange={(e) => updateLocal({ minPrice: Math.min(localFilters.maxPrice, Math.max(0, parseInt(e.target.value) || 0)) })}
                      className="w-20 bg-gray-800 border-none text-right text-orange-400 text-xs focus:ring-1 focus:ring-orange-500 rounded px-2 py-1"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={500000}
                  step={5000}
                  value={localFilters.minPrice}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateLocal({ minPrice: Math.min(val, localFilters.maxPrice) });
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
                      min={localFilters.minPrice} max={500000} 
                      value={localFilters.maxPrice}
                      onChange={(e) => updateLocal({ maxPrice: Math.max(localFilters.minPrice, Math.min(500000, parseInt(e.target.value) || 500000)) })}
                      className="w-20 bg-gray-800 border-none text-right text-orange-400 text-xs focus:ring-1 focus:ring-orange-500 rounded px-2 py-1"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={500000}
                  step={5000}
                  value={localFilters.maxPrice}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateLocal({ maxPrice: Math.max(val, localFilters.minPrice) });
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
              Min Rating: <span className="text-white ml-1">{localFilters.minRating === 0 ? 'Any' : `${localFilters.minRating}★`}</span>
            </p>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={localFilters.minRating}
              onChange={(e) => updateLocal({ minRating: parseFloat(e.target.value) })}
              className="w-full accent-orange-500 h-1"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
              <span>Any</span><span>5★</span>
            </div>
          </div>

          {/* Max Distance */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Distance: <span className="text-white ml-1">{localFilters.maxDistance === 0 ? 'Anywhere' : `< ${localFilters.maxDistance} km`}</span>
            </p>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={localFilters.maxDistance}
              onChange={(e) => updateLocal({ maxDistance: parseFloat(e.target.value) })}
              className="w-full accent-orange-500 h-1"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
              <span>0 km</span><span>10 km</span>
            </div>
          </div>

          {/* Smart Filters: Amenities */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map(amenity => (
                <button
                  key={amenity}
                  onClick={() => {
                    const current = localFilters.amenities;
                    updateLocal({
                      amenities: current.includes(amenity)
                        ? current.filter(a => a !== amenity)
                        : [...current, amenity]
                    });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    localFilters.amenities.includes(amenity)
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Filters: Dietary */}
          <div className="pt-2 pb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dietary Options</p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_LIST.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    const current = localFilters.dietaryTags;
                    updateLocal({
                      dietaryTags: current.includes(tag)
                        ? current.filter(t => t !== tag)
                        : [...current, tag]
                    });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    localFilters.dietaryTags.includes(tag)
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
