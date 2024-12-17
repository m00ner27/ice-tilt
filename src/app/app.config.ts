import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { provideZoneChangeDetection } from '@angular/core';
import { UserScope, buildAngularAuthConfig } from '@logto/js';
import { provideAuth } from 'angular-auth-oidc-client';
import { routes } from './app.routes';

@NgModule({
  imports: [
    HttpClientModule,
    RouterModule.forRoot(routes),
  ],
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAuth({
      config: buildAngularAuthConfig({
        endpoint: 'https://c27w0x.logto.app/',
        appId: 'uullibn9q38hsuskcjar8',
        redirectUri: 'http://localhost:3000/callback',
        postLogoutRedirectUri: 'http://localhost:3000/',
      }),
    }),
  ],
})
export class AppModule {}
