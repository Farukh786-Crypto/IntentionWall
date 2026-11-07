import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { ADMIN_API_EXCLUDED_PATHS, ADMIN_API_PREFIX } from '../models/constants';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthenticationService } from '../services';
import { rootNavigationRoutes } from '../models';

export const jwtAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const authservice = inject(AuthenticationService);
  const adminApi = request.url.includes(ADMIN_API_PREFIX);
  const isRefreshRequest = request.url.includes('/v1/auth/refresh');
  // if admin api used in public
  const isExcludedAdminApi = request.method === 'GET' && ADMIN_API_EXCLUDED_PATHS.some(path => request.url.includes(path));

  // if api not start with v1/admin then do not add Authorization header with token 
  if (!adminApi || isExcludedAdminApi || isRefreshRequest || request.headers.has('Authorization')) {
    return next(request);
  }

  const sendAuthenticated = (token: string) => next(withAccessToken(request, token));
  const token = authservice.getToken();
  const authenticatedRequest$ = token
    ? sendAuthenticated(token)
    : authservice.refreshAccessToken().pipe(switchMap(sendAuthenticated));

  return authenticatedRequest$.pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return authservice.refreshAccessToken().pipe(
          switchMap(sendAuthenticated),
          catchError(refreshError => {
            authservice.logout();
            router.navigateByUrl(`/${rootNavigationRoutes.adminLogin}`);
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

function withAccessToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}
