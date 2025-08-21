import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="article-page">
      <div class="article-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <h1 class="article-title">{{ articleTitle }}</h1>
        <div class="article-meta">
          <span class="article-date">{{ articleDate }}</span>
          <span class="article-author">by ITHL Staff</span>
        </div>
      </div>
      
      <div class="article-content">
        <div class="article-image">
          <img [src]="articleImage" [alt]="articleTitle" class="hero-image">
        </div>
        
        <div class="article-text">
          <p class="lead">
            {{ articleLead }}
          </p>
          
          <div [innerHTML]="articleBody"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .article-page {
      max-width: 800px;
      margin: 40px auto;
      background: #23293a;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.18);
      color: #fff;
    }
    
    .article-header {
      margin-bottom: 32px;
      text-align: center;
    }
    
    .back-btn {
      background: #394867;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
      margin-bottom: 20px;
    }
    
    .back-btn:hover {
      background: #4a5a7a;
    }
    
    .article-title {
      color: #90caf9;
      font-size: 2.5rem;
      margin-bottom: 16px;
      font-weight: 600;
    }
    
    .article-meta {
      color: #b0bec5;
      font-size: 1rem;
    }
    
    .article-meta span {
      margin: 0 12px;
    }
    
    .article-content {
      line-height: 1.8;
    }
    
    .article-image {
      margin-bottom: 32px;
      text-align: center;
    }
    
    .hero-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }
    
    .article-text {
      font-size: 1.1rem;
    }
    
    .lead {
      font-size: 1.3rem;
      color: #90caf9;
      margin-bottom: 24px;
      font-weight: 500;
    }
    
    .article-text p {
      margin-bottom: 20px;
    }
    
    .article-text h2 {
      color: #90caf9;
      margin: 32px 0 16px 0;
      font-size: 1.8rem;
    }
    
    .article-text h3 {
      color: #90caf9;
      margin: 24px 0 12px 0;
      font-size: 1.5rem;
    }
    
    .article-text ul, .article-text ol {
      margin: 16px 0;
      padding-left: 24px;
    }
    
    .article-text li {
      margin-bottom: 8px;
    }
    
    @media (max-width: 768px) {
      .article-page {
        margin: 20px;
        padding: 24px;
      }
      
      .article-title {
        font-size: 2rem;
      }
      
      .article-text {
        font-size: 1rem;
      }
    }
  `]
})
export class ArticleComponent implements OnInit {
  articleTitle: string = '';
  articleDate: string = '';
  articleImage: string = '';
  articleLead: string = '';
  articleBody: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const articleSlug = params['slug'];
      this.loadArticle(articleSlug);
    });
  }

  loadArticle(slug: string): void {
    // Load article content based on the slug
    switch (slug) {
      case 'new-season-begins':
        this.loadNewSeasonArticle();
        break;
      default:
        this.loadDefaultArticle();
        break;
    }
  }

  loadNewSeasonArticle(): void {
    this.articleTitle = 'Exciting Announcement: New Season Begins!';
    this.articleDate = 'August 20, 2025';
    this.articleImage = 'assets/images/IMG_3840.jpg';
    this.articleLead = 'The Ice Tilt Hockey League is thrilled to announce the start of our brand new season, bringing more excitement, competition, and unforgettable moments to the ice.';
    this.articleBody = `
      <h2>What's New This Season</h2>
      <p>We're excited to introduce several enhancements that will make this season our best yet:</p>
      
      <h3>Enhanced Statistics Tracking</h3>
      <p>Our new advanced statistics system will provide deeper insights into player performance, including detailed analytics for skaters and goalies across all divisions.</p>
      
      <h3>Improved Match Scheduling</h3>
      <p>Teams can now enjoy a more streamlined scheduling process with better conflict resolution and automatic game assignment features.</p>
      
      <h3>New Team Features</h3>
      <p>Clubs now have access to enhanced roster management tools, making it easier to track player movements and maintain team rosters throughout the season.</p>
      
      <h2>Season Structure</h2>
      <p>This season will feature:</p>
      <ul>
        <li><strong>Regular Season:</strong> 20 games per team</li>
        <li><strong>Playoffs:</strong> Top 8 teams from each division</li>
        <li><strong>Championship:</strong> Division winners face off for the ultimate prize</li>
      </ul>
      
      <h2>Get Ready to Play</h2>
      <p>Whether you're a returning player or new to the league, this season promises to deliver the most competitive and enjoyable hockey experience yet. Check your team schedules, review the updated rules, and get ready to hit the ice!</p>
      
      <p>Good luck to all teams, and may the best players win!</p>
    `;
  }

  loadDefaultArticle(): void {
    this.articleTitle = 'Article Not Found';
    this.articleDate = 'August 20, 2025';
    this.articleImage = 'assets/images/square-default.png';
    this.articleLead = 'The requested article could not be found.';
    this.articleBody = '<p>Please check the URL or return to the home page to browse available articles.</p>';
  }

  goBack(): void {
    this.location.back();
  }
}
