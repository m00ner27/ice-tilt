import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../store/services/api.service';
import { ImageUrlService } from '../../shared/services/image-url.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Season {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Club {
  _id: string;
  name: string;
  logoUrl?: string;
  regionId?: {
    _id: string;
    name: string;
    key: string;
  };
}

interface RankingPoint {
  _id?: string;
  clubId: string | Club;
  seasonId: string | Season;
  placementRP: number;
  playoffRP: number;
  totalRP?: number;
}

interface RankingConfig {
  _id?: string;
  region: string;
  activeSeasonIds: string[];
  lastUpdated?: Date;
}

interface ClubRPForm {
  clubId: string;
  clubName: string;
  clubLogo?: string;
  placementRP: number;
  playoffRP: number;
  existingRPId?: string;
}

@Component({
  selector: 'app-rankings-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './rankings.component.html',
  styleUrls: ['./rankings.component.css']
})
export class RankingsAdminComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Seasons
  seasons: Season[] = [];
  selectedSeasonId: string = '';
  
  // Clubs
  clubs: Club[] = [];
  filteredClubs: Club[] = [];
  clubSearchTerm: string = '';
  
  // Ranking Points
  rankingPoints: RankingPoint[] = [];
  clubRPForms: ClubRPForm[] = [];
  hasUnsavedChanges: boolean = false;
  
  // Ranking Config
  naConfig: RankingConfig | null = null;
  euConfig: RankingConfig | null = null;
  naActiveSeasons: Set<string> = new Set();
  euActiveSeasons: Set<string> = new Set();
  
  // UI State
  isLoading: boolean = false;
  error: string | null = null;
  activeTab: 'rp' | 'config' = 'rp';
  
  // Expose Math for template
  Math = Math;

  constructor(
    private apiService: ApiService,
    private imageUrlService: ImageUrlService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSeasons();
    this.loadRankingConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSeasons(): void {
    this.isLoading = true;
    this.apiService.getSeasons()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (seasons) => {
          this.seasons = seasons.sort((a, b) => 
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
          if (this.seasons.length > 0 && !this.selectedSeasonId) {
            this.selectedSeasonId = this.seasons[0]._id;
            this.onSeasonChange();
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading seasons:', err);
          this.error = 'Failed to load seasons';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onSeasonChange(): void {
    if (!this.selectedSeasonId) return;
    
    this.isLoading = true;
    this.error = null;
    this.clubRPForms = [];
    this.hasUnsavedChanges = false;
    
    // Load clubs for this season
    this.apiService.getClubsBySeasonForRankings(this.selectedSeasonId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clubs) => {
          this.clubs = clubs;
          this.filteredClubs = [...clubs];
          this.loadRankingPointsForSeason();
        },
        error: (err) => {
          console.error('Error loading clubs:', err);
          this.error = 'Failed to load clubs for this season';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  loadRankingPointsForSeason(): void {
    if (!this.selectedSeasonId) {
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.apiService.getRankingPointsBySeason(this.selectedSeasonId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rps) => {
          this.rankingPoints = rps;
          this.initializeClubRPForms();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading ranking points:', err);
          // If no RP exists yet, that's okay - just initialize empty forms
          this.rankingPoints = [];
          this.initializeClubRPForms();
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  initializeClubRPForms(): void {
    this.clubRPForms = this.clubs.map(club => {
      const existingRP = this.rankingPoints.find(rp => {
        const clubId = typeof rp.clubId === 'object' ? rp.clubId._id : rp.clubId;
        return clubId === club._id;
      });

      return {
        clubId: club._id,
        clubName: club.name,
        clubLogo: club.logoUrl,
        placementRP: existingRP ? existingRP.placementRP : 0,
        playoffRP: existingRP ? existingRP.playoffRP : 0,
        existingRPId: existingRP?._id
      };
    });

    // Sort by club name
    this.clubRPForms.sort((a, b) => a.clubName.localeCompare(b.clubName));
  }

  onRPChange(): void {
    this.hasUnsavedChanges = true;
  }

  saveRankingPoints(): void {
    if (!this.selectedSeasonId) {
      this.error = 'Please select a season';
      return;
    }

    this.isLoading = true;
    this.error = null;

    const savePromises = this.clubRPForms.map(form => {
      const data = {
        clubId: form.clubId,
        seasonId: this.selectedSeasonId,
        placementRP: form.placementRP || 0,
        playoffRP: form.playoffRP || 0
      };

      return this.apiService.createOrUpdateRankingPoints(data).toPromise();
    });

    Promise.all(savePromises)
      .then(() => {
        this.hasUnsavedChanges = false;
        this.loadRankingPointsForSeason();
        this.isLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        console.error('Error saving ranking points:', err);
        this.error = 'Failed to save ranking points. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  cancelChanges(): void {
    this.loadRankingPointsForSeason();
    this.hasUnsavedChanges = false;
  }

  filterClubs(): void {
    const term = this.clubSearchTerm.toLowerCase();
    this.filteredClubs = this.clubs.filter(club =>
      club.name.toLowerCase().includes(term)
    );
    
    // Update clubRPForms to match filtered clubs
    const filteredClubIds = new Set(this.filteredClubs.map(c => c._id));
    this.clubRPForms = this.clubRPForms.filter(form =>
      filteredClubIds.has(form.clubId)
    );
  }

  loadRankingConfig(): void {
    // Load both NA and EU configs
    this.apiService.getRankingConfig('north-america')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.naConfig = config;
          // Convert ObjectIds to strings
          const naIds = (config.activeSeasonIds || []).map((id: any) => 
            typeof id === 'string' ? id : (id._id ? String(id._id) : String(id))
          );
          this.naActiveSeasons = new Set(naIds);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading NA config:', err);
        }
      });

    this.apiService.getRankingConfig('europe')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.euConfig = config;
          // Convert ObjectIds to strings
          const euIds = (config.activeSeasonIds || []).map((id: any) => 
            typeof id === 'string' ? id : (id._id ? String(id._id) : String(id))
          );
          this.euActiveSeasons = new Set(euIds);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading EU config:', err);
        }
      });
  }

  toggleSeasonForRegion(seasonId: string, region: 'north-america' | 'europe'): void {
    const activeSeasons = region === 'north-america' ? this.naActiveSeasons : this.euActiveSeasons;
    
    if (activeSeasons.has(seasonId)) {
      activeSeasons.delete(seasonId);
    } else {
      activeSeasons.add(seasonId);
    }
    
    this.hasUnsavedChanges = true;
    this.cdr.detectChanges();
  }

  saveRankingConfig(): void {
    this.isLoading = true;
    this.error = null;

    // Convert Set to Array and ensure all IDs are strings
    const naSeasonIds = Array.from(this.naActiveSeasons).map(id => String(id));
    const euSeasonIds = Array.from(this.euActiveSeasons).map(id => String(id));

    console.log('Saving ranking config:', {
      na: { region: 'north-america', seasonIds: naSeasonIds },
      eu: { region: 'europe', seasonIds: euSeasonIds }
    });

    const naPromise = this.apiService.updateRankingConfig(
      'north-america',
      naSeasonIds
    ).toPromise();

    const euPromise = this.apiService.updateRankingConfig(
      'europe',
      euSeasonIds
    ).toPromise();

    Promise.all([naPromise, euPromise])
      .then(() => {
        this.hasUnsavedChanges = false;
        this.loadRankingConfig();
        this.isLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        console.error('Error saving ranking config:', err);
        console.error('Error details:', {
          status: err?.status,
          statusText: err?.statusText,
          error: err?.error,
          message: err?.error?.message,
          body: err?.error
        });
        const errorMessage = err?.error?.message || err?.message || 'Failed to save ranking configuration. Please try again.';
        this.error = errorMessage;
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  isSeasonActive(seasonId: string, region: 'north-america' | 'europe'): boolean {
    const activeSeasons = region === 'north-america' ? this.naActiveSeasons : this.euActiveSeasons;
    return activeSeasons.has(seasonId);
  }

  getLogoUrl(logoUrl?: string): string {
    return this.imageUrlService.getImageUrl(logoUrl || '');
  }
}

