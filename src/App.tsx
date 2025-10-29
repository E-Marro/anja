import React, { useState, useEffect } from 'react';
import { Brain, Search, MessageSquare, FileUp, BarChart3 } from 'lucide-react';
import type { Urteil, Message, FilterOptions, Statistics, TabType } from './types';
import { SearchTab } from './components/SearchTab';
import { ChatTab } from './components/ChatTab';
import { UploadTab } from './components/UploadTab';
import { StatsTab } from './components/StatsTab';
import { storageService } from './services/storageService';
import { claudeService } from './services/claudeService';
import { ragService } from './services/ragService';
import { calculateStatistics } from './utils/fileProcessor';
import './index.css';

const AVAILABLE_TAGS = [
  'Scheidung',
  'Sorgerecht',
  'Kindesunterhalt',
  'Altersvorsorge',
  'Hausrat',
  'Zugewinn',
];

const App: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [urteile, setUrteile] = useState<Urteil[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedUrteil, setSelectedUrteil] = useState<Urteil | null>(null);
  const [stats, setStats] = useState<Statistics>({
    totalUrteile: 0,
    totalChunks: 0,
    dateRange: {},
    tags: {},
    courtDistribution: {},
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchQuery: '',
    selectedTags: [],
    dateRange: { from: '', to: '' },
    selectedGericht: 'all',
  });

  // Load data from storage on mount
  useEffect(() => {
    loadDataFromStorage();
  }, []);

  // Update stats when urteile change
  useEffect(() => {
    if (urteile.length > 0) {
      const newStats = calculateStatistics(urteile);
      setStats(newStats);

      // Recalculate IDF for RAG
      ragService.calculateIDF(urteile);
    }
  }, [urteile]);

  const loadDataFromStorage = async () => {
    try {
      const indexData = await storageService.getIndex();
      if (indexData && Array.isArray(indexData)) {
        setUrteile(indexData);
      }
    } catch (error) {
      console.error('Error loading data from storage:', error);
    }
  };

  const handleUploadComplete = () => {
    loadDataFromStorage();
  };

  const handleUrteilSelect = (urteil: Urteil) => {
    setSelectedUrteil(urteil);
    setActiveTab('chat');

    // Add automatic intro message
    if (messages.length === 0 || messages[messages.length - 1].role === 'assistant') {
      const introMessage: Message = {
        role: 'user',
        content: `Erzähle mir über das Urteil ${urteil.signatur}: ${urteil.title}`,
        timestamp: Date.now(),
      };
      handleRAGQuery(introMessage.content);
    }
  };

  const handleRAGQuery = async (queryText?: string) => {
    const query = queryText || currentMessage;
    if (!query.trim() || urteile.length === 0) return;

    setIsProcessing(true);
    const userMessage = query;
    setCurrentMessage('');

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage, timestamp: Date.now() },
    ];
    setMessages(newMessages);

    try {
      // Search for relevant urteile using improved RAG
      const searchResults = ragService.searchUrteile(userMessage, urteile, {
        topK: 5,
        minScore: 0.05,
      });

      // Build context
      const context = ragService.buildContext(searchResults, 2500);

      // Create system prompt
      const systemPrompt = ragService.createSystemPrompt(context);

      // Call Claude API
      const response = await claudeService.sendMessage(newMessages, systemPrompt, {
        maxTokens: 1024,
        temperature: 0.7,
      });

      const answerText = claudeService.extractTextFromResponse(response);

      const assistantMessage: Message = {
        role: 'assistant',
        content: answerText,
        sources: ragService.extractSources(searchResults),
        timestamp: Date.now(),
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Query error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}\n\n` +
                 `Tipp: Stelle sicher, dass ein Claude API-Key konfiguriert ist.`,
        timestamp: Date.now(),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedUrteil(null);
  };

  const tabs = [
    { id: 'search' as TabType, icon: Search, label: 'Urteilssuche' },
    { id: 'chat' as TabType, icon: MessageSquare, label: 'RAG Chat' },
    { id: 'upload' as TabType, icon: FileUp, label: 'Import' },
    { id: 'stats' as TabType, icon: BarChart3, label: 'Statistiken' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-red-500/30 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-red-400" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                  Scheidungsrecht-DB 🇨🇭
                </h1>
                <p className="text-sm text-red-300">
                  Schweizer Scheidungsurteile RAG-System
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-red-300">
              <div className="font-bold text-red-400">
                {stats.totalUrteile.toLocaleString()}
              </div>
              <div>Urteile loaded</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-red-500/30 bg-black/10 sticky top-[73px] z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-red-600/30 border-b-2 border-red-400 text-white'
                    : 'text-red-300 hover:text-white hover:bg-red-600/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'search' && (
          <SearchTab
            urteile={urteile}
            filterOptions={filterOptions}
            setFilterOptions={setFilterOptions}
            onUrteilSelect={handleUrteilSelect}
            availableTags={AVAILABLE_TAGS}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab
            messages={messages}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            onSendMessage={() => handleRAGQuery()}
            isProcessing={isProcessing}
            selectedUrteil={selectedUrteil}
            onClearSelection={handleClearSelection}
            hasUrteile={urteile.length > 0}
          />
        )}

        {activeTab === 'upload' && (
          <UploadTab
            stats={stats}
            onUploadComplete={handleUploadComplete}
            messageCount={messages.length}
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab stats={stats} messageCount={messages.length} />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-red-500/30 bg-black/20 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-red-300">
          <p>
            Scheidungsrecht-RAG-System • Powered by Claude AI • Made with TypeScript & React
          </p>
          <p className="text-xs mt-1 text-red-400/70">
            ⚖️ Schweizer Rechtsprechung zum Scheidungsrecht
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
