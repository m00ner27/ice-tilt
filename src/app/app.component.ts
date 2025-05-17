import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router'; // Import RouterModule
import { NavigationComponent } from './navigation/navigation.component';
import { ScheduleBarComponent } from './schedule-bar/schedule-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, RouterOutlet, NavigationComponent, ScheduleBarComponent], // Add ScheduleBarComponent here
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'ice-tilt';
}

