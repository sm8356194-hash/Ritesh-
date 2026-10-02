import React, { useState, useRef, useEffect, useId } from 'react';
import { MapPin, Search, Check, X, SearchX, Globe, Info, Compass } from 'lucide-react';
import { DemoLocation, SAMPLE_LOCATIONS, searchDemoLocations } from '../../data/demoLocations';

interface LocationPickerProps {
  selectedLocation: DemoLocation | null;
  onSelectLocation: (location: DemoLocation) => void;
  error?: string;
  label?: string;
  idPrefix?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  selectedLocation,
  onSelectLocation,
  error,
  label = 'Birth Place (Location Search)',
  idPrefix = 'location-picker',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const searchInputId = useId();

  const filteredLocations = searchDemoLocations(query);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard navigation & accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
      e.stopPropagation();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev < filteredLocations.length - 1 ? prev + 1 : 0;
        scrollIntoView(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : filteredLocations.length - 1;
        scrollIntoView(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredLocations.length) {
        handleSelect(filteredLocations[highlightedIndex]);
      } else if (filteredLocations.length > 0) {
        handleSelect(filteredLocations[0]);
      }
    }
  };

  const scrollIntoView = (index: number) => {
    if (!listboxRef.current) return;
    const items = listboxRef.current.querySelectorAll('[role="option"]');
    if (items[index]) {
      (items[index] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  };

  const handleSelect = (loc: DemoLocation) => {
    // Deliver complete fresh location object (id, city, state, country, displayName, latitude, longitude, timezone)
    onSelectLocation({
      id: loc.id,
      city: loc.city,
      state: loc.state,
      country: loc.country,
      displayName: loc.displayName,
      latitude: loc.latitude,
      longitude: loc.longitude,
      timezone: loc.timezone,
      aliases: loc.aliases,
    });
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
    setIsOpen(true);
  };

  const handleChangeLocation = () => {
    setIsOpen(true);
    setQuery('');
    setHighlightedIndex(-1);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="flex items-center justify-between">
        <label 
          htmlFor={searchInputId} 
          className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>{label}</span>
        </label>
        <span className="text-[10px] text-amber-300/80 font-mono">
          Verified Coordinates
        </span>
      </div>

      {/* Selected Location Card Display */}
      {selectedLocation && !isOpen ? (
        <div 
          id={`${idPrefix}-selected-card`}
          className="p-3 rounded-xl bg-[#0c1222] border border-amber-400/40 shadow-sm relative group"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-100 truncate">
                  {selectedLocation.displayName}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                  Selected
                </span>
              </div>

              {/* Coordinates & Timezone Strip */}
              <div className="flex items-center gap-2 text-[10px] text-slate-400 pl-5 flex-wrap">
                <span className="font-mono text-amber-300/90 font-medium">
                  {selectedLocation.latitude >= 0 ? `${selectedLocation.latitude.toFixed(4)}° N` : `${Math.abs(selectedLocation.latitude).toFixed(4)}° S`}, {' '}
                  {selectedLocation.longitude >= 0 ? `${selectedLocation.longitude.toFixed(4)}° E` : `${Math.abs(selectedLocation.longitude).toFixed(4)}° W`}
                </span>
                <span>•</span>
                <span className="text-slate-300 font-mono">
                  TZ: {selectedLocation.timezone}
                </span>
              </div>
            </div>

            <button
              type="button"
              id={`${idPrefix}-change-btn`}
              onClick={handleChangeLocation}
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline pl-2 py-1 shrink-0 active:scale-95 transition-transform"
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        /* Search Input Box */
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-amber-400 absolute left-3 pointer-events-none" />
            <input
              ref={inputRef}
              id={searchInputId}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
                setHighlightedIndex(0);
              }}
              onFocus={() => {
                setIsOpen(true);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={isOpen}
              placeholder="Type city, state, country or alias (e.g. Bangalore, Varanasi, Dubai)..."
              className={`w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#0c1222] border text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all ${
                error ? 'border-rose-500' : 'border-[#1e2b4f] focus:border-amber-400'
              }`}
            />
            {query && (
              <button
                type="button"
                id={`${idPrefix}-clear-btn`}
                onClick={handleClear}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-200 active:scale-95 transition-transform"
                aria-label="Clear location search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Options */}
          {isOpen && (
            <div 
              ref={listboxRef}
              role="listbox"
              id={`${idPrefix}-dropdown`}
              className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl bg-[#0c1222] border border-amber-500/40 shadow-2xl divide-y divide-[#1e2b4f]/60"
            >
              {/* Dataset Scope Notice inside dropdown */}
              <div className="p-2 bg-[#111a30] text-[10px] text-amber-300/80 flex items-center justify-between gap-1.5 sticky top-0 z-10 border-b border-[#1e2b4f]/80">
                <div className="flex items-center gap-1.5 truncate">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Curated Astrological & World Locations Dataset</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 shrink-0">
                  {filteredLocations.length} found
                </span>
              </div>

              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  const isCurrentlySelected = selectedLocation?.id === loc.id;

                  return (
                    <button
                      key={loc.id}
                      role="option"
                      aria-selected={isCurrentlySelected}
                      type="button"
                      onClick={() => handleSelect(loc)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full text-left p-3 transition-colors flex items-center justify-between group min-h-[48px] active:bg-[#1f2c52] ${
                        isHighlighted ? 'bg-[#16203c]' : 'hover:bg-[#131c34]'
                      } ${isCurrentlySelected ? 'bg-amber-400/10' : ''}`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-semibold truncate ${
                            isHighlighted ? 'text-amber-300' : 'text-slate-200'
                          }`}>
                            {loc.displayName}
                          </span>
                          {loc.aliases && loc.aliases.length > 0 && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#101930] text-slate-400 border border-[#1e2b4f] shrink-0 hidden sm:inline">
                              aka {loc.aliases[0]}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>
                            {loc.latitude >= 0 ? `${loc.latitude.toFixed(2)}°N` : `${Math.abs(loc.latitude).toFixed(2)}°S`}, {' '}
                            {loc.longitude >= 0 ? `${loc.longitude.toFixed(2)}°E` : `${Math.abs(loc.longitude).toFixed(2)}°W`}
                          </span>
                          <span>•</span>
                          <span className="text-slate-300">{loc.timezone}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        {isCurrentlySelected && (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span className={`text-[10px] font-medium px-2 py-1 rounded-lg border transition-all ${
                          isHighlighted
                            ? 'bg-amber-400 text-slate-950 font-bold border-amber-400'
                            : 'bg-[#16203c] text-slate-300 border-[#1e2b4f] group-hover:border-amber-400/40 group-hover:text-amber-200'
                        }`}>
                          Select
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                /* Enhanced Clear Empty Results State */
                <div 
                  id={`${idPrefix}-no-results`}
                  className="p-5 text-center space-y-2 bg-[#0c1222]"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
                    <SearchX className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">
                      No matching location found for "{query.trim()}"
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                      Our offline dataset contains major global and Vedic cities. Try searching by state or country, or select a nearby metro below.
                    </p>
                  </div>
                  <div className="pt-1 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-2.5 py-1 rounded-lg bg-[#16203c] hover:bg-[#1e2b4f] text-amber-300 text-[11px] font-medium border border-[#1e2b4f]"
                    >
                      Clear Search
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inline Validation Error */}
      {error && (
        <p className="text-[11px] text-rose-400 mt-1">{error}</p>
      )}

      {/* Quick Suggestion Chips */}
      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-slate-400">Quick Cities:</span>
        {SAMPLE_LOCATIONS.slice(0, 6).map((loc) => (
          <button
            key={loc.id}
            type="button"
            onClick={() => handleSelect(loc)}
            className={`px-2 py-0.5 rounded-md text-[10px] transition-colors border active:scale-95 ${
              selectedLocation?.id === loc.id
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-semibold'
                : 'bg-[#16203c] hover:bg-[#1e2b4f] text-slate-300 border-slate-700/50 hover:border-amber-400/30'
            }`}
          >
            {loc.city}
          </button>
        ))}
      </div>
    </div>
  );
};
