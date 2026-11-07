import { inject, Service } from '@angular/core';
import { Spinnerservice } from './spinnerservice';
import { Toastservice } from './toastservice';
import { catchError, finalize, forkJoin, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { rootNavigationRoutes } from '../models';

@Service()
export class ApiHandlerService {
    private spinner = inject(Spinnerservice);
    private toastService = inject(Toastservice);
    private router = inject(Router);

    execute<T>(options: {
        apiCall: () => Observable<T>;
        successMessage?: string;
        errorMessage?: string;
        showSpinner?: boolean;
    }): Observable<T> {

        // Show spinner unless explicitly disabled
        if (options.showSpinner !== false) {
            this.spinner.showSpinner();
        }

        return options.apiCall()
            .pipe(
                // Success handling
                tap(() => {
                    if (options.successMessage) {
                        this.toastService.showSuccess(
                            options.successMessage
                        );
                    }
                }),

                // Error handling
                catchError((error: unknown) => {
                    const currentUrl = this.router.url.split('?')[0].split('#')[0];
                    const publicWallUrl = `/${rootNavigationRoutes.intentionwall}`;
                    if (currentUrl !== publicWallUrl) {
                        this.toastService.showError(
                            options.errorMessage ?? 'Something went wrong'
                        );
                    }

                    // Important: send the error back to the component
                    return throwError(() => error);
                }),

                // Always hide spinner
                finalize(() => {
                    if (options.showSpinner !== false) {
                        this.spinner.hideSpinner();
                    }
                })
            );
    }

    executeAll<T extends Record<string, Observable<any>>>(
        apiCalls: T,
        options?: {
            successMessage?: string;
            errorMessage?: string;
            showSpinner?: boolean;
        }
    ): Observable<T> {

        if (options?.showSpinner !== false) {
            this.spinner.showSpinner();
        }

        return forkJoin(apiCalls).pipe(

            tap(() => {
                if (options?.successMessage) {
                    this.toastService.showSuccess(
                        options.successMessage
                    );
                }
            }),

            catchError((error: unknown) => {
                // this.toastService.showError(
                //     options?.errorMessage ?? 'Something went wrong'
                // );

                return throwError(() => error);
            }),

            finalize(() => {
                if (options?.showSpinner !== false) {
                    this.spinner.hideSpinner();
                }
            })
        );
    }

}
