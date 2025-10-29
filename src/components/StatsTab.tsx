import React from 'react';
import { BarChart3, TrendingUp, Calendar, Tags } from 'lucide-react';
import type { Statistics } from '@/types';
import { formatNumber, formatDate } from '@/utils/formatter';

interface StatsTabProps {
  stats: Statistics;
  messageCount: number;
}

export const StatsTab: React.FC<StatsTabProps> = ({ stats, messageCount }) => {
  const topTags = React.useMemo(() => {
    if (!stats.tags) return [];
    return Object.entries(stats.tags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }, [stats.tags]);

  const topCourts = React.useMemo(() => {
    if (!stats.courtDistribution) return [];
    return Object.entries(stats.courtDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [stats.courtDistribution]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-red-400" />
        Statistik-Dashboard
      </h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-red-300">Urteile</div>
            <TrendingUp className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400">
            {formatNumber(stats.totalUrteile)}
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-red-300">Text-Chunks</div>
            <BarChart3 className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-3xl font-bold text-pink-400">
            {formatNumber(stats.totalChunks)}
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-red-300">Nachrichten</div>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-cyan-400">{messageCount}</div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-red-300">Ø Chunks/Urteil</div>
            <Tags className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">
            {stats.totalUrteile > 0
              ? Math.round(stats.totalChunks / stats.totalUrteile)
              : 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Overview */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
          <h3 className="font-semibold mb-4 text-red-300 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            System-Übersicht
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-red-500/20">
              <span className="text-red-300">Urteile geladen</span>
              <span className="font-bold text-white">
                {formatNumber(stats.totalUrteile)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-red-500/20">
              <span className="text-red-300">Text-Chunks</span>
              <span className="font-bold text-white">
                {formatNumber(stats.totalChunks)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-red-500/20">
              <span className="text-red-300">Frühestes Datum</span>
              <span className="font-bold text-white text-sm">
                {stats.dateRange.earliest || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-red-300">Neuestes Datum</span>
              <span className="font-bold text-white text-sm">
                {stats.dateRange.latest || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Chat Stats */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
          <h3 className="font-semibold mb-4 text-red-300 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Chat-Statistiken
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-red-500/20">
              <span className="text-red-300">Nachrichten</span>
              <span className="font-bold text-white">{messageCount}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-red-500/20">
              <span className="text-red-300">Status</span>
              <span className="font-bold text-green-400">✓ Aktiv</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-red-300">Datenquelle</span>
              <span className="font-bold text-white text-sm">
                {stats.totalUrteile > 0 ? 'Geladen' : 'Keine Daten'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Tags */}
      {topTags.length > 0 && (
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
          <h3 className="font-semibold mb-4 text-red-300 flex items-center gap-2">
            <Tags className="w-5 h-5" />
            Top Themen-Tags
          </h3>
          <div className="space-y-2">
            {topTags.map(([tag, count]) => {
              const percentage = (count / stats.totalUrteile) * 100;
              return (
                <div key={tag} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white">{tag}</span>
                    <span className="text-red-300">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-pink-600 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Court Distribution */}
      {topCourts.length > 0 && (
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
          <h3 className="font-semibold mb-4 text-red-300 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Gerichts-Verteilung
          </h3>
          <div className="space-y-3">
            {topCourts.map(([court, count]) => {
              const percentage = (count / stats.totalUrteile) * 100;
              return (
                <div key={court} className="flex justify-between items-center py-2 border-b border-red-500/20 last:border-0">
                  <span className="text-white">{court}</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-red-400">{count}</div>
                      <div className="text-xs text-red-300">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
