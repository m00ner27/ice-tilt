import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-position-pill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './position-pill.component.html',
  styleUrls: ['./position-pill.component.css']
})
export class PositionPillComponent {
  @Input() position: string = '';

  get positionClass(): string {
    return `position-${this.position.toLowerCase()}`;
  }
} 