import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

const POSITIONS = ['C', 'LW', 'RW', 'LD', 'RD', 'G'];
const REGIONS = ['north', 'south', 'east', 'west'];

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent {
  userForm: FormGroup;
  loading = false;
  success = false;
  error: string | null = null;
  positions = POSITIONS;
  regions = REGIONS;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.userForm = this.fb.group({
      auth0Id: ['dev-' + Date.now(), Validators.required],
      discordId: ['', Validators.required],
      role: ['PLAYER', Validators.required],
      platform: ['PS5', Validators.required],
      gamertag: ['', Validators.required],
      position: ['C', Validators.required],
      secondaryPositions: [[]],
      handedness: ['Left', Validators.required],
      location: ['NA', Validators.required],
      region: ['north', Validators.required],
      status: ['Free Agent', Validators.required],
    });
  }

  onSubmit() {
    if (this.userForm.invalid) return;
    this.loading = true;
    this.success = false;
    this.error = null;
    const formValue = this.userForm.value;
    const payload = {
      auth0Id: formValue.auth0Id,
      discordId: formValue.discordId,
      role: formValue.role,
      platform: formValue.platform,
      gamertag: formValue.gamertag,
      playerProfile: {
        position: formValue.position,
        secondaryPositions: formValue.secondaryPositions,
        handedness: formValue.handedness,
        location: formValue.location,
        region: formValue.region,
        status: formValue.status
      }
    };
    this.http.post('/api/users', payload).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        this.userForm.reset({
          auth0Id: 'dev-' + Date.now(),
          role: 'PLAYER',
          platform: 'PS5',
          position: 'C',
          handedness: 'Left',
          location: 'NA',
          region: 'north',
          status: 'Free Agent',
          secondaryPositions: []
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create user.';
        this.loading = false;
      }
    });
  }

  toggleSecondaryPosition(pos: string) {
    const current = this.userForm.value.secondaryPositions as string[];
    if (current.includes(pos)) {
      this.userForm.patchValue({ secondaryPositions: current.filter(p => p !== pos) });
    } else {
      this.userForm.patchValue({ secondaryPositions: [...current, pos] });
    }
  }

  isSecondarySelected(pos: string): boolean {
    return (this.userForm.value.secondaryPositions as string[]).includes(pos);
  }
} 