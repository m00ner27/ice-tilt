import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Production-safe logger service
 * Only logs in development mode to avoid performance impact and security issues in production
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private isProduction = environment.production;

  /**
   * Log info messages (only in development)
   */
  log(message: any, ...optionalParams: any[]): void {
    if (!this.isProduction) {
      console.log(message, ...optionalParams);
    }
  }

  /**
   * Log warning messages (only in development)
   */
  warn(message: any, ...optionalParams: any[]): void {
    if (!this.isProduction) {
      console.warn(message, ...optionalParams);
    }
  }

  /**
   * Log error messages (always logged, but can be enhanced with error tracking in production)
   */
  error(message: any, ...optionalParams: any[]): void {
    if (!this.isProduction) {
      console.error(message, ...optionalParams);
    }
    // In production, you could send errors to an error tracking service like Sentry
    // if (this.isProduction) {
    //   // Send to error tracking service
    // }
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: any, ...optionalParams: any[]): void {
    if (!this.isProduction) {
      console.debug(message, ...optionalParams);
    }
  }

  /**
   * Group related log messages (only in development)
   */
  group(label: string): void {
    if (!this.isProduction) {
      console.group(label);
    }
  }

  /**
   * End a log group (only in development)
   */
  groupEnd(): void {
    if (!this.isProduction) {
      console.groupEnd();
    }
  }
}

