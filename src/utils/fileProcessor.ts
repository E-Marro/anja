/**
 * File Processing Utilities
 * Verarbeitet JSONL-Dateien für das RAG-System
 */

import type { Urteil, Chunk, Statistics } from '@/types';
import { storageService } from '@/services/storageService';

export interface ProcessingResult {
  success: boolean;
  message: string;
  count?: number;
  type?: 'index' | 'chunks' | 'chunks_by_sig' | 'dedup';
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/**
 * Prüft ob Datei zu groß ist
 */
export function validateFileSize(file: File): { valid: boolean; message?: string } {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      message: `❌ ${file.name} ist zu groß (${sizeMB}MB)!\n\n` +
               `Max. 50MB pro Datei.\n\n` +
               `Für große Dateien:\n` +
               `→ Bitte mit 'split' aufteilen:\n` +
               `  split -l 5000 ${file.name} ${file.name.replace('.jsonl', '_part_')}`
    };
  }
  return { valid: true };
}

/**
 * Parst JSONL-Datei
 */
export function parseJSONL<T = any>(text: string): T[] {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => JSON.parse(line));
}

/**
 * Verarbeitet index_master.jsonl
 */
export async function processIndexFile(file: File): Promise<ProcessingResult> {
  try {
    const text = await file.text();
    const indexLines = parseJSONL<Urteil>(text);

    await storageService.setIndex(indexLines);

    return {
      success: true,
      message: `✅ ${indexLines.length} Urteile geladen!`,
      count: indexLines.length,
      type: 'index'
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Fehler beim Verarbeiten von ${file.name}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

/**
 * Verarbeitet chunks_by_signatur.jsonl
 */
export async function processChunksBySignaturFile(file: File): Promise<ProcessingResult> {
  try {
    const text = await file.text();
    const chunkData = parseJSONL(text);

    await storageService.setChunksBySignatur(chunkData);

    return {
      success: true,
      message: `✅ Chunks nach Signatur organisiert (${chunkData.length} Signaturen)!`,
      count: chunkData.length,
      type: 'chunks_by_sig'
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

/**
 * Verarbeitet chunks_part_* Dateien (Split chunks_master)
 */
export async function processChunksPartFile(file: File): Promise<ProcessingResult> {
  try {
    const text = await file.text();
    const chunkData = parseJSONL<Chunk>(text);

    const merged = await storageService.appendChunksMaster(chunkData);

    return {
      success: true,
      message: `✅ Chunk-Teil geladen (${chunkData.length} Chunks)!\nInsgesamt: ${merged.length}`,
      count: merged.length,
      type: 'chunks'
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

/**
 * Verarbeitet deduplication_map.jsonl
 */
export async function processDeduplicationFile(file: File): Promise<ProcessingResult> {
  try {
    const text = await file.text();
    const dedupData = parseJSONL(text);

    await storageService.setDeduplication(dedupData);

    return {
      success: true,
      message: `✅ Deduplications-Map geladen!`,
      count: dedupData.length,
      type: 'dedup'
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

/**
 * Hauptfunktion zum Verarbeiten von Dateien
 */
export async function processFile(file: File): Promise<ProcessingResult> {
  // Größen-Check
  const sizeCheck = validateFileSize(file);
  if (!sizeCheck.valid) {
    return {
      success: false,
      message: sizeCheck.message!
    };
  }

  // Datei-Typ erkennen und entsprechend verarbeiten
  if (file.name.includes('index_master')) {
    return processIndexFile(file);
  } else if (file.name.includes('chunks_by_signatur')) {
    return processChunksBySignaturFile(file);
  } else if (file.name.includes('chunks_part')) {
    return processChunksPartFile(file);
  } else if (file.name.includes('deduplication')) {
    return processDeduplicationFile(file);
  } else {
    return {
      success: false,
      message: `❌ Unbekannter Dateityp: ${file.name}\n\nErwartete Dateien:\n- index_master.jsonl\n- chunks_by_signatur.jsonl\n- chunks_part_*\n- deduplication_map.jsonl`
    };
  }
}

/**
 * Verarbeitet mehrere Dateien
 */
export async function processFiles(files: FileList | File[]): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];

  for (const file of Array.from(files)) {
    const result = await processFile(file);
    results.push(result);
  }

  return results;
}

/**
 * Berechnet Statistiken aus geladenen Urteilen
 */
export function calculateStatistics(urteile: Urteil[]): Statistics {
  const stats: Statistics = {
    totalUrteile: urteile.length,
    totalChunks: urteile.reduce((sum, u) => sum + (u.chunks_count || 0), 0),
    dateRange: {},
    tags: {},
    courtDistribution: {}
  };

  if (urteile.length > 0) {
    // Datumsspanne
    stats.dateRange.earliest = urteile.reduce(
      (min, u) => (u.date < min ? u.date : min),
      '9999-12-31'
    );
    stats.dateRange.latest = urteile.reduce(
      (max, u) => (u.date > max ? u.date : max),
      '1900-01-01'
    );

    // Tag-Verteilung
    urteile.forEach(urteil => {
      urteil.tags?.forEach(tag => {
        stats.tags![tag] = (stats.tags![tag] || 0) + 1;
      });

      // Gerichtsverteilung
      if (urteil.court) {
        stats.courtDistribution![urteil.court] =
          (stats.courtDistribution![urteil.court] || 0) + 1;
      }
    });
  }

  return stats;
}
