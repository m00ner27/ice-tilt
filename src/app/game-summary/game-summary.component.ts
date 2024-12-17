import { Component } from '@angular/core';

@Component({
  selector: 'app-game-summary',
  standalone: true,
  // If you are using Bootstrap or other styles, make sure they're globally included.
  styleUrls: ['./game-summary.component.css'],
  templateUrl: './game-summary.component.html'
})
export class GameSummaryComponent {
  // If you need to pass dynamic data to this component later,
  // you can add @Input properties and/or fetch data here.
}
