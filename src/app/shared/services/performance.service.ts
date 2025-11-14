import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

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
  private componentInitTimes: Map<string, number> = new Map();
  private changeDetectionCounts: Map<string, number> = new Map();

  constructor(private logger: LoggerService) {}

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
          this.logger.log(`⏱️ Performance: ${name} took ${duration.toFixed(2)}ms`);
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
        
        this.logger.group('🚀 App Performance Metrics');
        this.logger.log(`Initial Load: ${loadTime}ms`);
        this.logger.log(`DOM Content Loaded: ${domContentLoaded}ms`);
        if (firstPaint) {
          this.logger.log(`First Paint: ${Math.round(firstPaint.startTime)}ms`);
        }
        this.logger.groupEnd();
      });
    }
  }

  /**
   * Track component initialization time
   */
  trackComponentInit(componentName: string): void {
    if (!environment.production) {
      const initTime = performance.now();
      this.componentInitTimes.set(componentName, initTime);
    }
  }

  /**
   * Get component initialization time
   */
  getComponentInitTime(componentName: string): number | null {
    return this.componentInitTimes.get(componentName) || null;
  }

  /**
   * Track change detection cycle
   */
  trackChangeDetection(componentName: string): void {
    if (!environment.production) {
      const current = this.changeDetectionCounts.get(componentName) || 0;
      this.changeDetectionCounts.set(componentName, current + 1);
    }
  }

  /**
   * Get change detection statistics
   */
  getChangeDetectionStats(): { [componentName: string]: number } {
    const stats: { [key: string]: number } = {};
    this.changeDetectionCounts.forEach((count, name) => {
      stats[name] = count;
    });
    return stats;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    measures: { [name: string]: number };
    componentInitTimes: { [name: string]: number };
    changeDetectionCounts: { [name: string]: number };
  } {
    const measures: { [key: string]: number } = {};
    this.measures.forEach((value, key) => {
      measures[key] = value;
    });

    const initTimes: { [key: string]: number } = {};
    this.componentInitTimes.forEach((value, key) => {
      initTimes[key] = value;
    });

    return {
      measures,
      componentInitTimes: initTimes,
      changeDetectionCounts: this.getChangeDetectionStats()
    };
  }
}

