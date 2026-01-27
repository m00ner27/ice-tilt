import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdSenseService } from '../../services/adsense.service';
import { AdSenseConfig } from './adsense.component';

@Component({
  selector: 'app-header-ad',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isAdSenseEnabled" class="header-ad-container">
      <ins 
        #adElement
        class="adsbygoogle header-ad"
        [attr.data-ad-client]="publisherId"
        [attr.data-ad-slot]="adSlot"
        data-ad-format="auto"
        data-full-width-responsive="true">
      </ins>
    </div>
  `,
  styles: [`
    .header-ad-container {
      width: 100%;
      margin: 0;
      padding: 0.5rem 0;
      text-align: center;
      background-color: transparent;
    }
    
    .header-ad {
      display: block;
      width: 100%;
      min-height: 90px;
    }
    
    /* Mobile responsive */
    @media (max-width: 768px) {
      .header-ad {
        min-height: 50px;
      }
    }
  `]
})
export class HeaderAdComponent implements OnInit, AfterViewInit {
  @ViewChild('adElement', { static: false }) adElement!: ElementRef<HTMLElement>;
  
  isAdSenseEnabled = false;
  publisherId = '';
  adSlot = '8840984486'; // Default ad slot - can be customized via input if needed

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

