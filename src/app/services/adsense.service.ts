import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdSenseService {
  private isAdSenseLoaded = false;

  constructor() {
    this.initializeAdSense();
  }

  private initializeAdSense(): void {
    if (environment.adsense.enabled && !this.isAdSenseLoaded) {
      // Check if AdSense script is already loaded (from index.html)
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        this.isAdSenseLoaded = true;
        console.log('AdSense script already loaded from index.html');
        return;
      }

      // Wait a bit for the script from index.html to load
      setTimeout(() => {
        if (window.adsbygoogle) {
          this.isAdSenseLoaded = true;
          console.log('AdSense script loaded from index.html');
        } else {
          console.warn('AdSense script not found, ads may not display properly');
        }
      }, 1000);
    }
  }

  /**
   * Push an ad to the adsbygoogle array for rendering
   */
  pushAd(adElement: HTMLElement): void {
    if (environment.adsense.enabled && this.isAdSenseLoaded && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('Error pushing AdSense ad:', error);
      }
    }
  }

  /**
   * Check if AdSense is enabled and ready
   */
  isEnabled(): boolean {
    return environment.adsense.enabled && this.isAdSenseLoaded;
  }

  /**
   * Get the publisher ID
   */
  getPublisherId(): string {
    return environment.adsense.publisherId;
  }
}
