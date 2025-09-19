import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AuthService } from '@auth0/auth0-angular';

import { AppState } from '../../store';
import * as ManagersActions from '../../store/managers.actions';
import { selectIsUserAnyManager, selectManagerStatus } from '../../store/managers.selectors';

@Injectable({
  providedIn: 'root'
})
export class ManagerGuard implements CanActivate {
  constructor(
    private store: Store<AppState>,
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.auth.user$.pipe(
      take(1),
      switchMap(user => {
        if (!user?.sub) {
          this.router.navigate(['/login']);
          return of(false);
        }

        // Extract user ID from Auth0 sub
        const userId = user.sub.split('|')[1];
        console.log('ManagerGuard - Auth0 sub:', user.sub);
        console.log('ManagerGuard - Extracted userId:', userId);

        // Check if user is any manager
        return this.store.select(selectIsUserAnyManager).pipe(
          take(1),
          switchMap(isManager => {
            if (isManager) {
              return of(true);
            }

            // If not in store, check manager status
            return this.store.select(selectManagerStatus).pipe(
              take(1),
              switchMap(status => {
                if (status?.isManager) {
                  return of(true);
                }

                // Only dispatch if we have a valid userId (not 'discord')
                if (userId && userId !== 'discord') {
                  this.store.dispatch(ManagersActions.loadManagersByUser({ userId }));
                } else {
                  console.log('ManagerGuard - Skipping manager load - invalid userId:', userId);
                  return of(false);
                }
                
                // Wait for the result
                return this.store.select(selectIsUserAnyManager).pipe(
                  take(1),
                  map(hasManagerStatus => {
                    if (!hasManagerStatus) {
                      this.router.navigate(['/unauthorized']);
                      return false;
                    }
                    return true;
                  })
                );
              })
            );
          })
        );
      }),
      catchError(() => {
        this.router.navigate(['/unauthorized']);
        return of(false);
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class ClubManagerGuard implements CanActivate {
  constructor(
    private store: Store<AppState>,
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.auth.user$.pipe(
      take(1),
      switchMap(user => {
        if (!user?.sub) {
          this.router.navigate(['/login']);
          return of(false);
        }

        // Extract user ID from Auth0 sub
        const userId = user.sub.split('|')[1];
        const clubId = route.params['clubId'] || route.queryParams['clubId'];
        
        if (!clubId) {
          this.router.navigate(['/unauthorized']);
          return of(false);
        }

        // Check manager status for specific club
        return this.store.select(selectManagerStatus).pipe(
          take(1),
          switchMap(status => {
            if (status?.isManager && status.manager?.clubId === clubId) {
              return of(true);
            }

            // Dispatch action to check manager status for this club
            this.store.dispatch(ManagersActions.checkManagerStatus({ userId, clubId }));
            
            // Wait for the result
            return this.store.select(selectManagerStatus).pipe(
              take(1),
              map(managerStatus => {
                if (!managerStatus?.isManager || managerStatus.manager?.clubId !== clubId) {
                  this.router.navigate(['/unauthorized']);
                  return false;
                }
                return true;
              })
            );
          })
        );
      }),
      catchError(() => {
        this.router.navigate(['/unauthorized']);
        return of(false);
      })
    );
  }
}
