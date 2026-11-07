import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { rootNavigationRoutes } from '../../models';

@Component({
  imports: [],
  selector: 'IntentionWall-page-not-found',
  styleUrl: './page-not-found.scss',
  templateUrl: './page-not-found.html',
})
export class PageNotFound {
  private readonly router = inject(Router);

  goToLogin(): void {
    this.router.navigateByUrl(`/${rootNavigationRoutes.adminLogin}`);
  }
}
