import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http'; // Import HttpClientModule
import { AuthButtonComponent } from './auth-button/auth-button.component'; // Correct path
import { UserProfileComponent } from '../user-profile/user-profile.component';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule, AuthButtonComponent, UserProfileComponent], // Add HttpClientModule here
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
})
export class NavigationComponent {
  constructor(private http: HttpClient) {
    console.log('HttpClient initialized!');
  }
}


