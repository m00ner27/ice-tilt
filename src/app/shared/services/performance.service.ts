import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Performance measurement service for tracking app load times and performance metrics
 * Only logs in development mode to avoid performance impact in production
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  /**
   * Mark a performance point (like a timestamp)
   */
  mark(name: string): void {
    if (!environment.production && typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number | null {
    if (!environment.production && typeof performance !== 'undefined') {
      try {
        if (endMark) {
          performance.measure(name, startMark, endMark);
        } else {
          performance.measure(name, startMark);
        }
        
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (measure) {
          const duration = measure.duration;
          this.measures.set(name, duration);
          console.log(`⏱️ Performance: ${name} took ${duration.toFixed(2)}ms`);
          return duration;
        }
      } catch (error) {
        // Silently fail if marks don't exist
      }
    }
    return null;
  }

  /**
   * Get all performance measures
   */
  getMeasures(): Map<string, number> {
    return new Map(this.measures);
  }

  /**
   * Clear all marks and measures
   */
  clear(): void {
    if (!environment.production && typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks();
      performance.clearMeasures();
    }
    this.marks.clear();
    this.measures.clear();
  }

  /**
   * Log initial load time
   */
  logInitialLoad(): void {
    if (!environment.production && typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        const domContentLoaded = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
        const firstPaint = performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint');
        
        console.group('🚀 App Performance Metrics');
        console.log(`Initial Load: ${loadTime}ms`);
        console.log(`DOM Content Loaded: ${domContentLoaded}ms`);
        if (firstPaint) {
          console.log(`First Paint: ${Math.round(firstPaint.startTime)}ms`);
        }
        console.groupEnd();
      });
    }
  }
}

