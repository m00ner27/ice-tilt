import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAuth0 } from '@auth0/auth0-angular';
import { StandingsService } from './services/standings.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAuth0({
      domain: 'dev-51tl555qz78d354r',
      clientId: '6761e3e56eb890ad7767bb63',
      authorizationParams: {
        redirect_uri: window.location.origin + '/callback',
        audience: 'https://ice-tilt-backend.onrender.com',
      },
      httpInterceptor: {
        allowedList: [
          'https://ice-tilt-backend.onrender.com/api/*',
          'http://localhost:3000/api/*',
        ],
      },
    }),
    StandingsService,
  ],
};


