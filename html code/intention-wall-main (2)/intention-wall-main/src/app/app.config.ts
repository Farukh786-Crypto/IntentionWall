import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { provideToastr } from 'ngx-toastr';
import { jwtAuthInterceptor } from './features/common/httpinterceptor/jwt-auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          // never follow the OS dark mode (PrimeNG's default is 'system'); the app has no dark theme
          darkModeSelector: false
        }
      }
    }),
    provideRouter(routes, withHashLocation()),
    provideToastr({
      positionClass: 'toast-top-right'
    }),
    provideHttpClient(withInterceptors([jwtAuthInterceptor]))
  ]
};
