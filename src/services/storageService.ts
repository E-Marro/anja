/**
 * Storage Service für Browser-Storage-Operationen
 * Abstrahiert den Zugriff auf window.storage
 */

export class StorageService {
  private static instance: StorageService;
  private storage: any;

  private constructor() {
    // Prüfe ob window.storage verfügbar ist (Claude Artifacts)
    if (typeof window !== 'undefined' && (window as any).storage) {
      this.storage = (window as any).storage;
    } else {
      // Fallback zu localStorage
      this.storage = {
        get: async (key: string) => {
          const value = localStorage.getItem(key);
          return value ? { value } : null;
        },
        set: async (key: string, value: string) => {
          localStorage.setItem(key, value);
        },
        remove: async (key: string) => {
          localStorage.removeItem(key);
        }
      };
    }
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.storage.get(key);
      if (!result?.value) return null;
      return JSON.parse(result.value) as T;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await this.storage.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.storage.remove(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = ['scheidung_index', 'scheidung_chunks_master', 'scheidung_chunks_by_sig', 'scheidung_dedup'];
      for (const key of keys) {
        await this.remove(key);
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Spezifische Methoden für das RAG-System
  async getIndex() {
    return this.get('scheidung_index');
  }

  async setIndex(data: any) {
    return this.set('scheidung_index', data);
  }

  async getChunksMaster() {
    return this.get('scheidung_chunks_master');
  }

  async setChunksMaster(data: any) {
    return this.set('scheidung_chunks_master', data);
  }

  async appendChunksMaster(data: any[]) {
    const existing = await this.getChunksMaster() || [];
    const merged = Array.isArray(existing) ? existing.concat(data) : data;
    await this.setChunksMaster(merged);
    return merged;
  }

  async getChunksBySignatur() {
    return this.get('scheidung_chunks_by_sig');
  }

  async setChunksBySignatur(data: any) {
    return this.set('scheidung_chunks_by_sig', data);
  }

  async getDeduplication() {
    return this.get('scheidung_dedup');
  }

  async setDeduplication(data: any) {
    return this.set('scheidung_dedup', data);
  }
}

export const storageService = StorageService.getInstance();
