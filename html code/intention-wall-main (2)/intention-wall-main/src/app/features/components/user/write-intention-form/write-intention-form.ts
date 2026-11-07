import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, ElementRef, inject, OnDestroy, OnInit, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { Button } from '../button/button';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { hasValidationErrors } from '../../../common/Validators/form-utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CreatePostRequest, digitValidator, SendEmailOtpRequest, StringEmpty, VerifyOtpRequest } from '../../../common/models';
import { AddIntentionForm } from '../../../common/Validators/add-intention-form';
import { LookupStore } from '../../../common/services/api-store';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { AdminService, ApiHandlerService, ApplicationuserService } from '../../../common/services';

@Component({
  imports: [CommonModule, Button, ReactiveFormsModule, SelectModule],
  selector: 'IntentionWall-write-intention-form',
  styleUrl: './write-intention-form.scss',
  templateUrl: './write-intention-form.html',
  providers: [AddIntentionForm],

})
export class WriteIntentionForm implements OnInit, OnDestroy {

  // inject service
  private fb = inject(FormBuilder);
  private readonly apiHandler = inject(ApiHandlerService);
  private readonly applicationUserService = inject(ApplicationuserService);
  private readonly router = inject(Router);
  private readonly adminService = inject(AdminService);
  private readonly lookupStore = inject(LookupStore);
  private readonly destroyRef = inject(DestroyRef);
  private otpTimer?: ReturnType<typeof setInterval>;

  otpSent = signal(false);
  submitOtp = signal(StringEmpty);
  emailVerified = signal(false);
  otpCountdown = signal(60);
  @ViewChildren('otpInput') otpInput!: QueryList<ElementRef<HTMLInputElement>>;
  //posting state for intention submission
  postingState = signal<'idle' | 'posting' | 'success' | 'error'>('idle');
  @ViewChild('postingVideo', { static: false }) postingVideo!: ElementRef<HTMLDivElement>;
  readonly addIntentionForm: AddIntentionForm = inject(AddIntentionForm);
  verifiedEmail!: string;
  countriesListOptions = this.lookupStore.countriesListOptions;
  readonly zonesListOptions = this.lookupStore.zonesListOptions;
  traditionListOptions = this.lookupStore.traditionListOptions;
  verifyOtpMessage = signal(StringEmpty);
  sendOtp = signal<boolean>(false);
  otpVerify = signal<boolean>(true);
  emailVerifyButtonText = signal<string>('Verify Email');
  errorVerifyEmail = signal<boolean>(false);
  isSendingEmailOtp = signal<boolean>(false);
  otpEmailVerify = signal<boolean>(false);
  isVerifyingOtp = signal<boolean>(false);
  verifyOtpButtonText = signal<string>('Verify code');

  ngOnInit(): void {
    this.setupEmailChangeListener();
    this.lookupStore.loadMessagesSelectOption();
  }

  hasAddPostFormErrors(controlName: string, errorName?: string): boolean {
    return hasValidationErrors(this.addIntentionForm, controlName, errorName);
  }


  // posting status text
  postingTitle = computed(() => {
    switch (this.postingState()) {
      case 'success':
        return 'Thank you for adding a piece back to the wall.';

      case 'error':
        return "Message couldn't be sent!";

      default:
        return 'Submitting your message…';
    }
  });

  postingText = computed(() => {
    switch (this.postingState()) {
      case 'success':
        return 'Every intention adds to a shared hope for peace. Thank you for contributing.';

      case 'error':
        return 'Something went wrong while submitting your message. Please try again in a moment.';

      default:
        return 'Please wait while we securely submit your message. This should only take a few seconds.';
    }
  });

  showTryAgain = computed(() => this.postingState() === 'error');
  showPostAnother = computed(() => this.postingState() === 'success');

  private setupEmailChangeListener(): void {
    const emailControl = this.addIntentionForm.controls['email'];
    emailControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.resetEmailVerification();
    })
  }

  private resetEmailVerification(): void {
    this.emailVerified.set(false);
    this.otpSent.set(false);
    this.otpCountdown.set(0);
    this.verifiedEmail = StringEmpty;
    if (this.otpTimer) {
      clearInterval(this.otpTimer);
      this.otpTimer = undefined;
    }
    this.addIntentionForm.controls['otp'].reset(StringEmpty, {
      emitEvent: false
    })
  }

  SendEmailOtp(request: SendEmailOtpRequest) {
    if (this.sendOtp() && this.isSendingEmailOtp()) {
      return;
    }
    this.isSendingEmailOtp.set(true);
    this.errorVerifyEmail.set(false);
    this.emailVerifyButtonText.set('Verify Email');

    // called send otp api
    this.apiHandler.execute({
      apiCall: () => this.applicationUserService.sendOtp(request),
      showSpinner: false
      // successMessage: 'Verification code sent successfully.',
      // errorMessage: 'Failed to send verification code.'
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isSendingEmailOtp.set(false))).subscribe({
      next: (res) => {
        if (res?.Success) {
          this.sendOtp.set(true);
          this.otpSent.set(true);
          this.emailVerified.set(false);
          this.otpEmailVerify.set(false);
          this.errorVerifyEmail.set(false);
        }
      },
      error: (err: string) => {
        this.sendOtp.set(false);
        this.isSendingEmailOtp.set(false);
        this.errorVerifyEmail.set(true);
        this.emailVerifyButtonText.set('Try Again');
      },
      complete: () => {
        this.addIntentionForm.controls['otp'].reset(StringEmpty, { emitEvent: false })
        this.addIntentionForm.controls['otp'].markAllAsDirty();
        this.addIntentionForm.controls['consent'].markAllAsTouched();
        this.startOtpCountdown();
      }
    })
  }

  startOtpCountdown() {
    // Reset Timer
    this.otpCountdown.set(60);
    // clear previous timer 
    if (this.otpTimer) {
      clearInterval(this.otpTimer);
    }

    this.otpTimer = setInterval(() => {
      const current = this.otpCountdown();
      if (current <= 1) {
        this.otpCountdown.set(0);
        clearInterval(this.otpTimer);
        this.otpTimer = undefined;
        this.sendOtp.set(false);
        return;
      }

      this.otpCountdown.update(value => value - 1);
    }, 1000);
  }

  otpTimerDisplay = computed(() => {
    const seconds = this.otpCountdown();
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `(${minutes}:${remainingSeconds.toString().padStart(2, '0')})`;
  });

  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    // allow number 
    input.value = input.value.replace(/\D/g, StringEmpty);
    // allow only one digit
    if (input.value.length > 1) {
      input.value = input.value.charAt(0);
    }

    this.updateOtpValue();

    // move to next box
    if (input.value && index < 5) {
      this.otpInput.get(index + 1)?.nativeElement.focus();
    }
    // call verification api only when 6 digit entered
    this.addIntentionForm.controls['otp'].value.length === digitValidator ? this.otpVerify.set(false) : this.otpVerify.set(true);
  }

  VerifyOtpClick() {
    let otpVal = this.addIntentionForm.controls['otp'];
    let emailVal = this.addIntentionForm.controls['email'];
    if (this.isVerifyingOtp()) {
      return;
    }
    this.VerifyEmailOtp({ email: emailVal.value, otp: otpVal.value });
  }

  onOtpKeyDown(event: KeyboardEvent, index: number) {
    const input = event?.target as HTMLInputElement;

    if (event.key == 'Backspace' && !input.value && index > 0) {
      this.otpInput.get(index - 1)?.nativeElement.focus();
    }
  }

  private updateOtpValue(): void {
    let otp = this.otpInput.map(input => input.nativeElement.value).join(StringEmpty);
    this.addIntentionForm.controls['otp'].setValue(otp);
  }

  VerifyEmailOtp(verifyOtpRequest: VerifyOtpRequest) {

    const otpVal = this.addIntentionForm.controls['otp'];
    // show otp control error if invalid
    const otp = otpVal.value;
    if (otpVal.invalid) {
      otpVal.markAsTouched();
      return;
    }
    this.isVerifyingOtp.set(true);
    this.verifyOtpButtonText.set('Verify code');
    this.verifyOtpMessage.set(StringEmpty);
    // called api to verify otp
    this.apiHandler.execute({
      apiCall: () => this.applicationUserService.verifyOtp(verifyOtpRequest),
      showSpinner: false
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isVerifyingOtp.set(false))).subscribe({
      next: (res) => {
        if (res.Success) {
          this.emailVerified.set(true);
          this.otpEmailVerify.set(true);
          this.verifyOtpMessage.set(StringEmpty);
          this.verifyOtpButtonText.set('Verify code');
        }
        else {
          this.verifyOtpMessage.set(res.Message);
          this.verifyOtpButtonText.set('Try Again');
        }
      },
      error: (err: string) => {
        this.otpEmailVerify.set(false);
        this.emailVerified.set(false);
        this.verifyOtpButtonText.set('Try Again');
      }
    })
  }

  onSubmit(): void {
    if (this.addIntentionForm.invalid) {
      this.addIntentionForm.markAllAsTouched();
      return;
    }
    //  keep #intention in the URL after submitting
    this.router.navigate([], {
      fragment: 'intention',
      replaceUrl: true
    });

    // prevent duplicate submission
    if (this.postingState() === 'posting') {
      return;
    }
    const addform = this.addIntentionForm.getRawValue();
    const createPostRequest = {
      firstName: addform.firstName,
      lastName: addform.lastName,
      email: addform.email,
      countryId: addform.country,
      zoneId: addform.zone,
      traditionId: addform.tradition ?? null,
      content: addform.content,
      terms_Accepted: addform.consent ? 1 : 0,
      allows_Marketing_Emails: addform.emailconsent ? 1 : 0,
      post_Anonymously: addform.post_Anonymously ? 1 : 0
    } as CreatePostRequest;
    // show posting UI before API call
    this.startPostingState();
    this.apiHandler.execute({
      apiCall: () => this.applicationUserService.approvedMessage(createPostRequest),
      showSpinner: false
      // successMessage: 'Form details sent successfully.',
      // errorMessage: 'Failed to send Form details.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res) {
          //API succeeded
          this.postingState.set('success');
          this.resetOTP();
          this.addIntentionForm.reset();
        }
      },
      error: (err: string) => {
        // show error state
        this.postingState.set('error');
        // stop video when API fails
        //this.removePostingVideo();
      },
      complete: () => {
        // show complete state
        this.postingState.set('success');
      }
    })
  }

  // start posting state and load video
  private startPostingState(): void {
    this.postingState.set('posting');

    // Wait until Angular has rendered the posting card
    setTimeout(() => {
      this.insertPostingVideo();
    });
    // keep user on the Intention section
    document.getElementById('intention')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  // create Vimeo iframe only when posting starts
  // CHANGED: create Vimeo iframe only when posting starts
  private insertPostingVideo(): void {
    const container = this.postingVideo?.nativeElement;

    if (!container) {
      return;
    }

    // Do not create the iframe twice
    if (container.querySelector('.intention-posting__iframe')) {
      return;
    }

    const iframe = document.createElement('iframe');

    iframe.className = 'intention-posting__iframe';

    // CHANGED: explicitly apply video sizing because iframe is dynamically created
    iframe.style.position = 'absolute';
    iframe.style.inset = '0';
    iframe.style.display = 'block';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';

    iframe.src =
      'https://player.vimeo.com/video/1225999647' +
      '?h=8f0b524729' +
      '&autoplay=1' +
      '&muted=0' +
      '&controls=1' +
      '&playsinline=1';

    iframe.title = 'Shalom Salam film clip';

    iframe.setAttribute(
      'allow',
      'autoplay; fullscreen; picture-in-picture'
    );

    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('frameborder', '0');

    const placeholder = container.querySelector(
      '.intention-posting__placeholder'
    );

    if (placeholder) {
      placeholder.replaceWith(iframe);
    } else {
      container.appendChild(iframe);
    }
  }


  // remove iframe and restore thumbnail
  private removePostingVideo(): void {
    const container = this.postingVideo?.nativeElement;

    if (!container) {
      return;
    }

    const iframe = container.querySelector(
      '.intention-posting__iframe'
    ) as HTMLIFrameElement | null;

    if (!iframe) {
      return;
    }

    const placeholder = document.createElement('img');

    placeholder.className = 'intention-posting__placeholder';
    placeholder.src = '/images/trailer-thumbnail.png';
    placeholder.alt = '';
    placeholder.decoding = 'async';

    iframe.replaceWith(placeholder);
  }

  tryAgain(): void {
    if (this.postingState() !== 'error') {
      return;
    }
    this.onSubmit();
  }

  postAnotherIntention(): void {
    this.resetOTP();
    this.addIntentionForm.reset();
    this.removePostingVideo();
    this.postingState.set('idle');
    // clear previous OTP verification state
    this.resetEmailVerification();
    // return focus to the form
    setTimeout(() => {
      const firstField = document.querySelector('.intention-field__input') as HTMLElement | null;
      firstField?.focus();
    });
  }

  resetOTP() {
    this.emailVerifyButtonText.set('Verify Email');
    this.emailVerified.set(false);
    this.otpSent.set(false);
    this.sendOtp.set(false);
  }

  ngOnDestroy(): void {
    this.removePostingVideo();
    this.lookupStore.clearZoneList();
  }

}
