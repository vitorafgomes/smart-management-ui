import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

interface Feature {
  readonly image: string;
  readonly title: string;
  readonly description: string;
}

@Component({
  selector: 'app-landing-features',
  imports: [NgOptimizedImage],
  templateUrl: './landing-features.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingFeatures {
  protected readonly features: readonly Feature[] = [
    {
      image: '/assets/img/landing/1.png',
      title: 'One directory',
      description:
        'Users, roles and permissions in a single place, so access follows the person rather than the system they happen to be in.',
    },
    {
      image: '/assets/img/landing/2.png',
      title: 'Operations in view',
      description:
        'Sales, purchasing and inventory share one set of records, which is what makes a stock figure mean the same thing everywhere.',
    },
    {
      image: '/assets/img/landing/3.png',
      title: 'Numbers that reconcile',
      description:
        'Finance reads the same movements the warehouse posts, so the close is a report rather than an investigation.',
    },
  ];
}
