import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h2>API Test</h2>
      
      <div class="card mb-4">
        <div class="card-header">Test Connection</div>
        <div class="card-body">
          <button (click)="testApiConnection()" class="btn btn-primary">Test API</button>
          <div *ngIf="connectionMessage" class="mt-2 alert alert-info">
            {{ connectionMessage }}
          </div>
        </div>
      </div>
      
      <div class="card mb-4">
        <div class="card-header">Add Test Data</div>
        <div class="card-body">
          <form (ngSubmit)="addData()">
            <div class="form-group mb-2">
              <label for="name">Name:</label>
              <input type="text" class="form-control" id="name" [(ngModel)]="newItem.name" name="name">
            </div>
            <div class="form-group mb-2">
              <label for="value">Value:</label>
              <input type="number" class="form-control" id="value" [(ngModel)]="newItem.value" name="value">
            </div>
            <button type="submit" class="btn btn-success">Add Data</button>
          </form>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">Test Data from MongoDB</div>
        <div class="card-body">
          <button (click)="loadTestData()" class="btn btn-primary mb-3">Load Data</button>
          
          <div *ngIf="loading" class="text-center">
            <p>Loading data...</p>
          </div>
          
          <div *ngIf="error" class="alert alert-danger">
            {{ error }}
          </div>
          
          <table *ngIf="testData.length > 0" class="table table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Value</th>
                <th>Active</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of testData">
                <td>{{ item.name }}</td>
                <td>{{ item.value }}</td>
                <td>{{ item.isActive ? 'Yes' : 'No' }}</td>
                <td>{{ item.createdAt | date }}</td>
              </tr>
            </tbody>
          </table>
          
          <div *ngIf="!loading && testData.length === 0 && !error" class="alert alert-info">
            No data found. Try adding some data.
          </div>
        </div>
      </div>
    </div>
  `
})
export class TestComponent implements OnInit {
  connectionMessage: string = '';
  testData: any[] = [];
  loading: boolean = false;
  error: string = '';
  newItem = {
    name: '',
    value: 0
  };

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    // Optional: load data on init
    // this.loadTestData();
  }

  testApiConnection() {
    this.connectionMessage = 'Testing connection...';
    this.apiService.testConnection().subscribe({
      next: (response) => {
        this.connectionMessage = `Connection successful: ${response.message}`;
      },
      error: (error) => {
        this.connectionMessage = `Error connecting to API: ${error.message}`;
        console.error('API connection error:', error);
      }
    });
  }

  loadTestData() {
    this.loading = true;
    this.error = '';
    
    this.apiService.getTestData().subscribe({
      next: (data) => {
        this.testData = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = `Failed to load data: ${error.message}`;
        this.loading = false;
        console.error('Error loading test data:', error);
      }
    });
  }

  addData() {
    if (!this.newItem.name) {
      this.error = 'Name is required';
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.apiService.addTestData(this.newItem).subscribe({
      next: (response) => {
        this.loading = false;
        // Add the new item to our list
        this.testData.push(response);
        // Reset the form
        this.newItem = {
          name: '',
          value: 0
        };
      },
      error: (error) => {
        this.loading = false;
        this.error = `Failed to add data: ${error.message}`;
        console.error('Error adding test data:', error);
      }
    });
  }
}