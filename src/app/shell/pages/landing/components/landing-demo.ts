import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-landing-demo',
  imports: [NgOptimizedImage],
  templateUrl: './landing-demo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingDemo {}
