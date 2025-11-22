import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { ApiService } from '../store/services/api.service';
import { ImageUrlService } from '../shared/services/image-url.service';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './article.component.html'
})
export class ArticleComponent implements OnInit {
  articleTitle: string = '';
  articleDate: string = '';
  articleImage: string = '';
  articleLead: string = '';
  articleBody: string = '';
  articleAuthor: string = '';
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private apiService: ApiService,
    private imageUrlService: ImageUrlService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const articleSlug = params['slug'];
      this.loadArticle(articleSlug);
    });
  }

  loadArticle(slug: string): void {
    this.loading = true;
    this.error = null;
    
    this.apiService.getArticleBySlug(slug).subscribe({
      next: (article) => {
        this.articleTitle = article.title;
        this.articleDate = this.formatDate(article.date);
        this.articleImage = this.imageUrlService.getImageUrl(article.imageUrl, 'assets/images/square-default.png');
        this.articleLead = article.lead || '';
        this.articleBody = article.body;
        this.articleAuthor = article.author;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading article:', err);
        // Fallback to hardcoded articles for backward compatibility
        this.loadHardcodedArticle(slug);
      }
    });
  }

  loadHardcodedArticle(slug: string): void {
    // Load article content based on the slug (fallback)
    switch (slug) {
      case 'new-season-begins':
        this.loadNewSeasonArticle();
        break;
      case 'signing-up-free-agents':
        this.loadSigningUpArticle();
        break;
      default:
        this.loadDefaultArticle();
        break;
    }
    this.loading = false;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }


  loadNewSeasonArticle(): void {
    this.articleTitle = 'Welcome to the new ITHL!';
    this.articleDate = 'October 1, 2025';
    this.articleImage = 'assets/images/IMG_3840.jpg';
    this.articleLead = 'After years of development, we\'re excited to finally launch our new ITHL website! This is version 1.0 with more features coming soon.';
    this.articleAuthor = 'm00ner';
    this.articleBody = `
      <h2>We've Finally Launched Our New Site!</h2>
      <p>After years of development and hard work, we're thrilled to announce that our brand new ITHL website is officially live! This has been a long journey, and we're incredibly excited to finally share the site with all of you.</p>
      
      <h2>What to Expect</h2>
      <p>This is version 1.0 of our site, and while it's currently fairly barebones, it represents a solid foundation for everything we have planned. We're committed to continuously improving and expanding the platform with new features and enhancements in the coming months.</p>
      
      <h2>Reporting Issues</h2>
      <p>As with any new platform, there may be some bugs or issues you encounter while using the site. If you notice anything that seems off or doesn't work as expected, please don't hesitate to create a ticket in our Discord server. Your feedback is invaluable in helping us identify and fix these issues quickly.</p>
      
      <h2>Your Input Matters</h2>
      <p>We want this platform to serve our community in the best way possible. If you have any suggestions for features, improvements, or changes you'd like to see, please share them in the suggestions channel on our Discord. Your ideas help shape the future of our platform.</p>
      
      <h2>What's Next</h2>
      <p>We have big plans for the future of this site, including sign in functionality, player profiles, managerial permissions, and more. </p>
      
      <p>Thank you for your patience and support as we've worked to bring this vision to life. We can't wait to see how you all use and enjoy the new platform!</p>
    `;
  }

  loadSigningUpArticle(): void {
    this.articleTitle = '📝 Signing Up & Free Agents';
    this.articleDate = 'October 7, 2025';
    this.articleImage = 'assets/images/hockey-fight.jpg';
    this.articleLead = 'Everything you need to know about joining the ITHL and finding a club to play for.';
    this.articleAuthor = 'ITHL Staff';
    this.articleBody = `
      <h2>Player Sign-Up Process</h2>
      <p>At this time, players do not need to sign up individually. If a manager would like to add a player to their roster, they simply need to create a support ticket in Discord to request the addition.</p>
      
      <h2>Free Agents</h2>
      <p>For free agents, there is also no individual sign-up process right now. Currently, we don't have functionality on the website to display free agents, but we plan to implement new features soon to help players connect with clubs more easily.</p>
      
      <h2>How to Find a Club</h2>
      <p>If you're looking for a club, head over to <strong>#free-agents</strong> and post your information, or check out <strong>#scouting-discords</strong> to find clubs that are recruiting.</p>
      
      <h2>What's Coming Soon</h2>
      <p>We're working on new features to make it easier for players to connect with clubs and for managers to find the right players for their teams. Stay tuned for updates!</p>
    `;
  }

  loadDefaultArticle(): void {
    this.articleTitle = 'Article Not Found';
    this.articleDate = 'August 20, 2025';
    this.articleImage = 'assets/images/square-default.png';
    this.articleLead = 'The requested article could not be found.';
    this.articleBody = '<p>Please check the URL or return to the home page to browse available articles.</p>';
    this.articleAuthor = 'ITHL Staff';
  }

  goBack(): void {
    this.location.back();
  }
}
