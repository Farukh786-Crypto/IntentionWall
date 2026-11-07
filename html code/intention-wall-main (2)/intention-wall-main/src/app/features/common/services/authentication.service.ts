
import { Service, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, defer, finalize, map, shareReplay, throwError } from 'rxjs';
import { AdminLoginRequest, AdminLoginResponse, ApiResponse, RefreshTokenRequest, RefreshTokenResponse } from '../models/apiResponse.model';
import { Api } from './api';
import { APPLICATION_USER_API, REFRESHTOKENSTORAGEKEY, rootNavigationRoutes, TOKENPAYLOADEMAIL, TOKENSTORAGEKEY } from '../models';

interface LoginApiResponse extends Partial<ApiResponse<AdminLoginResponse>> {
  statusCode?: number;
  success?: boolean;
  message?: string;
  data?: AdminLoginResponse | null;
}

@Service()

export class AuthenticationService {
  private readonly apiService = inject(Api);
  private readonly router = inject(Router);
  private readonly tokenStorageKey = TOKENSTORAGEKEY;
  private readonly refreshTokenStorageKey = REFRESHTOKENSTORAGEKEY;
  private readonly idleTimeoutMs = 20 * 60 * 1000;
  private readonly keepAliveIntervalMs = 18 * 60 * 1000;
  private refreshRequest$: Observable<string> | null = null;
  private activityTimerId: ReturnType<typeof setInterval> | null = null;
  private lastActivityAt = Date.now();
  private lastKeepAliveAt = Date.now();
  private isMonitoringActivity = false;
  private readonly recordActivity = () => this.lastActivityAt = Date.now();

  loginService(credentials: AdminLoginRequest): Observable<ApiResponse<AdminLoginResponse>> {
    return this.apiService.postAdmin<AdminLoginRequest, LoginApiResponse>(APPLICATION_USER_API.LOGIN, credentials).pipe(
      map(response => ({
        StatusCode: response.StatusCode ?? response.statusCode ?? 0,
        Success: response.Success ?? response.success ?? false,
        Message: response.Message ?? response.message ?? '',
        Data: response.Data ?? response.data ?? null
      }))
    );
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenStorageKey);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.refreshTokenStorageKey);
  }

  storeTokens(response: AdminLoginResponse | string): string {
    const accessToken = this.getAccessToken(response);
    sessionStorage.setItem(this.tokenStorageKey, accessToken);

    if (typeof response !== 'string') {
      const refreshToken = response.refreshToken ?? response.RefreshToken;
      if (refreshToken) {
        sessionStorage.setItem(this.refreshTokenStorageKey, refreshToken);
      }
    }

    const email = this.getJwtClaim(accessToken, 'unique_name') ?? this.getJwtClaim(accessToken, 'email');
    if (email) {
      sessionStorage.setItem(TOKENPAYLOADEMAIL, String(email));
    }
    this.startSessionMonitoring();
    return accessToken;
  }

  refreshAccessToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Your session has expired. Please sign in again.'));
    }

    if (!this.refreshRequest$) {
      this.refreshRequest$ = defer(() => this.apiService
        .postAdmin<RefreshTokenRequest, RefreshTokenResponse>(
          APPLICATION_USER_API.REFRESH_TOKEN,
          { refreshToken }
        )
      ).pipe(
        map(response => {
          if (!response.success || !response.data) {
            throw new Error('Unable to refresh your session.');
          }
          return this.storeTokens(response.data);
        }),
        finalize(() => this.refreshRequest$ = null),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.refreshRequest$;
  }

  isAuthenticated(): boolean {
    const authenticated = !!this.getToken();
    if (authenticated) {
      this.startSessionMonitoring();
    }
    return authenticated;
  }

  logout(): void {
    this.stopSessionMonitoring();
    sessionStorage.removeItem(this.tokenStorageKey);
    sessionStorage.removeItem(this.refreshTokenStorageKey);
    sessionStorage.removeItem(TOKENPAYLOADEMAIL);
  }

  private startSessionMonitoring(): void {
    if (this.isMonitoringActivity || typeof window === 'undefined') {
      return;
    }

    this.isMonitoringActivity = true;
    this.lastActivityAt = Date.now();
    this.lastKeepAliveAt = Date.now();
    window.addEventListener('pointerdown', this.recordActivity, { passive: true });
    window.addEventListener('keydown', this.recordActivity);
    window.addEventListener('scroll', this.recordActivity, { passive: true });
    window.addEventListener('touchstart', this.recordActivity, { passive: true });
    window.addEventListener('focus', this.recordActivity);

    this.activityTimerId = window.setInterval(() => {
      const now = Date.now();
      if (now - this.lastActivityAt >= this.idleTimeoutMs) {
        this.endInactiveSession();
        return;
      }

      if (now - this.lastKeepAliveAt >= this.keepAliveIntervalMs) {
        this.lastKeepAliveAt = now;
        this.refreshAccessToken().subscribe({
          error: () => this.endInactiveSession()
        });
      }
    }, 60 * 1000);
  }

  private stopSessionMonitoring(): void {
    if (this.activityTimerId !== null) {
      clearInterval(this.activityTimerId);
      this.activityTimerId = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerdown', this.recordActivity);
      window.removeEventListener('keydown', this.recordActivity);
      window.removeEventListener('scroll', this.recordActivity);
      window.removeEventListener('touchstart', this.recordActivity);
      window.removeEventListener('focus', this.recordActivity);
    }
    this.isMonitoringActivity = false;
  }

  private endInactiveSession(): void {
    this.logout();
    this.router.navigateByUrl(`/${rootNavigationRoutes.adminLogin}`);
  }

  private getAccessToken(response: AdminLoginResponse | string): string {
    const token = typeof response === 'string'
      ? response
      : response.token ?? response.accessToken ?? response.jwtToken ?? response.Token ?? response.AccessToken ?? response.JwtToken;
    if (!token) {
      throw new Error('The authentication response did not include an access token.');
    }
    return token;
  }

  private getJwtClaim(token: string, claim: string): unknown {
    try {
      const payload = token.split('.')[1];
      return payload ? JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))[claim] : undefined;
    } catch {
      return undefined;
    }
  }

}
