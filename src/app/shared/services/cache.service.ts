import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly STATIC_DATA_TTL = 30 * 60 * 1000; // 30 minutes for rarely-changing data (seasons, divisions)
  private readonly GAMES_TTL = 2 * 60 * 1000; // 2 minutes for games (change more frequently)
  private cacheSubjects = new Map<string, BehaviorSubject<any>>();

  constructor(private logger: LoggerService) {
    // Clean up expired cache entries every minute
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60 * 1000);
  }

  /**
   * Get data from cache or execute the observable if not cached or expired
   * Implements stale-while-revalidate: returns cached data immediately if available,
   * then updates cache in background if expired
   */
  getOrFetch<T>(key: string, observable: Observable<T>, ttl: number = this.DEFAULT_TTL): Observable<T> {
    const cachedEntry = this.cache.get(key);
    const now = Date.now();

    // Auto-detect TTL based on cache key for common data types
    if (ttl === this.DEFAULT_TTL) {
      if (key.includes('seasons') || key.includes('divisions') || key.includes('clubs-season')) {
        ttl = this.STATIC_DATA_TTL; // Longer cache for rarely-changing data
      } else if (key.includes('games')) {
        ttl = this.GAMES_TTL; // Shorter cache for frequently-changing data
      }
    }

    // Return cached data if it exists and hasn't expired
    if (cachedEntry && now < cachedEntry.expiresAt) {
      if (!environment.production) {
        this.logger.log(`Cache HIT for ${key}`);
      }
      return of(cachedEntry.data);
    }

    // Stale-while-revalidate: if data exists but is expired, return it immediately
    // and refresh in background
    if (cachedEntry && now >= cachedEntry.expiresAt) {
      if (!environment.production) {
        this.logger.log(`Cache STALE for ${key}, returning stale data and refreshing...`);
      }
      // Return stale data immediately
      const staleData$ = of(cachedEntry.data);
      
      // Refresh in background (don't wait for it)
      if (!this.cacheSubjects.has(key)) {
        this.refreshCache(key, observable, ttl);
      }
      
      return staleData$;
    }

    // Return existing subject if request is already in progress
    if (this.cacheSubjects.has(key)) {
      if (!environment.production) {
        this.logger.log(`Cache IN_PROGRESS for ${key}`);
      }
      return this.cacheSubjects.get(key)!.asObservable();
    }

    // Create new subject for this request
    const subject = new BehaviorSubject<T | null>(null);
    this.cacheSubjects.set(key, subject);

    if (!environment.production) {
      this.logger.log(`Cache MISS for ${key}, fetching from API...`);
    }

    // Execute the observable and cache the result
    return observable.pipe(
      tap(data => {
        // Cache the successful result
        this.cache.set(key, {
          data,
          timestamp: now,
          expiresAt: now + ttl
        });

        // Emit the result and complete the subject
        subject.next(data);
        subject.complete();
        this.cacheSubjects.delete(key);

        if (!environment.production) {
          this.logger.log(`Cached data for ${key}, expires in ${ttl / 1000}s`);
        }
      })
    );
  }

  /**
   * Refresh cache in background (for stale-while-revalidate pattern)
   */
  private refreshCache<T>(key: string, observable: Observable<T>, ttl: number): void {
    const subject = new BehaviorSubject<T | null>(null);
    this.cacheSubjects.set(key, subject);

    observable.subscribe({
      next: (data) => {
        const now = Date.now();
        this.cache.set(key, {
          data,
          timestamp: now,
          expiresAt: now + ttl
        });
        subject.complete();
        this.cacheSubjects.delete(key);
        if (!environment.production) {
          this.logger.log(`Background refresh completed for ${key}`);
        }
      },
      error: (error) => {
        // If refresh fails, keep the stale data
        subject.complete();
        this.cacheSubjects.delete(key);
        if (!environment.production) {
          this.logger.warn(`Background refresh failed for ${key}, keeping stale data`, error);
        }
      }
    });
  }

  /**
   * Manually set cache data
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
    if (!environment.production) {
      this.logger.log(`Manually cached data for ${key}, expires in ${ttl / 1000}s`);
    }
  }

  /**
   * Get data from cache without fallback
   */
  getFromCache<T>(key: string): T | null {
    const cachedEntry = this.cache.get(key);
    const now = Date.now();

    if (cachedEntry && now < cachedEntry.expiresAt) {
      return cachedEntry.data;
    }

    return null;
  }

  /**
   * Check if cache has a valid (non-expired) entry for the key
   */
  has(key: string): boolean {
    const cachedEntry = this.cache.get(key);
    const now = Date.now();

    return !!(cachedEntry && now < cachedEntry.expiresAt);
  }

  /**
   * Get data from cache (alias for getFromCache for backward compatibility)
   */
  get(key: string): any {
    return this.getFromCache(key);
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    if (!environment.production) {
      this.logger.log(`Invalidated cache for ${key}`);
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        if (!environment.production) {
          this.logger.log(`Invalidated cache for ${key} (pattern: ${pattern})`);
        }
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.cacheSubjects.clear();
    if (!environment.production) {
      this.logger.log('Cleared all cache');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[]; expired: number } {
    const now = Date.now();
    let expired = 0;
    
    for (const entry of this.cache.values()) {
      if (now >= entry.expiresAt) {
        expired++;
      }
    }

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      expired
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0 && !environment.production) {
      this.logger.log(`Cleaned up ${cleaned} expired cache entries`);
    }
  }
}