import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../store/services/api.service';
import { ImageUrlService } from '../../shared/services/image-url.service';

interface Tournament {
  _id?: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-tournaments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tournaments.component.html'
})
export class TournamentsComponent implements OnInit {
  tournaments: Tournament[] = [];
  tournamentForm: FormGroup;
  selectedTournament: Tournament | null = null;
  isAddingTournament = false;
  editingTournament: Tournament | null = null;
  tournamentLogoPreview: string | null = null;
  uploadingTournamentLogo = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private imageUrlService: ImageUrlService
  ) {
    this.tournamentForm = this.fb.group({
      name: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      isActive: [true],
      logoUrl: ['']
    });
  }

  ngOnInit() {
    this.loadTournaments();
  }

  loadTournaments() {
    this.loading = true;
    this.apiService.getTournaments().subscribe({
      next: (tournaments) => {
        this.tournaments = tournaments || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tournaments:', error);
        this.loading = false;
      }
    });
  }

  selectTournament(tournament: Tournament) {
    this.selectedTournament = tournament;
  }

  getImageUrl(url: string | undefined): string {
    return this.imageUrlService.getImageUrl(url);
  }

  onImageError(event: any): void {
    console.log('Image failed to load, URL:', event.target.src);
    if (event.target.src.includes('square-default.png')) {
      return;
    }
    event.target.src = '/assets/images/square-default.png';
  }

  // Tournament methods
  addTournament() {
    if (this.tournamentForm.valid) {
      this.loading = true;
      const tournamentData = this.tournamentForm.value;
      this.apiService.createTournament(tournamentData).subscribe({
        next: (newTournament) => {
          this.tournaments.push(newTournament);
          this.cancelTournamentForm();
          this.loadTournaments(); // Reload to get fresh data
          this.loading = false;
          // Trigger storage event to notify other components
          localStorage.setItem('admin-data-updated', Date.now().toString());
        },
        error: (error) => {
          console.error('Error creating tournament:', error);
          this.loading = false;
          const errorMessage = error?.error?.message || error?.message || 'Failed to create tournament. Please try again.';
          alert(errorMessage);
        }
      });
    } else {
      // Show which fields are invalid
      const invalidFields = Object.keys(this.tournamentForm.controls).filter(key => 
        this.tournamentForm.controls[key].invalid
      );
      alert(`Please fill in all required fields: ${invalidFields.join(', ')}`);
    }
  }

  editTournament(tournament: Tournament) {
    this.editingTournament = tournament;
    this.tournamentForm.patchValue({
      name: tournament.name,
      startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : '',
      endDate: tournament.endDate ? new Date(tournament.endDate).toISOString().split('T')[0] : '',
      isActive: tournament.isActive !== undefined ? tournament.isActive : true,
      logoUrl: tournament.logoUrl || ''
    });
    this.tournamentLogoPreview = tournament.logoUrl || null;
    this.isAddingTournament = true;
  }

  updateTournament() {
    if (this.tournamentForm.valid && this.editingTournament) {
      const tournamentData = { ...this.tournamentForm.value, _id: this.editingTournament._id };
      this.apiService.updateTournament(this.editingTournament._id!, tournamentData).subscribe({
        next: (updatedTournament) => {
          const index = this.tournaments.findIndex(t => t._id === updatedTournament._id);
          if (index !== -1) {
            this.tournaments[index] = updatedTournament;
          }
          this.cancelTournamentForm();
          // Trigger storage event
          localStorage.setItem('admin-data-updated', Date.now().toString());
        },
        error: (error) => {
          console.error('Error updating tournament:', error);
        }
      });
    }
  }

  deleteTournament(tournament: Tournament) {
    if (confirm('Are you sure you want to delete this tournament?')) {
      this.apiService.deleteTournament(tournament._id!).subscribe({
        next: () => {
          this.tournaments = this.tournaments.filter(t => t._id !== tournament._id);
          // Trigger storage event
          localStorage.setItem('admin-data-updated', Date.now().toString());
        },
        error: (error) => {
          console.error('Error deleting tournament:', error);
        }
      });
    }
  }

  cancelTournamentForm() {
    this.isAddingTournament = false;
    this.editingTournament = null;
    this.tournamentForm.reset({ isActive: true });
    this.tournamentLogoPreview = null;
  }

  onTournamentLogoFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadingTournamentLogo = true;
      
      this.apiService.uploadFile(file).subscribe({
        next: (response: any) => {
          console.log('Tournament logo uploaded:', response);
          this.tournamentLogoPreview = response.url;
          this.tournamentForm.patchValue({ logoUrl: response.url });
          this.uploadingTournamentLogo = false;
        },
        error: (error) => {
          console.error('Error uploading tournament logo:', error);
          this.uploadingTournamentLogo = false;
        }
      });
    }
  }
}

