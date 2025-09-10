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
