import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { increment } from '../store/counter.actions';
import { selectCounter } from '../store/counter.selectors';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  counter$: Observable<number>;

  constructor(private store: Store) {
    this.counter$ = this.store.select(selectCounter);
  }

  increment(): void {
    this.store.dispatch(increment());
  }
}