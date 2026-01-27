import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdSenseService } from '../../services/adsense.service';

@Component({
  selector: 'app-sidebar-ad',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isAdSenseEnabled" class="sidebar-ad-container">
      <ins 
        #adElement
        class="adsbygoogle sidebar-ad"
        [attr.data-ad-client]="publisherId"
        [attr.data-ad-slot]="adSlot"
        data-ad-format="auto"
        data-full-width-responsive="true">
      </ins>
    </div>
  `,
  styles: [`
    .sidebar-ad-container {
      width: 100%;
      margin: 1rem 0;
      text-align: center;
      position: sticky;
      top: 100px;
      z-index: 10;
    }
    
    .sidebar-ad {
      display: block;
      width: 100%;
      min-height: 250px;
      max-width: 300px;
      margin: 0 auto;
    }
    
    /* Hide on mobile */
    @media (max-width: 1024px) {
      .sidebar-ad-container {
        display: none;
      }
    }
  `]
})
export class SidebarAdComponent implements OnInit, AfterViewInit {
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

