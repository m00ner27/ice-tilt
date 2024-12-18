import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router'; // Import RouterModule
import { NavigationComponent } from './navigation/navigation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, RouterOutlet, NavigationComponent], // Add RouterModule here
  template: `
    <app-navigation></app-navigation>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'ice-tilt';
}

