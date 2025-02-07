import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { increment } from '../store/counter.actions';
import { selectCounter } from '../store/counter.selectors';

@Component({
  selector: 'app-home',
  // Add CommonModule to the standalone component imports so that Angular pipes (like async) and common directives are available.
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  counter$: Observable<number>;

  constructor(private store: Store) {
    // Use the selector defined in the store to read the counter value.
    this.counter$ = this.store.select(selectCounter);
  }

  // Dispatch an action when the button is clicked.
  increment(): void {
    this.store.dispatch(increment());
  }
}