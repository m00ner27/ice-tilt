import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../store/services/api.service'; // Import ApiService
@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css'],
})
export class EditProfileComponent implements OnInit {
  availablePositions = ['C', 'RW', 'LW', 'RD', 'LD', 'G'];

  // For the "Add New Profile" Form
  newProfile: any = this.initializeNewProfile();

  // For listing existing profiles
  playerProfiles: any[] = [];
  profilesListLoading: boolean = false;
  profilesListError: string = '';

  // Form submission status
  profileFormLoading: boolean = false;
  profileFormError: string = '';
  profileFormSuccess: string = '';

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.loadPlayerProfiles();
  }

  initializeNewProfile(): any {
    return {
      name: '',
      location: '',
      handedness: '',
      number: null,
      primaryPosition: '',
      secondaryPositions: [] as string[],
      bio: '',
      stats: {
        goals: 0,
        assists: 0,
        gamesPlayed: 0
        // yellowCards: 0, // Add if in your model
        // redCards: 0    // Add if in your model
      }
    };
  }

  loadPlayerProfiles() {
    this.profilesListLoading = true;
    this.profilesListError = '';
    this.apiService.getPlayerProfiles().subscribe({
      next: (data) => {
        this.playerProfiles = data;
        this.profilesListLoading = false;
      },
      error: (err) => {
        this.profilesListError = `Failed to load profiles: ${err.message || 'Server error'}`;
        this.profilesListLoading = false;
        console.error('Error loading player profiles:', err);
      }
    });
  }

  toggleNewProfileSecondaryPosition(position: string) {
    const index = this.newProfile.secondaryPositions.indexOf(position);
    if (index === -1) {
      this.newProfile.secondaryPositions.push(position);
    } else {
      this.newProfile.secondaryPositions.splice(index, 1);
    }
  }

  submitNewProfile() {
    if (!this.newProfile.name) {
      this.profileFormError = 'Discord Name is required.';
      return;
    }
    this.profileFormLoading = true;
    this.profileFormError = '';
    this.profileFormSuccess = '';

    this.apiService.addPlayerProfile(this.newProfile).subscribe({
      next: (response) => {
        this.profileFormLoading = false;
        this.profileFormSuccess = 'Profile added successfully!';
        this.playerProfiles.push(response); // Add to the list
        this.newProfile = this.initializeNewProfile(); // Reset form
        setTimeout(() => this.profileFormSuccess = '', 3000); // Clear success message
      },
      error: (err) => {
        this.profileFormLoading = false;
        this.profileFormError = `Failed to add profile: ${err.error?.message || err.message || 'Server error'}`;
        console.error('Error adding player profile:', err);
        setTimeout(() => this.profileFormError = '', 5000); // Clear error message
      }
    });
  }
}