/**
 * Claude API Service
 * Handhabt alle Kommunikation mit der Anthropic Claude API
 */

import type { ClaudeAPIRequest, ClaudeAPIResponse, Message } from '@/types';

export class ClaudeService {
  private static instance: ClaudeService;
  private apiKey: string | null = null;
  private readonly API_URL = 'https://api.anthropic.com/v1/messages';
  private readonly DEFAULT_MODEL = 'claude-haiku-4-20250514';

  private constructor() {}

  static getInstance(): ClaudeService {
    if (!ClaudeService.instance) {
      ClaudeService.instance = new ClaudeService();
    }
    return ClaudeService.instance;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  async sendMessage(
    messages: Message[],
    systemPrompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
    } = {}
  ): Promise<ClaudeAPIResponse> {
    if (!this.apiKey) {
      throw new Error('API-Key nicht konfiguriert. Bitte in den Einstellungen hinterlegen.');
    }

    const request: ClaudeAPIRequest = {
      model: options.model || this.DEFAULT_MODEL,
      max_tokens: options.maxTokens || 1024,
      system: systemPrompt,
      messages: messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: options.temperature ?? 0.7
    };

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Claude API Error (${response.status}): ${errorData.error?.message || response.statusText}`
        );
      }

      const data: ClaudeAPIResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unbekannter Fehler bei der API-Anfrage');
    }
  }

  extractTextFromResponse(response: ClaudeAPIResponse): string {
    if (response.content?.[0]?.text) {
      return response.content[0].text;
    }
    return 'Keine Antwort generiert';
  }
}

export const claudeService = ClaudeService.getInstance();
