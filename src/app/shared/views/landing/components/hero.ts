import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {BackgroundAnimationComponent} from '@app/components/background-animation';
import {NgxTypedJsModule} from 'ngx-typed-js';

@Component({
  selector: 'app-hero',
  imports: [
    BackgroundAnimationComponent,
    NgxTypedJsModule
  ],
  template: `
    <section class="hero-section position-relative overflow-hidden">
      <div class="container" style="position: relative; z-index: 1;">
        <div class="row align-items-center">
          <div class="col-sm-12 col-md-10 col-lg-8 col-xl-7 col-xxl-6">
            <h1 class="eye-catcher-text display-2 fw-700 mb-5 text-gradient text-center text-md-start"
                data-text="SmartAdmin v5 built with AI">
              SmartAdmin v5 built with AI
            </h1>
            @if (typedStrings.length) {

              <ngx-typed-js
                [contentType]="'html'"
                [strings]="typedStrings"
                [typeSpeed]="15"
                [backSpeed]="15"
                [backDelay]="3000"
                [loop]="true"
                cursorChar="|">
                <p class="lead fw-bold text-center text-md-start">
                  <span class="typing"></span>
                </p>
              </ngx-typed-js>
            }
            <div class="d-flex gap-3 justify-content-center justify-content-md-start">
              <a href="#features" class="btn btn-primary btn-lg px-4 py-2">Get started</a>
              <a href="#demo" class="btn btn-outline-light btn-lg px-4 py-2">Learn more</a>
            </div>
          </div>
        </div>
      </div>
      <app-background-animation/>
    </section>
  `,
  styles: ``
})
export class Hero implements OnInit {
  typedStrings: string[] = [];

  cd = inject(ChangeDetectorRef);

  ngOnInit(): void {
    // Delay setting strings so DOM is ready before ngx-typed-js initializes
    setTimeout(() => {
      this.typedStrings = [
        "The world's first Admin WebApp built with Artificial Intelligence",
        'AI-ready by design: pre-written prompt instructions included',
        'An advanced, jQuery-free Bootstrap 5 Admin Dashboard UI',
        'Built for the next generation of enterprise web applications',
        'Clean, scalable, and engineered for future-forward growth',
        'Continuously updated by a team of expert developers',
        'Enterprise-grade performance with beautiful design',
        'One dashboard template, unlimited use cases',
        'Modern, responsive UI built for serious development'
      ];
     this.cd.markForCheck();
    }, 0);
  }
}
