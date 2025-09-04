import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageUrlService {

  /**
   * Get the full image URL for a logo or image
   * @param logoUrl - The logo URL (can be relative, absolute, or filename)
   * @param defaultImage - Default image to return if logoUrl is null/undefined
   * @returns Full URL to the image
   */
  getImageUrl(logoUrl: string | undefined, defaultImage: string = 'assets/images/square-default.png'): string {
    if (!logoUrl) {
      return defaultImage;
    }
    
    // If it's already a full URL, return as is
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    
    // If it's a relative path starting with /uploads, prepend the API URL
    if (logoUrl.startsWith('/uploads/')) {
      return `${environment.apiUrl}${logoUrl}`;
    }
    
    // If it's a filename that looks like an upload (has timestamp pattern), add /uploads/ prefix
    if (logoUrl.match(/^\d{13}-\d+-.+\.(png|jpg|jpeg|gif)$/)) {
      return `${environment.apiUrl}/uploads/${logoUrl}`;
    }
    
    // If it starts with 'uploads/' (no leading slash), add the API URL
    if (logoUrl.startsWith('uploads/')) {
      return `${environment.apiUrl}/${logoUrl}`;
    }
    
    // Otherwise, assume it's a local asset
    return logoUrl;
  }

  /**
   * Get club logo URL by club name from a list of clubs
   * @param clubName - Name of the club
   * @param allClubs - Array of all clubs
   * @param defaultImage - Default image to return if club not found
   * @returns Full URL to the club logo
   */
  getClubLogoUrl(clubName: string, allClubs: any[], defaultImage: string = 'assets/images/square-default.png'): string {
    const club = allClubs.find(club => club.name === clubName);
    
    if (club?.logoUrl) {
      return this.getImageUrl(club.logoUrl);
    }
    
    return defaultImage;
  }
}
