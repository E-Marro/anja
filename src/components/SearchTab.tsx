import React from 'react';
import { Filter, Search, Copy, Check, AlertCircle } from 'lucide-react';
import type { Urteil, FilterOptions } from '@/types';
import { formatCitation } from '@/utils/formatter';

interface SearchTabProps {
  urteile: Urteil[];
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
  onUrteilSelect: (urteil: Urteil) => void;
  availableTags: string[];
}

export const SearchTab: React.FC<SearchTabProps> = ({
  urteile,
  filterOptions,
  setFilterOptions,
  onUrteilSelect,
  availableTags,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const filteredUrteile = React.useMemo(() => {
    return urteile.filter(urteil => {
      // Text Search
      if (filterOptions.searchQuery.trim()) {
        const query = filterOptions.searchQuery.toLowerCase();
        const matches =
          urteil.signatur?.toLowerCase().includes(query) ||
          urteil.title?.toLowerCase().includes(query) ||
          urteil.court?.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Tags Filter
      if (filterOptions.selectedTags.length > 0) {
        const hasTag = filterOptions.selectedTags.some(tag =>
          urteil.tags?.includes(tag)
        );
        if (!hasTag) return false;
      }

      // Date Range
      if (filterOptions.dateRange.from && urteil.date < filterOptions.dateRange.from)
        return false;
      if (filterOptions.dateRange.to && urteil.date > filterOptions.dateRange.to)
        return false;

      // Court Filter
      if (
        filterOptions.selectedGericht !== 'all' &&
        urteil.court !== filterOptions.selectedGericht
      )
        return false;

      return true;
    });
  }, [urteile, filterOptions]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleTag = (tag: string) => {
    const newTags = filterOptions.selectedTags.includes(tag)
      ? filterOptions.selectedTags.filter(t => t !== tag)
      : [...filterOptions.selectedTags, tag];

    setFilterOptions({
      ...filterOptions,
      selectedTags: newTags,
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter Panel */}
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-red-400" />
          Filter & Suche
        </h2>

        <div className="space-y-4">
          {/* Textsuche */}
          <div>
            <label className="block text-sm font-semibold text-red-300 mb-2">
              Volltextsuche
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
              <input
                type="text"
                value={filterOptions.searchQuery}
                onChange={e =>
                  setFilterOptions({ ...filterOptions, searchQuery: e.target.value })
                }
                placeholder="Aktenzeichen, Titel, Gericht..."
                className="w-full pl-10 pr-4 py-2 bg-black/40 border border-red-500/30 rounded-lg focus:outline-none focus:border-red-400 text-white placeholder-red-300/50"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-red-300 mb-2">
              Themen-Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterOptions.selectedTags.includes(tag)
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                      : 'bg-red-600/20 text-red-300 hover:bg-red-600/30'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Court Filter */}
          <div>
            <label className="block text-sm font-semibold text-red-300 mb-2">
              Gericht
            </label>
            <select
              value={filterOptions.selectedGericht}
              onChange={e =>
                setFilterOptions({ ...filterOptions, selectedGericht: e.target.value })
              }
              className="px-4 py-2 bg-black/40 border border-red-500/30 rounded-lg focus:outline-none focus:border-red-400 text-white"
            >
              <option value="all">Alle Gerichte</option>
              <option value="BGer">Bundesgericht (BGer)</option>
              <option value="BGE">Bundesgericht Entscheidungen (BGE)</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-red-300 mb-2">Von</label>
              <input
                type="date"
                value={filterOptions.dateRange.from}
                onChange={e =>
                  setFilterOptions({
                    ...filterOptions,
                    dateRange: { ...filterOptions.dateRange, from: e.target.value },
                  })
                }
                className="w-full px-4 py-2 bg-black/40 border border-red-500/30 rounded-lg focus:outline-none focus:border-red-400 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-red-300 mb-2">Bis</label>
              <input
                type="date"
                value={filterOptions.dateRange.to}
                onChange={e =>
                  setFilterOptions({
                    ...filterOptions,
                    dateRange: { ...filterOptions.dateRange, to: e.target.value },
                  })
                }
                className="w-full px-4 py-2 bg-black/40 border border-red-500/30 rounded-lg focus:outline-none focus:border-red-400 text-white"
              />
            </div>
          </div>

          <div className="text-sm text-red-300 pt-2 border-t border-red-500/30">
            Gefunden:{' '}
            <span className="font-bold text-red-400">{filteredUrteile.length}</span>{' '}
            Urteile
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {filteredUrteile.length === 0 ? (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-12 border border-red-500/30 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400 opacity-50" />
            <p className="text-red-300">
              Keine Urteile gefunden. Bitte Filter anpassen.
            </p>
          </div>
        ) : (
          filteredUrteile.slice(0, 50).map(urteil => (
            <div
              key={urteil.id}
              className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-red-500/30 hover:border-red-400/60 transition-all cursor-pointer hover:bg-black/40 group"
              onClick={() => onUrteilSelect(urteil)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-red-400 font-bold">
                      {urteil.signatur}
                    </span>
                    <span className="text-sm text-red-300">{urteil.date}</span>
                    <span className="text-xs text-red-400/70">{urteil.court}</span>
                  </div>
                  <h3 className="font-semibold mb-2 text-white group-hover:text-red-100">
                    {urteil.title}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {urteil.tags?.map(tag => (
                      <span
                        key={tag}
                        className="text-xs bg-red-600/30 text-red-200 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    copyToClipboard(formatCitation(urteil), urteil.id);
                  }}
                  className="p-2 hover:bg-red-600/30 rounded-lg transition-colors"
                  title="Zitat kopieren"
                >
                  {copiedId === urteil.id ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-red-400" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
