import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdSenseService } from '../../services/adsense.service';

@Component({
  selector: 'app-fullpage-ad',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="shouldShowAd" class="fullpage-ad-overlay" (click)="closeAd()">
      <div class="fullpage-ad-content" (click)="$event.stopPropagation()">
        <button class="close-button" (click)="closeAd()" aria-label="Close ad">
          <i class="fas fa-times"></i>
        </button>
        <div *ngIf="isAdSenseEnabled" class="fullpage-ad-wrapper">
          <ins 
            #adElement
            class="adsbygoogle fullpage-ad"
            [attr.data-ad-client]="publisherId"
            [attr.data-ad-slot]="adSlot"
            data-ad-format="auto"
            data-full-width-responsive="true">
          </ins>
        </div>
        <div *ngIf="!isAdSenseEnabled" class="ad-placeholder">
          <p>Advertisement</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fullpage-ad-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.85);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-in;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    .fullpage-ad-content {
      position: relative;
      max-width: 90%;
      max-height: 90vh;
      background-color: #fff;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .close-button {
      position: absolute;
      top: -10px;
      right: -10px;
      background-color: #fff;
      border: 2px solid #000;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      color: #000;
      z-index: 10000;
      transition: all 0.2s ease;
    }
    
    .close-button:hover {
      background-color: #f0f0f0;
      transform: scale(1.1);
    }
    
    .fullpage-ad-wrapper {
      width: 100%;
      min-height: 250px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .fullpage-ad {
      display: block;
      width: 100%;
      min-height: 250px;
    }
    
    .ad-placeholder {
      width: 100%;
      min-height: 250px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 8px;
    }
    
    /* Mobile responsive */
    @media (max-width: 768px) {
      .fullpage-ad-content {
        max-width: 95%;
        padding: 0.5rem;
      }
      
      .close-button {
        top: -5px;
        right: -5px;
        width: 28px;
        height: 28px;
        font-size: 16px;
      }
    }
  `]
})
export class FullPageAdComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('adElement', { static: false }) adElement!: ElementRef<HTMLElement>;
  @Input() pageType: string = ''; // 'schedule' or 'standings'
  @Input() delaySeconds: number = 3; // Delay before showing ad
  
  isAdSenseEnabled = false;
  publisherId = '';
  adSlot = '8840984486'; // Default ad slot
  shouldShowAd = false;
  private timeoutId: any;

  constructor(private adSenseService: AdSenseService) {}

  ngOnInit(): void {
    this.isAdSenseEnabled = this.adSenseService.isEnabled();
    this.publisherId = this.adSenseService.getPublisherId();
    
    // Check if ad should be shown (once per session per page type)
    if (this.pageType && this.shouldShowAdForPageType()) {
      // Show ad after delay
      this.timeoutId = setTimeout(() => {
        this.shouldShowAd = true;
        this.markAdAsShown();
      }, this.delaySeconds * 1000);
    }
  }

  ngAfterViewInit(): void {
    if (this.shouldShowAd && this.isAdSenseEnabled && this.adElement) {
      setTimeout(() => {
        this.adSenseService.pushAd(this.adElement.nativeElement);
      }, 100);
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private shouldShowAdForPageType(): boolean {
    if (!this.pageType) return false;
    
    const key = `fullpage_ad_shown_${this.pageType}`;
    return !localStorage.getItem(key);
  }

  private markAdAsShown(): void {
    if (this.pageType) {
      const key = `fullpage_ad_shown_${this.pageType}`;
      localStorage.setItem(key, 'true');
    }
  }

  closeAd(): void {
    this.shouldShowAd = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}

