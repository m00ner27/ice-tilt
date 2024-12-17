import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { UserScope, buildAngularAuthConfig } from '@logto/js';
import { provideAuth } from 'angular-auth-oidc-client';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';



export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()), // Use without withFetch()
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAuth({
      config: buildAngularAuthConfig({
        endpoint: 'https://c27w0x.logto.app/',
        appId: 'uullibn9q38hsuskcjar8',
        redirectUri: 'http://localhost:3000/callback',
        postLogoutRedirectUri: 'http://localhost:3000/',
      }),
    }),
  ],
};
