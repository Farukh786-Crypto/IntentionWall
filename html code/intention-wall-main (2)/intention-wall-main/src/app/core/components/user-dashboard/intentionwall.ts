import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { rootNavigationRoutes } from '../../../features/common/models/navigation-routes';
import { Footer, Header, Section, Wall, Wallofworlds, WriteIntentionForm } from '../../../features/components';
@Component({
  imports: [CommonModule, RouterModule, Header, WriteIntentionForm, Footer, Section, Wall, Wallofworlds],
  selector: 'intentionwall',
  styleUrl: './intentionwall.scss',
  templateUrl: './intentionwall.html',
})
export class Intentionwall {
  protected readonly rootNavigationRoutes = rootNavigationRoutes;
}
