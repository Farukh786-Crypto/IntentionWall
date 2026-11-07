import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { AuthenticationService } from '../../../common/services';
import { Router, RouterModule } from '@angular/router';
import { navigationRoutes, rootNavigationRoutes, StringEmpty, TOKENPAYLOADEMAIL } from '../../../common/models';

@Component({
  imports: [CommonModule, RouterModule],
  selector: 'IntentionWall-adminleftsidepanel',
  styleUrl: './adminleftsidepanel.scss',
  templateUrl: './adminleftsidepanel.html',
})
export class Adminleftsidepanel implements OnInit {

  private readonly authenticationService = inject(AuthenticationService);
  private readonly router = inject(Router);
  // Same key as the static admin-ui (script.js "admin-sidebar-collapsed"), "1" = collapsed.
  private readonly collapsedStorageKey = 'admin-sidebar-collapsed';
  // Collapse only exists at >= 901px (static CSS), so never restore it below that width.
  private readonly desktopQuery = '(min-width: 901px)';
  @Input() collapsed: boolean = this.readStoredCollapsed();
  @Output() toggleCollapsed = new EventEmitter<boolean>();

  visible: boolean = true;
  adminEmail = signal<string | null>(StringEmpty)
  // collapsed: boolean = false;

  ngOnInit(): void {
    if (sessionStorage.getItem(TOKENPAYLOADEMAIL)) {
      let email = sessionStorage.getItem(TOKENPAYLOADEMAIL);
      this.adminEmail.set(email);
    }

    if (this.collapsed) {
      // Tell the page so its .app gets is-sidebar-collapsed. Deferred: the page's
      // [class.is-sidebar-collapsed] is already checked when this runs (NG0100 otherwise).
      queueMicrotask(() => this.toggleCollapsed.emit(true));
    }
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
    sessionStorage.setItem(this.collapsedStorageKey, this.collapsed ? '1' : '0');
    this.toggleCollapsed.emit(this.collapsed);
  }

  private readStoredCollapsed(): boolean {
    return sessionStorage.getItem(this.collapsedStorageKey) === '1'
      && window.matchMedia(this.desktopQuery).matches;
  }

  logout() {
    this.authenticationService.logout();
    this.router.navigate([rootNavigationRoutes.adminLogin]);

  }
}
