import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../store';
import { NgRxApiService } from '../store/services/ngrx-api.service';

// Import selectors - we'll need to create these for test data
// For now, we'll use a simple approach with local state

@Component({
  selector: 'app-test-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-component.component.html'
})
export class TestComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Local state for this test component
  connectionMessage: string = '';
  testData: any[] = [];
  loading: boolean = false;
  error: string = '';
  newItem = {
    name: '',
    value: 0
  };

  constructor(
    private store: Store<AppState>,
    private ngrxApiService: NgRxApiService
  ) { }

  ngOnInit() {
    // Optional: load data on init
    // this.loadTestData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  testApiConnection() {
    this.connectionMessage = 'Testing connection...';
    // Note: This would need to be implemented in the NgRx API service
    // For now, we'll keep the direct API call approach for testing
    this.connectionMessage = 'API connection test - NgRx integration pending';
  }

  loadTestData() {
    this.loading = true;
    this.error = '';
    
    // Note: This would need to be implemented in the NgRx API service
    // For now, we'll keep the direct API call approach for testing
    this.loading = false;
    this.error = 'Test data loading - NgRx integration pending';
  }

  addData() {
    if (!this.newItem.name) {
      this.error = 'Name is required';
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    // Note: This would need to be implemented in the NgRx API service
    // For now, we'll keep the direct API call approach for testing
    this.loading = false;
    this.error = 'Test data adding - NgRx integration pending';
    
    // Reset the form
    this.newItem = {
      name: '',
      value: 0
    };
  }
}