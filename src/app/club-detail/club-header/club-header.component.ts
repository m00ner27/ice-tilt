import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Club } from '../../store/models/models/club.interface';

@Component({
  selector: 'app-club-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './club-header.component.html',
  styleUrls: ['./club-header.component.css']
})
export class ClubHeaderComponent {
  @Input() club: Club | undefined;
  @Input() selectedSeasonDivision: string | null = null;

  getContrastingTextColor(hexColor: string | undefined): string {
    if (!hexColor) {
      return '#FFFFFF'; // Default to white text if no color is provided
    }

    // Remove '#' if present
    const cleanHex = hexColor.replace('#', '');

    // Convert 3-digit hex to 6-digit
    const fullHex = cleanHex.length === 3 ? cleanHex.split('').map(char => char + char).join('') : cleanHex;

    if (fullHex.length !== 6) {
      return '#FFFFFF'; // Return default for invalid hex
    }

    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);

    // Calculate luminance using the WCAG formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }
}
