import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from '../services';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);
  if (authService.isAuthenticated()) {
    return true;
  } else {
    //router.navigate([{ path: rootNavigationRoutes.adminLogin }]);
    return router.createUrlTree(['/admin/login']);
  }
};
