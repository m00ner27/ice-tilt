import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../store/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class EashlService {

  constructor(private apiService: ApiService) {}

  getClubMatches(clubId: string): Observable<any> {
    return this.apiService.getClubEashlGames(clubId);
  }
} 