import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router'; // Import RouterModule
import { NavigationComponent } from './navigation/navigation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, RouterOutlet, NavigationComponent], // Add RouterModule here
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'ice-tilt';
}

