import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';

// Import the NgRx providers
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideEffects } from '@ngrx/effects';

// Import your reducers and effects
import { counterReducer } from './app/store/counter.reducer';
import { standingsReducer } from './app/state/standings/standings.reducer';
import { StandingsEffects } from './app/state/standings/standings.effects';
import { clubsReducer } from './app/state/clubs/clubs.reducer';
import { ClubsEffects } from './app/state/clubs/clubs.effects';
import { playersReducer } from './app/state/players/players.reducer';
import { PlayersEffects } from './app/state/players/players.effects';
import { profileReducer } from './app/state/profile/profile.reducer';
import { ProfileEffects } from './app/state/profile/profile.effects';
import { messagesReducer } from './app/state/messages/messages.reducer';
import { MessagesEffects } from './app/state/messages/messages.effects';
import { gamesReducer } from './app/state/games/games.reducer';
import { GamesEffects } from './app/state/games/games.effects';
import { transactionsReducer } from './app/state/transactions/transactions.reducer';
import { TransactionsEffects } from './app/state/transactions/transactions.effects';
import { freeAgentsReducer } from './app/state/free-agents/free-agents.reducer';
import { FreeAgentsEffects } from './app/state/free-agents/free-agents.effects';
import { adminReducer } from './app/state/admin/admin.reducer';
import { AdminEffects } from './app/state/admin/admin.effects';
import { seasonsReducer } from './app/state/seasons/seasons.reducer';
import { SeasonsEffects } from './app/state/seasons/seasons.effects';
import { scheduleReducer } from './app/state/schedule/schedule.reducer';
import { ScheduleEffects } from './app/state/schedule/schedule.effects';
import { statsReducer } from './app/state/stats/stats.reducer';
import { StatsEffects } from './app/state/stats/stats.effects';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),

    // Auth0 Configuration
    provideAuth0({
      domain: 'dev-51tl555qz78d354r.us.auth0.com',
      clientId: 'WgWpaLK0yww0VSuHQuvcKBAUWPCJcO4e',
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: 'http://localhost:3001',
        scope: 'openid profile email',
      },
      httpInterceptor: {
        allowedList: ['http://localhost:3001/api/*'],
      },
    }),

    // Provide store with all reducers
    provideStore({ 
      counter: counterReducer,
      standings: standingsReducer,
      clubs: clubsReducer,
      players: playersReducer,
      profile: profileReducer,
      messages: messagesReducer,
      games: gamesReducer,
      transactions: transactionsReducer,
      freeAgents: freeAgentsReducer,
      admin: adminReducer,
      seasons: seasonsReducer,
      schedule: scheduleReducer,
      stats: statsReducer,
    }),

    // Single provideEffects call with all effects
    provideEffects(
      StandingsEffects,
      ClubsEffects,
      PlayersEffects,
      ProfileEffects,
      MessagesEffects,
      GamesEffects,
      TransactionsEffects,
      FreeAgentsEffects,
      AdminEffects,
      SeasonsEffects,
      ScheduleEffects,
      StatsEffects
    ),

    // DevTools configuration
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false,
    }),
  ],
});