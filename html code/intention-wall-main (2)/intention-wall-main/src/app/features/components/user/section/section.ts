import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Scroll } from '../../../common/services';

@Component({
  imports: [CommonModule],
  selector: 'IntentionWall-section',
  styleUrl: './section.scss',
  templateUrl: './section.html',
})
export class Section {
  private scrollservice = inject(Scroll);

  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault();
    this.scrollservice.scrollToSection(sectionId);
  }
}
