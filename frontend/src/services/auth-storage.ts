import type { StoredSession } from '../types/auth';

const storageKey = 'cicloviento.auth-session';

export const authStorage = {
  load(): StoredSession | null {
    const value = localStorage.getItem(storageKey);
    if (!value) return null;

    try {
      return JSON.parse(value) as StoredSession;
    } catch {
      localStorage.removeItem(storageKey);
      return null;
    }
  },

  save(session: StoredSession): void {
    localStorage.setItem(storageKey, JSON.stringify(session));
  },

  clear(): void {
    localStorage.removeItem(storageKey);
  },
};
