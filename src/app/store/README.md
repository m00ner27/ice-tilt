# NgRx State Management Setup

This directory contains the complete NgRx state management setup for the Ice Tilt application. The setup follows NgRx best practices and provides a scalable architecture for managing application state.

## Architecture Overview

The NgRx setup is organized into feature modules, each representing a domain of the application:

- **Clubs** - Club management, rosters, and operations
- **Matches** - Game data, statistics, and EASHL integration
- **Seasons** - Season management and active season tracking
- **Users** - User management, free agents, and contract offers
- **Players** - Player profiles and authentication

## File Structure

```
store/
├── index.ts                    # Root store configuration
├── README.md                   # This documentation
├── services/
│   ├── api.service.ts         # Original API service
│   └── ngrx-api.service.ts    # NgRx wrapper service
├── models/
│   └── models/                # TypeScript interfaces
├── [feature].actions.ts       # Actions for each feature
├── [feature].reducer.ts       # Reducers for each feature
├── [feature].effects.ts       # Effects for each feature
└── [feature].selectors.ts     # Selectors for each feature
```

## Key Components

### 1. Actions
Actions represent events that occur in the application. They are dispatched to update the state.

```typescript
// Example: Loading clubs
this.store.dispatch(ClubsActions.loadClubs());

// Example: Creating a club with data
this.store.dispatch(ClubsActions.createClub({ clubData: newClub }));
```

### 2. Reducers
Reducers are pure functions that specify how the state changes in response to actions.

```typescript
// Example: Clubs reducer handles all club-related state changes
export const clubsReducer = createReducer(
  initialState,
  on(ClubsActions.loadClubs, (state) => ({ ...state, loading: true })),
  on(ClubsActions.loadClubsSuccess, (state, { clubs }) => ({ 
    ...state, 
    clubs, 
    loading: false 
  }))
);
```

### 3. Effects
Effects handle side effects (like API calls) and dispatch new actions based on the results.

```typescript
// Example: Loading clubs effect
loadClubs$ = createEffect(() =>
  this.actions$.pipe(
    ofType(ClubsActions.loadClubs),
    mergeMap(() =>
      this.apiService.getClubs().pipe(
        map(clubs => ClubsActions.loadClubsSuccess({ clubs })),
        catchError(error => of(ClubsActions.loadClubsFailure({ error })))
      )
    )
  )
);
```

### 4. Selectors
Selectors are pure functions used to select, derive, and compose pieces of state.

```typescript
// Example: Selecting all clubs
export const selectAllClubs = createSelector(
  selectClubsState,
  (state: ClubsState) => state.clubs
);

// Example: Selecting clubs by division
export const selectClubsByDivision = (division: string) => createSelector(
  selectAllClubs,
  (clubs) => clubs.filter(club => club.division === division)
);
```

## Usage Examples

### 1. Using the NgRx API Service (Recommended)

The `NgRxApiService` provides a clean interface for dispatching actions:

```typescript
import { NgRxApiService } from './store/services/ngrx-api.service';

@Component({...})
export class MyComponent {
  constructor(private ngrxApiService: NgRxApiService) {}

  loadClubs() {
    this.ngrxApiService.loadClubs();
  }

  createClub(clubData: any) {
    this.ngrxApiService.createClub(clubData);
  }
}
```

### 2. Using Selectors in Components

```typescript
import { Store } from '@ngrx/store';
import { selectAllClubs, selectClubsLoading } from './store/clubs.selectors';

@Component({...})
export class ClubsComponent {
  clubs$ = this.store.select(selectAllClubs);
  loading$ = this.store.select(selectClubsLoading);

  constructor(private store: Store<AppState>) {}
}
```

### 3. Template Usage

```html
<div *ngIf="loading$ | async" class="spinner">Loading...</div>

<div *ngFor="let club of clubs$ | async" class="club-card">
  <h3>{{ club.name }}</h3>
</div>
```

### 4. Direct Action Dispatching

```typescript
import { Store } from '@ngrx/store';
import * as ClubsActions from './store/clubs.actions';

@Component({...})
export class MyComponent {
  constructor(private store: Store<AppState>) {}

  loadClubs() {
    this.store.dispatch(ClubsActions.loadClubs());
  }
}
```

## State Structure

The application state is organized as follows:

```typescript
interface AppState {
  counter: number;           // Counter feature (legacy)
  players: PlayersState;     // Player profiles and auth
  clubs: ClubsState;         // Club management
  matches: MatchesState;     // Game data and stats
  seasons: SeasonsState;     // Season management
  users: UsersState;         // User management
}
```

## Best Practices

### 1. Use the NgRx API Service
Instead of directly dispatching actions, use the `NgRxApiService` for cleaner, more maintainable code.

### 2. Leverage Selectors
Use selectors to access state data. They provide memoization and can be composed for complex data transformations.

### 3. Handle Loading States
Always provide loading and error states for better user experience:

```typescript
// In your component
loading$ = this.store.select(selectClubsLoading);
error$ = this.store.select(selectClubsError);

// In your template
<div *ngIf="loading$ | async">Loading...</div>
<div *ngIf="error$ | async" class="error">{{ error$ | async }}</div>
```

### 4. Use Effects for Side Effects
All API calls should be handled in effects, not in components or services.

### 5. Keep Actions Simple
Actions should be simple and focused. Use props to pass data when needed.

## Available Features

### Clubs
- Load all clubs
- Load club by ID
- Load clubs by season
- Create, update, delete clubs
- Manage club rosters
- Upload club logos

### Matches
- Load all matches
- Load matches by season
- Create, update, delete matches
- Bulk update matches
- Merge matches
- Save game statistics
- EASHL data integration

### Seasons
- Load all seasons
- Create, update, delete seasons
- Set active season
- Track season status

### Users
- Load all users
- Load free agents
- Manage user profiles
- Handle contract offers
- Manage inbox offers

### Players
- Load player profiles
- Handle Discord authentication
- Manage player data

## Development Tools

The setup includes NgRx DevTools for debugging:

- **Redux DevTools Extension**: Install in your browser for state inspection
- **Time-travel debugging**: Step through state changes
- **Action replay**: Replay actions to reproduce issues

## Migration Guide

If you're migrating existing components to use NgRx:

1. **Replace direct API calls** with NgRx API service calls
2. **Replace local state** with store selectors
3. **Replace manual loading states** with store loading selectors
4. **Update templates** to use observables from selectors

## Example Component

See `components/ngrx-example/ngrx-example.component.ts` for a complete example of how to use the NgRx setup in a component.

## Troubleshooting

### Common Issues

1. **Actions not dispatching**: Ensure the action is imported and the store is injected
2. **Selectors returning undefined**: Check that the feature state is properly initialized
3. **Effects not running**: Verify the effect is registered in the main.ts providers
4. **Type errors**: Ensure all interfaces are properly imported and typed

### Debug Tips

1. Use Redux DevTools to inspect state changes
2. Add console.log statements in effects to trace execution
3. Check the browser console for NgRx-related errors
4. Verify that all required dependencies are installed

## Next Steps

1. **Add more features**: Extend the existing features with additional actions and selectors
2. **Implement caching**: Add caching strategies for frequently accessed data
3. **Add optimistic updates**: Implement optimistic updates for better UX
4. **Add real-time updates**: Integrate WebSocket connections for real-time data
5. **Add persistence**: Implement state persistence for offline support
