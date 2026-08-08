import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Stat {
  readonly value: string;
  readonly label: string;
}

@Component({
  selector: 'app-landing-stats',
  templateUrl: './landing-stats.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingStats {
  protected readonly stats: readonly Stat[] = [
    { value: '19', label: 'business areas under one roof' },
    { value: '1', label: 'sign-in for every screen' },
    { value: '24/7', label: 'operations that never wait on a batch' },
  ];
}
