import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Club } from '../../store/models/models/club.interface';

@Component({
  selector: 'app-club-stats-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './club-stats-grid.component.html',
  styleUrls: ['./club-stats-grid.component.css']
})
export class ClubStatsGridComponent {
  @Input() club: Club | undefined;
}
