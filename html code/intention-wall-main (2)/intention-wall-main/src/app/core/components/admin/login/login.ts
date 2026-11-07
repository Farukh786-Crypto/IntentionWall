import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminLoginResponse, ApiResponse } from '../../../../features/common/models/apiResponse.model';
import { hasValidationErrors } from '../../../../features/common/Validators/form-utils';
import { ApiHandlerService, AuthenticationService } from '../../../../features/common/services';
import { PasswordModule } from 'primeng/password';
import { LoginForm } from '../../../../features/common/Validators/login-form';
import { Router } from '@angular/router';
import { rootNavigationRoutes } from '../../../../features/common/models';

@Component({
  selector: 'IntentionWall-admin-login',
  imports: [CommonModule, ReactiveFormsModule, PasswordModule],
  providers: [LoginForm],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class AdminLogin {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authenticationService = inject(AuthenticationService);
  private readonly apiHandler = inject(ApiHandlerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly loginForm: LoginForm = inject(LoginForm);
  value!: string;

  hasLoginFormErrors(controlName: string, errorName?: string): boolean {
    return hasValidationErrors(this.loginForm, controlName, errorName);
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.apiHandler.execute<ApiResponse<AdminLoginResponse>>({
      apiCall: () => this.authenticationService.loginService(this.loginForm.getRawValue()),
      successMessage: 'Login successful.',
      errorMessage: 'Login failed. Please check your credentials and try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: ApiResponse<AdminLoginResponse>) => {
        if (!response.Success || !response.Data) {
          return;
        }
        this.authenticationService.storeTokens(response.Data);
        this.isSubmitting.set(false);

      },
      complete: () => {
        this.router.navigate([rootNavigationRoutes.adminHome], { replaceUrl: true });
        this.loginForm.reset();
      }
    })
  }

}
