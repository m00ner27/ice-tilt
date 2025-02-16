import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, tap } from 'rxjs';
import { Club } from '../state/clubs/clubs.model';
import * as ClubsActions from '../state/clubs/clubs.actions';
import * as ClubsSelectors from '../state/clubs/clubs.selectors';

@Component({
  selector: 'app-club',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './club.component.html',
  styleUrls: ['./club.component.css']
})
export class ClubComponent implements OnInit {
  clubs$: Observable<Club[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(private store: Store) {
    this.clubs$ = this.store.select(ClubsSelectors.selectAllClubs).pipe(
      tap(clubs => console.log('Clubs:', clubs))
    );
    this.loading$ = this.store.select(ClubsSelectors.selectClubsLoading);
    this.error$ = this.store.select(ClubsSelectors.selectClubsError);
  }

  ngOnInit() {
    this.store.dispatch(ClubsActions.loadClubs());
  }
}
