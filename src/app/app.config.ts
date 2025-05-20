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
      domain: 'dev-dev-51tl555qz78d354r.us.auth0.com',
      clientId: 'WgWpaLK0yww0VSuHQuvcKBAUWPCJcO4e',
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: environment.apiAudience,
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


