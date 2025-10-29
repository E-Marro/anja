import React, { useRef, useEffect } from 'react';
import { Send, Brain, X } from 'lucide-react';
import type { Urteil, Message } from '@/types';
import { formatCitation } from '@/utils/formatter';

interface ChatTabProps {
  messages: Message[];
  currentMessage: string;
  setCurrentMessage: (msg: string) => void;
  onSendMessage: () => void;
  isProcessing: boolean;
  selectedUrteil: Urteil | null;
  onClearSelection: () => void;
  hasUrteile: boolean;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  messages,
  currentMessage,
  setCurrentMessage,
  onSendMessage,
  isProcessing,
  selectedUrteil,
  onClearSelection,
  hasUrteile,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-red-500/30 h-[700px] flex flex-col">
      {/* Selected Urteil Header */}
      {selectedUrteil && (
        <div className="p-4 border-b border-red-500/30 bg-red-600/10">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-red-400 font-bold">
                {selectedUrteil.signatur}
              </span>
              <h3 className="font-semibold mt-1">{selectedUrteil.title}</h3>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedUrteil.tags?.map(tag => (
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
              onClick={onClearSelection}
              className="p-2 text-red-300 hover:text-red-200 hover:bg-red-600/20 rounded-lg transition-colors"
              title="Auswahl aufheben"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !selectedUrteil && (
          <div className="text-center text-red-300 mt-20">
            <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold">Frage etwas über Scheidungsrecht...</p>
            <p className="text-sm mt-2">Oder wähle ein Urteil aus der Suche</p>
            {!hasUrteile && (
              <div className="mt-4 p-4 bg-yellow-600/20 rounded-lg border border-yellow-500/30 max-w-md mx-auto">
                <p className="text-sm text-yellow-300">
                  ⚠️ Keine Urteile geladen. Bitte zuerst Daten im "Import"-Tab hochladen.
                </p>
              </div>
            )}
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg ${
              msg.role === 'user'
                ? 'bg-red-600/30 ml-12 border border-red-500/30'
                : 'bg-black/40 mr-12 border border-red-400/20'
            }`}
          >
            <div className="font-semibold mb-2 text-red-300 flex items-center gap-2">
              {msg.role === 'user' ? (
                <>
                  <span>👤</span> Frage
                </>
              ) : (
                <>
                  <span>⚖️</span> Antwort
                </>
              )}
            </div>
            <div className="whitespace-pre-wrap text-white leading-relaxed">
              {msg.content}
            </div>
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-red-500/30">
                <div className="text-xs text-red-300 mb-2 font-semibold flex items-center gap-1">
                  📜 Verwendete Quellen:
                </div>
                <div className="flex flex-wrap gap-2">
                  {msg.sources.map((src, i) => (
                    <span
                      key={i}
                      className="text-xs bg-red-600/30 px-2 py-1 rounded border border-red-500/30 font-mono"
                      title={`Relevanz: ${((src.relevanceScore || 0) * 100).toFixed(0)}%`}
                    >
                      {src.signatur} ({src.date})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="p-4 rounded-lg bg-black/40 mr-12 border border-red-400/20">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-red-300">Denke nach...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-red-500/30 bg-black/20">
        <div className="flex gap-2">
          <textarea
            value={currentMessage}
            onChange={e => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              hasUrteile
                ? 'Frage zum Scheidungsrecht...'
                : 'Bitte zuerst Urteile-Daten importieren'
            }
            className="flex-1 px-4 py-2 bg-black/40 border border-red-500/30 rounded-lg focus:outline-none focus:border-red-400 text-white placeholder-red-300/50 resize-none"
            rows={2}
            disabled={isProcessing || !hasUrteile}
          />
          <button
            onClick={onSendMessage}
            disabled={isProcessing || !hasUrteile || !currentMessage.trim()}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
            title="Nachricht senden (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {!hasUrteile && (
          <p className="text-xs text-yellow-400 mt-2">
            ℹ️ Lade zuerst die Urteilsdaten im "Import"-Tab hoch
          </p>
        )}
      </div>
    </div>
  );
};
