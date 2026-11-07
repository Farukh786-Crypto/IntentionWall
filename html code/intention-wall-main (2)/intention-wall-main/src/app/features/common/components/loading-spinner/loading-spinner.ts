import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Spinnerservice } from '../../services/spinnerservice';

@Component({
  imports: [CommonModule, ProgressSpinnerModule],
  selector: 'IntentionWall-loading-spinner',
  styleUrl: './loading-spinner.scss',
  templateUrl: './loading-spinner.html',
})
export class LoadingSpinner {
  private readonly spinnerService = inject(Spinnerservice);
  readonly isLoading = this.spinnerService.isLoading;
}
