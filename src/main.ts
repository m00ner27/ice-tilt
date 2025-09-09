import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';

// Import the NgRx providers
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { environment } from './environments/environment';

// Import store configuration
import { reducers, metaReducers } from './app/store';

// Import effects
import { PlayersEffects } from './app/store/players.effects';
import { ClubsEffects } from './app/store/clubs.effects';
import { MatchesEffects } from './app/store/matches.effects';
import { SeasonsEffects } from './app/store/seasons.effects';
import { UsersEffects } from './app/store/users.effects';
import { DivisionsEffects } from './app/store/divisions.effects';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes),

    // Auth0 Configuration
    provideAuth0({
      domain: environment.auth0.domain, // Auth0 domain
      clientId: environment.auth0.clientId, // Auth0 Client ID
      authorizationParams: {
        redirect_uri: window.location.origin, // Use your application's base URL
        audience: environment.apiAudience, // Include audience for API calls
        scope: 'openid profile email offline_access', // Add offline_access for refresh tokens
      },
      httpInterceptor: {
        allowedList: environment.apiAllowedList, // Uses environment variable
      },
      cacheLocation: 'localstorage',
      useRefreshTokens: true,
      useRefreshTokensFallback: true
    }),
    
    // Set up NgRx store with all feature modules
    provideStore(reducers, { metaReducers }),
    
    // Set up NgRx effects
    provideEffects([
      PlayersEffects,
      ClubsEffects,
      MatchesEffects,
      SeasonsEffects,
      UsersEffects,
      DivisionsEffects
    ]),
    
    // Set up NgRx DevTools
    provideStoreDevtools({
      maxAge: 25, // Retain last 25 states
      logOnly: environment.production, // Only log in development
    }),
  ],
});



