import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from '../services';
import { rootNavigationRoutes } from '../models';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return router.createUrlTree([rootNavigationRoutes.adminHome])
  }
  return true;
};
