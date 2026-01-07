# Standings Component Sync Fix

## Problem
The standings component was not updating when games were modified in the admin panel because:
- Admin panel uses direct API calls
- Standings component uses NgRx store data
- No synchronization between the two

## Root Cause
The admin schedule component was making direct API calls (`this.api.bulkUpdateGames()`, `this.api.deleteGame()`, etc.) but not updating the NgRx store that the standings component relies on.

## Solution
Added NgRx store updates after admin panel operations to ensure the standings component gets refreshed data.

## Changes Made

### 1. Added NgRx Imports
```typescript
import { Store } from '@ngrx/store';
import { AppState } from '../../store';
import * as MatchesActions from '../../store/matches.actions';
```

### 2. Added Store to Constructor
```typescript
constructor(
  private api: ApiService,
  private eashlService: EashlService,
  private router: Router,
  private store: Store<AppState>
) {}
```

### 3. Updated Methods to Reload NgRx Store

#### `submitChanges()` Method
- After successful bulk update and EASHL data fetching
- Added: `this.store.dispatch(MatchesActions.loadMatches());`

#### `deleteGame()` Method  
- After successful game deletion
- Added: `this.store.dispatch(MatchesActions.loadMatches());`

#### `performMerge()` Method
- After successful game merge
- Added: `this.store.dispatch(MatchesActions.loadMatches());`

## How It Works

1. **Admin Panel Operations**: Admin makes changes (link stats, delete games, merge games)
2. **API Calls**: Direct API calls update the database
3. **Local Refresh**: Admin panel reloads its own data
4. **Store Refresh**: NgRx store is reloaded with fresh data
5. **Standings Update**: Standings component automatically updates because it subscribes to NgRx store

## Result

✅ **Standings component now updates automatically** when admin panel makes changes
✅ **No breaking changes** to existing functionality  
✅ **Maintains data consistency** across all components
✅ **Simple solution** that works with existing architecture

## Testing

1. **Link stats in admin panel** → Check standings component updates
2. **Delete games in admin panel** → Check standings component updates  
3. **Merge games in admin panel** → Check standings component updates

The standings component should now reflect changes immediately after admin panel operations!
