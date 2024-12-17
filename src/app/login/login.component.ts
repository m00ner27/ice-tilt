import { Component, Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
@Injectable({ providedIn: 'root' })
export class LoginComponent {
  constructor(public oidcSecurityService: OidcSecurityService) {}
  signIn() {
    this.oidcSecurityService.authorize();
  }

  signOut() {
    this.oidcSecurityService.logoff().subscribe((result) => {
      console.log('app sign-out', result);
    });
  }
}
