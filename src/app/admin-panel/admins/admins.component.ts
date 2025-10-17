import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { ApiService } from '../../store/services/api.service';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, map } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';

@Component({
  selector: 'app-admins',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admins.component.html',
  styleUrl: './admins.component.scss'
})
export class AdminsComponent implements OnInit, OnDestroy {
  admins: any[] = [];
  isBusy = false;
  newNote = '';
  newSuper = false;
  
  // Autocomplete properties
  usernameControl = new FormControl('', [Validators.required]);
  userSuggestions: any[] = [];
  showSuggestions = false;
  highlightedIndex = -1;
  private destroy$ = new Subject<void>();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
    this.setupUsernameAutocomplete();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupUsernameAutocomplete(): void {
    this.usernameControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (!value || value.length < 2) {
          this.userSuggestions = [];
          this.showSuggestions = false;
          return [];
        }
        return this.api.getUsers().pipe(
          map((users: any[]) => users.filter((user: any) => 
            user.discordUsername?.toLowerCase().includes(value.toLowerCase())
          ))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((users: any[]) => {
      this.userSuggestions = users;
      this.showSuggestions = users.length > 0;
      this.highlightedIndex = -1;
    });
  }

  load() {
    this.isBusy = true;
    this.api.listAdmins().subscribe({
      next: (data) => { this.admins = data || []; this.isBusy = false; },
      error: () => { this.isBusy = false; }
    });
  }

  createAdmin() {
    if (!this.usernameControl.value) return;
    this.isBusy = true;
    this.api.addAdmin({ username: this.usernameControl.value, note: this.newNote, superAdmin: this.newSuper }).subscribe({
      next: () => { 
        this.usernameControl.setValue(''); 
        this.newNote = ''; 
        this.newSuper = false; 
        this.load(); 
      },
      error: () => { this.isBusy = false; }
    });
  }

  // Autocomplete methods
  onUsernameFocus(): void {
    if (this.userSuggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  onUsernameBlur(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  moveHighlight(direction: number): void {
    if (!this.showSuggestions) return;
    
    this.highlightedIndex += direction;
    
    if (this.highlightedIndex < 0) {
      this.highlightedIndex = this.userSuggestions.length - 1;
    } else if (this.highlightedIndex >= this.userSuggestions.length) {
      this.highlightedIndex = 0;
    }
  }

  onUsernameEnter(): void {
    if (this.showSuggestions && this.highlightedIndex >= 0) {
      this.selectUser(this.userSuggestions[this.highlightedIndex]);
    }
  }

  selectUser(user: any): void {
    this.usernameControl.setValue(user.discordUsername);
    this.showSuggestions = false;
    this.highlightedIndex = -1;
  }

  remove(a: any) {
    this.isBusy = true;
    this.api.removeAdmin(a.auth0Id).subscribe({
      next: () => { this.load(); },
      error: () => { this.isBusy = false; }
    });
  }

  toggleSuper(a: any) {
    this.isBusy = true;
    this.api.setSuperAdmin(a.auth0Id, !a.superAdmin).subscribe({
      next: () => { this.load(); },
      error: () => { this.isBusy = false; }
    });
  }
}
