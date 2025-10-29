/**
 * Formatting Utilities
 * Hilfs-Funktionen für Formatierung
 */

import type { Urteil, Source } from '@/types';

/**
 * Formatiert Urteil als Zitat
 */
export function formatCitation(urteil: Urteil): string {
  return `${urteil.signatur} (${urteil.date})`;
}

/**
 * Formatiert vollständiges Urteil-Zitat
 */
export function formatFullCitation(urteil: Urteil): string {
  return `${urteil.signatur} vom ${formatDate(urteil.date)}, ${urteil.court}`;
}

/**
 * Formatiert Datum für Anzeige
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-CH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
}

/**
 * Formatiert Zahlen mit Tausender-Trenner
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('de-CH');
}

/**
 * Formatiert Quellen-Liste
 */
export function formatSources(sources: Source[]): string {
  return sources
    .map(src => {
      const score = src.relevanceScore
        ? ` (${(src.relevanceScore * 100).toFixed(0)}%)`
        : '';
      return `• ${src.signatur} vom ${formatDate(src.date)}${score}`;
    })
    .join('\n');
}

/**
 * Formatiert Datei-Größe
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Kürzt Text auf maximale Länge
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Highlightet Suchbegriffe in Text
 */
export function highlightQuery(text: string, query: string): string {
  if (!query.trim()) return text;

  const terms = query.toLowerCase().split(/\s+/);
  let result = text;

  terms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  });

  return result;
}
