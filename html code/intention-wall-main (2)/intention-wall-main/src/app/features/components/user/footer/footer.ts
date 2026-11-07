import { Component, inject } from '@angular/core';
import { Scroll } from '../../../common/services';

@Component({
  imports: [],
  selector: 'IntentionWall-footer',
  styleUrl: './footer.scss',
  templateUrl: './footer.html',
})
export class Footer {
  private scrollservice = inject(Scroll);

  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault();

    this.scrollservice.scrollToSection(sectionId);
  }
}
