import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgRxApiService } from '../../store/services/ngrx-api.service';
import { ApiService } from '../../store/services/api.service';

const POSITIONS = ['C', 'LW', 'RW', 'LD', 'RD', 'G'];

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-user.component.html'
})
export class CreateUserComponent {
  userForm: FormGroup;
  loading = false;
  success = false;
  error: string | null = null;
  positions = POSITIONS;
  regions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private ngrxApiService: NgRxApiService,
    private api: ApiService
  ) {
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
    this.api.getRegions().subscribe(list => {
      this.regions = (list || []).map((r: any) => r.name || r.key);
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
    // Use NgRx to create user
    this.ngrxApiService.createUser(payload);
    
    // For now, we'll show success immediately since NgRx handles the async operation
    // In a full implementation, you'd subscribe to the store to get the actual result
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