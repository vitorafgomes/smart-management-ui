import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LandingCta } from './components/landing-cta';
import { LandingDemo } from './components/landing-demo';
import { LandingFaqs } from './components/landing-faqs';
import { LandingFeatures } from './components/landing-features';
import { LandingFooter } from './components/landing-footer';
import { LandingHero } from './components/landing-hero';
import { LandingJourney } from './components/landing-journey';
import { LandingNavbar } from './components/landing-navbar';
import { LandingStats } from './components/landing-stats';
import { LandingTestimonial } from './components/landing-testimonial';

/**
 * The public home. `app-landing` is the theme's own wrapper class: every landing style in
 * assets/sass/app/_landing.scss is scoped under it, so dropping it strips the whole page.
 */
@Component({
  selector: 'app-landing',
  imports: [
    LandingNavbar,
    LandingHero,
    LandingFeatures,
    LandingStats,
    LandingDemo,
    LandingJourney,
    LandingTestimonial,
    LandingFaqs,
    LandingCta,
    LandingFooter,
  ],
  templateUrl: './landing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-landing d-block' },
})
export class Landing {}
