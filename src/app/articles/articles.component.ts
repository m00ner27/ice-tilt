import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../store/services/api.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import { AdSenseComponent, AdSenseConfig } from '../components/adsense/adsense.component';
import { FooterAdComponent } from '../components/adsense/footer-ad.component';

interface Article {
  _id: string;
  title: string;
  slug: string;
  author: string;
  date: string;
  imageUrl?: string;
  lead?: string;
  body: string;
  published: boolean;
}

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, RouterModule, AdSenseComponent, FooterAdComponent],
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.css'
})
export class ArticlesComponent implements OnInit {
  articles: Article[] = [];
  loading = true;
  error: string | null = null;

  // AdSense configuration
  bannerAdConfig: AdSenseConfig = {
    adSlot: '8840984486',
    adFormat: 'auto',
    responsive: true,
    className: 'banner-ad'
  };

  constructor(
    private apiService: ApiService,
    private imageUrlService: ImageUrlService
  ) {}

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.loading = true;
    this.error = null;
    
    // Public route automatically filters to published articles
    this.apiService.getArticles().subscribe({
      next: (articles) => {
        this.articles = articles;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading articles:', err);
        this.error = 'Failed to load articles. Please try again later.';
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getImageUrl(imageUrl?: string): string {
    return this.imageUrlService.getImageUrl(imageUrl, 'assets/images/square-default.png');
  }
}

