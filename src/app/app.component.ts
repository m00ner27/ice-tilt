import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavigationComponent],
  template: `
    <app-navigation></app-navigation>
  
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'ice-tilt';
}

