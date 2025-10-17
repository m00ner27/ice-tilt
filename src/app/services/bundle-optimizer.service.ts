import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BundleOptimizerService {
  
  constructor() {
    this.optimizeBundleLoading();
  }

  private optimizeBundleLoading() {
    // Preload critical chunks
    this.preloadCriticalChunks();
    
    // Implement service worker for caching
    this.setupServiceWorker();
    
    // Optimize image loading
    this.optimizeImageLoading();
  }

  private preloadCriticalChunks() {
    // Preload the main chunk and critical routes
    const criticalChunks = [
      'main',
      'standings',
      'players',
      'home'
    ];

    criticalChunks.forEach(chunk => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = `/${chunk}.js`;
      link.as = 'script';
      document.head.appendChild(link);
    });
  }

  private setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          // Service worker registered successfully
        })
        .catch(error => {
          // Service worker registration failed
        });
    }
  }

  private optimizeImageLoading() {
    // Implement intersection observer for lazy loading images
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      });

      // Observe all images with data-src attribute
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // Prefetch next likely route
  prefetchRoute(route: string) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  }

  // Preload critical resources
  preloadResource(href: string, as: string) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }
}
