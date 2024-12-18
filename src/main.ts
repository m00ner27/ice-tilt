import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),

    // Auth0 Configuration
    provideAuth0({
      domain: 'dev-51tl555qz78d354r.us.auth0.com', // Auth0 domain
      clientId: 'WgWpaLK0yww0VSuHQuvcKBAUWPCJcO4e', // Auth0 Client ID
      authorizationParams: {
        redirect_uri: window.location.origin, // Use your application's base URL
        audience: 'http://localhost:3000', // Optional: API audience if needed
        scope: 'openid profile email', // Add the required scopes
      },
      httpInterceptor: {
        allowedList: ['http://localhost:3000/api/*'], // Protect API calls
      },
    }),
  ],
});



