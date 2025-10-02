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
    // Always use the production backend URL for images
    const BACKEND_URL = 'https://ice-tilt-backend.onrender.com';
    
    if (!logoUrl) {
      return defaultImage;
    }
    
    // If it's already a full URL, return as is
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    
    // If it's a local asset path (starts with 'assets/'), return as-is
    if (logoUrl.startsWith('assets/')) {
      return logoUrl;
    }
    
    // If it's a relative path starting with /uploads, prepend the backend URL
    if (logoUrl.startsWith('/uploads/')) {
      return `${BACKEND_URL}${logoUrl}`;
    }
    
    // If it's a filename that looks like an upload (has timestamp pattern), add /uploads/ prefix
    if (logoUrl.match(/^\d{13}-\d+-.+\.(png|jpg|jpeg|gif)$/)) {
      return `${BACKEND_URL}/uploads/${logoUrl}`;
    }
    
    // If it starts with 'uploads/' (no leading slash), add the backend URL
    if (logoUrl.startsWith('uploads/')) {
      return `${BACKEND_URL}/${logoUrl}`;
    }
    
    // Otherwise, assume it's a local asset
    return logoUrl;
  }

  /**
   * Get image URL with error handling - returns default image if the original fails to load
   */
  getImageUrlWithFallback(logoUrl: string | undefined, defaultImage: string = 'assets/images/square-default.png'): string {
    const imageUrl = this.getImageUrl(logoUrl, defaultImage);
    
    // If it's the default image, return it directly
    if (imageUrl === defaultImage) {
      return imageUrl;
    }
    
    // For backend URLs, we'll let the browser handle the error and show default via (error) handler
    return imageUrl;
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
