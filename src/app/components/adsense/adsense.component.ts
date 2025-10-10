import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdSenseService } from '../../services/adsense.service';

export interface AdSenseConfig {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  adStyle?: {
    display?: string;
    width?: string;
    height?: string;
  };
  responsive?: boolean;
  className?: string;
}

@Component({
  selector: 'app-adsense',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="isAdSenseEnabled" 
      class="adsense-container"
      [class]="config?.className || ''"
      [style]="getAdStyle()">
      
      <!-- AdSense Ad Unit -->
      <ins 
        #adElement
        class="adsbygoogle"
        [style.display]="config?.adStyle?.display || 'block'"
        [style.width]="config?.adStyle?.width || '100%'"
        [style.height]="config?.adStyle?.height || 'auto'"
        [attr.data-ad-client]="publisherId"
        [attr.data-ad-slot]="config?.adSlot"
        [attr.data-ad-format]="config?.adFormat || 'auto'"
        [attr.data-full-width-responsive]="config?.responsive !== false ? 'true' : 'false'">
      </ins>
      
      <!-- Fallback content for when ads are disabled -->
      <div *ngIf="!isAdSenseEnabled" class="ad-placeholder">
        <div class="placeholder-content">
          <i class="fas fa-ad text-muted"></i>
          <small class="text-muted">Advertisement</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .adsense-container {
      margin: 1rem 0;
      text-align: center;
    }
    
    .ad-placeholder {
      background-color: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      padding: 2rem;
      margin: 1rem 0;
      min-height: 250px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .placeholder-content {
      text-align: center;
      color: #6c757d;
    }
    
    .placeholder-content i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      display: block;
    }
    
    .placeholder-content small {
      font-size: 0.875rem;
    }
    
    /* Responsive ad styles */
    @media (max-width: 768px) {
      .adsense-container {
        margin: 0.5rem 0;
      }
      
      .ad-placeholder {
        min-height: 200px;
        padding: 1rem;
      }
    }
  `]
})
export class AdSenseComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() config!: AdSenseConfig;
  @ViewChild('adElement', { static: false }) adElement!: ElementRef<HTMLElement>;

  isAdSenseEnabled = false;
  publisherId = '';

  constructor(private adSenseService: AdSenseService) {}

  ngOnInit(): void {
    this.isAdSenseEnabled = this.adSenseService.isEnabled();
    this.publisherId = this.adSenseService.getPublisherId();
  }

  ngAfterViewInit(): void {
    if (this.isAdSenseEnabled && this.adElement) {
      // Small delay to ensure the element is rendered
      setTimeout(() => {
        this.adSenseService.pushAd(this.adElement.nativeElement);
      }, 100);
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  getAdStyle(): string {
    if (!this.config?.adStyle) return '';
    
    const styles = this.config.adStyle;
    return Object.entries(styles)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  }
}
