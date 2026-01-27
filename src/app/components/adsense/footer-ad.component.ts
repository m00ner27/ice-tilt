import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdSenseService } from '../../services/adsense.service';

@Component({
  selector: 'app-footer-ad',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isAdSenseEnabled" class="footer-ad-container">
      <ins 
        #adElement
        class="adsbygoogle footer-ad"
        [attr.data-ad-client]="publisherId"
        [attr.data-ad-slot]="adSlot"
        data-ad-format="auto"
        data-full-width-responsive="true">
      </ins>
    </div>
  `,
  styles: [`
    .footer-ad-container {
      width: 100%;
      margin: 2rem 0 1rem 0;
      padding: 1rem 0;
      text-align: center;
      background-color: transparent;
    }
    
    .footer-ad {
      display: block;
      width: 100%;
      min-height: 90px;
    }
    
    /* Mobile responsive */
    @media (max-width: 768px) {
      .footer-ad {
        min-height: 50px;
      }
    }
  `]
})
export class FooterAdComponent implements OnInit, AfterViewInit {
  @ViewChild('adElement', { static: false }) adElement!: ElementRef<HTMLElement>;
  
  isAdSenseEnabled = false;
  publisherId = '';
  adSlot = '8840984486'; // Default ad slot

  constructor(private adSenseService: AdSenseService) {}

  ngOnInit(): void {
    this.isAdSenseEnabled = this.adSenseService.isEnabled();
    this.publisherId = this.adSenseService.getPublisherId();
  }

  ngAfterViewInit(): void {
    if (this.isAdSenseEnabled && this.adElement) {
      setTimeout(() => {
        this.adSenseService.pushAd(this.adElement.nativeElement);
      }, 100);
    }
  }
}

