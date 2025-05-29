// services/persistent-cache.service.ts
import { Injectable } from '@angular/core';
import { openDB } from 'idb';

interface PersistentCacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class PersistentCacheService {
  private dbPromise = openDB('HomeServiceCache', 1, {
    upgrade(db) {
      db.createObjectStore('cache');
    }
  });

  async get<T>(key: string): Promise<PersistentCacheEntry<T> | null> {
    const db = await this.dbPromise;
    return (await db.get('cache', key)) ?? null;
  }

  async set<T>(key: string, value: PersistentCacheEntry<T>): Promise<void> {
    const db = await this.dbPromise;
    await db.put('cache', value, key);
  }

  async delete(key: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('cache', key);
  }

  async clear(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear('cache');
  }



}
