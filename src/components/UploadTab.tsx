import React from 'react';
import { Upload, FileUp } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { ProcessingResult } from '@/utils/fileProcessor';
import type { Statistics } from '@/types';
import { formatNumber } from '@/utils/formatter';

interface UploadTabProps {
  stats: Statistics;
  onUploadComplete: () => void;
  messageCount: number;
}

export const UploadTab: React.FC<UploadTabProps> = ({
  stats,
  onUploadComplete,
  messageCount,
}) => {
  const [results, setResults] = React.useState<ProcessingResult[]>([]);

  const { isProcessing, isDragging, handleDragOver, handleDragLeave, handleDrop, handleFileInput } =
    useFileUpload();

  const handleComplete = (newResults: ProcessingResult[]) => {
    setResults(prev => [...prev, ...newResults]);
    onUploadComplete();

    // Auto-clear results after 5s
    setTimeout(() => {
      setResults([]);
    }, 5000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-red-500/30">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileUp className="w-5 h-5 text-red-400" />
          JSONL-Dateien importieren
        </h2>

        {/* File Size Info */}
        <div className="mb-6 p-4 bg-red-600/20 rounded-lg border border-red-500/30">
          <p className="text-sm text-red-300 font-semibold mb-2">📝 Dateigrößen:</p>
          <div className="text-xs text-red-400 space-y-1 font-mono">
            <div>✅ index_master.jsonl: ~3 MB (OK)</div>
            <div>✅ chunks_by_signatur.jsonl: ~1 MB (OK)</div>
            <div>✅ deduplication_map.jsonl: ~100 KB (OK)</div>
            <div className="mt-2 pt-2 border-t border-red-500/30">
              ❌ chunks_master.jsonl: 144 MB (ZU GROSS!)
            </div>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, handleComplete)}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            isDragging
              ? 'border-red-400 bg-red-500/20 scale-[1.02]'
              : 'border-red-500/50 hover:border-red-400 hover:bg-red-500/5'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="text-lg mb-2">JSONL-Dateien hier ablegen</p>
          <p className="text-sm text-red-300 mb-4">Max. 50 MB pro Datei</p>
          <label className="inline-block px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer transition-colors">
            Dateien wählen
            <input
              type="file"
              multiple
              onChange={e => handleFileInput(e, handleComplete)}
              className="hidden"
              accept=".jsonl,.json"
            />
          </label>
        </div>

        {/* Anleitung für chunks_master */}
        <div className="mt-6 p-4 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
          <p className="text-sm text-yellow-300 font-semibold mb-2">
            🔧 chunks_master.jsonl zu groß?
          </p>
          <p className="text-xs text-yellow-400 mb-3">
            Teile die Datei mit diesem Befehl auf:
          </p>
          <div className="bg-black/40 p-3 rounded text-xs font-mono text-yellow-200 overflow-x-auto mb-3">
            split -l 5000 chunks_master.jsonl chunks_part_
          </div>
          <p className="text-xs text-yellow-400">
            Danach lade die chunks_part_* Dateien nacheinander hoch (sie werden automatisch
            zusammengeführt)
          </p>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-4 p-4 bg-red-600/20 rounded-lg border border-red-500/30">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Importiere Urteilsdaten...</span>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  result.success
                    ? 'bg-green-600/20 border-green-500/30 text-green-200'
                    : 'bg-red-600/20 border-red-500/30 text-red-200'
                }`}
              >
                <pre className="text-xs whitespace-pre-wrap font-mono">{result.message}</pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
          <div className="text-3xl font-bold text-red-400">
            {formatNumber(stats.totalUrteile)}
          </div>
          <div className="text-sm text-red-300">Urteile geladen</div>
        </div>
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
          <div className="text-3xl font-bold text-pink-400">
            {formatNumber(stats.totalChunks)}
          </div>
          <div className="text-sm text-red-300">Text-Chunks</div>
        </div>
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
          <div className="text-3xl font-bold text-cyan-400">{messageCount}</div>
          <div className="text-sm text-red-300">Chat-Nachrichten</div>
        </div>
      </div>
    </div>
  );
};
