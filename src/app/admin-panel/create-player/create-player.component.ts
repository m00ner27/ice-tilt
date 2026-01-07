import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AppState } from '../../store';
import { selectPlayersState } from '../../store/players.selectors';
import { createPlayer } from '../../store/players.actions';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-create-player',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-player.component.html'
})
export class CreatePlayerComponent implements OnDestroy {
  playerForm: FormGroup;
  loading = false;
  success = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>
  ) {
    this.playerForm = this.fb.group({
      gamertag: ['', [Validators.required, this.duplicateNameValidator.bind(this)]],
      platform: ['PS5', Validators.required] // Default to PlayStation
    });

    // Listen for player creation state changes
    this.store.select(selectPlayersState)
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.loading = state.adminLoading;
        if (state.adminError) {
          this.error = state.adminError;
          this.success = false;
        }
      });
  }

  // Custom validator to check for duplicate gamertags (case-insensitive)
  duplicateNameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value || !control.value.trim()) {
      return null; // Don't validate empty values
    }
    
    // Get current free agents from the store
    let freeAgents: any[] = [];
    this.store.select(selectPlayersState)
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        freeAgents = state.freeAgents || [];
      });
    
    // Check if gamertag already exists (case-insensitive)
    const normalizedValue = control.value.trim().toLowerCase();
    const existingPlayer = freeAgents.find(player => {
      if (!player.gamertag) return false;
      const normalizedGamertag = player.gamertag.trim().toLowerCase();
      return normalizedGamertag === normalizedValue;
    });
    
    if (existingPlayer) {
      return { duplicateName: { message: 'A player with this name already exists (case-insensitive)' } };
    }
    
    return null;
  }

  onButtonClick() {
    console.log('Button clicked!');
    console.log('Button disabled state:', this.playerForm.invalid || this.loading);
  }

  onSubmit() {
    console.log('Form submitted');
    console.log('Form valid:', this.playerForm.valid);
    console.log('Form invalid:', this.playerForm.invalid);
    console.log('Form value:', this.playerForm.value);
    console.log('Form errors:', this.playerForm.errors);
    console.log('Gamertag errors:', this.playerForm.get('gamertag')?.errors);
    
    if (this.playerForm.invalid) {
      console.log('Form is invalid, not submitting');
      return;
    }
    
    console.log('Form is valid, proceeding with submission');
    this.loading = true;
    this.success = false;
    this.error = null;
    
    const formValue = this.playerForm.value;
           const payload = {
             gamertag: formValue.gamertag,
             platform: formValue.platform, // Use selected platform
             playerProfile: {
               position: 'C', // Default position
               secondaryPositions: [],
               handedness: 'Left', // Default handedness
               country: 'USA', // Default country (required field)
               region: 'North America', // Default region (required field)
               status: 'Free Agent'
             }
           };
    
    // Use NgRx to create player
    this.store.dispatch(createPlayer({ playerData: payload }));
    
    // Listen for success
    this.store.select(selectPlayersState)
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (!state.adminLoading && !state.adminError && state.freeAgents.length > 0) {
          // Check if our player was just created
          const lastPlayer = state.freeAgents[state.freeAgents.length - 1];
          if (lastPlayer.gamertag === formValue.gamertag) {
            this.success = true;
            this.loading = false;
            this.playerForm.reset();
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}