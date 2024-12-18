import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAuth0 } from '@auth0/auth0-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(), // Standard HTTP client
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // Auth0 Configuration for standalone apps
    provideAuth0({
      domain: 'dev-51tl555qz78d354r', // Your Auth0 domain
      clientId: '6761e3e56eb890ad7767bb63', // Your Auth0 Client ID
      authorizationParams: {
        redirect_uri: window.location.origin + '/callback',
        audience: 'http://localhost:3000', // Replace with your API audience
      },
      httpInterceptor: {
        allowedList: ['http://localhost:3000/api/*'], // Protect API calls
      },
    }),
  ],
};


