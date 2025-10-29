/**
 * RAG (Retrieval Augmented Generation) Service
 * Implementiert verbesserte Suchlogik für Urteile
 */

import type { Urteil, RAGSearchResult, Chunk } from '@/types';

export class RAGService {
  private static instance: RAGService;

  // IDF-Cache für häufige Begriffe
  private idfCache: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  /**
   * Tokenisiert Text in Wörter
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\säöüß]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2); // Nur Wörter mit 3+ Zeichen
  }

  /**
   * Berechnet TF (Term Frequency) für einen Text
   */
  private calculateTF(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    const totalTokens = tokens.length;

    tokens.forEach(token => {
      tf.set(token, (tf.get(token) || 0) + 1);
    });

    // Normalisieren
    tf.forEach((count, term) => {
      tf.set(term, count / totalTokens);
    });

    return tf;
  }

  /**
   * Berechnet IDF (Inverse Document Frequency)
   */
  calculateIDF(urteile: Urteil[]): void {
    const documentCount = urteile.length;
    const termDocumentCount = new Map<string, number>();

    // Zähle in wie vielen Dokumenten jeder Term vorkommt
    urteile.forEach(urteil => {
      const text = this.getUrteilText(urteil);
      const tokens = new Set(this.tokenize(text));

      tokens.forEach(token => {
        termDocumentCount.set(token, (termDocumentCount.get(token) || 0) + 1);
      });
    });

    // Berechne IDF
    termDocumentCount.forEach((docCount, term) => {
      const idf = Math.log(documentCount / docCount);
      this.idfCache.set(term, idf);
    });
  }

  /**
   * Extrahiert suchbaren Text aus Urteil
   */
  private getUrteilText(urteil: Urteil): string {
    return [
      urteil.title || '',
      urteil.signatur || '',
      urteil.court || '',
      urteil.summary || '',
      (urteil.tags || []).join(' ')
    ].join(' ');
  }

  /**
   * Berechnet Relevanz-Score mit TF-IDF
   */
  private calculateRelevanceScore(
    urteil: Urteil,
    queryTokens: string[]
  ): number {
    const urteilText = this.getUrteilText(urteil);
    const urteilTokens = this.tokenize(urteilText);
    const tf = this.calculateTF(urteilTokens);

    let score = 0;

    queryTokens.forEach(queryToken => {
      const termFrequency = tf.get(queryToken) || 0;
      const inverseDocFrequency = this.idfCache.get(queryToken) || 0;

      score += termFrequency * inverseDocFrequency;

      // Bonus für exakte Matches in wichtigen Feldern
      if (urteil.title?.toLowerCase().includes(queryToken)) {
        score += 2.0;
      }
      if (urteil.tags?.some(tag => tag.toLowerCase().includes(queryToken))) {
        score += 1.5;
      }
      if (urteil.signatur?.toLowerCase().includes(queryToken)) {
        score += 1.0;
      }
    });

    return score;
  }

  /**
   * Sucht relevante Urteile basierend auf Query
   */
  searchUrteile(
    query: string,
    urteile: Urteil[],
    options: {
      topK?: number;
      minScore?: number;
    } = {}
  ): RAGSearchResult[] {
    const { topK = 5, minScore = 0.1 } = options;

    // Tokenisiere Query
    const queryTokens = this.tokenize(query);

    if (queryTokens.length === 0) {
      return [];
    }

    // Berechne IDF falls nicht bereits geschehen
    if (this.idfCache.size === 0) {
      this.calculateIDF(urteile);
    }

    // Berechne Scores für alle Urteile
    const results: RAGSearchResult[] = urteile
      .map(urteil => ({
        urteil,
        relevanceScore: this.calculateRelevanceScore(urteil, queryTokens)
      }))
      .filter(result => result.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, topK);

    return results;
  }

  /**
   * Sucht in Chunks für detaillierte Antworten
   */
  searchChunks(
    query: string,
    chunks: Chunk[],
    options: {
      topK?: number;
      minScore?: number;
    } = {}
  ): Array<Chunk & { score: number }> {
    const { topK = 10, minScore = 0.1 } = options;
    const queryTokens = this.tokenize(query);

    if (queryTokens.length === 0 || chunks.length === 0) {
      return [];
    }

    const results = chunks
      .map(chunk => {
        const chunkTokens = this.tokenize(chunk.text);
        const tf = this.calculateTF(chunkTokens);

        let score = 0;
        queryTokens.forEach(queryToken => {
          const termFrequency = tf.get(queryToken) || 0;
          const inverseDocFrequency = this.idfCache.get(queryToken) || 1;
          score += termFrequency * inverseDocFrequency;
        });

        return { ...chunk, score };
      })
      .filter(result => result.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results;
  }

  /**
   * Erstellt Kontext-String aus Suchergebnissen
   */
  buildContext(results: RAGSearchResult[], maxLength: number = 2000): string {
    if (results.length === 0) {
      return 'Keine relevanten Urteile gefunden.';
    }

    let context = 'Relevante Urteile:\n\n';

    for (const result of results) {
      const entry = `📋 ${result.urteil.signatur} (${result.urteil.date})\n` +
                   `Titel: ${result.urteil.title}\n` +
                   `Gericht: ${result.urteil.court}\n` +
                   `Relevanz: ${(result.relevanceScore * 100).toFixed(1)}%\n` +
                   `Tags: ${result.urteil.tags?.join(', ') || 'keine'}\n\n`;

      if (context.length + entry.length > maxLength) {
        break;
      }

      context += entry;
    }

    return context;
  }

  /**
   * Erstellt System-Prompt für Claude
   */
  createSystemPrompt(context: string): string {
    return `Du bist ein spezialisierter Assistent für Schweizer Scheidungsrecht.

WICHTIG: Antworte IMMER auf Deutsch und basiere deine Antworten auf den verfügbaren Urteilen.

Verfügbare Urteile und Kontext:
${context}

Anweisungen:
- Zitiere IMMER die Signatur (z.B. "5A_123/2020") und das Datum wenn du dich auf ein Urteil beziehst
- Erkläre rechtliche Konzepte klar und verständlich
- Wenn keine relevanten Urteile vorhanden sind, sage das ehrlich
- Strukturiere deine Antworten mit klaren Absätzen
- Nutze Aufzählungen für mehrere Punkte
- Gib praktische Hinweise, wenn möglich

Format für Zitate: **[Signatur vom Datum]**
Beispiel: **[5A_123/2020 vom 15.03.2020]**`;
  }

  /**
   * Extrahiert Quellen aus Suchergebnissen
   */
  extractSources(results: RAGSearchResult[]) {
    return results.map(result => ({
      signatur: result.urteil.signatur,
      date: result.urteil.date,
      relevanceScore: result.relevanceScore
    }));
  }

  /**
   * Cache zurücksetzen (z.B. bei neuen Daten)
   */
  clearCache(): void {
    this.idfCache.clear();
  }
}

export const ragService = RAGService.getInstance();
