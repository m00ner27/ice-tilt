import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';

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
