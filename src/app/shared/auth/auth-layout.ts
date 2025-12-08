import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { BackgroundAnimationComponent } from '@app/components/background-animation';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    BackgroundAnimationComponent
  ],
  templateUrl: './auth-layout.html',
  styles: ``
})
export class AuthLayout {
  private readonly router = inject(Router);

  get isLoginPage(): boolean {
    return this.router.url.includes('/auth/login');
  }

  get isRegisterPage(): boolean {
    return this.router.url.includes('/auth/register');
  }
}
