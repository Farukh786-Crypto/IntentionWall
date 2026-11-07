import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Button } from '../button/button';
import { Scroll } from '../../../common/services';

@Component({
  imports: [CommonModule, Button],
  selector: 'IntentionWall-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  private scrollservice = inject(Scroll);
  readonly isMenuExpanded = signal(false);

  toggleMobileMenu() {
    this.isMenuExpanded.update((open) => !open);
  }

  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault();

    this.scrollservice.scrollToSection(sectionId);

    //close the mobile menu after selection
    this.isMenuExpanded.set(false);
  }
}
