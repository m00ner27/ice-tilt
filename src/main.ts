import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';

// Import the NgRx providers
import { provideStore } from '@ngrx/store';
import { counterReducer } from './app/store/counter.reducer';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),

    // Auth0 Configuration
    provideAuth0({
      domain: environment.auth0.domain, // Auth0 domain
      clientId: environment.auth0.clientId, // Auth0 Client ID
      authorizationParams: {
        redirect_uri: window.location.origin, // Use your application's base URL
        audience: environment.apiAudience, // Uses environment variable
        scope: 'openid profile email', // Add the required scopes
      },
      httpInterceptor: {
        allowedList: environment.apiAllowedList, // Uses environment variable
      },
    }),
    // Set up NgRx store with the "counter" state slice
    provideStore({ counter: counterReducer }),
    provideStoreDevtools({
      maxAge: 25, // Retain last 25 states
      logOnly: false, // Change to true in production mode
    }),
  ],
});



