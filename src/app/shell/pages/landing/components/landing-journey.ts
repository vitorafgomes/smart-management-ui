import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Milestone {
  readonly year: number;
  readonly title: string;
  readonly description: string;
}

@Component({
  selector: 'app-landing-journey',
  templateUrl: './landing-journey.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingJourney {
  protected readonly milestones: readonly Milestone[] = [
    {
      year: 2021,
      title: 'First release',
      description:
        'Smart Management started as one team replacing a spreadsheet that three departments were editing at once.',
    },
    {
      year: 2023,
      title: 'One directory',
      description:
        'Identity, roles and permissions moved behind a single sign-in, and access stopped being a per-system conversation.',
    },
    {
      year: 2025,
      title: 'Operations joined up',
      description:
        'Sales, purchasing, inventory and logistics landed on shared records, so a stock figure means the same thing everywhere.',
    },
    {
      year: 2026,
      title: 'One application',
      description:
        'The back office is being rebuilt as a single application, with each business area kept a separate bounded context inside it.',
    },
  ];
}
