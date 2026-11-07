import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, OnDestroy, output, Output, signal, SimpleChanges } from '@angular/core';
import { Message, rootNavigationRoutes, StringEmpty } from '../../../common/models';
import { MessageDetailsIntentionForm } from '../../../common/Validators/message-detail-form';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiHandlerService } from '../../../common/services';
import { AdminService } from '../../../common/services/admin.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'IntentionWall-adminrightsidemessagepanel',
  styleUrl: './adminrightsidemessagepanel.scss',
  templateUrl: './adminrightsidemessagepanel.html',
})
export class Adminrightsidemessagepanel implements OnChanges, OnDestroy {
  @Output() isClosed = new EventEmitter<boolean>();
  @Output() messageApproved = new EventEmitter<string>();
  @Input() message!: Message;

  // services
  private readonly apiHandler = inject(ApiHandlerService);
  private readonly adminService = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);
  readonly messageDetailsIntentionForm = inject(MessageDetailsIntentionForm);
  readonly router = inject(Router);

  isDetailPanelOpen: boolean = true;
  isAcceptModalOpen = signal(false);
  isRejectModalOpen = signal(false);
  intentionReviewForm = signal(false);
  publishMessageForm = signal(false);
  messageId = signal<string>(StringEmpty);

  ngOnChanges(changes: SimpleChanges): void {
    this.patchMessageDetailForm();
    this.findUrlMatching();
    this.messageId.set(this.message.Id);
  }

  private findUrlMatching() {
    const currentUrl = this.router.url;
    if (currentUrl.includes(rootNavigationRoutes.intentionReview)) {
      this.intentionReviewForm.set(true);
    }
    if (currentUrl.includes(rootNavigationRoutes.publishMessage)) {
      this.publishMessageForm.set(true);
    }
  }

  private patchMessageDetailForm() {
    this.messageDetailsIntentionForm.patchValue({
      country: this.message.CountryName,
      dateSubmitted: this.message.LastModeratedAt,
      email: this.message.Email,
      message: this.message.Content,
      submittedBy: `${this.message.FirstName} ${this.message.LastName}`,
      tradition: this.message.TradtionName,
      zone: this.message.TradtionName
    });
  }

  closeDetailPanel() {
    this.isDetailPanelOpen = false;
    this.isClosed.emit(this.isDetailPanelOpen);
    this.messageApproved.emit(this.message.Id);
  }

  onAccept() {
    this.isAcceptModalOpen.set(true);
  }

  onReject() {
    this.isRejectModalOpen.set(true);
  }

  approveAcceptModel() {
    const reviewComments = this.messageDetailsIntentionForm.controls.reviewComment.value;

    // called api here..
    this.apiHandler.execute({
      apiCall: () => this.adminService.approvedMessage({ messageId: this.messageId(), reviewComment: reviewComments }),
      successMessage: 'Message approved successfully.',
      errorMessage: 'Unable to approve the message. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.Success) {
          this.isAcceptModalOpen.set(false);
        }
      },
      complete: () => {
        this.closeDetailPanel();
      }
    })
  }

  cancelAcceptModel() {
    this.isAcceptModalOpen.set(false);
  }

  cancelRejectModel() {
    this.isRejectModalOpen.set(false);
  }

  arroveRejectModel() {
    const reviewComments = this.messageDetailsIntentionForm.controls.reviewComment.value;
    // called api here..
    this.apiHandler.execute({
      apiCall: () => this.adminService.rejectedMessage({ messageId: this.messageId(), reviewComment: reviewComments }),
      successMessage: 'Message rejected successfully.',
      errorMessage: 'Unable to reject the message. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.Success) {
          this.isRejectModalOpen.set(false);
        }
      },
      complete: () => {
        this.closeDetailPanel();
      }
    })
  }

  ngOnDestroy(): void {
    this.messageDetailsIntentionForm.reset();
    this.publishMessageForm.set(false);
    this.intentionReviewForm.set(false);
  }
}
