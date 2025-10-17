import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rulebook',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rulebook.component.html',
  styleUrls: ['./rulebook.component.css']
})
export class RulebookComponent {

  constructor() { }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}