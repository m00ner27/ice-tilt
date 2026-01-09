import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  clubsImageUrl: string = 'assets/images/Clubs.png';
  
  constructor() { }
  
  onImageError(event: any): void {
    console.error('Failed to load Clubs.png, attempted URL:', event.target.src);
    event.target.style.display = 'none';
  }
  
  onImageLoad(): void {
    console.log('Clubs.png image loaded successfully');
  }
}

