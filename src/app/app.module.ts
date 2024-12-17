import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { AuthModule, StsConfigLoader, StsConfigStaticLoader, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { NavigationComponent } from './navigation/navigation.component';

@NgModule({
  declarations: [
    AppComponent, // Declare your main AppComponent
    NavigationComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    AuthModule.forRoot({
      loader: {
        provide: StsConfigLoader,
        useFactory: () =>
          new StsConfigStaticLoader({
            authority: 'https://c27w0x.logto.app/', // Your OIDC provider
            redirectUrl: 'http://localhost:4200/callback',
            postLogoutRedirectUri: 'http://localhost:4200',
            clientId: 'uullibn9q38hsuskcjar8',
            scope: 'openid profile email', // Define your required scopes
            responseType: 'code', // Use the authorization code flow
          }),
      },
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
