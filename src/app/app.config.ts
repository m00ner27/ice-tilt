import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { provideAuth0 } from '@auth0/auth0-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(), // Standard HTTP client
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // Auth0 Configuration for standalone apps
    provideAuth0({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: environment.apiAudience,
        scope: 'openid profile email offline_access read:clubs read:games read:seasons read:divisions read:player-profiles read:regions read:skater-data read:standings read:users read:offers',
      },
      httpInterceptor: {
        allowedList: [
          ...environment.apiAllowedList,
        ],
      },
      cacheLocation: 'localstorage',
      useRefreshTokens: true,
    }),    
  ],
};


