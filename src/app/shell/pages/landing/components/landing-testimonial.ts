import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-landing-testimonial',
  imports: [NgOptimizedImage],
  templateUrl: './landing-testimonial.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingTestimonial {}
