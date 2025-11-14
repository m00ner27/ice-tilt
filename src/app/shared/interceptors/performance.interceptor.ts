import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../services/logger.service';

interface ApiCallMetrics {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  responseSize?: number;
  statusCode?: number;
  cached?: boolean;
}

/**
 * HTTP Interceptor to monitor API call performance
 * Tracks request times, response sizes, and cache status
 * Only logs in development mode
 */
@Injectable()
export class PerformanceInterceptor implements HttpInterceptor {
  private metrics: ApiCallMetrics[] = [];
  private readonly MAX_METRICS = 100; // Keep last 100 API calls

  constructor(private logger: LoggerService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip monitoring for non-API calls (assets, etc.)
    if (!req.url.includes('/api/')) {
      return next.handle(req);
    }

    const startTime = performance.now();
    const metric: ApiCallMetrics = {
      url: req.url,
      method: req.method,
      startTime
    };

    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            const endTime = performance.now();
            metric.endTime = endTime;
            metric.duration = endTime - startTime;
            metric.statusCode = event.status;
            
            // Calculate response size
            const responseText = JSON.stringify(event.body);
            metric.responseSize = new Blob([responseText]).size;
            
            // Check if response came from cache (custom header)
            metric.cached = event.headers.get('X-Cache') === 'HIT';

            this.recordMetric(metric);
            this.logMetric(metric);
          }
        },
        error: (error) => {
          const endTime = performance.now();
          metric.endTime = endTime;
          metric.duration = endTime - startTime;
          metric.statusCode = error.status || 0;
          
          this.recordMetric(metric);
          this.logMetric(metric, error);
        }
      })
    );
  }

  private recordMetric(metric: ApiCallMetrics): void {
    this.metrics.push(metric);
    
    // Keep only last N metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }
  }

  private logMetric(metric: ApiCallMetrics, error?: any): void {
    if (environment.production) {
      return; // Don't log in production
    }

    const duration = metric.duration || 0;
    const sizeKB = metric.responseSize ? (metric.responseSize / 1024).toFixed(2) : '?';
    const cacheStatus = metric.cached ? ' [CACHED]' : '';
    const status = metric.statusCode || 'ERROR';
    
    if (error) {
      this.logger.error(
        `API ${metric.method} ${this.getShortUrl(metric.url)} - ${duration.toFixed(0)}ms - ${sizeKB}KB - Status: ${status}${cacheStatus}`,
        error
      );
    } else if (duration > 1000) {
      // Warn about slow API calls (>1s)
      this.logger.warn(
        `⚠️ SLOW API: ${metric.method} ${this.getShortUrl(metric.url)} - ${duration.toFixed(0)}ms - ${sizeKB}KB${cacheStatus}`
      );
    } else if (duration > 500) {
      // Log moderately slow calls (>500ms)
      this.logger.log(
        `⏱️ API: ${metric.method} ${this.getShortUrl(metric.url)} - ${duration.toFixed(0)}ms - ${sizeKB}KB${cacheStatus}`
      );
    }
  }

  private getShortUrl(url: string): string {
    // Extract just the endpoint path for cleaner logs
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      // If URL parsing fails, return last part of path
      const parts = url.split('/');
      return parts.slice(-2).join('/');
    }
  }

  /**
   * Get performance metrics summary
   */
  getMetrics(): {
    total: number;
    averageDuration: number;
    slowestCalls: ApiCallMetrics[];
    largestResponses: ApiCallMetrics[];
    cacheHitRate: number;
  } {
    if (this.metrics.length === 0) {
      return {
        total: 0,
        averageDuration: 0,
        slowestCalls: [],
        largestResponses: [],
        cacheHitRate: 0
      };
    }

    const completed = this.metrics.filter(m => m.duration !== undefined);
    const totalDuration = completed.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = totalDuration / completed.length;
    
    const cached = this.metrics.filter(m => m.cached).length;
    const cacheHitRate = (cached / this.metrics.length) * 100;

    const slowestCalls = [...this.metrics]
      .filter(m => m.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    const largestResponses = [...this.metrics]
      .filter(m => m.responseSize !== undefined)
      .sort((a, b) => (b.responseSize || 0) - (a.responseSize || 0))
      .slice(0, 10);

    return {
      total: this.metrics.length,
      averageDuration,
      slowestCalls,
      largestResponses,
      cacheHitRate
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

