import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

export type AppButtonVariant = 'gold' | 'ghost' | 'primary';
export type AppButtonIconPos = 'left' | 'right';

@Component({
  imports: [CommonModule],
  selector: 'IntentionWall-button',
  styleUrl: './button.scss',
  templateUrl: './button.html',
})
export class Button {
  readonly label = input.required<string>();
  readonly icon = input<string | undefined>(undefined);
  readonly iconPos = input<AppButtonIconPos>('left');
  readonly variant = input<AppButtonVariant>('gold');
  readonly disabled = input(false);
}
