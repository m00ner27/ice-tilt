# Performance Analysis & Optimization Plan

## Executive Summary

This document outlines the performance issues identified in the Ice Tilt application and the optimization strategy, starting with the Standings page as a proof of concept.

## Current Architecture

- **Frontend**: Angular with partial NgRx implementation
- **Backend**: Node.js/Express with MongoDB
- **Database**: MongoDB (max subscription)
- **Caching**: Basic CacheService with TTL

## Critical Performance Issues

### 1. Database Layer Issues

#### Issue: Loading All Games Without Pagination
**Location**: `ice-tilt-api/src/controllers/GameController.ts`
- `getAllGames()` - Fetches ALL games with `.find()` - no limit
- `getGamesBySeason()` - Fetches ALL games for a season - no pagination
- **Impact**: Could be loading thousands of game documents with full eashlData

**Current Code**:
```typescript
public getAllGames = async (req: Request, res: Response): Promise<void> => {
  const games = await Game.find()
    .populate('homeClubId', 'name abbreviation logoUrl eashlClubId')
    .populate('awayClubId', 'name abbreviation logoUrl eashlClubId');
  this.handleSuccess(res, games);
};
```

#### Issue: Missing Database Indexes
**Location**: `ice-tilt-api/src/models/game.ts`
- Only 2 indexes exist (playoff-related)
- No indexes on: `seasonId`, `divisionId`, `status`, `date`, `homeClubId`, `awayClubId`
- **Impact**: Full collection scans on common queries

#### Issue: Large Document Sizes
- Game documents store full `eashlData` including:
  - Complete player statistics for all players
  - Full club data in `eashlData.clubs`
  - This data is duplicated across many game documents
- **Impact**: Large payload sizes, slow network transfer, memory pressure

#### Issue: N+1 Query Patterns
**Location**: `ice-tilt-api/src/controllers/PlayoffController.ts`
- Loads games per series in loops
- **Impact**: Multiple round trips to database

### 2. Backend API Issues

#### Issue: No Field Selection
- Queries fetch entire documents when only specific fields needed
- Example: `Game.find()` returns all fields including large `eashlData`
- **Impact**: Unnecessary data transfer

#### Issue: Client-Side Calculations
**Location**: `ice-tilt/src/app/standings/standings.component.ts`
- Standings calculated on frontend by processing all games
- Should be calculated server-side with aggregation pipelines
- **Impact**: Large data transfer + CPU usage on client

**Current Flow**:
1. Frontend calls `getGamesBySeason(seasonId)` - returns ALL games
2. Frontend calls `getClubsBySeason(seasonId)` - returns ALL clubs
3. Frontend calls `getDivisionsBySeason(seasonId)` - returns ALL divisions
4. Frontend processes all games to calculate standings
5. Frontend renders standings

**Optimized Flow**:
1. Frontend calls `getStandings(seasonId, divisionId?)` - returns calculated standings
2. Frontend renders standings

#### Issue: Inconsistent Pagination
- Only TransactionsController has pagination
- Games, Clubs, Matches endpoints lack pagination
- **Impact**: Loading unnecessary data

### 3. Frontend Issues

#### Issue: Partial NgRx Implementation
- NgRx is set up but not consistently used
- Some components use NgRx, others use direct API calls
- **Impact**: Inconsistent state management, potential duplicate requests

#### Issue: Loading All Data Upfront
**Location**: `ice-tilt/src/app/standings/standings.component.ts`
- Loads all games, clubs, divisions at once
- **Impact**: Slow initial load, poor user experience

**Current Code**:
```typescript
forkJoin({
  games: this.apiService.getGamesBySeason(this.selectedSeasonId),
  clubs: this.apiService.getClubsBySeason(this.selectedSeasonId),
  divisions: this.apiService.getDivisionsBySeason(this.selectedSeasonId)
}).subscribe({
  next: ({ games, clubs, divisions }) => {
    this.games = (games || []).filter((game: any) => !game.isPlayoff);
    // ... process all games to calculate standings
  }
});
```

#### Issue: No Virtual Scrolling
- Large lists rendered without virtualization
- Virtual scroll component exists but not widely used
- **Impact**: DOM performance issues with large lists

## Standings Page Optimization Plan

### Phase 1: Backend Optimizations

#### 1.1 Create Server-Side Standings Endpoint
**New Endpoint**: `GET /api/standings/:seasonId?divisionId=:divisionId`

**Implementation**:
- Use MongoDB aggregation pipeline to calculate standings
- Return only standings data, not all games
- Support filtering by season/division
- Calculate: GP, W, L, OTL, PTS, GF, GA, GD, Win%

**Aggregation Pipeline Strategy**:
```javascript
[
  { $match: { seasonId, divisionId, status: 'completed', isPlayoff: { $ne: true } } },
  { $group: {
      _id: '$homeClubId',
      // Calculate stats for home games
    }
  },
  // Similar for away games
  { $merge: { into: 'standings' } }
]
```

#### 1.2 Add Database Indexes
```javascript
GameSchema.index({ seasonId: 1, divisionId: 1 });
GameSchema.index({ seasonId: 1, status: 1 });
GameSchema.index({ date: -1 });
GameSchema.index({ homeClubId: 1, seasonId: 1 });
GameSchema.index({ awayClubId: 1, seasonId: 1 });
```

#### 1.3 Optimize Game Queries
- Add field selection to exclude eashlData when not needed
- Use `.select()` to limit fields returned
- Use `.lean()` for read-only queries

### Phase 2: Frontend Optimizations

#### 2.1 Replace Client-Side Calculation
- Call new standings endpoint instead of loading all games
- Reduce data transfer by 90%+

#### 2.2 Implement Proper NgRx Pattern
- Create standings state/actions/effects
- Cache standings data appropriately
- Use selectors for derived data

#### 2.3 Optimize Rendering
- Ensure OnPush change detection (already implemented)
- Use trackBy functions for *ngFor
- Lazy load division standings if multiple

#### 2.4 Progressive Loading
- Show skeleton/loading states
- Load divisions one at a time if needed
- Cache standings per season

### Phase 3: Additional Optimizations

#### 3.1 Data Structure Optimization
- Consider separating eashlData into separate collection
- Use references instead of embedding large data
- Implement data archiving for old seasons

#### 3.2 Caching Strategy
- Cache standings server-side (if Redis available)
- Implement cache invalidation on game updates
- Use HTTP caching headers

## Implementation Steps

1. ✅ Create analysis document (this file)
2. ⏳ Create backend standings endpoint
3. ⏳ Add database indexes
4. ⏳ Update frontend to use new endpoint
5. ⏳ Implement NgRx for standings
6. ⏳ Test and validate
7. ⏳ Document patterns for future use

## Success Metrics

- **Initial Load Time**: Target < 2 seconds
- **Data Transfer**: Reduce by 80%+
- **Database Query Time**: Reduce by 70%+
- **Time to Interactive**: Improve by 60%+

## Next Steps

After Standings page optimization, apply similar patterns to:
1. Club Detail page
2. Schedule page
3. Admin Schedule page
4. Player Stats pages
