import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../store/services/api.service';
import { AdminNavComponent } from '../admin-nav.component';

interface Club {
  _id?: string;
  name: string;
  logoUrl: string;
  manager: string;
  primaryColour: string;
  seasons: any[];
}

@Component({
  selector: 'app-clubs',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminNavComponent],
  templateUrl: './clubs.component.html',
  styleUrls: ['./clubs.component.css']
})
export class ClubsComponent implements OnInit {
  clubs: Club[] = [];
  clubForm: FormGroup;
  isAddingClub = false;
  editingClub: Club | null = null;
  divisions: any[] = [];
  seasons: any[] = [];
  logoPreview: string | ArrayBuffer | null = null;
  uploadingLogo = false;

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.clubForm = this.fb.group({
      name: ['', Validators.required],
      logo: ['', Validators.required],
      manager: ['', Validators.required],
      color: ['#3498db', Validators.required],
      division: ['', Validators.required],
      season: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.api.getSeasons().subscribe(seasons => this.seasons = seasons);
    this.api.getDivisions().subscribe(divisions => this.divisions = divisions);
    this.api.getClubs().subscribe(clubs => this.clubs = clubs);
  }

  onLogoFileChange(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadingLogo = true;
      this.api.uploadFile(file).subscribe({
        next: (res) => {
          this.clubForm.patchValue({ logo: res.url });
          this.logoPreview = res.url;
          this.uploadingLogo = false;
        },
        error: () => {
          this.uploadingLogo = false;
        }
      });
      // Show local preview while uploading
      const reader = new FileReader();
      reader.onload = e => this.logoPreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  addClub(): void {
    if (this.clubForm.valid) {
      const form = this.clubForm.value;
      const clubData = {
        name: form.name,
        logoUrl: form.logo,
        manager: form.manager,
        primaryColour: form.color,
        seasons: [
          {
            seasonId: form.season,
            divisionIds: [form.division]
          }
        ]
      };
      this.api.addClub(clubData).subscribe(newClub => {
        this.clubs.push(newClub);
        this.isAddingClub = false;
        this.clubForm.reset();
        this.logoPreview = null;
      });
    }
  }

  editClub(club: Club): void {
    this.editingClub = club;
    this.clubForm.patchValue(club);
    this.logoPreview = club.logoUrl;
    this.isAddingClub = true;
  }

  updateClub(): void {
    if (this.clubForm.valid && this.editingClub) {
      const updated = { ...this.editingClub, ...this.clubForm.value };
      this.api.updateClub(updated).subscribe(updatedClub => {
        const idx = this.clubs.findIndex(c => c._id === updatedClub._id);
        if (idx > -1) this.clubs[idx] = updatedClub;
        this.editingClub = null;
        this.isAddingClub = false;
        this.clubForm.reset();
        this.logoPreview = null;
      });
    }
  }

  deleteClub(club: Club): void {
    if (!club._id) return;
    this.api.deleteClub(club._id).subscribe(() => {
      this.clubs = this.clubs.filter(c => c._id !== club._id);
    });
  }
} 